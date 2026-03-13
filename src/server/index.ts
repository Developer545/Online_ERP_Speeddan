// ══════════════════════════════════════════════════════════
// SERVIDOR EXPRESS — ERP Speeddansys
// Modo web (Vercel/Render): sirve la API REST + SPA React
// Modo desktop (Electron): este archivo NO se usa (IPC handlers)
// ══════════════════════════════════════════════════════════

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { prisma, registerTenantResolver } from '../main/database/prisma.client'
import { getEmpresaId } from './context/tenant.context'
import { requireAuth } from './middleware/auth.middleware'
import { globalErrorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// ── Seguridad: cabeceras HTTP hardening ─────────────────────
app.use(helmet({
  // Content Security Policy desactivado aquí; configurar si se sirve HTML propio
  contentSecurityPolicy: false,
}))

// ── Compresión gzip ─────────────────────────────────────────
app.use(compression())

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

// ── Rate limiting ────────────────────────────────────────────

// General: todas las rutas de la API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minuto
  max: 300,                   // 300 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiadas peticiones. Intente en un momento.' }
})

// Autenticación: más estricto para prevenir fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Intente en 10 minutos.' }
})

// Provisión de empresa: muy restrictivo
const provisionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Límite de provisión alcanzado. Intente en 1 hora.' }
})

app.use('/api', apiLimiter)
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


// ── Caché en memoria para chequeos de suscripción ──────────
// Evita llamar al panel de licencias en cada request
const subscriptionCache = new Map<string, { valido: boolean; exp: number }>()
const SUBSCRIPTION_CACHE_TTL = parseInt(process.env.SUBSCRIPTION_CACHE_TTL || '300') * 1000

/**
 * Extrae el subdominio del Host header.
 * Ej: "acme.speeddansys.com" → "acme"
 * En dev: usa header X-Empresa-Subdominio o query ?empresa=
 */
function extractSubdominio(req: any): string | null {
  // 1. Header explícito (dev / testing)
  const explicit = req.headers['x-empresa-subdominio'] as string
  if (explicit) return explicit.toLowerCase()

  // 2. Query param (dev fallback)
  if (req.query?.empresa) return String(req.query.empresa).toLowerCase()

  // 3. Subdominio real del Host header (custom domains)
  const host = (req.headers.host || '').split(':')[0]
  if (!host.includes('vercel.app') && host !== 'localhost' && host !== '127.0.0.1') {
    const parts = host.split('.')
    // Ej: acme.speeddansys.com → ['acme', 'speeddansys', 'com'] → 'acme'
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0].toLowerCase()
    }
  }

  return null
}

/**
 * Middleware: valida que la suscripción de la empresa esté activa.
 * Llama a POST /api/empresas/check en el panel de licencias.
 * En desarrollo o si LICENSE_PANEL_URL no está configurado → bypass.
 */
async function checkSubscription(req: any, res: any, next: any) {
  // Bypass en desarrollo o si no hay panel configurado
  const panelUrl = process.env.LICENSE_PANEL_URL
  if (!panelUrl || process.env.NODE_ENV === 'development') return next()

  const subdominio = extractSubdominio(req)
  if (!subdominio) return next() // sin subdominio → dejar pasar (ej. dominio raíz)

  // Revisar caché primero
  const cached = subscriptionCache.get(subdominio)
  if (cached && Date.now() < cached.exp) {
    if (!cached.valido) {
      return res.status(402).json({ ok: false, error: 'Suscripción vencida o suspendida. Contacta a soporte.' })
    }
    return next()
  }

  // Consultar panel de licencias
  try {
    const response = await fetch(`${panelUrl}/api/empresas/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdominio }),
      signal: AbortSignal.timeout(5_000),
    })

    const data = await response.json() as any
    const valido = response.ok && data.valido === true

    // Guardar en caché
    subscriptionCache.set(subdominio, { valido, exp: Date.now() + SUBSCRIPTION_CACHE_TTL })

    if (!valido) {
      return res.status(402).json({ ok: false, error: data.error || 'Suscripción inválida.' })
    }

    next()
  } catch (err: any) {
    // Si el panel no responde, dejar pasar (fail-open) para no bloquear a los clientes
    console.warn('[subscription] Panel de licencias no disponible, dejando pasar:', err.message)
    next()
  }
}

// ── Rutas API ──────────────────────────────────────────────
import seguridadRoutes from './routes/seguridad'
import configuracionRoutes from './routes/configuracion'
import clientesRoutes from './routes/clientes'
import proveedoresRoutes from './routes/proveedores'
import productosRoutes from './routes/productos'
import billingRoutes from './routes/billing'
import cxcRoutes from './routes/cxc'
import cxpRoutes from './routes/cxp'
import pagosRoutes from './routes/pagos'
import reportesRoutes from './routes/reportes'
import analyticsRoutes from './routes/analytics'
import planillaRoutes from './routes/planilla'
import gastosRoutes from './routes/gastos'
import empleadosRoutes from './routes/empleados'
import comprasRoutes from './routes/compras'

// Middleware global de autenticación JWT
// Se aplica a TODAS las rutas declaradas DESPUÉS de este punto.
// Verifica el token y establece el contexto de empresa (AsyncLocalStorage).
const PUBLIC_API_PATHS = [
  '/api/health',
  '/api/seguridad/login',
  '/api/seguridad/provision',
  '/api/seguridad/provision-internal', // auth por X-Internal-Key, no JWT
]

// Middleware 1: Autenticación JWT
app.use((req: any, res: any, next: any) => {
  if (PUBLIC_API_PATHS.some(p => req.path.startsWith(p))) return next()
  return requireAuth(req, res, next)
})

// Middleware 2: Validar suscripción activa (solo rutas protegidas)
app.use((req: any, res: any, next: any) => {
  if (PUBLIC_API_PATHS.some(p => req.path.startsWith(p))) return next()
  return checkSubscription(req, res, next)
})

// Todas las rutas pasan por el middleware de auth de arriba.
// login y provision son excluidas explícitamente en PUBLIC_API_PATHS.
app.use('/api/seguridad', seguridadRoutes)

// Rutas protegidas (auth verificado por middleware anterior)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/proveedores', proveedoresRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/cxc', cxcRoutes)
app.use('/api/cxp', cxpRoutes)
app.use('/api/pagos', pagosRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/planilla', planillaRoutes)
app.use('/api/gastos', gastosRoutes)
app.use('/api/empleados', empleadosRoutes)
app.use('/api/compras', comprasRoutes)

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

// ── Global error handler ─────────────────────────────────────
// DEBE ir DESPUÉS de todas las rutas.
// Captura AppError, ZodError, Prisma errors y genéricos (500).
app.use(globalErrorHandler)

// Solo escuchar cuando NO es Vercel (Vercel usa serverless functions)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`[Speeddansys] 🚀 Servidor web en http://localhost:${port}`)
    console.log(`[Speeddansys] DB: ${process.env.DATABASE_URL ? 'Conectando...' : '⚠ DATABASE_URL no configurada'}`)
  })
}

export { app, prisma }
export default app
