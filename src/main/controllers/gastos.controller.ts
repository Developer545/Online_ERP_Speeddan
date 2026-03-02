import { prisma } from '../database/prisma.client'

export const gastosController = {

  // ── Categorías ────────────────────────────────────────────

  async listarCategorias() {
    return prisma.categoriaGasto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { gastos: true } }
      }
    })
  },

  async crearCategoria(data: { nombre: string; descripcion?: string; color?: string }) {
    return prisma.categoriaGasto.create({ data })
  },

  async editarCategoria(id: number, data: { nombre?: string; descripcion?: string; color?: string }) {
    return prisma.categoriaGasto.update({ where: { id }, data })
  },

  async eliminarCategoria(id: number) {
    const count = await prisma.gastoInterno.count({ where: { categoriaId: id } })
    if (count > 0) throw new Error('La categoría tiene gastos registrados y no puede eliminarse')
    return prisma.categoriaGasto.update({ where: { id }, data: { activo: false } })
  },

  // ── Gastos Internos ───────────────────────────────────────

  async listar(page = 1, pageSize = 20, categoriaId?: number, desde?: string, hasta?: string) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = {}

    if (categoriaId) where.categoriaId = categoriaId
    if (desde || hasta) {
      where.fecha = {}
      if (desde) (where.fecha as Record<string, unknown>).gte = new Date(desde)
      if (hasta) {
        const hastaDate = new Date(hasta)
        hastaDate.setHours(23, 59, 59, 999)
        ;(where.fecha as Record<string, unknown>).lte = hastaDate
      }
    }

    const [gastos, total] = await Promise.all([
      prisma.gastoInterno.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { fecha: 'desc' },
        include: { categoria: { select: { id: true, nombre: true, color: true } } }
      }),
      prisma.gastoInterno.count({ where })
    ])

    return { gastos, total, page, pageSize }
  },

  async crear(data: {
    categoriaId: number
    fecha: string
    monto: number
    descripcion: string
    notas?: string
  }) {
    return prisma.gastoInterno.create({
      data: {
        ...data,
        fecha: new Date(data.fecha)
      },
      include: { categoria: { select: { id: true, nombre: true, color: true } } }
    })
  },

  async editar(id: number, data: {
    categoriaId?: number
    fecha?: string
    monto?: number
    descripcion?: string
    notas?: string
  }) {
    const { fecha, ...rest } = data
    return prisma.gastoInterno.update({
      where: { id },
      data: {
        ...rest,
        ...(fecha ? { fecha: new Date(fecha) } : {})
      },
      include: { categoria: { select: { id: true, nombre: true, color: true } } }
    })
  },

  async eliminar(id: number) {
    return prisma.gastoInterno.delete({ where: { id } })
  },

  async resumenPorCategoria(mes: number, anio: number) {
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59)

    const gastos = await prisma.gastoInterno.findMany({
      where: { fecha: { gte: inicio, lte: fin } },
      include: { categoria: { select: { nombre: true, color: true } } }
    })

    const mapa: Record<number, { categoria: string; color: string; total: number }> = {}
    for (const g of gastos) {
      if (!mapa[g.categoriaId]) {
        mapa[g.categoriaId] = {
          categoria: g.categoria.nombre,
          color: g.categoria.color ?? '#1890ff',
          total: 0
        }
      }
      mapa[g.categoriaId].total += Number(g.monto)
    }

    return Object.values(mapa).map(r => ({
      ...r,
      total: Number(r.total.toFixed(2))
    }))
  }
}
