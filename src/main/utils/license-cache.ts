// ══════════════════════════════════════════════════════════
// CACHÉ CIFRADO DE LICENCIAS — Validación Offline
// Almacena datos de licencia cifrados con AES-256-GCM
// usando el hardware_id como clave derivada.
// ══════════════════════════════════════════════════════════

import { app } from 'electron'
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'crypto'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// ── Tipos ─────────────────────────────────────────────────
export interface LicenseCacheData {
  license_key: string
  expiration_date: string      // ISO string
  hardware_id: string
  last_verified_at: string     // ISO string — última verificación online
  server_time: string          // ISO string — hora del servidor en última verificación
}

// Período de gracia offline: 7 días
const OFFLINE_GRACE_DAYS = 7

// ── Rutas ─────────────────────────────────────────────────
function getCachePath(): string {
  return join(app.getPath('userData'), 'license-cache.enc')
}

// ── Cifrado AES-256-GCM ──────────────────────────────────
function deriveKey(hwid: string): Buffer {
  // Derivar clave de 32 bytes del hardware_id usando scrypt
  const salt = createHash('sha256').update('speeddansys-salt-v1').digest()
  return scryptSync(hwid, salt, 32)
}

function encrypt(data: string, hwid: string): Buffer {
  const key = deriveKey(hwid)
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Formato: [iv 16 bytes] [authTag 16 bytes] [encrypted data]
  return Buffer.concat([iv, authTag, encrypted])
}

function decrypt(buffer: Buffer, hwid: string): string {
  const key = deriveKey(hwid)
  const iv = buffer.subarray(0, 16)
  const authTag = buffer.subarray(16, 32)
  const encrypted = buffer.subarray(32)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8')
}

// ══════════════════════════════════════════════════════════
// API PÚBLICA
// ══════════════════════════════════════════════════════════

/**
 * Guardar datos de licencia cifrados en disco.
 * Se llama después de cada verificación online exitosa.
 */
export function saveLicenseCache(data: LicenseCacheData): void {
  try {
    const json = JSON.stringify(data)
    const encrypted = encrypt(json, data.hardware_id)
    writeFileSync(getCachePath(), encrypted)
    console.log('[license-cache] Caché guardado correctamente')
  } catch (err) {
    console.error('[license-cache] Error al guardar caché:', err)
  }
}

/**
 * Leer datos de licencia desde el caché cifrado.
 * Retorna null si no existe, está corrupto o el hwid no coincide.
 */
export function loadLicenseCache(hwid: string): LicenseCacheData | null {
  try {
    const cachePath = getCachePath()
    if (!existsSync(cachePath)) return null

    const buffer = readFileSync(cachePath)
    const json = decrypt(buffer, hwid)
    const data: LicenseCacheData = JSON.parse(json)

    // Verificar que el hardware_id coincida
    if (data.hardware_id !== hwid) {
      console.warn('[license-cache] HWID no coincide — caché inválido')
      return null
    }

    return data
  } catch (err) {
    console.error('[license-cache] Error al leer caché (posible manipulación):', err)
    return null
  }
}

/**
 * Validar si el caché offline es aún válido.
 * Reglas:
 * 1. La licencia no debe estar expirada
 * 2. No deben haber pasado más de OFFLINE_GRACE_DAYS desde la última verificación
 * 3. El reloj del sistema no debe haber retrocedido (anti-tampering)
 */
export function validateOfflineCache(cache: LicenseCacheData): {
  valid: boolean
  reason?: string
  daysRemaining?: number
  offlineDays?: number
} {
  const now = new Date()
  const expDate = new Date(cache.expiration_date)
  const lastVerified = new Date(cache.last_verified_at)
  const serverTime = new Date(cache.server_time)

  // 1. ¿Licencia expirada?
  if (now > expDate) {
    return { valid: false, reason: 'expired', daysRemaining: 0 }
  }

  // 2. Anti-clock-tampering: ¿El reloj retrocedió?
  // Si la hora actual es más de 1 hora ANTES de la última verificación, es sospechoso
  const oneHourMs = 60 * 60 * 1000
  if (now.getTime() < lastVerified.getTime() - oneHourMs) {
    return {
      valid: false,
      reason: 'clock_tampered',
    }
  }

  // 3. Anti-clock-tampering: verificar contra la hora del servidor
  // Si la hora actual es más de 24 horas ANTES de la hora del servidor, manipulación detectada
  const oneDayMs = 24 * 60 * 60 * 1000
  if (now.getTime() < serverTime.getTime() - oneDayMs) {
    return {
      valid: false,
      reason: 'clock_tampered',
    }
  }

  // 4. ¿Período offline excedido?
  const offlineMs = now.getTime() - lastVerified.getTime()
  const offlineDays = Math.floor(offlineMs / oneDayMs)
  const graceLimitMs = OFFLINE_GRACE_DAYS * oneDayMs

  if (offlineMs > graceLimitMs) {
    return {
      valid: false,
      reason: 'offline_too_long',
      offlineDays,
    }
  }

  // Calcular días restantes de licencia
  const remainingMs = expDate.getTime() - now.getTime()
  const daysRemaining = Math.ceil(remainingMs / oneDayMs)

  return { valid: true, daysRemaining, offlineDays }
}

/**
 * Eliminar el caché (cuando se revoque o desactive la licencia).
 */
export function clearLicenseCache(): void {
  try {
    const cachePath = getCachePath()
    if (existsSync(cachePath)) {
      writeFileSync(cachePath, Buffer.alloc(0))
      console.log('[license-cache] Caché eliminado')
    }
  } catch (err) {
    console.error('[license-cache] Error al eliminar caché:', err)
  }
}
