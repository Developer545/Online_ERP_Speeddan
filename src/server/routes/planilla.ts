import { Router, Request, Response } from 'express';
import { planillaController } from '../../main/controllers/planilla.controller';

const router = Router();

// ── Config ─────────────────────────────────────────
router.get('/config', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.getConfig();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/config', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.updateConfig(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/config/seed', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.seedConfigDefaults();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── Planillas ──────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, pageSize } = req.query;
        const result = await planillaController.listarPlanillas(
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.getPlanillaById(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/generar', async (req: Request, res: Response) => {
    try {
        const { periodo, tipoPago } = req.body;
        const result = await planillaController.generarPlanilla(periodo, tipoPago);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/aprobar', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.aprobarPlanilla(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.eliminarPlanilla(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── Boletas / Constancias ──────────────────────────
router.get('/:id/boleta/:empleadoId', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.getBoleta(Number(req.params.id), Number(req.params.empleadoId));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/empleado/:id/constancia', async (req: Request, res: Response) => {
    try {
        const { meses } = req.query;
        const result = await planillaController.getConstanciaSalarial(Number(req.params.id), meses ? Number(meses) : undefined);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── Cálculos Extra ─────────────────────────────────
router.get('/calcular/aguinaldo', async (req: Request, res: Response) => {
    try {
        const { anio, otorgarCompleto } = req.query;
        const result = await planillaController.calcularAguinaldoTodos(
            anio ? Number(anio) : undefined,
            otorgarCompleto === 'true'
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/calcular/vacaciones', async (req: Request, res: Response) => {
    try {
        const result = await planillaController.calcularVacacionesTodos();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/calcular/quincena25', async (req: Request, res: Response) => {
    try {
        const { anio } = req.query;
        const result = await planillaController.calcularQuincena25Todos(anio ? Number(anio) : undefined);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
