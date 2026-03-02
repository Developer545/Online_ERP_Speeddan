import { prisma } from '../database/prisma.client'

export const comprasController = {
  async listar(page = 1, pageSize = 20, busqueda?: string, proveedorId?: number) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = {}

    if (busqueda) {
      where.OR = [
        { numeroDocumento: { contains: busqueda, mode: 'insensitive' } },
        { proveedor: { nombre: { contains: busqueda, mode: 'insensitive' } } }
      ]
    }
    if (proveedorId) where.proveedorId = proveedorId

    const [compras, total] = await Promise.all([
      prisma.compra.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { fecha: 'desc' },
        include: {
          proveedor: { select: { id: true, nombre: true, nit: true } },
          detalles: {
            include: { producto: { select: { id: true, codigo: true, nombre: true } } }
          }
        }
      }),
      prisma.compra.count({ where })
    ])

    return { compras, total, page, pageSize }
  },

  async getById(id: number) {
    return prisma.compra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        detalles: {
          include: { producto: true }
        }
      }
    })
  },

  async crear(data: {
    proveedorId?: number
    numeroDocumento: string
    tipoDocumento: string
    tipoCompra?: string
    fecha: string
    condicionPago: string
    notas?: string
    detalles: Array<{
      productoId?: number
      descripcion?: string
      cantidad: number
      costoUnitario: number
      descuento?: number
    }>
  }) {
    const { detalles, fecha, tipoCompra = 'PRODUCTO', ...compraData } = data

    // Calcular totales
    let subtotal = 0
    for (const d of detalles) {
      const desc = d.descuento ?? 0
      subtotal += d.cantidad * d.costoUnitario * (1 - desc / 100)
    }
    const iva = subtotal * 0.13
    const total = subtotal + iva

    return prisma.$transaction(async tx => {
      // Crear compra
      const compra = await tx.compra.create({
        data: {
          ...compraData,
          tipoCompra,
          fecha: new Date(fecha),
          subtotal,
          iva,
          total,
          estado: 'REGISTRADA',
          detalles: {
            create: detalles.map(d => ({
              productoId: d.productoId ?? null,
              descripcion: d.descripcion,
              cantidad: d.cantidad,
              costoUnitario: d.costoUnitario,
              descuento: d.descuento ?? 0,
              subtotal: d.cantidad * d.costoUnitario * (1 - (d.descuento ?? 0) / 100)
            }))
          }
        },
        include: {
          detalles: { include: { producto: true } }
        }
      })

      // Solo actualizar inventario si es compra de productos
      if (tipoCompra === 'PRODUCTO') {
        for (const detalle of compra.detalles) {
          if (!detalle.productoId) continue
          const producto = await tx.producto.findUnique({ where: { id: detalle.productoId } })
          if (!producto) continue

          const stockAnterior = Number(producto.stockActual)
          const stockNuevo = stockAnterior + Number(detalle.cantidad)

          // Costo promedio ponderado
          const costoActual = Number(producto.costoPromedio)
          const costoNuevo = stockAnterior > 0
            ? (costoActual * stockAnterior + Number(detalle.costoUnitario) * Number(detalle.cantidad)) / stockNuevo
            : Number(detalle.costoUnitario)

          await tx.producto.update({
            where: { id: detalle.productoId },
            data: { stockActual: stockNuevo, costoPromedio: costoNuevo }
          })

          await tx.kardex.create({
            data: {
              productoId: detalle.productoId,
              tipoMovimiento: 'COMPRA',
              referencia: `Compra #${compra.numeroDocumento}`,
              cantidad: Number(detalle.cantidad),
              costoUnitario: Number(detalle.costoUnitario),
              costoTotal: Number(detalle.subtotal),
              stockAnterior,
              stockNuevo,
              notas: `Compra de ${detalle.producto?.nombre ?? 'producto'}`
            }
          })
        }
      }

      return compra
    })
  },

  async anular(id: number, motivo: string) {
    return prisma.$transaction(async tx => {
      const compra = await tx.compra.findUnique({
        where: { id },
        include: { detalles: true }
      })
      if (!compra) throw new Error('Compra no encontrada')
      if (compra.estado === 'ANULADA') throw new Error('La compra ya está anulada')

      // Solo revertir stock si es compra de productos
      if (compra.tipoCompra === 'PRODUCTO') {
        for (const detalle of compra.detalles) {
          if (!detalle.productoId) continue
          const producto = await tx.producto.findUnique({ where: { id: detalle.productoId } })
          if (!producto) continue

          const stockAnterior = Number(producto.stockActual)
          const stockNuevo = stockAnterior - Number(detalle.cantidad)

          await tx.producto.update({
            where: { id: detalle.productoId },
            data: { stockActual: Math.max(0, stockNuevo) }
          })

          await tx.kardex.create({
            data: {
              productoId: detalle.productoId,
              tipoMovimiento: 'AJUSTE',
              referencia: `Anulación compra #${compra.numeroDocumento}`,
              cantidad: Number(detalle.cantidad),
              costoUnitario: Number(detalle.costoUnitario),
              costoTotal: Number(detalle.subtotal),
              stockAnterior,
              stockNuevo: Math.max(0, stockNuevo),
              notas: `Motivo: ${motivo}`
            }
          })
        }
      }

      return tx.compra.update({
        where: { id },
        data: { estado: 'ANULADA', notas: `ANULADA: ${motivo}` }
      })
    })
  }
}
