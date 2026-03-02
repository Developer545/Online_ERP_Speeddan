import { prisma } from '../database/prisma.client'

export const proveedoresController = {
  async listar(
    page = 1,
    pageSize = 20,
    busqueda?: string,
    tipoProveedor?: string
  ) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = { activo: true }

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { nit: { contains: busqueda } },
        { nrc: { contains: busqueda } },
        { correo: { contains: busqueda, mode: 'insensitive' } }
      ]
    }
    if (tipoProveedor) where.tipoProveedor = tipoProveedor

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where, skip, take: pageSize,
        orderBy: { nombre: 'asc' }
      }),
      prisma.proveedor.count({ where })
    ])

    return { proveedores, total, page, pageSize }
  },

  async buscar(query: string) {
    return prisma.proveedor.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { nit: { contains: query } }
        ]
      },
      take: 10
    })
  },

  async getById(id: number) {
    return prisma.proveedor.findUnique({ where: { id } })
  },

  async crear(data: {
    nombre: string
    nit?: string
    nrc?: string
    correo?: string
    telefono?: string
    tipoProveedor?: string
    contacto?: string
    direccion?: string
    departamentoCod?: string
    municipioCod?: string
    plazoCredito?: number
    activo?: boolean
  }) {
    return prisma.proveedor.create({ data: { ...data, activo: true } })
  },

  async actualizar(id: number, data: {
    nombre?: string
    nit?: string
    nrc?: string
    correo?: string
    telefono?: string
    tipoProveedor?: string
    contacto?: string
    direccion?: string
    departamentoCod?: string
    municipioCod?: string
    plazoCredito?: number
  }) {
    return prisma.proveedor.update({ where: { id }, data })
  },

  async desactivar(id: number) {
    return prisma.proveedor.update({ where: { id }, data: { activo: false } })
  }
}
