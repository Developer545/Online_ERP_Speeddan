import { Router, Request, Response } from 'express';
import { reportesController } from '../../main/controllers/reportes.controller';

const router = Router();

router.get('/ventas', async (req: Request, res: Response) => {
    try {
        const { desde, hasta } = req.query;
        const result = await reportesController.libroVentas(String(desde || ''), String(hasta || ''));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/rentabilidad', async (req: Request, res: Response) => {
    try {
        const result = await reportesController.rentabilidad();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/compras', async (req: Request, res: Response) => {
    try {
        const { desde, hasta } = req.query;
        const result = await reportesController.libroCompras(String(desde || ''), String(hasta || ''));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/f07/:mes', async (req: Request, res: Response) => {
    try {
        const result = await reportesController.resumenF07(String(req.params.mes));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/cxc-vencidas', async (req: Request, res: Response) => {
    try {
        const result = await reportesController.cxcVencidas();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
