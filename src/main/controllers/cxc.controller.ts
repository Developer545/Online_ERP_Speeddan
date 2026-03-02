import { prisma } from '../database/prisma.client'

export const cxcController = {

  async listar() {
    const facturas = await prisma.factura.findMany({
      where: {
        condicionPago: '2',
        estado: { notIn: ['ANULADO', 'RECHAZADO'] }
      },
      include: {
        cliente: { select: { id: true, nombre: true, numDocumento: true, tipoDocumento: true, telefono: true, correo: true } },
        pagos: true
      } as any,
      orderBy: { fechaEmision: 'asc' }
    }) as any[]

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return facturas.map(f => {
      const plazo = f.plazoCredito ?? 30
      const emision = new Date(f.fechaEmision)
      const vencimiento = new Date(emision)
      vencimiento.setDate(vencimiento.getDate() + plazo)

      const totalAbonado = (f.pagos || []).reduce((acc: number, p: any) => acc + Number(p.monto), 0)
      const totalPagar = Number(f.totalPagar)
      const saldo = totalPagar - totalAbonado

      const diffMs = vencimiento.getTime() - hoy.getTime()
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      let estadoCxC: string
      if (saldo <= 0) estadoCxC = 'PAGADA'
      else if (totalAbonado > 0) estadoCxC = 'ABONADA'
      else if (diasRestantes < 0) estadoCxC = 'VENCIDA'
      else if (diasRestantes <= 5) estadoCxC = 'POR_VENCER'
      else estadoCxC = 'VIGENTE'

      return {
        id: f.id,
        numeroControl: f.numeroControl,
        tipoDte: f.tipoDte,
        fechaEmision: f.fechaEmision.toISOString().split('T')[0],
        fechaVencimiento: vencimiento.toISOString().split('T')[0],
        diasRestantes,
        plazoCredito: plazo,
        total: totalPagar,
        abonado: totalAbonado,
        saldo: saldo,
        estadoCxC,
        cliente: (f as any).cliente ? {
          id: (f as any).cliente.id,
          nombre: (f as any).cliente.nombre,
          numDocumento: (f as any).cliente.numDocumento,
          tipoDocumento: (f as any).cliente.tipoDocumento,
          telefono: (f as any).cliente.telefono,
          correo: (f as any).cliente.correo
        } : null
      }
    })
  },

  async resumen() {
    const items = await cxcController.listar()
    const total = items.reduce((a, i) => a + i.saldo, 0)
    const vencidas = items.filter(i => i.estadoCxC === 'VENCIDA' || (i.estadoCxC === 'ABONADA' && i.diasRestantes < 0))
    const porVencer = items.filter(i => i.estadoCxC === 'POR_VENCER' || (i.estadoCxC === 'ABONADA' && i.diasRestantes >= 0 && i.diasRestantes <= 5))
    const vigentes = items.filter(i => i.estadoCxC === 'VIGENTE' || (i.estadoCxC === 'ABONADA' && i.diasRestantes > 5))

    return {
      totalDocumentos: items.length,
      totalMonto: Number(total.toFixed(2)),
      montoVencido: Number(vencidas.reduce((a, i) => a + i.saldo, 0).toFixed(2)),
      montoPorVencer: Number(porVencer.reduce((a, i) => a + i.saldo, 0).toFixed(2)),
      montoVigente: Number(vigentes.reduce((a, i) => a + i.saldo, 0).toFixed(2)),
      countVencidas: vencidas.length,
      countPorVencer: porVencer.length,
      countVigentes: vigentes.length
    }
  }
}
