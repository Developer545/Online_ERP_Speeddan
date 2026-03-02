import { Router, Request, Response } from 'express';
import { ProductsController } from '../../main/controllers/products.controller';

const router = Router();

// ─── Resumen Inventario ──────────────────────────────
router.get('/resumen', async (req: Request, res: Response) => {
    try {
        const result = await ProductsController.getResumenInventario();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Categorías ──────────────────────────────────────
router.get('/categorias', async (req: Request, res: Response) => {
    try {
        const result = await ProductsController.listarCategorias();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/categorias', async (req: Request, res: Response) => {
    try {
        const { nombre } = req.body;
        const result = await ProductsController.crearCategoria(nombre);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Kardex ──────────────────────────────────────────
router.get('/kardex/general', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, productoId } = req.query;
        const result = await ProductsController.getKardexGeneral(
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined,
            productoId ? Number(productoId) : undefined
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Búsqueda ────────────────────────────────────────
router.get('/buscar', async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const result = await ProductsController.buscar(query as string);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Productos Principales ─────────────────────────────
router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, busqueda, categoriaId, soloStockBajo } = req.query;
        const result = await ProductsController.listar(
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined,
            busqueda as string,
            categoriaId ? Number(categoriaId) : undefined,
            soloStockBajo === 'true'
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await ProductsController.getById(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await ProductsController.crear(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const result = await ProductsController.actualizar(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const result = await ProductsController.desactivar(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/ajustar-stock', async (req: Request, res: Response) => {
    try {
        const result = await ProductsController.ajustarStock(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id/kardex', async (req: Request, res: Response) => {
    try {
        const { page, pageSize } = req.query;
        const result = await ProductsController.getKardex(
            Number(req.params.id),
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
