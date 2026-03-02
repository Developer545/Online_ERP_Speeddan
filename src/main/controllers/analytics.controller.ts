import { prisma } from '../database/prisma.client'

export const analyticsController = {

  async getVentasPorDia(dias: number) {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    desde.setHours(0, 0, 0, 0)

    const facturas = await prisma.factura.findMany({
      where: {
        fechaEmision: { gte: desde },
        estado: { notIn: ['ANULADO', 'RECHAZADO'] }
      },
      select: { fechaEmision: true, totalPagar: true }
    })

    const mapaFechas: Record<string, { total: number; cantidad: number }> = {}

    // Prellenar todos los días del rango con 0
    for (let i = dias; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      mapaFechas[key] = { total: 0, cantidad: 0 }
    }

    for (const f of facturas) {
      const key = f.fechaEmision.toISOString().split('T')[0]
      if (mapaFechas[key]) {
        mapaFechas[key].total += Number(f.totalPagar)
        mapaFechas[key].cantidad += 1
      }
    }

    return Object.entries(mapaFechas).map(([fecha, data]) => ({
      fecha,
      total: Number(data.total.toFixed(2)),
      cantidad: data.cantidad
    }))
  },

  async getTopProductos(limite: number) {
    const detalles = await prisma.detalleFactura.findMany({
      where: {
        factura: { estado: { notIn: ['ANULADO', 'RECHAZADO'] } }
      },
      include: {
        producto: { select: { nombre: true } }
      }
    })

    const mapa: Record<string, { nombre: string; cantidad: number; ingreso: number }> = {}

    for (const d of detalles) {
      // Agrupar por productoId cuando existe; si no, agrupar por descripción normalizada
      const key = d.productoId != null
        ? `id:${d.productoId}`
        : `desc:${(d.descripcion ?? '').toLowerCase().trim()}`
      if (!mapa[key]) {
        mapa[key] = {
          nombre: d.producto?.nombre ?? d.descripcion ?? 'Producto',
          cantidad: 0,
          ingreso: 0
        }
      }
      mapa[key].cantidad += Number(d.cantidad)
      mapa[key].ingreso += Number(d.cantidad) * Number(d.precioUnitario)
    }

    return Object.values(mapa)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limite)
      .map(p => ({
        nombre: p.nombre.length > 22 ? p.nombre.slice(0, 22) + '…' : p.nombre,
        cantidad: Number(p.cantidad.toFixed(0)),
        ingreso: Number(p.ingreso.toFixed(2))
      }))
  },

  async getVentasVsComprasPorMes(meses: number) {
    const resultado: { mes: string; ventas: number; compras: number }[] = []

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(1)
      fecha.setMonth(fecha.getMonth() - i)

      const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59)

      const [ventas, compras] = await Promise.all([
        prisma.factura.aggregate({
          where: {
            fechaEmision: { gte: inicio, lte: fin },
            estado: { notIn: ['ANULADO', 'RECHAZADO'] }
          },
          _sum: { totalPagar: true }
        }),
        prisma.compra.aggregate({
          where: {
            fecha: { gte: inicio, lte: fin },
            estado: 'REGISTRADA'
          },
          _sum: { total: true }
        })
      ])

      const mesLabel = inicio.toLocaleDateString('es-SV', { month: 'short', year: '2-digit' })
      resultado.push({
        mes: mesLabel,
        ventas: Number((ventas._sum.totalPagar ?? 0).toFixed(2)),
        compras: Number((compras._sum.total ?? 0).toFixed(2))
      })
    }

    return resultado
  },

  async getDistribucionTipoDocumento() {
    const inicio = new Date()
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)

    const facturas = await prisma.factura.groupBy({
      by: ['tipoDte'],
      where: {
        fechaEmision: { gte: inicio },
        estado: { notIn: ['ANULADO', 'RECHAZADO'] }
      },
      _count: { id: true },
      _sum: { totalPagar: true }
    })

    const etiquetas: Record<string, string> = {
      '01': 'Factura',
      '03': 'CCF',
      '05': 'Nota Crédito',
      '06': 'Nota Débito'
    }

    return facturas.map(f => ({
      tipo: etiquetas[f.tipoDte] ?? f.tipoDte,
      cantidad: f._count.id,
      total: Number((f._sum.totalPagar ?? 0).toFixed(2))
    }))
  },

  async getUtilidadReal(meses: number) {
    const resultado: { mes: string; ventas: number; compras: number; gastos: number; utilidad: number }[] = []

    for (let i = meses - 1; i >= 0; i--) {
      const fecha = new Date()
      fecha.setDate(1)
      fecha.setMonth(fecha.getMonth() - i)

      const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59)

      const [ventas, compras, gastosAgg] = await Promise.all([
        prisma.factura.aggregate({
          where: {
            fechaEmision: { gte: inicio, lte: fin },
            estado: { notIn: ['ANULADO', 'RECHAZADO'] }
          },
          _sum: { totalPagar: true }
        }),
        prisma.compra.aggregate({
          where: {
            fecha: { gte: inicio, lte: fin },
            estado: 'REGISTRADA'
          },
          _sum: { total: true }
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).gastoInterno.aggregate({
          where: { fecha: { gte: inicio, lte: fin } },
          _sum: { monto: true }
        })
      ])

      const v = Number((ventas._sum.totalPagar ?? 0).toFixed(2))
      const c = Number((compras._sum.total ?? 0).toFixed(2))
      const g = Number((gastosAgg._sum.monto ?? 0).toFixed(2))
      const mesLabel = inicio.toLocaleDateString('es-SV', { month: 'short', year: '2-digit' })

      resultado.push({
        mes: mesLabel,
        ventas: v,
        compras: c,
        gastos: g,
        utilidad: Number((v - c - g).toFixed(2))
      })
    }

    return resultado
  },

  async getKpiResumen() {
    const ahora = new Date()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0)
    const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59)
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59)

    const [
      ventasHoyAgg,
      ventasMesAgg,
      ventasMesAnteriorAgg,
      totalClientes,
      totalProductos,
      stockBajoRes,
      valorInventarioRes,
      pendientesMH
    ] = await Promise.all([
      prisma.factura.aggregate({
        where: { fechaEmision: { gte: inicioHoy, lte: finHoy }, estado: { notIn: ['ANULADO', 'RECHAZADO'] } },
        _sum: { totalPagar: true }
      }),
      prisma.factura.aggregate({
        where: { fechaEmision: { gte: inicioMes }, estado: { notIn: ['ANULADO', 'RECHAZADO'] } },
        _sum: { totalPagar: true }
      }),
      prisma.factura.aggregate({
        where: { fechaEmision: { gte: inicioMesAnterior, lte: finMesAnterior }, estado: { notIn: ['ANULADO', 'RECHAZADO'] } },
        _sum: { totalPagar: true }
      }),
      prisma.cliente.count({ where: { activo: true } }),
      prisma.producto.count({ where: { activo: true } }),
      prisma.producto.count({ where: { activo: true, stockActual: { lt: 10 } } }),
      prisma.producto.findMany({
        where: { activo: true },
        select: { stockActual: true, costoPromedio: true }
      }),
      prisma.factura.count({ where: { estado: { in: ['PENDIENTE_ENVIO', 'CONTINGENCIA'] } } })
    ])

    const valorInventario = valorInventarioRes.reduce(
      (acc, p) => acc + Number(p.stockActual) * Number(p.costoPromedio), 0
    )

    return {
      ventasHoy: Number((ventasHoyAgg._sum.totalPagar ?? 0).toFixed(2)),
      ventasMes: Number((ventasMesAgg._sum.totalPagar ?? 0).toFixed(2)),
      ventasMesAnterior: Number((ventasMesAnteriorAgg._sum.totalPagar ?? 0).toFixed(2)),
      totalClientes,
      totalProductos,
      stockBajo: stockBajoRes,
      valorInventario: Number(valorInventario.toFixed(2)),
      facturasPendientesMH: pendientesMH
    }
  }
}
