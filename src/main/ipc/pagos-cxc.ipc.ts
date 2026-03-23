import { ipcMain } from 'electron'
import { pagosCxcController } from '../controllers/pagos-cxc.controller'

export function registerPagosCxcIPC() {
    ipcMain.handle('pagos:registrar', (_, data) => pagosCxcController.registrarPago(data))
    ipcMain.handle('pagos:historial', (_, facturaId: number) => pagosCxcController.historial(facturaId))
    ipcMain.handle('pagos:anular', (_, pagoId: number) => pagosCxcController.anularPago(pagoId))
}
