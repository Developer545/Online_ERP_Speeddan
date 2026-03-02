import { Router, Request, Response } from 'express';
import { ClientsController } from '../../main/controllers/clients.controller';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, busqueda, tipoDocumento } = req.query;
        const result = await ClientsController.listar(
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined,
            busqueda as string,
            tipoDocumento as string
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/buscar', async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const result = await ClientsController.buscar(query as string);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await ClientsController.getById(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await ClientsController.crear(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const result = await ClientsController.actualizar(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await ClientsController.desactivar(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
