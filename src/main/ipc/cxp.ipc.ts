import { ipcMain } from 'electron'
import { cxpController } from '../controllers/cxp.controller'

export function registerCxpIPC() {
  ipcMain.handle('cxp:listar', () => cxpController.listar())
  ipcMain.handle('cxp:resumen', () => cxpController.resumen())
}
