import { ipcMain } from 'electron'
import { proveedoresController } from '../controllers/proveedores.controller'

export function registerProveedoresIPC() {
  ipcMain.handle('proveedores:listar', (_, page, pageSize, busqueda, tipoProveedor) =>
    proveedoresController.listar(page, pageSize, busqueda, tipoProveedor))

  ipcMain.handle('proveedores:buscar', (_, query) =>
    proveedoresController.buscar(query))

  ipcMain.handle('proveedores:getById', (_, id) =>
    proveedoresController.getById(id))

  ipcMain.handle('proveedores:crear', (_, data) =>
    proveedoresController.crear(data))

  ipcMain.handle('proveedores:actualizar', (_, id, data) =>
    proveedoresController.actualizar(id, data))

  ipcMain.handle('proveedores:desactivar', (_, id) =>
    proveedoresController.desactivar(id))
}
