import { ipcMain } from 'electron'
import { SucursalesController } from '@main/controllers/sucursales.controller'

export function registerSucursalesIPC(): void {
  ipcMain.handle('sucursales:listar', () => SucursalesController.listar())
  ipcMain.handle('sucursales:getEmisor', () => SucursalesController.getEmisorActivo())
}
