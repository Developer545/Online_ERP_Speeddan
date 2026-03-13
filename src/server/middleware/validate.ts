// ══════════════════════════════════════════════════════════
// VALIDATE MIDDLEWARE — Validación de esquemas con Zod
// Portado desde Facturación DTE Online
// ══════════════════════════════════════════════════════════

import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

/**
 * Middleware que valida `req.body` contra un esquema Zod.
 * Si la validación pasa, reemplaza req.body con los datos
 * parseados (con defaults y transformaciones aplicadas).
 *
 * Uso en rutas:
 *   router.post('/', validate(crearClienteSchema), handler)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: result.error.errors.map((e) => ({
          campo: e.path.join('.') || 'body',
          mensaje: e.message,
        })),
      })
      return
    }

    // Reemplazar body con datos validados (incluye defaults de Zod)
    req.body = result.data
    next()
  }
}

/**
 * Middleware que valida `req.query` contra un esquema Zod.
 * Útil para validar parámetros de paginación, filtros, etc.
 *
 * Uso en rutas:
 *   router.get('/', validateQuery(listarQuerySchema), handler)
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: 'Parámetros de consulta inválidos',
        code: 'QUERY_VALIDATION_ERROR',
        details: result.error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        })),
      })
      return
    }

    req.query = result.data as typeof req.query
    next()
  }
}

/**
 * Middleware que valida `req.params` contra un esquema Zod.
 *
 * Uso en rutas:
 *   router.get('/:id', validateParams(idParamSchema), handler)
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params)

    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: 'Parámetros de ruta inválidos',
        code: 'PARAMS_VALIDATION_ERROR',
        details: result.error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        })),
      })
      return
    }

    req.params = result.data as typeof req.params
    next()
  }
}
