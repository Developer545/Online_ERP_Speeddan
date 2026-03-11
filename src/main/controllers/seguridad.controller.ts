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
  // Usa SQL UPSERT nativo para ser 100% idempotente sin importar
  // qué unique constraints existan en la BD.
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

    const permsJson = JSON.stringify(ALL_PERMS).replace(/'/g, "''")

    // UPSERT idempotente del Rol Administrador
    // Usa ON CONFLICT en el índice compuesto (empresaId, nombre).
    // Si hay cualquier conflicto, actualiza los permisos.
    let roleRows: Array<{ id: number }>
    if (empresaId) {
      // Modo web: rol ligado a la empresa
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Role" (nombre, descripcion, permisos, activo, "empresaId", "createdAt", "updatedAt")
        VALUES ('Administrador', 'Acceso completo al sistema', '${permsJson}', true, ${empresaId}, NOW(), NOW())
        ON CONFLICT ("empresaId", nombre) DO UPDATE SET permisos = EXCLUDED.permisos, "updatedAt" = NOW()
      `)
      roleRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM "Role" WHERE nombre = 'Administrador' AND "empresaId" = ${empresaId} LIMIT 1`
      )
      // Si no encontró con empresaId específico, buscar el global
      if (!roleRows.length) {
        roleRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
          `SELECT id FROM "Role" WHERE nombre = 'Administrador' LIMIT 1`
        )
      }
    } else {
      // Modo desktop: rol global (sin empresa)
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Role" (nombre, descripcion, permisos, activo, "createdAt", "updatedAt")
        VALUES ('Administrador', 'Acceso completo al sistema', '${permsJson}', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `)
      roleRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM "Role" WHERE nombre = 'Administrador' AND "empresaId" IS NULL LIMIT 1`
      )
      if (!roleRows.length) {
        roleRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
          `SELECT id FROM "Role" WHERE nombre = 'Administrador' LIMIT 1`
        )
      }
    }

    if (!roleRows.length) throw new Error('No se pudo obtener el rol Administrador')
    const roleId = Number(roleRows[0].id)

    // UPSERT idempotente del Usuario
    const passwordHash = await bcrypt.hash(password, 10)
    const correo = `${username}@speeddansys.com`

    let userRows: Array<{ id: number }>
    if (empresaId) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" (nombre, username, "passwordHash", correo, "roleId", activo, "empresaId", "createdAt", "updatedAt")
        VALUES ('Administrador', '${username}', '${passwordHash}', '${correo}', ${roleId}, true, ${empresaId}, NOW(), NOW())
        ON CONFLICT ("empresaId", username) DO UPDATE
          SET "passwordHash" = EXCLUDED."passwordHash", activo = true, "roleId" = EXCLUDED."roleId", "updatedAt" = NOW()
      `)
      userRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM "User" WHERE username = '${username}' AND "empresaId" = ${empresaId} LIMIT 1`
      )
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" (nombre, username, "passwordHash", correo, "roleId", activo, "createdAt", "updatedAt")
        VALUES ('Administrador', '${username}', '${passwordHash}', '${correo}', ${roleId}, true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `)
      userRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM "User" WHERE username = '${username}' AND "empresaId" IS NULL LIMIT 1`
      )
    }

    const userId = userRows.length ? Number(userRows[0].id) : 0
    return { ok: true, userId, roleId }
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
