import { Router, Request, Response } from 'express';
import { cxpController } from '../../main/controllers/cxp.controller';

const router = Router();

router.get('/resumen', async (req: Request, res: Response) => {
    try {
        const result = await cxpController.resumen();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await cxpController.listar();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
