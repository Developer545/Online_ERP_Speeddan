import { Router, Request, Response } from 'express';
import { ComprasController } from '../../main/controllers/compras.controller';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, busqueda, proveedorId } = req.query;
        const result = await ComprasController.listar(
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined,
            busqueda as string,
            proveedorId ? Number(proveedorId) : undefined
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await ComprasController.getById(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await ComprasController.crear(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/anular', async (req: Request, res: Response) => {
    try {
        const result = await ComprasController.anular(Number(req.params.id), req.body.motivo);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
