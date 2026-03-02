import { prisma } from '../database/prisma.client'

export const cxpController = {

  async listar() {
    const compras = await prisma.compra.findMany({
      where: {
        condicionPago: 'CREDITO',
        estado: 'REGISTRADA'
      },
      include: {
        proveedor: {
          select: {
            id: true, nombre: true, nit: true, telefono: true,
            correo: true, plazoCredito: true
          }
        }
      },
      orderBy: { fecha: 'asc' }
    })

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return compras.map(c => {
      const plazo = c.proveedor?.plazoCredito ?? 30
      const emision = new Date(c.fecha)
      const vencimiento = new Date(emision)
      vencimiento.setDate(vencimiento.getDate() + plazo)

      const diffMs = vencimiento.getTime() - hoy.getTime()
      const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      let estadoCxP: string
      if (diasRestantes < 0) estadoCxP = 'VENCIDA'
      else if (diasRestantes <= 5) estadoCxP = 'POR_VENCER'
      else estadoCxP = 'VIGENTE'

      return {
        id: c.id,
        numeroDocumento: c.numeroDocumento,
        tipoDocumento: c.tipoDocumento,
        fecha: c.fecha.toISOString().split('T')[0],
        fechaVencimiento: vencimiento.toISOString().split('T')[0],
        diasRestantes,
        plazoCredito: plazo,
        total: Number(c.total),
        estadoCxP,
        proveedor: c.proveedor ? {
          id: c.proveedor.id,
          nombre: c.proveedor.nombre,
          nit: c.proveedor.nit,
          telefono: c.proveedor.telefono,
          correo: c.proveedor.correo
        } : null
      }
    })
  },

  async resumen() {
    const items = await cxpController.listar()
    const total = items.reduce((a, i) => a + i.total, 0)
    const vencidas = items.filter(i => i.estadoCxP === 'VENCIDA')
    const porVencer = items.filter(i => i.estadoCxP === 'POR_VENCER')
    const vigentes = items.filter(i => i.estadoCxP === 'VIGENTE')

    return {
      totalDocumentos: items.length,
      totalMonto: Number(total.toFixed(2)),
      montoVencido: Number(vencidas.reduce((a, i) => a + i.total, 0).toFixed(2)),
      montoPorVencer: Number(porVencer.reduce((a, i) => a + i.total, 0).toFixed(2)),
      montoVigente: Number(vigentes.reduce((a, i) => a + i.total, 0).toFixed(2)),
      countVencidas: vencidas.length,
      countPorVencer: porVencer.length,
      countVigentes: vigentes.length
    }
  }
}
