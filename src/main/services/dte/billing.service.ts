// ══════════════════════════════════════════════════════════
// SERVICIO ORQUESTADOR DE FACTURACIÓN DTE
// ══════════════════════════════════════════════════════════
// Coordina el flujo completo de emisión de un DTE:
//  1. Obtener correlativo
//  2. Construir JSON DTE
//  3. Firmar digitalmente
//  4. Transmitir al MH
//  5. Guardar en BD con sello de recepción
//  6. Generar PDF
// ══════════════════════════════════════════════════════════

import { getPrismaClient } from '../../database/prisma.client'
import { CorrelatvivoService } from './correlativo.service'
import { DTEBuilderService, type BuildDTEInput } from './builder.service'
import { DTESignerService } from './signer.service'
import { MHTransmitterService } from './transmitter.service'
import type { TipoDTE, AmbienteDTE, DTEDocument } from '@shared/types/dte.types'
import fs from 'fs'
import path from 'path'

const db = getPrismaClient()

// Carpeta raíz del proyecto donde se guardan los JSON DTE emitidos
const JSON_DOC_DIR = path.join(process.cwd(), 'json_doc')

function saveJsonDoc(codigoGeneracion: string, dteJson: DTEDocument): void {
  try {
    if (!fs.existsSync(JSON_DOC_DIR)) fs.mkdirSync(JSON_DOC_DIR, { recursive: true })
    const filePath = path.join(JSON_DOC_DIR, `${codigoGeneracion}.json`)
    fs.writeFileSync(filePath, JSON.stringify(dteJson, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[json_doc] Error guardando JSON del DTE:', err)
  }
}

interface ReceptorDTE {
  tipoDocumento: string | null
  numDocumento: string | null
  nrc: string | null
  nombre: string | null
  codActividad: string | null
  descActividad: string | null
  nombreComercial: string | null
  direccion: { departamento: string; municipio: string; complemento: string } | null
  telefono: string | null
  correo: string | null
}

export interface EmitirFacturaInput {
  tipoDte: TipoDTE
  sucursalId: number
  clienteId?: number
  items: Array<{
    productoId?: number
    codigo?: string
    descripcion: string
    cantidad: number
    precioUni: number
    descuento?: number
    tipoItem: 1 | 2 | 3
    uniMedida: number
    esGravado?: boolean
  }>
  formaPago: Array<{ codigo: string; monto: number; referencia?: string }>
  condicionOperacion: 1 | 2 | 3
  documentoRelacionado?: { tipoDte: string; numDoc: string; fecha: string }
  notas?: string
}

export interface EmitirFacturaResult {
  ok: boolean
  facturaId?: number
  numeroControl?: string
  codigoGeneracion?: string
  selloRecepcion?: string
  estado?: string
  error?: string
  observaciones?: string[]
  pdfBuffer?: Buffer
}

export class BillingService {

  static async emitir(input: EmitirFacturaInput): Promise<EmitirFacturaResult> {
    // 1. Obtener configuración del emisor y sucursal
    const sucursal = await db.sucursal.findUnique({
      where: { id: input.sucursalId },
      include: { emisor: true }
    })

    if (!sucursal) {
      return { ok: false, error: 'Sucursal no encontrada' }
    }

    const emisor = sucursal.emisor

    if (!emisor.modoSimulacion) {
      if (!emisor.certPath || !emisor.certPassword) {
        return { ok: false, error: 'Certificado digital no configurado. Configúrelo en Ajustes > Emisor.' }
      }

      if (!emisor.mhApiUser || !emisor.mhApiPassword) {
        return { ok: false, error: 'Credenciales API del MH no configuradas.' }
      }
    }

    // 2. Obtener y reservar el número de control
    const { numeroControl } = await CorrelatvivoService.getNextNumeroControl(
      input.sucursalId,
      input.tipoDte
    )

    const ambiente = emisor.mhAmbiente as AmbienteDTE

    // 3. Preparar datos del emisor para el DTE
    const dteEmisor = {
      nit: emisor.nit,
      nrc: emisor.nrc,
      nombre: emisor.nombre,
      codActividad: emisor.codActividad,
      descActividad: emisor.descActividad,
      nombreComercial: emisor.nombreComercial,
      tipoEstablecimiento: sucursal.tipoEstab,
      direccion: {
        departamento: sucursal.departamentoCod,
        municipio: sucursal.municipioCod,
        complemento: sucursal.complemento
      },
      telefono: sucursal.telefono,
      correo: emisor.correo,
      codEstableMH: sucursal.codMH,
      codEstable: sucursal.codMH,
      codPuntoVentaMH: sucursal.puntoVenta,
      codPuntoVenta: sucursal.puntoVenta
    }

    // 4. Preparar datos del receptor
    let dteReceptor = this.buildReceptorAnonimo()
    if (input.clienteId) {
      const cliente = await db.cliente.findUnique({ where: { id: input.clienteId } })
      if (cliente) {
        dteReceptor = {
          tipoDocumento: cliente.tipoDocumento,
          numDocumento: cliente.numDocumento,
          nrc: cliente.nrc,
          nombre: cliente.nombre,
          codActividad: null,
          descActividad: null,
          nombreComercial: cliente.nombreComercial,
          direccion: cliente.departamentoCod ? {
            departamento: cliente.departamentoCod,
            municipio: cliente.municipioCod ?? '',
            complemento: cliente.complemento ?? ''
          } : null,
          telefono: cliente.telefono,
          correo: cliente.correo
        }
      }
    }

    // 5. Calcular items del DTE
    const dteItems = input.items.map((item, idx) => {
      const esGravado = item.esGravado !== false
      const descuento = item.descuento ?? 0
      const ventaGravada = esGravado ? round2(item.cantidad * item.precioUni - descuento) : 0
      const ventaExenta = !esGravado ? round2(item.cantidad * item.precioUni - descuento) : 0
      const ivaItem = esGravado ? round2(ventaGravada * 0.13) : 0

      return {
        numItem: idx + 1,
        tipoItem: item.tipoItem,
        numeroDocumento: null,
        cantidad: item.cantidad,
        codigo: item.codigo ?? null,
        codTributo: esGravado ? '20' : null,
        uniMedida: item.uniMedida,
        descripcion: item.descripcion,
        precioUni: round2(item.precioUni),
        montoDescu: round2(descuento),
        ventaNoSuj: 0,
        ventaExenta,
        ventaGravada,
        tributos: esGravado ? ['20'] : null,
        psv: 0,
        noGravado: 0,
        ivaItem
      }
    })

    // 6. Construir JSON DTE
    const buildInput: BuildDTEInput = {
      tipoDte: input.tipoDte,
      ambiente,
      numeroControl,
      emisor: dteEmisor,
      receptor: dteReceptor,
      items: dteItems,
      condicionOperacion: input.condicionOperacion,
      formaPago: input.formaPago,
      documentoRelacionado: input.documentoRelacionado
    }

    const dteJson: DTEDocument = DTEBuilderService.build(buildInput)
    const codigoGeneracion = dteJson.identificacion.codigoGeneracion

    // 7. Crear registro en BD con estado PENDIENTE_ENVIO
    const totalesResumen = dteJson.resumen
    const factura = await db.factura.create({
      data: {
        tipoDte: input.tipoDte,
        codigoGeneracion,
        numeroControl,
        ambiente,
        fechaEmision: new Date(),
        clienteId: input.clienteId ?? null,
        totalNoSuj: totalesResumen.totalNoSuj,
        totalExenta: totalesResumen.totalExenta,
        totalGravada: totalesResumen.totalGravada,
        subTotal: totalesResumen.subTotal,
        totalIva: totalesResumen.totalIva,
        totalDescuento: totalesResumen.totalDescu,
        totalPagar: totalesResumen.totalPagar,
        estado: 'PENDIENTE_ENVIO',
        dteJson: JSON.stringify(dteJson),
        condicionPago: String(input.condicionOperacion),
        notas: input.notas,
        detalles: {
          create: dteItems.map(item => ({
            numItem: item.numItem,
            tipoItem: item.tipoItem,
            codigo: item.codigo,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            uniMedida: item.uniMedida,
            precioUnitario: item.precioUni,
            descuento: item.montoDescu,
            esGravado: input.items[item.numItem - 1]?.esGravado !== false,
            ventaNoSuj: item.ventaNoSuj,
            ventaExenta: item.ventaExenta,
            ventaGravada: item.ventaGravada,
            ivaItem: item.ivaItem
          }))
        }
      }
    })

    // 8. Firmar el DTE
    let jwsSigned = ''

    if (emisor.modoSimulacion) {
      // En modo simulación, no se requiere certificado real
      jwsSigned = `SIMULACION.${Buffer.from(JSON.stringify(dteJson)).toString('base64url')}.SIM_FIRMA`
    } else {
      const signResult = await DTESignerService.sign(
        dteJson,
        emisor.certPath!,
        emisor.certPassword ?? ''
      )

      if (!signResult.ok) {
        await db.factura.update({
          where: { id: factura.id },
          data: { estado: 'RECHAZADO', mhEstado: signResult.error }
        })
        return { ok: false, error: signResult.error, facturaId: factura.id }
      }
      jwsSigned = signResult.jwsSigned!
    }

    // 9. Transmitir al MH

    let selloRecepcion = ''
    let mhEstado = 'RECIBIDO'
    let fhProcesamiento = new Date().toISOString()
    let transmitObservaciones: string[] = []

    if (emisor.modoSimulacion) {
      // En simulación: sello simulado con timestamp
      const ts = Date.now()
      selloRecepcion = `SIM-${codigoGeneracion.substring(0, 8).toUpperCase()}-${ts}`
      transmitObservaciones = ['[MODO SIMULACIÓN] Documento NO enviado al Ministerio de Hacienda']
    } else {
      const transmitResult = await MHTransmitterService.transmitir(
        jwsSigned,
        input.tipoDte,
        ambiente,
        emisor.mhApiUser!,
        emisor.mhApiPassword ?? ''
      )

      if (!transmitResult.ok) {
        const estadoFinal = transmitResult.codigoMsg === 'NETWORK_ERROR'
          ? 'CONTINGENCIA'
          : 'RECHAZADO'

        await db.factura.update({
          where: { id: factura.id },
          data: {
            estado: estadoFinal,
            dteJsonFirmado: jwsSigned,
            mhEstado: transmitResult.descripcionMsg,
            mhRespuestaJson: JSON.stringify(transmitResult)
          }
        })

        return {
          ok: false,
          facturaId: factura.id,
          numeroControl,
          codigoGeneracion,
          error: transmitResult.error,
          observaciones: transmitResult.observaciones,
          estado: estadoFinal
        }
      }

      selloRecepcion = transmitResult.selloRecepcion!
      mhEstado = transmitResult.estado!
      fhProcesamiento = transmitResult.fhProcesamiento!
      transmitObservaciones = transmitResult.observaciones!
    }

    // 10. Actualizar con sello de recepción
    await db.factura.update({
      where: { id: factura.id },
      data: {
        estado: 'RECIBIDO',
        dteJsonFirmado: jwsSigned,
        selloRecepcion,
        mhEstado,
        mhRespuestaJson: JSON.stringify({ simulacion: emisor.modoSimulacion, selloRecepcion }),
        mhFechaRecepcion: new Date(fhProcesamiento)
      }
    })

    // Actualizar stock si hay productos (para tipo 01 y 03)
    if (['01', '03'].includes(input.tipoDte)) {
      await this.actualizarStock(input.items, factura.id, numeroControl)
    }

    // Guardar JSON del DTE en carpeta json_doc
    saveJsonDoc(codigoGeneracion, dteJson)

    return {
      ok: true,
      facturaId: factura.id,
      numeroControl,
      codigoGeneracion,
      selloRecepcion,
      estado: 'RECIBIDO',
      observaciones: transmitObservaciones
    }
  }

  private static buildReceptorAnonimo(): ReceptorDTE {
    return {
      tipoDocumento: null,
      numDocumento: null,
      nrc: null,
      nombre: null,
      codActividad: null,
      descActividad: null,
      nombreComercial: null,
      direccion: null,
      telefono: null,
      correo: null
    }
  }

  private static async actualizarStock(
    items: EmitirFacturaInput['items'],
    facturaId: number,
    referencia: string
  ): Promise<void> {
    for (const item of items) {
      if (!item.productoId) continue

      const producto = await db.producto.findUnique({ where: { id: item.productoId } })
      if (!producto) continue

      const stockAnterior = Number(producto.stockActual)
      const stockNuevo = stockAnterior - item.cantidad

      await db.$transaction([
        db.producto.update({
          where: { id: item.productoId },
          data: { stockActual: stockNuevo }
        }),
        db.kardex.create({
          data: {
            productoId: item.productoId,
            tipoMovimiento: 'SALIDA',
            referencia,
            cantidad: item.cantidad,
            costoUnitario: Number(producto.costoPromedio),
            costoTotal: item.cantidad * Number(producto.costoPromedio),
            stockAnterior,
            stockNuevo,
            notas: `Factura electrónica ID: ${facturaId}`
          }
        })
      ])
    }
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
