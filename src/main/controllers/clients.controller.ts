import { getPrismaClient } from '../database/prisma.client'

const db = getPrismaClient()

export class ClientsController {

  static async buscar(query: string) {
    if (!query || query.trim().length < 1) return []
    const q = query.trim()
    return db.cliente.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { numDocumento: { contains: q } },
          { nrc: { contains: q } }
        ]
      },
      take: 10,
      orderBy: { nombre: 'asc' }
    })
  }

  static async listar(
    page = 1,
    pageSize = 20,
    busqueda?: string,
    tipoDocumento?: string
  ) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = { activo: true }

    if (tipoDocumento) where.tipoDocumento = tipoDocumento

    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim()
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { numDocumento: { contains: q } },
        { nrc: { contains: q } },
        { nombreComercial: { contains: q, mode: 'insensitive' } }
      ]
    }

    const [clientes, total] = await Promise.all([
      db.cliente.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip,
        take: pageSize
      }),
      db.cliente.count({ where })
    ])

    return { clientes, total, page, pageSize }
  }

  static async getById(id: number) {
    return db.cliente.findUnique({ where: { id } })
  }

  static async crear(data: {
    tipoDocumento: string
    numDocumento: string
    nombre: string
    nombreComercial?: string
    nrc?: string
    correo?: string
    telefono?: string
    departamentoCod?: string
    municipioCod?: string
    complemento?: string
  }) {
    return db.cliente.create({ data })
  }

  static async actualizar(id: number, data: Partial<{
    nombre: string
    nombreComercial: string
    nrc: string
    correo: string
    telefono: string
    departamentoCod: string
    municipioCod: string
    complemento: string
  }>) {
    return db.cliente.update({ where: { id }, data })
  }

  static async desactivar(id: number) {
    return db.cliente.update({ where: { id }, data: { activo: false } })
  }
}
