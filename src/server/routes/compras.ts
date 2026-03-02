import { Router, Request, Response } from 'express';
import { comprasController } from '../../main/controllers/compras.controller';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, busqueda, proveedorId } = req.query;
        const result = await comprasController.listar(
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
        const result = await comprasController.getById(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await comprasController.crear(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/anular', async (req: Request, res: Response) => {
    try {
        const result = await comprasController.anular(Number(req.params.id), req.body.motivo);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
