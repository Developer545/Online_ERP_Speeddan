import { ipcMain } from 'electron'
import { pagosCxpController } from '../controllers/pagos-cxp.controller'

export function registerPagosCxpIPC() {
    ipcMain.handle('pagosCxp:registrar', (_, data) => pagosCxpController.registrarPago(data))
    ipcMain.handle('pagosCxp:historial', (_, compraId: number) => pagosCxpController.historial(compraId))
    ipcMain.handle('pagosCxp:anular', (_, pagoId: number) => pagosCxpController.anularPago(pagoId))
}
