import { Router, Request, Response } from 'express';
import { proveedoresController } from '../../main/controllers/proveedores.controller';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, busqueda, tipoProveedor } = req.query;
        const result = await proveedoresController.listar(
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined,
            busqueda as string,
            tipoProveedor as string
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/buscar', async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const result = await proveedoresController.buscar(query as string);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await proveedoresController.getById(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await proveedoresController.crear(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const result = await proveedoresController.actualizar(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await proveedoresController.desactivar(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
