import { prisma } from '../database/prisma.client'

export const reportesController = {
  /**
   * LIBRO IVA VENTAS — Separado por tipo:
   *   contribuyente (CCF/03) vs consumidor final (FAC/01)
   * Usa campos almacenados de Factura (no recalcula IVA).
   * Incluye sello de recepción para formato F07 MH.
   */
  async libroVentas(desde: string, hasta: string) {
    // Usar T00:00:00 / T23:59:59.999 igual que billing.controller
    // para evitar problemas de zona horaria UTC vs El Salvador (-06:00)
    const facturas = await prisma.factura.findMany({
      where: {
        fechaEmision: {
          gte: new Date(desde + 'T00:00:00.000'),
          lte: new Date(hasta + 'T23:59:59.999')
        },
        // Solo facturas válidamente emitidas (RECIBIDO = exitoso en prod/simulación)
        // CONTINGENCIA = enviada pero sin confirmación MH
        // Se excluye: PENDIENTE_ENVIO, RECHAZADO, ANULADO
        estado: { in: ['RECIBIDO', 'CONTINGENCIA'] }
      },
      include: {
        cliente: { select: { nombre: true, numDocumento: true, tipoDocumento: true, nrc: true } }
      },
      orderBy: { fechaEmision: 'asc' }
    })

    return facturas.map((f, idx) => ({
      correlativo: idx + 1,
      fecha: f.fechaEmision.toISOString().split('T')[0],
      numeroControl: f.numeroControl,
      codigoGeneracion: f.codigoGeneracion,
      selloRecepcion: f.selloRecepcion ?? '',
      tipoDte: f.tipoDte,
      estado: f.estado,
      clienteNombre: f.cliente?.nombre ?? f.nombreReceptor ?? 'Consumidor Final',
      clienteDocumento: f.cliente?.numDocumento ?? '',
      clienteNrc: (f.cliente as any)?.nrc ?? '',
      // Usar campos almacenados — NO recalcular
      ventasExentas: Number(f.totalExenta),
      ventasNoSujetas: Number(f.totalNoSuj),
      ventasGravadas: Number(f.totalGravada),
      iva: Number(f.totalIva),
      total: Number(f.totalPagar)
    }))
  },

  async rentabilidad() {
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        precioVenta: true,
        costoPromedio: true,
        stockActual: true,
        categoria: { select: { nombre: true } }
      },
      orderBy: { nombre: 'asc' }
    })

    return productos.map(p => {
      const precio = Number(p.precioVenta)
      const costo = Number(p.costoPromedio)
      const stock = Number(p.stockActual)
      const margenBruto = precio - costo
      const margenPct = precio > 0 ? (margenBruto / precio) * 100 : 0
      const valorInventario = costo * stock

      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria?.nombre ?? 'Sin categoría',
        precioVenta: precio,
        costoPromedio: costo,
        margenBruto,
        margenPct,
        stockActual: stock,
        valorInventario
      }
    })
  },

  async libroCompras(desde: string, hasta: string) {
    const compras = await prisma.compra.findMany({
      where: {
        fecha: {
          gte: new Date(desde + 'T00:00:00.000'),
          lte: new Date(hasta + 'T23:59:59.999')
        },
        // Excluir solo las explícitamente anuladas
        estado: { not: 'ANULADO' }
      },
      include: {
        proveedor: { select: { nombre: true, nit: true, nrc: true } }
      },
      orderBy: { fecha: 'asc' }
    })

    return compras.map((c, idx) => ({
      correlativo: idx + 1,
      fecha: c.fecha.toISOString().split('T')[0],
      numeroDocumento: c.numeroDocumento,
      tipoDocumento: c.tipoDocumento,
      proveedorNombre: c.proveedor?.nombre ?? 'Sin proveedor',
      proveedorNit: c.proveedor?.nit ?? '',
      proveedorNrc: (c.proveedor as any)?.nrc ?? '',
      subtotal: Number(c.subtotal),
      iva: Number(c.iva),
      total: Number(c.total)
    }))
  },

  /**
   * RESUMEN F07 — Débito fiscal (ventas) vs Crédito fiscal (compras)
   */
  async resumenF07(mes: string) {
    const [anio, mesNum] = mes.split('-').map(Number)
    const desde = new Date(anio, mesNum - 1, 1)
    const hasta = new Date(anio, mesNum, 0, 23, 59, 59)

    // Ventas del período
    const facturas = await prisma.factura.findMany({
      where: {
        fechaEmision: { gte: desde, lte: hasta },
        // Solo facturas válidamente emitidas
        estado: { in: ['RECIBIDO', 'CONTINGENCIA'] }
      },
      select: {
        tipoDte: true,
        totalGravada: true,
        totalExenta: true,
        totalNoSuj: true,
        totalIva: true,
        totalPagar: true
      }
    })

    // Compras del período
    const compras = await prisma.compra.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: { not: 'ANULADA' }
      },
      select: { subtotal: true, iva: true, total: true }
    })

    // Separar contribuyente vs consumidor
    const ventasCCF = facturas.filter(f => f.tipoDte === '03')
    const ventasFAC = facturas.filter(f => f.tipoDte !== '03')

    const sum = (arr: any[], field: string) => arr.reduce((a: number, r: any) => a + Number(r[field] ?? 0), 0)

    const debitoFiscal = sum(facturas, 'totalIva')
    const creditoFiscal = sum(compras, 'iva')
    const ivaAPagar = debitoFiscal - creditoFiscal

    return {
      periodo: mes,
      ventasContribuyente: {
        registros: ventasCCF.length,
        gravadas: sum(ventasCCF, 'totalGravada'),
        exentas: sum(ventasCCF, 'totalExenta'),
        noSujetas: sum(ventasCCF, 'totalNoSuj'),
        iva: sum(ventasCCF, 'totalIva'),
        total: sum(ventasCCF, 'totalPagar')
      },
      ventasConsumidor: {
        registros: ventasFAC.length,
        gravadas: sum(ventasFAC, 'totalGravada'),
        exentas: sum(ventasFAC, 'totalExenta'),
        noSujetas: sum(ventasFAC, 'totalNoSuj'),
        iva: sum(ventasFAC, 'totalIva'),
        total: sum(ventasFAC, 'totalPagar')
      },
      compras: {
        registros: compras.length,
        subtotal: sum(compras, 'subtotal'),
        iva: creditoFiscal,
        total: sum(compras, 'total')
      },
      debitoFiscal,
      creditoFiscal,
      ivaAPagar,
      remanente: ivaAPagar < 0 ? Math.abs(ivaAPagar) : 0
    }
  },

  /**
   * CUENTAS POR COBRAR — Antigüedad de saldos (30/60/90/+90 días)
   */
  async cxcVencidas() {
    const facturas = await prisma.factura.findMany({
      where: {
        condicionPago: '2', // Crédito
        estado: { notIn: ['ANULADA', 'INVALIDADA'] }
      },
      include: {
        cliente: { select: { nombre: true, numDocumento: true } },
        pagos: { select: { monto: true } }
      },
      orderBy: { fechaEmision: 'asc' }
    })

    const hoy = new Date()

    return facturas
      .map(f => {
        const totalPagado = f.pagos.reduce((a, p) => a + Number(p.monto), 0)
        const saldo = Number(f.totalPagar) - totalPagado
        if (saldo <= 0.01) return null // Ya pagada

        const diasEmision = Math.floor((hoy.getTime() - f.fechaEmision.getTime()) / (1000 * 60 * 60 * 24))
        const plazo = f.plazoCredito ?? 30
        const diasVencido = Math.max(0, diasEmision - plazo)

        let rango: string
        if (diasVencido === 0) rango = 'VIGENTE'
        else if (diasVencido <= 30) rango = '1-30'
        else if (diasVencido <= 60) rango = '31-60'
        else if (diasVencido <= 90) rango = '61-90'
        else rango = '+90'

        return {
          facturaId: f.id,
          fecha: f.fechaEmision.toISOString().split('T')[0],
          numeroControl: f.numeroControl,
          clienteNombre: f.cliente?.nombre ?? f.nombreReceptor ?? 'Sin nombre',
          clienteDocumento: f.cliente?.numDocumento ?? '',
          total: Number(f.totalPagar),
          pagado: totalPagado,
          saldo,
          plazo,
          diasEmision,
          diasVencido,
          rango
        }
      })
      .filter(Boolean)
  }
}

