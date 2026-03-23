// ══════════════════════════════════════════════════════════
// SETUP IPC — Wizard de configuración inicial de PostgreSQL
// ══════════════════════════════════════════════════════════

import { ipcMain } from 'electron'
import {
  testPostgresConnectionCustom,
  setupDatabaseWithCredentials,
  DbCredentials
} from '../utils/db-setup'
import { overrideDatabaseUrl } from '../config/env.config'
import { resetPrismaClient, setDatabaseUrl } from '../database/prisma.client'

// Estado global del setup
let _setupNeeded = false
let _setupDone = false

export function setSetupNeeded(needed: boolean): void {
  _setupNeeded = needed
}

export function isSetupDone(): boolean {
  return _setupDone
}

export function registerSetupIPC(): void {
  // ── Consultar si el setup es necesario ─────────────────
  ipcMain.handle('setup:getStatus', () => ({
    needsSetup: _setupNeeded && !_setupDone
  }))

  // ── Probar conexión con credenciales proporcionadas ─────
  ipcMain.handle(
    'setup:testConnection',
    async (_event, creds: DbCredentials) => {
      try {
        const ok = await testPostgresConnectionCustom(creds)
        return {
          success: ok,
          error: ok ? undefined : 'No se pudo conectar. Verifica host, puerto, usuario y contraseña.'
        }
      } catch (err: any) {
        return { success: false, error: err?.message ?? String(err) }
      }
    }
  )

  // ── Crear base de datos y aplicar migraciones ───────────
  ipcMain.handle(
    'setup:createDatabase',
    async (_event, creds: DbCredentials) => {
      try {
        const result = await setupDatabaseWithCredentials(creds)
        if (result.success) {
          // Activar la URL correcta para que Prisma la use
          overrideDatabaseUrl(result.databaseUrl)
          setDatabaseUrl(result.databaseUrl)
          // Destruir instancia anterior de Prisma (si existía con URL incorrecta)
          await resetPrismaClient()
          _setupDone = true
        }
        return result
      } catch (err: any) {
        return { success: false, password: '', databaseUrl: '', error: err?.message ?? String(err) }
      }
    }
  )
}
