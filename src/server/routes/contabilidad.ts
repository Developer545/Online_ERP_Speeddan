import { Router, Request, Response } from 'express'
import { contabilidadController } from '../../main/controllers/contabilidad.controller'

const router = Router()

// ═══════════════════════════════════════
// CATÁLOGO DE CUENTAS
// ═══════════════════════════════════════

router.get('/cuentas', async (req: Request, res: Response) => {
  try {
    const { busqueda, tipo } = req.query
    const result = await contabilidadController.listarCuentas(
      busqueda as string | undefined,
      tipo as string | undefined
    )
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/cuentas', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.crearCuenta(req.body)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/cuentas/:id', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.editarCuenta(Number(req.params.id), req.body)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/cuentas/:id', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.eliminarCuenta(Number(req.params.id))
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/cuentas/importar', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.importarCatalogo(req.body.cuentas || req.body)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/cuentas/estandar', async (_req: Request, res: Response) => {
  try {
    const result = await contabilidadController.obtenerCatalogoEstandar()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// ═══════════════════════════════════════
// PERÍODOS CONTABLES
// ═══════════════════════════════════════

router.get('/periodos', async (req: Request, res: Response) => {
  try {
    const { anio } = req.query
    const result = await contabilidadController.listarPeriodos(anio ? Number(anio) : undefined)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/periodos', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.crearPeriodo(req.body)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/periodos/:id/cerrar', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.cerrarPeriodo(Number(req.params.id))
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/periodos/:id/reabrir', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.reabrirPeriodo(Number(req.params.id))
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// ═══════════════════════════════════════
// ASIENTOS CONTABLES
// ═══════════════════════════════════════

router.get('/asientos', async (req: Request, res: Response) => {
  try {
    const { periodoId, estado, page, pageSize } = req.query
    const result = await contabilidadController.listarAsientos(
      periodoId ? Number(periodoId) : undefined,
      estado as string | undefined,
      Number(page ?? 1),
      Number(pageSize ?? 20)
    )
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/asientos/:id', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.obtenerAsiento(Number(req.params.id))
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/asientos', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.crearAsiento(req.body)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/asientos/:id', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.editarAsiento(Number(req.params.id), req.body)
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/asientos/:id/aprobar', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.aprobarAsiento(Number(req.params.id))
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.put('/asientos/:id/anular', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.anularAsiento(Number(req.params.id))
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/asientos/:id', async (req: Request, res: Response) => {
  try {
    const result = await contabilidadController.eliminarAsiento(Number(req.params.id))
    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// ═══════════════════════════════════════
// REPORTES CONTABLES
// ═══════════════════════════════════════

router.get('/reportes/balance-comprobacion', async (req: Request, res: Response) => {
  try {
    const { periodoId, desde, hasta } = req.query
    const result = await contabilidadController.balanceComprobacion(
      periodoId ? Number(periodoId) : undefined,
      desde as string | undefined,
      hasta as string | undefined
    )
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/reportes/estado-resultados', async (req: Request, res: Response) => {
  try {
    const { desde, hasta } = req.query
    if (!desde || !hasta) return res.status(400).json({ error: 'Parámetros desde y hasta son requeridos' })
    const result = await contabilidadController.estadoResultados(desde as string, hasta as string)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/reportes/balance-general', async (req: Request, res: Response) => {
  try {
    const { fecha } = req.query
    if (!fecha) return res.status(400).json({ error: 'Parámetro fecha es requerido' })
    const result = await contabilidadController.balanceGeneral(fecha as string)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/reportes/libro-mayor', async (req: Request, res: Response) => {
  try {
    const { cuentaId, desde, hasta } = req.query
    if (!cuentaId || !desde || !hasta) return res.status(400).json({ error: 'Parámetros cuentaId, desde y hasta son requeridos' })
    const result = await contabilidadController.libroMayor(Number(cuentaId), desde as string, hasta as string)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/reportes/libro-diario', async (req: Request, res: Response) => {
  try {
    const { desde, hasta } = req.query
    if (!desde || !hasta) return res.status(400).json({ error: 'Parámetros desde y hasta son requeridos' })
    const result = await contabilidadController.libroDiario(desde as string, hasta as string)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/reportes/auxiliar', async (req: Request, res: Response) => {
  try {
    const { cuentaId, desde, hasta } = req.query
    if (!cuentaId || !desde || !hasta) return res.status(400).json({ error: 'Parámetros cuentaId, desde y hasta son requeridos' })
    const result = await contabilidadController.auxiliarCuenta(Number(cuentaId), desde as string, hasta as string)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
