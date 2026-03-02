// ══════════════════════════════════════════════════════════
// RUTAS DE SEGURIDAD
// Rutas públicas: /login, /provision
// Rutas protegidas: el resto (auth aplicado en index.ts)
// ══════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { seguridadController } from '../../main/controllers/seguridad.controller'
import { prisma } from '../../main/database/prisma.client'
import { runWithEmpresa } from '../context/tenant.context'
import { requirePermission } from '../middleware/permissions.middleware'

const router = Router()

// ── AUTENTICACIÓN (pública) ────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'Usuario y contraseña son requeridos' })

    const result = await seguridadController.login(username, password)
    res.json(result)
  } catch (err: any) {
    console.error('[login]', err?.message, err?.code)
    res.status(500).json({ ok: false, error: 'Error al procesar el login', _debug: err?.message })
  }
})

// ── PROVISIÓN MULTI-TENANT (pública — post-activación) ─
// En desktop (Electron) sigue usando el IPC handler de seguridad.ipc.ts.
// En web (Vercel) este endpoint crea el Emisor + usuario admin y retorna JWT.
router.post('/provision', async (req: Request, res: Response) => {
  try {
    const { license_key, empresa_nombre, empresa_nit, username, password } = req.body

    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'username y password son requeridos' })

    // ── Modo web: license_key + creación de Emisor ──────
    if (license_key) {
      // 1. Validar licencia contra el panel de admin-licencias
      const adminLicenciasUrl = process.env.ADMIN_LICENCIAS_URL || 'https://admin-licencias.vercel.app'
      const licRes = await fetch(`${adminLicenciasUrl}/api/licenses/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key })
      })

      if (!licRes.ok) {
        const err = await licRes.json().catch(() => ({})) as any
        return res.status(403).json({ ok: false, error: err.error || 'Licencia inválida o expirada' })
      }
      const licData = await licRes.json() as any

      // 2. Buscar o crear el Emisor para esta licencia
      let emisor = await prisma.emisor.findUnique({ where: { licenseKey: license_key } })
      if (!emisor) {
        emisor = await prisma.emisor.create({
          data: {
            licenseKey: license_key,
            nombre:             empresa_nombre || licData.empresa_nombre || 'Mi Empresa',
            nit:                empresa_nit    || licData.empresa_nit    || '0000-000000-000-0',
            nrc:                '0000000',
            codActividad:       '00000',
            descActividad:      'Por configurar en Configuración',
            tipoEstablecimiento:'01',
            departamentoCod:    '06',
            municipioCod:       '23',
            complementoDireccion: 'Por configurar',
            correo:             'admin@empresa.com',
            mhAmbiente:         '00'
          }
        })
      }

      // 3. Crear rol + usuario admin dentro del contexto de esta empresa
      const { userId, roleId } = await runWithEmpresa(emisor.id, () =>
        seguridadController.provisionUser(username, password, emisor!.id)
      )

      // 4. Retornar JWT con identidad + empresa
      const secret = process.env.JWT_SECRET!
      const token = jwt.sign(
        { userId, username, empresaId: emisor.id, roleId },
        secret,
        { expiresIn: '8h' }
      )

      return res.json({ ok: true, token, empresaId: emisor.id })
    }

    // ── Modo desktop: sin license_key (compatibilidad) ──
    // Solo crea usuario admin básico sin empresa (IPC es preferido en desktop)
    const result = await seguridadController.provisionUser(username, password)
    return res.json(result)

  } catch (error: any) {
    console.error('[provision]', error.message)
    res.status(500).json({ ok: false, error: 'Error al procesar la provisión' })
  }
})

// ── USUARIOS (protegidos por auth global + RBAC) ────────
router.get('/usuarios', requirePermission('seguridad:ver'), async (req: Request, res: Response) => {
  try {
    const { page, pageSize, busqueda } = req.query
    const result = await seguridadController.listarUsuarios(
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined,
      busqueda as string
    )
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al listar usuarios' })
  }
})

router.post('/usuarios', requirePermission('seguridad:usuarios'), async (req: Request, res: Response) => {
  try {
    const result = await seguridadController.crearUsuario(req.body)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

router.put('/usuarios/:id', requirePermission('seguridad:usuarios'), async (req: Request, res: Response) => {
  try {
    const result = await seguridadController.actualizarUsuario(Number(req.params.id), req.body)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

router.delete('/usuarios/:id', requirePermission('seguridad:usuarios'), async (req: Request, res: Response) => {
  try {
    const result = await seguridadController.desactivarUsuario(Number(req.params.id))
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al desactivar usuario' })
  }
})

// ── ROLES ──────────────────────────────────────────────
router.get('/roles', requirePermission('seguridad:roles'), async (req: Request, res: Response) => {
  try {
    const result = await seguridadController.listarRoles()
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al listar roles' })
  }
})

router.post('/roles', requirePermission('seguridad:roles'), async (req: Request, res: Response) => {
  try {
    const result = await seguridadController.crearRol(req.body)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al crear rol' })
  }
})

router.put('/roles/:id', requirePermission('seguridad:roles'), async (req: Request, res: Response) => {
  try {
    const result = await seguridadController.actualizarRol(Number(req.params.id), req.body)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al actualizar rol' })
  }
})

router.delete('/roles/:id', requirePermission('seguridad:roles'), async (req: Request, res: Response) => {
  try {
    const result = await seguridadController.eliminarRol(Number(req.params.id))
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al eliminar rol' })
  }
})

// ── PREFERENCIAS DE TEMA ───────────────────────────────
router.post('/tema', async (req: Request, res: Response) => {
  try {
    const { userId, tema, colorCustom } = req.body
    const result = await seguridadController.guardarTema(userId, tema, colorCustom)
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Error al guardar tema' })
  }
})

export default router
