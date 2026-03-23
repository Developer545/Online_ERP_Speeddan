import { ipcMain } from 'electron'
import { empleadosController } from '../controllers/empleados.controller'

export function registerEmpleadosIPC() {
  ipcMain.handle('empleados:listar', (_, page, pageSize, busqueda, cargo) =>
    empleadosController.listar(page, pageSize, busqueda, cargo))

  ipcMain.handle('empleados:getById', (_, id) =>
    empleadosController.getById(id))

  ipcMain.handle('empleados:crear', (_, data) =>
    empleadosController.crear(data))

  ipcMain.handle('empleados:actualizar', (_, id, data) =>
    empleadosController.actualizar(id, data))

  ipcMain.handle('empleados:desactivar', (_, id) =>
    empleadosController.desactivar(id))
}
