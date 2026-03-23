import { ipcMain } from 'electron'
import { configuracionController } from '../controllers/configuracion.controller'

export function registerConfiguracionIPC() {
  ipcMain.handle('config:getEmisor', () =>
    configuracionController.getEmisor())

  ipcMain.handle('config:guardarEmisor', (_, data) =>
    configuracionController.guardarEmisor(data))

  ipcMain.handle('config:guardarCredencialesMH', (_, data) =>
    configuracionController.guardarCredencialesMH(data))

  ipcMain.handle('config:listarSucursales', () =>
    configuracionController.listarSucursales())

  ipcMain.handle('config:guardarSucursal', (_, data) =>
    configuracionController.guardarSucursal(data))

  ipcMain.handle('config:desactivarSucursal', (_, id) =>
    configuracionController.desactivarSucursal(id))

  ipcMain.handle('config:toggleSimulacion', (_, activar: boolean) =>
    configuracionController.toggleSimulacion(activar))

  ipcMain.handle('config:activarModoSimulacion', () =>
    configuracionController.activarModoSimulacion())
}
