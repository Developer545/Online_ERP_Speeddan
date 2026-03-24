// ══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ENTORNO EN TIEMPO DE EJECUCIÓN
// Permite cambiar entre DB de pruebas y producción sin rebuild
// ══════════════════════════════════════════════════════════

import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

export type EnvMode = 'test' | 'production'

const CONFIG_FILENAME = 'speeddansys-env.json'

function getConfigPath(): string {
  try {
    return join(app.getPath('userData'), CONFIG_FILENAME)
  } catch {
    return join(process.env['APPDATA'] || '.', 'Speeddansys', CONFIG_FILENAME)
  }
}

export function readEnvMode(): EnvMode {
  try {
    const raw = readFileSync(getConfigPath(), 'utf-8')
    const cfg = JSON.parse(raw)
    return cfg.mode === 'production' ? 'production' : 'test'
  } catch {
    return 'test'
  }
}

export function writeEnvMode(mode: EnvMode): void {
  try {
    writeFileSync(getConfigPath(), JSON.stringify({ mode }), 'utf-8')
  } catch (e) {
    console.error('[env.config] No se pudo guardar el modo:', e)
  }
}

/**
 * URL por defecto cuando la app está empaquetada y no hay .env.
 * Apunta a la base de datos del cliente (cliente_db).
 * El password puede sobrescribirse desde setupDatabase() en db-setup.ts.
 */
const DEFAULT_PACKAGED_DB_URL = 'postgresql://postgres:@localhost:5432/cliente_db?schema=public'

/**
 * Aplica el modo de entorno: ajusta DATABASE_URL según el modo guardado.
 * Debe llamarse ANTES de que el cliente Prisma sea instanciado.
 */
export function applyEnvMode(): EnvMode {
  // Si no hay DATABASE_URL (app empaquetada sin .env), usar el default
  if (!process.env['DATABASE_URL']) {
    process.env['DATABASE_URL'] = DEFAULT_PACKAGED_DB_URL
  }

  // Guardar la URL de pruebas al inicio (solo una vez)
  if (!process.env['DATABASE_URL_TEST']) {
    process.env['DATABASE_URL_TEST'] = process.env['DATABASE_URL'] ?? ''
  }

  const mode = readEnvMode()

  if (mode === 'production') {
    const prodUrl = process.env['DATABASE_URL_PROD']
    if (prodUrl) {
      process.env['DATABASE_URL'] = prodUrl
    } else {
      // Sin URL de producción → fallback a test/cliente
      writeEnvMode('test')
      return 'test'
    }
  } else {
    process.env['DATABASE_URL'] = process.env['DATABASE_URL_TEST'] ?? process.env['DATABASE_URL'] ?? DEFAULT_PACKAGED_DB_URL
  }

  return mode
}

/**
 * Sobrescribe DATABASE_URL con una URL específica (desde db-setup.ts).
 * Llamar antes de que Prisma instancie el cliente.
 */
export function overrideDatabaseUrl(url: string): void {
  process.env['DATABASE_URL'] = url
  process.env['DATABASE_URL_TEST'] = url
}

export function configFileExists(): boolean {
  try {
    return existsSync(getConfigPath())
  } catch {
    return false
  }
}
