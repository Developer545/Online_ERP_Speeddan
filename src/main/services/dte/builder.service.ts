// ══════════════════════════════════════════════════════════
// SERVICIO CONSTRUCTOR DE DTE (JSON)
// ══════════════════════════════════════════════════════════
// Construye el JSON del DTE según los esquemas oficiales
// del Ministerio de Hacienda de El Salvador.
//
// Referencia: svfe-json-schemas (fe-fc-v1.json, fe-ccf-v3.json...)
// ══════════════════════════════════════════════════════════

import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { VERSION_DTE } from '@shared/constants/catalogs'
import type {
  DTEDocument,
  DTEIdentificacion,
  DTEEmisor,
  DTEReceptor,
  DTEItem,
  DTEResumen,
  TipoDTE,
  AmbienteDTE
} from '@shared/types/dte.types'

export interface BuildDTEInput {
  tipoDte: TipoDTE
  ambiente: AmbienteDTE
  numeroControl: string
  emisor: DTEEmisor
  receptor: DTEReceptor
  items: DTEItem[]
  condicionOperacion: 1 | 2 | 3
  formaPago: { codigo: string; monto: number; referencia?: string }[]
  documentoRelacionado?: { tipoDte: string; numDoc: string; fecha: string } | null
}

export class DTEBuilderService {

  /**
   * Construye el JSON completo del DTE listo para firmar.
   * El codigoGeneracion (UUID v4) se genera aquí automáticamente.
   */
  static build(input: BuildDTEInput): DTEDocument {
    const identificacion = this.buildIdentificacion(input)
    const resumen = this.buildResumen(input)

    return {
      identificacion,
      documentoRelacionado: input.documentoRelacionado
        ? [{
            tipoDocumento: input.documentoRelacionado.tipoDte,
            tipoGeneracion: 2,
            numeroDocumento: input.documentoRelacionado.numDoc,
            fechaEmision: input.documentoRelacionado.fecha
          }]
        : null,
      emisor: input.emisor,
      receptor: input.receptor,
      otrosDocumentos: null,
      ventaTercero: null,
      cuerpoDocumento: input.items,
      resumen,
      extension: null,
      apendice: null
    }
  }

  private static buildIdentificacion(input: BuildDTEInput): DTEIdentificacion {
    const ahora = dayjs()
    return {
      version: VERSION_DTE[input.tipoDte] || 1,
      ambiente: input.ambiente,
      tipoDte: input.tipoDte,
      numeroControl: input.numeroControl,
      codigoGeneracion: uuidv4().toUpperCase(),
      tipoModelo: 1,       // 1 = Transmisión online (normal)
      tipoOperacion: 1,    // 1 = Operación normal
      tipoContingencia: null,
      motivoContigencia: null,
      fecEmi: ahora.format('YYYY-MM-DD'),
      horEmi: ahora.format('HH:mm:ss'),
      tipoMoneda: 'USD'
    }
  }

  private static buildResumen(input: BuildDTEInput): DTEResumen {
    const items = input.items
    const totalGravada = items.reduce((s, i) => s + i.ventaGravada, 0)
    const totalExenta = items.reduce((s, i) => s + i.ventaExenta, 0)
    const totalNoSuj = items.reduce((s, i) => s + i.ventaNoSuj, 0)
    const totalDescu = items.reduce((s, i) => s + i.montoDescu, 0)
    const totalIva = items.reduce((s, i) => s + i.ivaItem, 0)
    const subTotal = totalGravada + totalExenta + totalNoSuj
    const totalPagar = round2(subTotal + totalIva - totalDescu)

    return {
      totalNoSuj: round2(totalNoSuj),
      totalExenta: round2(totalExenta),
      totalGravada: round2(totalGravada),
      subTotalVentas: round2(subTotal),
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: round2(totalDescu),
      porcentajeDescuento: 0,
      totalDescu: round2(totalDescu),
      tributos: totalGravada > 0
        ? [{ codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', valor: round2(totalIva) }]
        : [],
      subTotal: round2(subTotal),
      ivaRete1: 0,
      reteRenta: 0,
      montoTotalOperacion: totalPagar,
      totalNoGravado: 0,
      totalPagar,
      totalLetras: numberToWords(totalPagar),
      totalIva: round2(totalIva),
      saldoFavor: 0,
      condicionOperacion: input.condicionOperacion,
      pagos: input.formaPago.map(p => ({
        codigo: p.codigo,
        montoPago: round2(p.monto),
        referencia: p.referencia ?? null,
        plazo: null,
        periodo: null
      })),
      numPagoElectronico: null
    }
  }
}

// ── Utilidades ────────────────────────────────────────────

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Convierte un número en palabras en español (para totalLetras).
 * Ejemplo: 11.15 → "ONCE DÓLARES CON 15/100"
 */
function numberToWords(amount: number): string {
  const entero = Math.floor(amount)
  const centavos = Math.round((amount - entero) * 100)
  const palabras = intToWords(entero).toUpperCase()
  return centavos > 0
    ? `${palabras} DÓLARES CON ${centavos}/100`
    : `${palabras} DÓLARES EXACTOS`
}

function intToWords(n: number): string {
  if (n === 0) return 'cero'
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  if (n < 20) return unidades[n]
  if (n < 100) {
    const d = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? decenas[d] : `${decenas[d]} y ${unidades[u]}`
  }
  if (n === 100) return 'cien'
  if (n < 1000) {
    const c = Math.floor(n / 100)
    const resto = n % 100
    const cStr = c === 1 ? 'ciento' : centenas[c]
    return resto === 0 ? cStr : `${cStr} ${intToWords(resto)}`
  }
  if (n < 1000000) {
    const miles = Math.floor(n / 1000)
    const resto = n % 1000
    const milesStr = miles === 1 ? 'mil' : `${intToWords(miles)} mil`
    return resto === 0 ? milesStr : `${milesStr} ${intToWords(resto)}`
  }
  return n.toString()
}
