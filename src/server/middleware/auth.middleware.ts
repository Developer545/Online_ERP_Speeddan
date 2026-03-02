// ══════════════════════════════════════════════════════════
// AUTH MIDDLEWARE — JWT + Tenant Context
// Valida el token JWT de cada request y establece el contexto
// de empresa (empresaId) para que el Prisma middleware pueda
// filtrar los datos automáticamente.
//
// Flujo:
//   1. Leer token del header Authorization: Bearer <token>
//   2. Verificar con JWT_SECRET
//   3. Adjuntar payload al request (req.user)
//   4. Ejecutar next() dentro del contexto de empresa
//      → AsyncLocalStorage propagará empresaId al stack completo
// ══════════════════════════════════════════════════════════

import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { runWithEmpresa } from '../context/tenant.context'

// ── Tipos ─────────────────────────────────────────────────

export interface JWTPayload {
  userId: number
  username: string
  empresaId: number
  roleId: number
}

/** Request con datos del usuario autenticado adjuntos */
export interface AuthRequest extends Request {
  user: JWTPayload
}

// ── Middleware ─────────────────────────────────────────────

/**
 * Middleware de autenticación. Verifica el JWT y establece el contexto
 * de empresa para que los filtros de Prisma operen automáticamente.
 *
 * Uso en rutas:
 *   router.get('/recurso', requireAuth, handler)
 *
 * O como middleware global en index.ts (excepto rutas públicas).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: 'Autenticación requerida' })
    return
  }

  const token = authHeader.slice(7).trim()

  if (!token) {
    res.status(401).json({ ok: false, error: 'Token no proporcionado' })
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('[auth] JWT_SECRET no está configurado')
    res.status(500).json({ ok: false, error: 'Error de configuración del servidor' })
    return
  }

  try {
    const payload = jwt.verify(token, secret) as JWTPayload
    ;(req as AuthRequest).user = payload

    // Ejecutar el resto del pipeline dentro del contexto de la empresa.
    // El Prisma middleware detectará empresaId vía AsyncLocalStorage
    // e inyectará WHERE empresa_id = X en cada query automáticamente.
    runWithEmpresa(payload.empresaId, next)
  } catch (err) {
    // Token expirado, malformado o firma inválida
    res.status(401).json({ ok: false, error: 'Token inválido o expirado' })
  }
}
