import { ipcMain } from 'electron'
import { comprasController } from '../controllers/compras.controller'

export function registerComprasIPC() {
  ipcMain.handle('compras:listar', (_, page, pageSize, busqueda, proveedorId) =>
    comprasController.listar(page, pageSize, busqueda, proveedorId))

  ipcMain.handle('compras:getById', (_, id) =>
    comprasController.getById(id))

  ipcMain.handle('compras:crear', (_, data) =>
    comprasController.crear(data))

  ipcMain.handle('compras:anular', (_, id, motivo) =>
    comprasController.anular(id, motivo))
}
