import { prisma } from '../database/prisma.client'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const seguridadController = {
  // ── USUARIOS ──────────────────────────────────────────
  async listarUsuarios(page = 1, pageSize = 20, busqueda?: string) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = {}
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { username: { contains: busqueda, mode: 'insensitive' } },
        { correo: { contains: busqueda, mode: 'insensitive' } }
      ]
    }
    const [usuarios, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: pageSize,
        orderBy: { nombre: 'asc' },
        select: {
          id: true, nombre: true, username: true, correo: true,
          activo: true, roleId: true, ultimoAcceso: true,
          role: { select: { id: true, nombre: true } }
        }
      }),
      prisma.user.count({ where })
    ])
    return { usuarios, total, page, pageSize }
  },

  async crearUsuario(data: {
    username: string
    nombre: string
    correo?: string
    password: string
    roleId: number
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10)
    return prisma.user.create({
      data: {
        username: data.username,
        nombre: data.nombre,
        correo: data.correo,
        passwordHash,
        roleId: data.roleId
      },
      select: {
        id: true, nombre: true, username: true, correo: true,
        activo: true, roleId: true,
        role: { select: { id: true, nombre: true } }
      }
    })
  },

  async actualizarUsuario(id: number, data: {
    nombre?: string
    correo?: string
    roleId?: number
    activo?: boolean
    password?: string
  }) {
    const { password, ...rest } = data
    const updateData: Record<string, unknown> = { ...rest }
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10)
    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, nombre: true, username: true, correo: true,
        activo: true, roleId: true,
        role: { select: { id: true, nombre: true } }
      }
    })
  },

  async desactivarUsuario(id: number) {
    return prisma.user.update({
      where: { id },
      data: { activo: false },
      select: { id: true, nombre: true, username: true, activo: true }
    })
  },

  // ── ROLES ──────────────────────────────────────────────
  async listarRoles() {
    return prisma.role.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { users: true } } }
    })
  },

  async crearRol(data: { nombre: string; permisos: string[] }) {
    return prisma.role.create({
      data: {
        nombre: data.nombre,
        permisos: JSON.stringify(data.permisos)
      }
    })
  },

  async actualizarRol(id: number, data: { nombre?: string; permisos?: string[] }) {
    return prisma.role.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.permisos !== undefined && { permisos: JSON.stringify(data.permisos) })
      }
    })
  },

  async eliminarRol(id: number) {
    const count = await prisma.user.count({ where: { roleId: id } })
    if (count > 0) throw new Error(`No se puede eliminar: ${count} usuario(s) usan este rol`)
    return prisma.role.delete({ where: { id } })
  },

  // ── AUTENTICACIÓN ──────────────────────────────────────
  async login(username: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { username },
      include: { role: { select: { id: true, nombre: true, permisos: true } } }
    })
    if (!user) return { ok: false, error: 'Usuario o contraseña incorrectos' }
    if (!user.activo) return { ok: false, error: 'Usuario inactivo. Contacte al administrador.' }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return { ok: false, error: 'Usuario o contraseña incorrectos' }

    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() }
    })

    const u = user as unknown as Record<string, unknown>
    const empresaId = (u.empresaId as number | null) ?? null

    // Generar JWT con la identidad + empresa del usuario
    const jwtSecret = process.env.JWT_SECRET
    const token = jwtSecret
      ? jwt.sign(
        { userId: user.id, username: user.username, empresaId: empresaId ?? 0, roleId: user.roleId },
        jwtSecret,
        { expiresIn: '8h' }
      )
      : undefined

    return {
      ok: true,
      token,          // undefined en desktop (sin JWT_SECRET), string en web
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        correo: user.correo,
        roleId: user.roleId,
        role: user.role,
        empresaId,
        tema: (u.tema as string) ?? 'ocean-blue',
        colorCustom: (u.colorCustom as string) ?? null
      }
    }
  },

  // ── PROVISIONAR USUARIO INICIAL (desde activación de licencia) ────
  // empresaId: undefined = desktop (DB privada), number = empresa en modo web
  async provisionUser(username: string, password: string, empresaId?: number) {
    const ALL_PERMS = [
      'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar',
      'proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar',
      'empleados:ver', 'empleados:crear', 'empleados:editar', 'empleados:eliminar',
      'inventario:ver', 'inventario:ajustar', 'productos:crear', 'productos:editar', 'productos:eliminar',
      'compras:ver', 'compras:crear', 'compras:anular',
      'facturacion:ver', 'facturacion:emitir', 'facturacion:anular', 'facturacion:configurar',
      'reportes:ver', 'reportes:exportar',
      'seguridad:ver', 'seguridad:usuarios', 'seguridad:roles'
    ]

    // Buscar/crear rol Administrador para esta empresa de forma idempotente
    // 1. Busca rol con empresaId exacto
    let role = await prisma.role.findFirst({
      where: { nombre: 'Administrador', empresaId: empresaId ?? null }
    })
    // 2. Si no hay rol específico, buscar cualquier rol Administrador (puede ser global)
    if (!role) {
      role = await prisma.role.findFirst({ where: { nombre: 'Administrador' } })
    }
    // 3. Si aún no hay, crear con try-catch para evitar race conditions
    if (!role) {
      try {
        role = await prisma.role.create({
          data: {
            nombre: 'Administrador',
            descripcion: 'Acceso completo al sistema',
            permisos: JSON.stringify(ALL_PERMS),
            ...(empresaId ? { empresaId } : {})
          }
        })
      } catch {
        role = await prisma.role.findFirst({ where: { nombre: 'Administrador' } })
        if (!role) throw new Error('No se pudo crear ni encontrar el rol Administrador')
      }
    }
    // Siempre actualizar permisos para asegurar set completo
    role = await prisma.role.update({
      where: { id: role.id },
      data: { permisos: JSON.stringify(ALL_PERMS) }
    })

    const passwordHash = await bcrypt.hash(password, 10)

    // Crear o actualizar usuario. El upsert con el unique compuesto
    // (empresaId, username) requiere que empresaId esté en el where.
    // En desktop usamos findFirst + update/create porque empresaId es null.
    const existing = await prisma.user.findFirst({
      where: { username, empresaId: empresaId ?? null }
    })

    let userId: number
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, activo: true } })
      userId = existing.id
    } else {
      const created = await prisma.user.create({
        data: {
          nombre: 'Administrador',
          username,
          passwordHash,
          correo: `${username}@speeddansys.com`,
          roleId: role.id,
          activo: true,
          ...(empresaId ? { empresaId } : {})
        }
      })
      userId = created.id
    }

    return { ok: true, userId, roleId: role.id }
  },

  // ── PREFERENCIAS DE TEMA ───────────────────────────────
  async guardarTema(userId: number, tema: string, colorCustom?: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(tema && { tema }),
        colorCustom: colorCustom ?? null
      },
      select: { id: true, tema: true }
    })
  }
}
