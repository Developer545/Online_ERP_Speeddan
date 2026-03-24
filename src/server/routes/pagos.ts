import { Router, Request, Response } from 'express';
import { pagosCxcController } from '../../main/controllers/pagos-cxc.controller';
import { pagosCxpController } from '../../main/controllers/pagos-cxp.controller';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await pagosCxcController.registrarPago(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/historial/:facturaId', async (req: Request, res: Response) => {
    try {
        const result = await pagosCxcController.historial(Number(req.params.facturaId));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await pagosCxcController.anularPago(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── CxP (Cuentas por Pagar) ───────────────────────────────
router.post('/cxp', async (req: Request, res: Response) => {
    try {
        const result = await pagosCxpController.registrarPago(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/cxp/historial/:compraId', async (req: Request, res: Response) => {
    try {
        const result = await pagosCxpController.historial(Number(req.params.compraId));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/cxp/:id', async (req: Request, res: Response) => {
    try {
        const result = await pagosCxpController.anularPago(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
