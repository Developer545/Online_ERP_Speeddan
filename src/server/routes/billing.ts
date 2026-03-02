import { Router, Request, Response } from 'express';
import { BillingController } from '../../main/controllers/billing.controller';

const router = Router();

router.post('/emitir', async (req: Request, res: Response) => {
    try {
        const result = await BillingController.emitir(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const { tipoDte, estado, desde, hasta, clienteId, page, pageSize } = req.query;
        const result = await BillingController.listar({
            tipoDte: tipoDte as string,
            estado: estado as string,
            desde: desde as string,
            hasta: hasta as string,
            clienteId: clienteId ? Number(clienteId) : undefined,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined
        });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const result = await BillingController.getById(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/reenviar', async (req: Request, res: Response) => {
    try {
        const result = await BillingController.reenviar(Number(req.params.id));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/invalidar', async (req: Request, res: Response) => {
    try {
        const result = await BillingController.invalidar({
            facturaId: Number(req.params.id),
            ...req.body
        });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/cert/verificar', async (req: Request, res: Response) => {
    try {
        const { certFileName, certPassword } = req.body;
        const result = await BillingController.verificarCertificado(certFileName, certPassword);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/cert/listar', async (req: Request, res: Response) => {
    try {
        const result = await BillingController.listCertificados();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
