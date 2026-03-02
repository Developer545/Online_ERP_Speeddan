import * as express from 'express';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Speeddansys ERP Web API is running', env: process.env.NODE_ENV });
});

// ── Rutas API ──────────────────────────────────────────────
import seguridadRoutes from './routes/seguridad';
import configuracionRoutes from './routes/configuracion';
import clientesRoutes from './routes/clientes';
import proveedoresRoutes from './routes/proveedores';
import productosRoutes from './routes/productos';
import billingRoutes from './routes/billing';
import cxcRoutes from './routes/cxc';
import cxpRoutes from './routes/cxp';
import pagosRoutes from './routes/pagos';
import reportesRoutes from './routes/reportes';
import analyticsRoutes from './routes/analytics';
import planillaRoutes from './routes/planilla';
import gastosRoutes from './routes/gastos';
import empleadosRoutes from './routes/empleados';
import comprasRoutes from './routes/compras';

app.use('/api/seguridad', seguridadRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/cxc', cxcRoutes);
app.use('/api/cxp', cxpRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/planilla', planillaRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/compras', comprasRoutes);

// ── Servir React (modo producción web en Render/Vercel) ────
if (process.env.NODE_ENV === 'production') {
    const staticPath = path.join(__dirname, '../../dist/renderer');
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(staticPath, 'index.html'));
        }
    });
}

// Solo escuchar cuando NO es Vercel (Vercel usa serverless)
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`[Speeddansys-Server] 🚀 Servidor web en http://localhost:${port}`);
        console.log(`[Speeddansys-Server] DB: ${process.env.DATABASE_URL ? 'Conectando a Neon...' : '⚠ DATABASE_URL no configurada'}`);
    });
}

export { app, prisma };
export default app;
