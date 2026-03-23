import { ipcMain } from 'electron'
import { ClientsController } from '@main/controllers/clients.controller'

export function registerClientsIPC(): void {
  ipcMain.handle('clients:buscar', (_e, query: string) =>
    ClientsController.buscar(query))

  ipcMain.handle('clients:listar', (_e, page?: number, pageSize?: number, busqueda?: string, tipoDocumento?: string) =>
    ClientsController.listar(page, pageSize, busqueda, tipoDocumento))

  ipcMain.handle('clients:getById', (_e, id: number) =>
    ClientsController.getById(id))

  ipcMain.handle('clients:crear', (_e, data) =>
    ClientsController.crear(data))

  ipcMain.handle('clients:actualizar', (_e, id: number, data) =>
    ClientsController.actualizar(id, data))

  ipcMain.handle('clients:desactivar', (_e, id: number) =>
    ClientsController.desactivar(id))
}
