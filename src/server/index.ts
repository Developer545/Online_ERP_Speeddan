// ══════════════════════════════════════════════════════════
// SERVIDOR EXPRESS — ERP Speeddansys
// Modo web (Vercel/Render): sirve la API REST + SPA React
// Modo desktop (Electron): este archivo NO se usa (IPC handlers)
// ══════════════════════════════════════════════════════════

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { prisma, registerTenantResolver } from '../main/database/prisma.client'
import { getEmpresaId } from './context/tenant.context'
import { requireAuth } from './middleware/auth.middleware'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// ── Registrar el resolver de tenant en el Prisma middleware ─
// Esto enlaza AsyncLocalStorage (tenant.context) con el filtro
// automático de empresa_id en cada query de Prisma.
// En Electron, este archivo no se importa → el resolver nunca
// se registra → todos los queries son globales (correcto).
registerTenantResolver(getEmpresaId)

// ── CORS seguro: solo orígenes permitidos ───────────────────
const ALLOWED_ORIGINS = [
  'https://speeddansys.vercel.app',
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://localhost:3000']
    : [])
]

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Electron, curl en dev)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS: Origen no permitido'))
    }
  },
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))

// ── Rate limiting: rutas públicas sensibles ─────────────────
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Intente en 10 minutos.' }
})

const provisionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Límite de provisión alcanzado. Intente en 1 hora.' }
})

app.use('/api/seguridad/login', loginLimiter)
app.use('/api/seguridad/provision', provisionLimiter)

// ── Health check (público) ──────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Speeddansys ERP Web API is running',
    env: process.env.NODE_ENV
  })
})

// ── DB ping (temporal para diagnóstico) ─────────────────────
app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, db: 'connected' })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message, code: err.code })
  }
})

// ── Rutas API ──────────────────────────────────────────────
import seguridadRoutes     from './routes/seguridad'
import configuracionRoutes from './routes/configuracion'
import clientesRoutes      from './routes/clientes'
import proveedoresRoutes   from './routes/proveedores'
import productosRoutes     from './routes/productos'
import billingRoutes       from './routes/billing'
import cxcRoutes           from './routes/cxc'
import cxpRoutes           from './routes/cxp'
import pagosRoutes         from './routes/pagos'
import reportesRoutes      from './routes/reportes'
import analyticsRoutes     from './routes/analytics'
import planillaRoutes      from './routes/planilla'
import gastosRoutes        from './routes/gastos'
import empleadosRoutes     from './routes/empleados'
import comprasRoutes       from './routes/compras'

// Rutas públicas: no requieren JWT
// /login y /provision se gestionan internamente en seguridadRoutes
app.use('/api/seguridad', seguridadRoutes)

// Middleware global de autenticación JWT
// Se aplica a TODAS las rutas declaradas DESPUÉS de este punto.
// Verifica el token y establece el contexto de empresa (AsyncLocalStorage).
const PUBLIC_API_PATHS = [
  '/api/health',
  '/api/seguridad/login',
  '/api/seguridad/provision'
]

app.use((req, res, next) => {
  // Dejar pasar rutas públicas sin auth
  if (PUBLIC_API_PATHS.some(path => req.path.startsWith(path))) {
    return next()
  }
  return requireAuth(req, res, next)
})

// Rutas protegidas (auth verificado por middleware anterior)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/clientes',      clientesRoutes)
app.use('/api/proveedores',   proveedoresRoutes)
app.use('/api/productos',     productosRoutes)
app.use('/api/billing',       billingRoutes)
app.use('/api/cxc',           cxcRoutes)
app.use('/api/cxp',           cxpRoutes)
app.use('/api/pagos',         pagosRoutes)
app.use('/api/reportes',      reportesRoutes)
app.use('/api/analytics',     analyticsRoutes)
app.use('/api/planilla',      planillaRoutes)
app.use('/api/gastos',        gastosRoutes)
app.use('/api/empleados',     empleadosRoutes)
app.use('/api/compras',       comprasRoutes)

// ── Servir React SPA (solo en modo NO-Vercel, ej. Render/VPS) ──
// En Vercel el SPA se sirve desde vercel.json rewrites.
if (!process.env.VERCEL && process.env.NODE_ENV === 'production') {
  const path = require('path')
  const staticPath = path.join(__dirname, '../../dist/renderer')
  app.use(express.static(staticPath))
  app.get('*', (req: any, res: any) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticPath, 'index.html'))
    }
  })
}

// Solo escuchar cuando NO es Vercel (Vercel usa serverless functions)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[Speeddansys] 🚀 Servidor web en http://localhost:${port}`)
    console.log(`[Speeddansys] DB: ${process.env.DATABASE_URL ? 'Conectando...' : '⚠ DATABASE_URL no configurada'}`)
  })
}

export { app, prisma }
export default app
