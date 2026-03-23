import { ipcMain } from 'electron'
import { ProductsController } from '@main/controllers/products.controller'

export function registerProductsIPC(): void {
  ipcMain.handle('products:buscar', (_e, query: string) =>
    ProductsController.buscar(query))

  ipcMain.handle('products:listar', (_e, page?: number, pageSize?: number, busqueda?: string, categoriaId?: number, soloStockBajo?: boolean) =>
    ProductsController.listar(page, pageSize, busqueda, categoriaId, soloStockBajo))

  ipcMain.handle('products:getById', (_e, id: number) =>
    ProductsController.getById(id))

  ipcMain.handle('products:crear', (_e, data) =>
    ProductsController.crear(data))

  ipcMain.handle('products:actualizar', (_e, id: number, data) =>
    ProductsController.actualizar(id, data))

  ipcMain.handle('products:desactivar', (_e, id: number) =>
    ProductsController.desactivar(id))

  ipcMain.handle('products:listarCategorias', () =>
    ProductsController.listarCategorias())

  ipcMain.handle('products:crearCategoria', (_e, nombre: string) =>
    ProductsController.crearCategoria(nombre))

  ipcMain.handle('products:ajustarStock', (_e, productoId: number, data) =>
    ProductsController.ajustarStock(productoId, data))

  ipcMain.handle('products:getKardex', (_e, productoId: number, page?: number, pageSize?: number) =>
    ProductsController.getKardex(productoId, page, pageSize))

  ipcMain.handle('products:getKardexGeneral', (_e, page?: number, pageSize?: number, productoId?: number) =>
    ProductsController.getKardexGeneral(page, pageSize, productoId))

  ipcMain.handle('products:getResumenInventario', () =>
    ProductsController.getResumenInventario())
}
