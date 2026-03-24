import { ipcMain } from 'electron'
import { contabilidadController } from '../controllers/contabilidad.controller'

export function registerContabilidadIPC() {
  // ── Catálogo de Cuentas ──────────────────────────────────
  ipcMain.handle('contabilidad:listarCuentas', (_e, busqueda?: string, tipo?: string) =>
    contabilidadController.listarCuentas(busqueda, tipo)
  )
  ipcMain.handle('contabilidad:crearCuenta', (_e, data) =>
    contabilidadController.crearCuenta(data)
  )
  ipcMain.handle('contabilidad:editarCuenta', (_e, id: number, data) =>
    contabilidadController.editarCuenta(id, data)
  )
  ipcMain.handle('contabilidad:eliminarCuenta', (_e, id: number) =>
    contabilidadController.eliminarCuenta(id)
  )
  ipcMain.handle('contabilidad:importarCatalogo', (_e, cuentas) =>
    contabilidadController.importarCatalogo(cuentas)
  )
  ipcMain.handle('contabilidad:obtenerCatalogoEstandar', () =>
    contabilidadController.obtenerCatalogoEstandar()
  )

  // ── Períodos Contables ───────────────────────────────────
  ipcMain.handle('contabilidad:listarPeriodos', (_e, anio?: number) =>
    contabilidadController.listarPeriodos(anio)
  )
  ipcMain.handle('contabilidad:crearPeriodo', (_e, data) =>
    contabilidadController.crearPeriodo(data)
  )
  ipcMain.handle('contabilidad:cerrarPeriodo', (_e, id: number) =>
    contabilidadController.cerrarPeriodo(id)
  )
  ipcMain.handle('contabilidad:reabrirPeriodo', (_e, id: number) =>
    contabilidadController.reabrirPeriodo(id)
  )

  // ── Asientos Contables ───────────────────────────────────
  ipcMain.handle('contabilidad:listarAsientos', (_e, periodoId?: number, estado?: string, page?: number, pageSize?: number) =>
    contabilidadController.listarAsientos(periodoId, estado, page, pageSize)
  )
  ipcMain.handle('contabilidad:obtenerAsiento', (_e, id: number) =>
    contabilidadController.obtenerAsiento(id)
  )
  ipcMain.handle('contabilidad:crearAsiento', (_e, data) =>
    contabilidadController.crearAsiento(data)
  )
  ipcMain.handle('contabilidad:editarAsiento', (_e, id: number, data) =>
    contabilidadController.editarAsiento(id, data)
  )
  ipcMain.handle('contabilidad:aprobarAsiento', (_e, id: number) =>
    contabilidadController.aprobarAsiento(id)
  )
  ipcMain.handle('contabilidad:anularAsiento', (_e, id: number) =>
    contabilidadController.anularAsiento(id)
  )
  ipcMain.handle('contabilidad:eliminarAsiento', (_e, id: number) =>
    contabilidadController.eliminarAsiento(id)
  )

  // ── Reportes ─────────────────────────────────────────────
  ipcMain.handle('contabilidad:balanceComprobacion', (_e, periodoId?: number, desde?: string, hasta?: string) =>
    contabilidadController.balanceComprobacion(periodoId, desde, hasta)
  )
  ipcMain.handle('contabilidad:estadoResultados', (_e, desde: string, hasta: string) =>
    contabilidadController.estadoResultados(desde, hasta)
  )
  ipcMain.handle('contabilidad:balanceGeneral', (_e, fecha: string) =>
    contabilidadController.balanceGeneral(fecha)
  )
  ipcMain.handle('contabilidad:libroMayor', (_e, cuentaId: number, desde: string, hasta: string) =>
    contabilidadController.libroMayor(cuentaId, desde, hasta)
  )
  ipcMain.handle('contabilidad:libroDiario', (_e, desde: string, hasta: string) =>
    contabilidadController.libroDiario(desde, hasta)
  )
  ipcMain.handle('contabilidad:auxiliarCuenta', (_e, cuentaId: number, desde: string, hasta: string) =>
    contabilidadController.auxiliarCuenta(cuentaId, desde, hasta)
  )

  // ── Tipos de Asiento ─────────────────────────────────────
  ipcMain.handle('contabilidad:listarTiposAsiento', (_e, empresaId?: number) =>
    contabilidadController.listarTiposAsiento(empresaId)
  )
  ipcMain.handle('contabilidad:crearTipoAsiento', (_e, data) =>
    contabilidadController.crearTipoAsiento(data)
  )
  ipcMain.handle('contabilidad:eliminarTipoAsiento', (_e, id: number) =>
    contabilidadController.eliminarTipoAsiento(id)
  )
}
