import { ipcMain } from 'electron'
import { analyticsController } from '../controllers/analytics.controller'

export function registerAnalyticsIPC() {
  ipcMain.handle('analytics:ventasPorDia', () => analyticsController.getVentasPorDia(30))
  ipcMain.handle('analytics:topProductos', () => analyticsController.getTopProductos(5))
  ipcMain.handle('analytics:ventasVsCompras', () => analyticsController.getVentasVsComprasPorMes(6))
  ipcMain.handle('analytics:distribucionTipo', () => analyticsController.getDistribucionTipoDocumento())
  ipcMain.handle('analytics:kpiResumen', () => analyticsController.getKpiResumen())
  ipcMain.handle('analytics:utilidadReal', () => analyticsController.getUtilidadReal(6))
}
