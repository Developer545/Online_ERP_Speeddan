// ══════════════════════════════════════════════════════════
// LICENSE IPC — ACTIVACIÓN, VALIDACIÓN ONLINE/OFFLINE
// Sistema de licencias con caché cifrado y anti-piratería.
// ══════════════════════════════════════════════════════════

import { ipcMain } from 'electron'
import { createHash } from 'crypto'
import { hostname, cpus, networkInterfaces } from 'os'
import { Client } from 'pg'
import {
  saveLicenseCache,
  loadLicenseCache,
  validateOfflineCache,
  clearLicenseCache,
  type LicenseCacheData
} from '../utils/license-cache'

// URL del servidor de licencias (producción vs desarrollo)
const LICENSE_SERVER_URL = process.env['LICENSE_SERVER_URL']
  || 'https://admin-licencias.vercel.app'

/**
 * Genera un ID de hardware estable basado en datos del sistema.
 */
function getHardwareId(): string {
  try {
    const macs = Object.values(networkInterfaces())
      .flat()
      .filter((n): n is NonNullable<typeof n> => !!n && !n.internal && n.mac !== '00:00:00:00:00:00')
      .map(n => n.mac)
      .sort()
      .join('|')

    const raw = `${hostname()}|${cpus()[0]?.model ?? 'cpu'}|${macs}`
    return createHash('sha256').update(raw).digest('hex').slice(0, 32)
  } catch {
    return createHash('sha256').update(hostname()).digest('hex').slice(0, 32)
  }
}

/**
 * Obtiene el cliente pg usando DATABASE_URL del entorno.
 */
async function getPgClient(): Promise<Client> {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL no configurada')
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 })
  await client.connect()
  return client
}

async function ensureAppConfigTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "AppConfig" (
      "id"        SERIAL        NOT NULL,
      "clave"     TEXT          NOT NULL,
      "valor"     TEXT,
      "updatedAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
    )
  `)
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "AppConfig_clave_key" ON "AppConfig"("clave")
  `)
}

async function getConfig(client: Client, clave: string): Promise<string | null> {
  const res = await client.query(
    `SELECT valor FROM "AppConfig" WHERE clave = $1 LIMIT 1`,
    [clave]
  )
  return res.rows[0]?.valor ?? null
}

async function upsertConfig(client: Client, clave: string, valor: string): Promise<void> {
  await client.query(
    `INSERT INTO "AppConfig" (clave, valor, "updatedAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, "updatedAt" = NOW()`,
    [clave, valor]
  )
}

/**
 * Intenta verificar la licencia online contra el servidor.
 */
async function verifyOnline(
  licenseKey: string,
  hwid: string
): Promise<{ valid: boolean; expiration_date?: string; error?: string }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const res = await fetch(`${LICENSE_SERVER_URL}/api/licenses/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, hardware_id: hwid }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const data = await res.json()

    if (res.ok && data.success) {
      return { valid: true, expiration_date: data.expiration_date }
    }

    // 403 = licencia expirada o ya activada en otra PC
    if (res.status === 403) {
      return { valid: false, error: data.error }
    }

    // 404 = licencia revocada/eliminada
    if (res.status === 404) {
      return { valid: false, error: data.error }
    }

    return { valid: false, error: data.error || 'Error desconocido' }
  } catch (err: any) {
    // Error de red = sin internet
    console.log('[license] Sin conexión al servidor:', err.message)
    return { valid: false, error: 'offline' }
  }
}

export function registerLicenseIPC(): void {
  // ══════════════════════════════════════════════════════
  // 1. OBTENER ESTADO (startup check)
  // Estrategia: Online-First, Offline-Tolerant (7 días gracia)
  // ══════════════════════════════════════════════════════
  ipcMain.handle('license:getStatus', async () => {
    const hwid = getHardwareId()
    let client: Client | null = null

    try {
      client = await getPgClient()
      await ensureAppConfigTable(client)

      const [licKey, licExp] = await Promise.all([
        getConfig(client, 'license_key'),
        getConfig(client, 'license_exp')
      ])

      // Sin licencia en BD local
      if (!licKey || !licExp) {
        // Revisar caché por si la BD fue limpiada
        const cache = loadLicenseCache(hwid)
        if (cache) {
          const v = validateOfflineCache(cache)
          if (v.valid) {
            return { active: true, hwid, offline: true, daysRemaining: v.daysRemaining }
          }
        }
        return { active: false, hwid }
      }

      // Licencia expirada según BD local
      const expDate = new Date(licExp)
      if (isNaN(expDate.getTime()) || new Date() > expDate) {
        return { active: false, expired: true, hwid }
      }

      // ── Intentar verificación online ──────────────────
      const online = await verifyOnline(licKey, hwid)

      if (online.valid) {
        // Online OK — actualizar caché
        const now = new Date().toISOString()
        const cacheData: LicenseCacheData = {
          license_key: licKey,
          expiration_date: online.expiration_date || licExp,
          hardware_id: hwid,
          last_verified_at: now,
          server_time: now,
        }
        saveLicenseCache(cacheData)

        // Si el servidor actualizó la expiración, guardar en BD local
        if (online.expiration_date && online.expiration_date !== licExp) {
          await upsertConfig(client, 'license_exp', online.expiration_date)
        }

        return { active: true, hwid, online: true }
      }

      if (online.error === 'offline') {
        // ── Sin internet: usar caché cifrado ────────────
        const cache = loadLicenseCache(hwid)
        if (cache) {
          const v = validateOfflineCache(cache)
          if (v.valid) {
            console.log(`[license] Offline — día ${v.offlineDays}/7, quedan ${v.daysRemaining} días de licencia`)
            return {
              active: true, hwid, offline: true,
              daysRemaining: v.daysRemaining,
              offlineDays: v.offlineDays,
              message: `Sin internet (día ${v.offlineDays}/7). Conecta pronto.`
            }
          }

          // Caché inválido
          if (v.reason === 'clock_tampered') {
            return { active: false, hwid, error: 'Manipulación del reloj detectada. Conecta a internet.' }
          }
          if (v.reason === 'offline_too_long') {
            return { active: false, hwid, error: 'Más de 7 días sin internet. Conecta para revalidar.' }
          }
        }

        // Sin caché previo, crear uno de gracia (primera vez offline)
        const firstCache: LicenseCacheData = {
          license_key: licKey,
          expiration_date: licExp,
          hardware_id: hwid,
          last_verified_at: new Date().toISOString(),
          server_time: new Date().toISOString(),
        }
        saveLicenseCache(firstCache)
        return { active: true, hwid, offline: true, message: 'Primera ejecución offline.' }
      }

      // Licencia revocada o en otra PC — limpiar todo
      clearLicenseCache()
      return { active: false, hwid, error: online.error }

    } catch (error) {
      console.error('[license:getStatus] Error BD:', error)
      // Si la BD local falla, intentar caché
      const cache = loadLicenseCache(hwid)
      if (cache) {
        const v = validateOfflineCache(cache)
        if (v.valid) {
          return { active: true, hwid, offline: true, daysRemaining: v.daysRemaining }
        }
      }
      return { active: false, hwid }
    } finally {
      await client?.end().catch(() => {})
    }
  })

  // ══════════════════════════════════════════════════════
  // 2. GUARDAR LICENCIA (después de activación remota)
  // ══════════════════════════════════════════════════════
  ipcMain.handle('license:save', async (_, data: { key: string; expDate: string }) => {
    const hwid = getHardwareId()
    let client: Client | null = null
    try {
      client = await getPgClient()
      await ensureAppConfigTable(client)

      await Promise.all([
        upsertConfig(client, 'license_key', data.key),
        upsertConfig(client, 'license_exp', data.expDate)
      ])

      // Guardar en caché cifrado también
      const now = new Date().toISOString()
      saveLicenseCache({
        license_key: data.key,
        expiration_date: data.expDate,
        hardware_id: hwid,
        last_verified_at: now,
        server_time: now,
      })

      return { success: true }
    } catch (error: any) {
      console.error('[license:save] Error:', error)
      return {
        success: false,
        error: error?.message ?? 'Error desconocido al guardar licencia'
      }
    } finally {
      await client?.end().catch(() => {})
    }
  })
}
