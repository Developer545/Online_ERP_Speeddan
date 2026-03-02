import { Router, Request, Response } from 'express';
import { configuracionController } from '../../main/controllers/configuracion.controller';

const router = Router();

// ── EMISOR ────────────────────────────────────────────────
router.get('/emisor', async (req: Request, res: Response) => {
    try {
        const result = await configuracionController.getEmisor();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/emisor', async (req: Request, res: Response) => {
    try {
        const result = await configuracionController.guardarEmisor(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/credenciales-mh', async (req: Request, res: Response) => {
    try {
        const result = await configuracionController.guardarCredencialesMH(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/simulacion/toggle', async (req: Request, res: Response) => {
    try {
        const { activar } = req.body;
        const result = await configuracionController.toggleSimulacion(activar);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/simulacion/activar', async (req: Request, res: Response) => {
    try {
        const result = await configuracionController.activarModoSimulacion();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── SUCURSALES ────────────────────────────────────────────
router.get('/sucursales', async (req: Request, res: Response) => {
    try {
        const result = await configuracionController.listarSucursales();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/sucursales', async (req: Request, res: Response) => {
    try {
        const result = await configuracionController.guardarSucursal(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/sucursales/:id', async (req: Request, res: Response) => {
    try {
        const result = await configuracionController.desactivarSucursal(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
