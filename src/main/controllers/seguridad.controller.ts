import { prisma } from '../database/prisma.client'
import * as bcrypt from 'bcryptjs'

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
    const user = await prisma.user.findUnique({
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

    return {
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        correo: user.correo,
        roleId: user.roleId,
        role: user.role,
        tema: (user as unknown as Record<string, unknown>).tema as string ?? 'ocean-blue',
        colorCustom: (user as unknown as Record<string, unknown>).colorCustom as string ?? null
      }
    }
  },

  // ── PROVISIONAR USUARIO INICIAL (desde activación de licencia) ────
  async provisionUser(username: string, password: string) {
    // Asegurar que el rol Administrador exista
    let role = await prisma.role.findFirst({ where: { nombre: 'Administrador' } })
    if (!role) {
      role = await prisma.role.create({
        data: {
          nombre: 'Administrador',
          descripcion: 'Acceso completo al sistema',
          permisos: JSON.stringify([
            'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar',
            'proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar',
            'empleados:ver', 'empleados:crear', 'empleados:editar', 'empleados:eliminar',
            'inventario:ver', 'inventario:ajustar', 'productos:crear', 'productos:editar', 'productos:eliminar',
            'compras:ver', 'compras:crear', 'compras:anular',
            'facturacion:ver', 'facturacion:emitir', 'facturacion:anular', 'facturacion:configurar',
            'reportes:ver', 'reportes:exportar',
            'seguridad:ver', 'seguridad:usuarios', 'seguridad:roles'
          ])
        }
      })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    // Crear o actualizar el usuario con las credenciales provistas
    await prisma.user.upsert({
      where: { username },
      update: { passwordHash, activo: true },
      create: {
        nombre: 'Administrador',
        username,
        passwordHash,
        correo: `${username}@speeddansys.com`,
        roleId: role.id,
        activo: true
      }
    })
    return { ok: true }
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
