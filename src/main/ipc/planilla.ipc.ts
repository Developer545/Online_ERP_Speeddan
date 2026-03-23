import { ipcMain } from 'electron'
import { planillaController } from '../controllers/planilla.controller'

export function registerPlanillaIPC() {
    // ── Configuración ──
    ipcMain.handle('planilla:getConfig', () =>
        planillaController.getConfig())

    ipcMain.handle('planilla:updateConfig', (_, items) =>
        planillaController.updateConfig(items))

    ipcMain.handle('planilla:seedConfig', () =>
        planillaController.seedConfigDefaults())

    // ── Planillas ──
    ipcMain.handle('planilla:listar', (_, page, pageSize) =>
        planillaController.listarPlanillas(page, pageSize))

    ipcMain.handle('planilla:getById', (_, id) =>
        planillaController.getPlanillaById(id))

    ipcMain.handle('planilla:generar', (_, periodo, tipoPago) =>
        planillaController.generarPlanilla(periodo, tipoPago))

    ipcMain.handle('planilla:aprobar', (_, id) =>
        planillaController.aprobarPlanilla(id))

    ipcMain.handle('planilla:eliminar', (_, id) =>
        planillaController.eliminarPlanilla(id))

    // ── Boletas y constancia ──
    ipcMain.handle('planilla:getBoleta', (_, planillaId, empleadoId) =>
        planillaController.getBoleta(planillaId, empleadoId))

    ipcMain.handle('planilla:constanciaSalarial', (_, empleadoId, meses) =>
        planillaController.getConstanciaSalarial(empleadoId, meses))

    // ── Prestaciones ──
    ipcMain.handle('planilla:aguinaldo', (_, anio, completo) =>
        planillaController.calcularAguinaldoTodos(anio, completo))

    ipcMain.handle('planilla:vacaciones', () =>
        planillaController.calcularVacacionesTodos())

    ipcMain.handle('planilla:quincena25', (_, anio) =>
        planillaController.calcularQuincena25Todos(anio))
}
