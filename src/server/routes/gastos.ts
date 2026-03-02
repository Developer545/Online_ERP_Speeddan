import { Router, Request, Response } from 'express';
import { gastosController } from '../../main/controllers/gastos.controller';

const router = Router();

// ── Categorías ────────────────────────────────────────────

router.get('/categorias', async (_req: Request, res: Response) => {
    try {
        const result = await gastosController.listarCategorias();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/categorias', async (req: Request, res: Response) => {
    try {
        const result = await gastosController.crearCategoria(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/categorias/:id', async (req: Request, res: Response) => {
    try {
        const result = await gastosController.editarCategoria(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/categorias/:id', async (req: Request, res: Response) => {
    try {
        const result = await gastosController.eliminarCategoria(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// ── Gastos ────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, categoriaId, desde, hasta } = req.query;
        const result = await gastosController.listar(
            Number(page ?? 1),
            Number(pageSize ?? 20),
            categoriaId ? Number(categoriaId) : undefined,
            desde as string | undefined,
            hasta as string | undefined
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await gastosController.crear(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const result = await gastosController.editar(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await gastosController.eliminar(Number(req.params.id));
        res.json({ ok: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/resumen/:mes/:anio', async (req: Request, res: Response) => {
    try {
        const result = await gastosController.resumenPorCategoria(
            Number(req.params.mes),
            Number(req.params.anio)
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
