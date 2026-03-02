import { Router, Request, Response } from 'express';
import { analyticsController } from '../../main/controllers/analytics.controller';

const router = Router();

router.get('/ventas/dias/:dias', async (req: Request, res: Response) => {
    try {
        const result = await analyticsController.getVentasPorDia(Number(req.params.dias));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/productos/top/:limite', async (req: Request, res: Response) => {
    try {
        const result = await analyticsController.getTopProductos(Number(req.params.limite));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/ventas-compras/meses/:meses', async (req: Request, res: Response) => {
    try {
        const result = await analyticsController.getVentasVsComprasPorMes(Number(req.params.meses));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/documentos/distribucion', async (req: Request, res: Response) => {
    try {
        const result = await analyticsController.getDistribucionTipoDocumento();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/kpi', async (req: Request, res: Response) => {
    try {
        const result = await analyticsController.getKpiResumen();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/utilidad-real/:meses', async (req: Request, res: Response) => {
    try {
        const result = await analyticsController.getUtilidadReal(Number(req.params.meses));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
