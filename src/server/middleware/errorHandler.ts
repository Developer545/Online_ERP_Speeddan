// ══════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// Portado desde Facturación DTE Online
// Centraliza todas las respuestas de error para:
//  - AppError (errores de negocio controlados)
//  - ZodError (validación de datos)
//  - Prisma errors (BD: duplicados, not found, etc.)
//  - Errores genéricos (500 sin exponer stack en prod)
// ══════════════════════════════════════════════════════════

import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { AppError } from '../utils/AppError'

const isDev = process.env.NODE_ENV !== 'production'

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── 1. AppError: errores de negocio conocidos ───────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: err.message,
      code: err.code,
    })
    return
  }

  // ── 2. ZodError: fallo de validación de esquema ─────────
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      })),
    })
    return
  }

  // ── 3. Prisma: errores conocidos de BD ──────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint
        res.status(409).json({
          ok: false,
          error: 'Ya existe un registro con esos datos',
          code: 'DUPLICATE_KEY',
        })
        return
      case 'P2025': // Record not found (delete/update)
        res.status(404).json({
          ok: false,
          error: 'Registro no encontrado',
          code: 'NOT_FOUND',
        })
        return
      case 'P2003': // Foreign key constraint
        res.status(400).json({
          ok: false,
          error: 'No se puede completar la operación: referencia inválida',
          code: 'FOREIGN_KEY_ERROR',
        })
        return
      case 'P2014': // Relation violation
        res.status(400).json({
          ok: false,
          error: 'Operación inválida: relación de datos incorrecta',
          code: 'RELATION_ERROR',
        })
        return
    }
  }

  // ── 4. CORS error ────────────────────────────────────────
  if (err.message?.startsWith('CORS:')) {
    res.status(403).json({ ok: false, error: err.message, code: 'CORS_BLOCKED' })
    return
  }

  // ── 5. Error genérico (inesperado) ───────────────────────
  // Solo logear en servidor, nunca enviar stack al cliente en prod
  console.error('[Server Error]', {
    name: err.name,
    message: err.message,
    ...(isDev && { stack: err.stack }),
  })

  res.status(500).json({
    ok: false,
    error: isDev ? err.message : 'Error interno del servidor. Contacta a soporte.',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  })
}
