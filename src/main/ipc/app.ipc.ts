import { ipcMain } from 'electron'
import { readEnvMode, writeEnvMode, applyEnvMode, EnvMode } from '../config/env.config'
import { resetPrismaClient } from '../database/prisma.client'

export function registerAppIPC(): void {
  // Retorna el modo activo: 'test' | 'production'
  ipcMain.handle('app:getEnvMode', () => readEnvMode())

  // Retorna si DATABASE_URL_PROD está configurada (para saber si el switch es posible)
  ipcMain.handle('app:canSwitchToProd', () => {
    return !!(process.env['DATABASE_URL_PROD'])
  })

  // Cambia el entorno en caliente: guarda preferencia, ajusta DB_URL y resetea Prisma
  ipcMain.handle('app:setEnvMode', async (_event, mode: EnvMode) => {
    writeEnvMode(mode)
    applyEnvMode()
    await resetPrismaClient()
    return { ok: true, mode }
  })
}
