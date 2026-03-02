// ══════════════════════════════════════════════════════════
// RBAC MIDDLEWARE — Control de acceso basado en roles
// Verifica que el usuario autenticado tenga el permiso
// requerido antes de ejecutar el handler de la ruta.
// ══════════════════════════════════════════════════════════

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../main/database/prisma.client'
import type { AuthRequest } from './auth.middleware'

/**
 * Middleware de autorización por permiso.
 * Debe usarse DESPUÉS de requireAuth.
 *
 * Uso:
 *   router.delete('/usuarios/:id', requirePermission('seguridad:usuarios'), handler)
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthRequest).user
      if (!user) {
        res.status(401).json({ ok: false, error: 'No autenticado' })
        return
      }

      const role = await prisma.role.findUnique({
        where: { id: user.roleId },
        select: { permisos: true }
      })

      const permisos: string[] = JSON.parse(role?.permisos ?? '[]')

      if (!permisos.includes(permission)) {
        res.status(403).json({ ok: false, error: 'Acceso denegado: permiso insuficiente' })
        return
      }

      next()
    } catch {
      res.status(500).json({ ok: false, error: 'Error al verificar permisos' })
    }
  }
}
