// ══════════════════════════════════════════════════════════
// AUDIT UTIL — Registro de auditoría de acciones
// Portado / inspirado de Facturación DTE Online
// Registra automáticamente: quién hizo qué, cuándo, desde dónde
// ══════════════════════════════════════════════════════════

import { prisma } from '../../main/database/prisma.client'
import type { Request } from 'express'

// ── Tipos ──────────────────────────────────────────────────

export interface AuditParams {
  empresaId?: number | null
  userId?:    number | null
  username?:  string | null
  /** Acción realizada: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', etc. */
  accion:     string
  /** Entidad afectada: 'Factura', 'Cliente', 'Producto', 'User', etc. */
  entidad:    string
  /** ID del registro afectado (opcional) */
  entidadId?: string | number | null
  /** Detalle adicional (diferencias, datos relevantes) */
  detalle?:   Record<string, unknown> | null
  ip?:        string | null
  userAgent?: string | null
}

// ── Función principal ──────────────────────────────────────

/**
 * Registra una entrada de auditoría de forma asíncrona no-bloqueante.
 * Los errores de auditoría nunca interrumpen el flujo principal de la petición.
 *
 * Uso en un controller:
 *   await registrarAuditoria({
 *     empresaId: req.empresaId,
 *     userId:    req.user?.id,
 *     username:  req.user?.username,
 *     accion:    'CREATE',
 *     entidad:   'Factura',
 *     entidadId: nuevaFactura.id,
 *     detalle:   { correlativo: nuevaFactura.numeroControl },
 *     ip:        getClientIp(req),
 *     userAgent: req.headers['user-agent'],
 *   })
 */
export function registrarAuditoria(params: AuditParams): void {
  // Fire-and-forget: no bloquear el response del endpoint
  prisma.auditLog
    .create({
      data: {
        empresaId: params.empresaId ?? null,
        userId:    params.userId    ?? null,
        username:  params.username  ?? null,
        accion:    params.accion,
        entidad:   params.entidad,
        entidadId: params.entidadId != null ? String(params.entidadId) : null,
        detalle:   params.detalle   ? JSON.stringify(params.detalle)   : null,
        ip:        params.ip        ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
    .catch((err) => {
      // No lanzar — auditoría nunca debe romper el flujo de negocio
      console.warn('[audit] Error al registrar auditoría:', err?.message ?? err)
    })
}

// ── Helper: extraer IP del cliente ─────────────────────────

/**
 * Extrae la IP real del cliente, tomando en cuenta proxies / load balancers.
 * Prioridad: X-Forwarded-For → X-Real-IP → socket.remoteAddress
 */
export function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]
    return first.trim()
  }

  const realIp = req.headers['x-real-ip']
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp
  }

  return req.socket?.remoteAddress ?? null
}

// ── Helper: construir params desde request ─────────────────

/**
 * Atajo para construir AuditParams comunes a partir del Request.
 * Combina con parámetros específicos del endpoint.
 *
 * Uso:
 *   registrarAuditoria(fromRequest(req, {
 *     accion: 'DELETE',
 *     entidad: 'Cliente',
 *     entidadId: id,
 *   }))
 */
export function fromRequest(
  req: Request & { user?: { id?: number; username?: string }; empresaId?: number | null },
  params: Pick<AuditParams, 'accion' | 'entidad'> & Partial<AuditParams>
): AuditParams {
  return {
    empresaId: req.empresaId   ?? null,
    userId:    req.user?.id    ?? null,
    username:  req.user?.username ?? null,
    ip:        getClientIp(req),
    userAgent: req.headers['user-agent'] ?? null,
    ...params,
  }
}
