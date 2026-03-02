// ══════════════════════════════════════════════════════════
// CONTROLLER DE FACTURACIÓN
// ══════════════════════════════════════════════════════════
// Capa de control entre el IPC handler y el BillingService.
// Valida los datos de entrada antes de pasarlos al servicio.
// ══════════════════════════════════════════════════════════

import { getPrismaClient } from '../database/prisma.client'
import { BillingService, type EmitirFacturaInput } from '../services/dte/billing.service'
import { MHTransmitterService } from '../services/dte/transmitter.service'
import { DTESignerService } from '../services/dte/signer.service'

const db = getPrismaClient()

export class BillingController {

  // ─── Emitir DTE ────────────────────────────────────────
  static async emitir(input: EmitirFacturaInput) {
    if (!input.items || input.items.length === 0) {
      return { ok: false, error: 'La factura debe tener al menos un ítem' }
    }

    if (!input.formaPago || input.formaPago.length === 0) {
      return { ok: false, error: 'Debe especificar al menos una forma de pago' }
    }

    const totalPago = input.formaPago.reduce((s, p) => s + p.monto, 0)
    const totalItems = input.items.reduce((s, i) => {
      const base = i.cantidad * i.precioUni - (i.descuento ?? 0)
      const iva = (i.esGravado !== false) ? base * 0.13 : 0
      return s + base + iva
    }, 0)

    if (Math.abs(totalPago - totalItems) > 0.01) {
      return { ok: false, error: `Total de pago ($${totalPago.toFixed(2)}) no coincide con total de ítems ($${totalItems.toFixed(2)})` }
    }

    return BillingService.emitir(input)
  }

  // ─── Listar facturas ───────────────────────────────────
  static async listar(filtros: {
    tipoDte?: string
    estado?: string
    desde?: string
    hasta?: string
    clienteId?: number
    page?: number
    pageSize?: number
  }) {
    const page = filtros.page ?? 1
    const pageSize = filtros.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (filtros.tipoDte) where.tipoDte = filtros.tipoDte
    if (filtros.estado) where.estado = filtros.estado
    if (filtros.clienteId) where.clienteId = filtros.clienteId
    if (filtros.desde || filtros.hasta) {
      where.fechaEmision = {}
      if (filtros.desde) {
        ; (where.fechaEmision as Record<string, unknown>).gte = new Date(filtros.desde + 'T00:00:00')
      }
      if (filtros.hasta) {
        ; (where.fechaEmision as Record<string, unknown>).lte = new Date(filtros.hasta + 'T23:59:59.999')
      }
    }

    const [facturas, total] = await Promise.all([
      db.factura.findMany({
        where,
        include: { cliente: { select: { nombre: true, numDocumento: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      db.factura.count({ where })
    ])

    // Serialize Prisma Decimal and Date objects to plain JS primitives
    // (structuredClone over Electron IPC cannot handle Decimal/Date properly)
    const facturasSerialized = facturas.map(f => ({
      id: f.id,
      tipoDte: f.tipoDte,
      numeroControl: f.numeroControl,
      codigoGeneracion: f.codigoGeneracion,
      ambiente: f.ambiente,
      fechaEmision: f.fechaEmision instanceof Date ? f.fechaEmision.toISOString() : f.fechaEmision,
      estado: f.estado,
      selloRecepcion: f.selloRecepcion ?? null,
      mhEstado: f.mhEstado ?? null,
      condicionPago: f.condicionPago,
      notas: f.notas ?? null,
      totalNoSuj: Number(f.totalNoSuj),
      totalExenta: Number(f.totalExenta),
      totalGravada: Number(f.totalGravada),
      subTotal: Number(f.subTotal),
      totalIva: Number(f.totalIva),
      totalDescuento: Number(f.totalDescuento),
      totalPagar: Number(f.totalPagar),
      clienteId: f.clienteId ?? null,
      cliente: f.cliente ?? null
    }))

    return { facturas: facturasSerialized, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }

  // ─── Obtener factura por ID ────────────────────────────
  static async getById(id: number) {
    const f = await db.factura.findUnique({
      where: { id },
      include: {
        cliente: true,
        detalles: { include: { producto: { select: { codigo: true, nombre: true } } } }
      }
    })
    if (!f) return null

    // Serialize Decimal/Date for IPC transport
    return {
      id: f.id,
      tipoDte: f.tipoDte,
      numeroControl: f.numeroControl,
      codigoGeneracion: f.codigoGeneracion,
      ambiente: f.ambiente,
      fechaEmision: f.fechaEmision instanceof Date ? f.fechaEmision.toISOString() : f.fechaEmision,
      estado: f.estado,
      selloRecepcion: f.selloRecepcion ?? null,
      mhEstado: f.mhEstado ?? null,
      condicionPago: f.condicionPago,
      notas: f.notas ?? null,
      dteJson: f.dteJson,
      dteJsonFirmado: f.dteJsonFirmado ?? null,
      totalNoSuj: Number(f.totalNoSuj),
      totalExenta: Number(f.totalExenta),
      totalGravada: Number(f.totalGravada),
      subTotal: Number(f.subTotal),
      totalIva: Number(f.totalIva),
      totalDescuento: Number(f.totalDescuento),
      totalPagar: Number(f.totalPagar),
      clienteId: f.clienteId ?? null,
      cliente: f.cliente ? {
        id: f.cliente.id,
        nombre: f.cliente.nombre,
        numDocumento: f.cliente.numDocumento,
        tipoDocumento: f.cliente.tipoDocumento,
        nrc: f.cliente.nrc ?? null,
        correo: f.cliente.correo ?? null,
        telefono: f.cliente.telefono ?? null,
        departamentoCod: f.cliente.departamentoCod ?? null,
        municipioCod: f.cliente.municipioCod ?? null,
        complemento: f.cliente.complemento ?? null,
        nombreComercial: f.cliente.nombreComercial ?? null
      } : null,
      detalles: f.detalles.map(d => ({
        id: d.id,
        numItem: d.numItem,
        descripcion: d.descripcion,
        cantidad: Number(d.cantidad),
        uniMedida: d.uniMedida,
        precioUnitario: Number(d.precioUnitario),
        descuento: Number(d.descuento),
        esGravado: d.esGravado,
        ventaNoSuj: Number(d.ventaNoSuj),
        ventaExenta: Number(d.ventaExenta),
        ventaGravada: Number(d.ventaGravada),
        ivaItem: Number(d.ivaItem),
        producto: d.producto ?? null
      }))
    }
  }

  // ─── Reenviar factura en contingencia ─────────────────
  static async reenviar(facturaId: number) {
    const factura = await db.factura.findUnique({ where: { id: facturaId } })
    if (!factura) return { ok: false, error: 'Factura no encontrada' }
    if (factura.estado === 'RECIBIDO') return { ok: false, error: 'La factura ya fue recibida por el MH' }
    if (!factura.dteJsonFirmado) return { ok: false, error: 'La factura no tiene firma digital. Regenerar.' }

    const sucursal = await db.sucursal.findFirst({
      where: { correlativos: { some: {} } },
      include: { emisor: true }
    })
    if (!sucursal) return { ok: false, error: 'No se encontró sucursal configurada' }

    const emisor = sucursal.emisor
    const result = await MHTransmitterService.transmitir(
      factura.dteJsonFirmado,
      factura.tipoDte as '01',
      factura.ambiente as '00' | '01',
      emisor.mhApiUser ?? '',
      emisor.mhApiPassword ?? ''
    )

    if (result.ok) {
      await db.factura.update({
        where: { id: facturaId },
        data: {
          estado: 'RECIBIDO',
          selloRecepcion: result.selloRecepcion,
          mhEstado: result.estado,
          mhFechaRecepcion: new Date(result.fhProcesamiento ?? new Date().toISOString())
        }
      })
    }

    return result
  }

  // ─── Anular / Invalidar DTE ────────────────────────────
  static async invalidar(input: {
    facturaId: number
    tipoInvalidacion: string
    motivoDescripcion: string
    nombreResponsable: string
    docResponsable: string
    nombreSolicita: string
    docSolicita: string
  }) {
    const factura = await db.factura.findUnique({ where: { id: input.facturaId } })
    if (!factura) return { ok: false, error: 'Factura no encontrada' }
    if (factura.estado !== 'RECIBIDO') return { ok: false, error: 'Solo se pueden anular facturas recibidas por el MH' }

    // TODO: construir y enviar evento de invalidación al MH
    // Por ahora marcamos como ANULADO localmente
    await db.factura.update({
      where: { id: input.facturaId },
      data: { estado: 'ANULADO' }
    })

    return { ok: true, message: 'Factura marcada como anulada' }
  }

  // ─── Verificar certificado configurado ─────────────────
  static async verificarCertificado(certFileName: string, certPassword: string) {
    return DTESignerService.validateCertificate(certFileName, certPassword)
  }

  // ─── Listar certificados disponibles ───────────────────
  static listCertificados() {
    return DTESignerService.listCertificates()
  }
}
