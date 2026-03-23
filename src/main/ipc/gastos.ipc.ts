import { ipcMain } from 'electron'
import { gastosController } from '../controllers/gastos.controller'

export function registerGastosIPC() {
  ipcMain.handle('gastos:listarCategorias', () => gastosController.listarCategorias())

  ipcMain.handle('gastos:crearCategoria', (_e, data) => gastosController.crearCategoria(data))

  ipcMain.handle('gastos:editarCategoria', (_e, id, data) => gastosController.editarCategoria(id, data))

  ipcMain.handle('gastos:eliminarCategoria', (_e, id) => gastosController.eliminarCategoria(id))

  ipcMain.handle('gastos:listar', (_e, page, pageSize, categoriaId, desde, hasta) =>
    gastosController.listar(page, pageSize, categoriaId, desde, hasta)
  )

  ipcMain.handle('gastos:crear', (_e, data) => gastosController.crear(data))

  ipcMain.handle('gastos:editar', (_e, id, data) => gastosController.editar(id, data))

  ipcMain.handle('gastos:eliminar', (_e, id) => gastosController.eliminar(id))

  ipcMain.handle('gastos:resumenPorCategoria', (_e, mes, anio) =>
    gastosController.resumenPorCategoria(mes, anio)
  )
}
