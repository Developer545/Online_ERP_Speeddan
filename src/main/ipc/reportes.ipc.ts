import { ipcMain } from 'electron'
import { reportesController } from '../controllers/reportes.controller'

export function registerReportesIPC() {
  ipcMain.handle('reportes:libroVentas', (_, desde, hasta) =>
    reportesController.libroVentas(desde, hasta))

  ipcMain.handle('reportes:libroCompras', (_, desde, hasta) =>
    reportesController.libroCompras(desde, hasta))

  ipcMain.handle('reportes:rentabilidad', () =>
    reportesController.rentabilidad())

  ipcMain.handle('reportes:resumenF07', (_, mes) =>
    reportesController.resumenF07(mes))

  ipcMain.handle('reportes:cxcVencidas', () =>
    reportesController.cxcVencidas())
}
