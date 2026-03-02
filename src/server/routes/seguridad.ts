import { Router, Request, Response } from 'express';
import { seguridadController } from '../../main/controllers/seguridad.controller';

const router = Router();

// ── AUTENTICACIÓN ──────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ ok: false, error: 'Usuario y contraseña son requeridos' });
        }
        const result = await seguridadController.login(username, password);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ── USUARIOS ──────────────────────────────────────────
router.get('/usuarios', async (req: Request, res: Response) => {
    try {
        const { page, pageSize, busqueda } = req.query;
        const result = await seguridadController.listarUsuarios(
            page ? Number(page) : undefined,
            pageSize ? Number(pageSize) : undefined,
            busqueda as string
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/usuarios', async (req: Request, res: Response) => {
    try {
        const result = await seguridadController.crearUsuario(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/usuarios/:id', async (req: Request, res: Response) => {
    try {
        const result = await seguridadController.actualizarUsuario(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/usuarios/:id', async (req: Request, res: Response) => {
    try {
        const result = await seguridadController.desactivarUsuario(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── ROLES ──────────────────────────────────────────────
router.get('/roles', async (req: Request, res: Response) => {
    try {
        const result = await seguridadController.listarRoles();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/roles', async (req: Request, res: Response) => {
    try {
        const result = await seguridadController.crearRol(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/roles/:id', async (req: Request, res: Response) => {
    try {
        const result = await seguridadController.actualizarRol(Number(req.params.id), req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/roles/:id', async (req: Request, res: Response) => {
    try {
        const result = await seguridadController.eliminarRol(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ── PROVISIÓN DE USUARIO ADMIN (post-activación) ────────
router.post('/provision', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ ok: false, error: 'Usuario y contraseña son requeridos' });
        }
        const result = await seguridadController.provisionUser(username, password);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// ── PREFERENCIAS DE TEMA ───────────────────────────────
router.post('/tema', async (req: Request, res: Response) => {
    try {
        const { userId, tema, colorCustom } = req.body;
        const result = await seguridadController.guardarTema(userId, tema, colorCustom);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
