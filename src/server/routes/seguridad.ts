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
    const { username, password, subdominio } = req.body
    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'Usuario y contraseña son requeridos' })

    // Validar el subdominio si viene y es válido para extraer el tenant context
    if (subdominio && subdominio !== 'localhost' && subdominio !== '127') {
      const emisor = await prisma.emisor.findUnique({ where: { subdominio } })
      if (emisor) {
        const result = await runWithEmpresa(emisor.id, () =>
          seguridadController.login(username, password)
        )
        return res.json(result)
      }
    }

    // Fallback: Si no hay subdominio (desktop, localhost), realizar búsqueda global
    const result = await seguridadController.login(username, password)
    res.json(result)
  } catch (error: any) {
    console.error('[login]', error.message)
    res.status(500).json({ ok: false, error: 'Error al procesar el login' })
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
            nombre: empresa_nombre || licData.empresa_nombre || 'Mi Empresa',
            nit: empresa_nit || licData.empresa_nit || '0000-000000-000-0',
            nrc: '0000000',
            codActividad: '00000',
            descActividad: 'Por configurar en Configuración',
            tipoEstablecimiento: '01',
            departamentoCod: '06',
            municipioCod: '23',
            complementoDireccion: 'Por configurar',
            correo: 'admin@empresa.com',
            mhAmbiente: '00'
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

// ── PROVISIÓN INTERNA (llamada desde panel de licencias) ─────────────────
// No requiere JWT — requiere header X-Internal-Key coincidiendo con INTERNAL_API_KEY
// Crea Emisor + usuario admin para nuevas empresas web desde el panel admin
router.post('/provision-internal', async (req: Request, res: Response) => {
  // Verificar clave interna
  const internalKey = req.headers['x-internal-key'] as string
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ ok: false, error: 'Acceso no autorizado' })
  }

  try {
    const {
      empresa_nombre, empresa_nit, subdominio,
      username, password, plan, modulos, database_url
    } = req.body

    if (!empresa_nombre || !username || !password) {
      return res.status(400).json({ ok: false, error: 'empresa_nombre, username y password son requeridos' })
    }

    // Verificar si el Emisor con ese subdominio o NIT ya existe (idempotente)
    let emisor = subdominio
      ? await prisma.emisor.findFirst({ where: { subdominio } })
      : null

    // Si no se encontró por subdominio, buscar por NIT para evitar unique constraint
    if (!emisor && empresa_nit) {
      emisor = await prisma.emisor.findFirst({ where: { nit: empresa_nit } })
      // Si lo encontramos por NIT, actualizar su subdominio si no lo tenía
      if (emisor && subdominio && !emisor.subdominio) {
        emisor = await prisma.emisor.update({
          where: { id: emisor.id },
          data: { subdominio, plan: plan || emisor.plan, modulosActivos: modulos || emisor.modulosActivos }
        })
      }
    }

    if (!emisor) {
      // NRC único por empresa: usar subdominio o timestamp para evitar unique constraint
      const nrcUnico = subdominio
        ? subdominio.slice(0, 7).padEnd(7, '0')
        : Date.now().toString().slice(-7)

      emisor = await prisma.emisor.create({
        data: {
          nombre: empresa_nombre,
          nit: empresa_nit || '0000-000000-000-0',
          nrc: nrcUnico,
          codActividad: '00000',
          descActividad: 'Por configurar',
          tipoEstablecimiento: '01',
          departamentoCod: '06',
          municipioCod: '23',
          complementoDireccion: 'Por configurar',
          correo: 'admin@empresa.com',
          mhAmbiente: '00',
          subdominio: subdominio || null,
          plan: plan || 'emprendedor',
          modulosActivos: modulos || {},
        }
      })
    }

    // Crear rol admin + primer usuario dentro del contexto de esta empresa
    const { userId, roleId } = await runWithEmpresa(emisor.id, () =>
      seguridadController.provisionUser(username, password, emisor!.id)
    )

    console.log(`[provision-internal] Emisor creado: ${empresa_nombre} (id=${emisor.id}, subdominio=${subdominio})`)

    return res.status(201).json({ ok: true, emisorId: emisor.id, userId, roleId })
  } catch (error: any) {
    console.error('[provision-internal]', error.message, error.stack)
    res.status(500).json({ ok: false, error: 'Error al provisionar la empresa', detail: error.message, stack: error.stack })
  }
})

// ── ELIMINAR PROVISIÓN (llamada desde panel de licencias) ────────
// Borra la empresa y sus usuarios administradores si se elimina desde el panel Web
router.delete('/provision-internal/:subdominio', async (req: Request, res: Response) => {
  const internalKey = req.headers['x-internal-key'] as string
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ ok: false, error: 'Acceso no autorizado' })
  }

  const { subdominio } = req.params
  if (!subdominio) return res.status(400).json({ ok: false, error: 'Subdominio requerido' })

  try {
    const emisor = await prisma.emisor.findUnique({ where: { subdominio } })
    if (!emisor) {
      return res.status(404).json({ ok: false, error: 'Emisor no encontrado' })
    }

    // Borrar usuarios, roles y finalmente el emisor
    await prisma.user.deleteMany({ where: { empresaId: emisor.id } })
    await prisma.role.deleteMany({ where: { empresaId: emisor.id } })
    await prisma.emisor.delete({ where: { id: emisor.id } })

    console.log(`[provision-internal] Emisor eliminado: (id=${emisor.id}, subdominio=${subdominio})`)
    return res.status(200).json({ ok: true, message: 'Emisor eliminado correctamente del ERP' })
  } catch (error: any) {
    console.error('[provision-internal DELETE]', error.message)
    res.status(500).json({ ok: false, error: 'Error al eliminar la empresa' })
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
