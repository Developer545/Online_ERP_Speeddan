import { ipcMain, Notification } from 'electron'
import { prisma } from '../database/prisma.client'

export function registerNotificationsIPC() {
  ipcMain.handle('notifications:checkAndFire', async () => {
    try {
      const ahora = new Date()
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0)

      // 1. Stock crítico (< 10 unidades)
      const stockCritico = await prisma.producto.count({
        where: { activo: true, stockActual: { lt: 10 } }
      })

      if (stockCritico > 0 && Notification.isSupported()) {
        new Notification({
          title: 'Speeddansys ERP — Stock Crítico',
          body: `${stockCritico} producto(s) tienen stock por debajo del mínimo. Revisa el módulo de Inventario.`,
          urgency: 'normal'
        }).show()
      }

      // 2. Facturas pendientes de envío al MH
      const pendientesMH = await prisma.factura.count({
        where: { estado: { in: ['PENDIENTE_ENVIO', 'CONTINGENCIA'] } }
      })

      if (pendientesMH > 0 && Notification.isSupported()) {
        setTimeout(() => {
          new Notification({
            title: 'Speeddansys ERP — DTEs Pendientes',
            body: `${pendientesMH} factura(s) pendiente(s) de envío al Ministerio de Hacienda.`,
            urgency: 'critical'
          }).show()
        }, 2000)
      }

      // 3. CxC vencidas (facturas a crédito con plazo vencido)
      const todasCredito = await prisma.factura.findMany({
        where: {
          condicionPago: '2',
          estado: { in: ['RECIBIDO', 'PROCESADO'] }
        },
        select: { fechaEmision: true, plazoCredito: true }
      })

      const cxcVencidas = todasCredito.filter(f => {
        const plazo = f.plazoCredito ?? 30
        const vence = new Date(f.fechaEmision)
        vence.setDate(vence.getDate() + plazo)
        return vence < inicioHoy
      }).length

      if (cxcVencidas > 0 && Notification.isSupported()) {
        setTimeout(() => {
          new Notification({
            title: 'Speeddansys ERP — Cobros Vencidos',
            body: `${cxcVencidas} factura(s) a crédito han superado su fecha de vencimiento. Revisa Cuentas por Cobrar.`,
            urgency: 'critical'
          }).show()
        }, 4000)
      }

      return { stockCritico, pendientesMH, cxcVencidas }
    } catch {
      return { stockCritico: 0, pendientesMH: 0, cxcVencidas: 0 }
    }
  })
}
