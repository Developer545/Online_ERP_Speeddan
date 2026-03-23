import { ipcMain } from 'electron'
import { cxcController } from '../controllers/cxc.controller'

export function registerCxcIPC() {
  ipcMain.handle('cxc:listar', () => cxcController.listar())
  ipcMain.handle('cxc:resumen', () => cxcController.resumen())
}
