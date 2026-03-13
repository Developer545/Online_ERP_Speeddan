// ══════════════════════════════════════════════════════════
// AppError — Clase centralizada de errores de negocio
// Portado desde Facturación DTE Online
// ══════════════════════════════════════════════════════════

/**
 * Error controlado de la aplicación.
 * Cualquier módulo puede lanzar AppError y el globalErrorHandler
 * lo capturará, enviando la respuesta HTTP correcta sin exponer
 * información interna.
 *
 * Uso:
 *   throw AppError.badRequest('El NIT no es válido')
 *   throw new AppError('Recurso no encontrado', 404)
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string | undefined
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 500, code?: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true // Errores esperados vs crashes inesperados
    Error.captureStackTrace(this, this.constructor)
  }

  // ── Factories ────────────────────────────────────────────

  /** 400 — Datos del cliente inválidos o faltantes */
  static badRequest(message: string, code?: string): AppError {
    return new AppError(message, 400, code ?? 'BAD_REQUEST')
  }

  /** 401 — No autenticado */
  static unauthorized(message = 'Autenticación requerida'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED')
  }

  /** 403 — Autenticado pero sin permisos */
  static forbidden(message = 'No tienes permiso para esta acción'): AppError {
    return new AppError(message, 403, 'FORBIDDEN')
  }

  /** 404 — Recurso no existe */
  static notFound(entity = 'Registro'): AppError {
    return new AppError(`${entity} no encontrado`, 404, 'NOT_FOUND')
  }

  /** 409 — Conflicto (ej. duplicado) */
  static conflict(message: string, code?: string): AppError {
    return new AppError(message, 409, code ?? 'CONFLICT')
  }

  /** 422 — Datos válidos pero regla de negocio falla */
  static unprocessable(message: string, code?: string): AppError {
    return new AppError(message, 422, code ?? 'UNPROCESSABLE')
  }

  /** 500 — Error interno inesperado */
  static internal(message = 'Error interno del servidor'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR')
  }
}
