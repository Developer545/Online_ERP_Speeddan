import { prisma } from '../database/prisma.client'

export const empleadosController = {
  async listar(page = 1, pageSize = 20, busqueda?: string, cargo?: string) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = { activo: true }

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { dui: { contains: busqueda } },
        { correo: { contains: busqueda, mode: 'insensitive' } }
      ]
    }
    if (cargo) where.cargo = cargo

    const [empleados, total] = await Promise.all([
      prisma.empleado.findMany({
        where, skip, take: pageSize,
        orderBy: { nombre: 'asc' }
      }),
      prisma.empleado.count({ where })
    ])

    // Convertir Decimal a número para serialización IPC
    const empleadosSerializados = empleados.map(e => ({
      ...e,
      salario: e.salario ? Number(e.salario) : 0
    }))

    return { empleados: empleadosSerializados, total, page, pageSize }
  },

  async getById(id: number) {
    const empleado = await prisma.empleado.findUnique({ where: { id } })
    if (!empleado) return null
    return {
      ...empleado,
      salario: empleado.salario ? Number(empleado.salario) : 0
    }
  },

  async crear(data: {
    nombre: string
    dui?: string
    nit?: string
    correo?: string
    telefono?: string
    cargo?: string
    salario?: number
    fechaIngreso?: string
    departamentoCod?: string
    municipioCod?: string
    direccion?: string
  }) {
    const empleado = await prisma.empleado.create({
      data: {
        nombre: data.nombre,
        dui: data.dui || null,
        nit: data.nit,
        correo: data.correo,
        telefono: data.telefono,
        cargo: data.cargo,
        salario: data.salario ?? 0,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
        departamentoCod: data.departamentoCod,
        municipioCod: data.municipioCod,
        direccion: data.direccion,
        activo: true
      }
    })
    
    return {
      ...empleado,
      salario: empleado.salario ? Number(empleado.salario) : 0
    }
  },

  async actualizar(id: number, data: {
    nombre?: string
    dui?: string
    nit?: string
    correo?: string
    telefono?: string
    cargo?: string
    salario?: number
    fechaIngreso?: string
    departamentoCod?: string
    municipioCod?: string
    direccion?: string
  }) {
    const { fechaIngreso, ...rest } = data
    const empleado = await prisma.empleado.update({
      where: { id },
      data: {
        ...rest,
        ...(fechaIngreso && { fechaIngreso: new Date(fechaIngreso) })
      }
    })
    
    return {
      ...empleado,
      salario: empleado.salario ? Number(empleado.salario) : 0
    }
  },

  async desactivar(id: number) {
    const empleado = await prisma.empleado.update({ where: { id }, data: { activo: false } })
    return {
      ...empleado,
      salario: empleado.salario ? Number(empleado.salario) : 0
    }
  }
}
