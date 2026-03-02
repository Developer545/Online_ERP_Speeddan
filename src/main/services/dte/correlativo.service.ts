// ══════════════════════════════════════════════════════════
// SERVICIO DE CORRELATIVOS DTE
// ══════════════════════════════════════════════════════════
// Gestiona los números correlativos por tipo de DTE,
// sucursal, punto de venta y año fiscal.
//
// REGLAS DEL MINISTERIO DE HACIENDA:
//  • Cada tipo de DTE tiene su propia secuencia
//  • Cada sucursal/punto de venta tiene su propia secuencia
//  • Se resetea a 1 el 31 de diciembre de cada año fiscal
//  • El emisor es responsable de la secuencialidad
// ══════════════════════════════════════════════════════════

import { getPrismaClient } from '@main/database/prisma.client'
import type { TipoDTE } from '@shared/types/dte.types'

export interface NumeroControlDTE {
  numeroControl: string  // DTE-01-M001P001-000000000000001
  correlativoUsado: number
}

export class CorrelatvivoService {
  private static db = getPrismaClient()

  /**
   * Obtiene y reserva el siguiente número de control DTE.
   * Operación atómica — usa transacción para evitar duplicados.
   */
  static async getNextNumeroControl(
    sucursalId: number,
    tipoDte: TipoDTE
  ): Promise<NumeroControlDTE> {
    const anioFiscal = new Date().getFullYear()

    return this.db.$transaction(async (tx) => {
      // Buscar o crear el correlativo para esta combinación
      let correlativo = await tx.correlativo.findUnique({
        where: { sucursalId_tipoDte_anioFiscal: { sucursalId, tipoDte, anioFiscal } },
        include: { sucursal: true }
      })

      if (!correlativo) {
        correlativo = await tx.correlativo.create({
          data: { sucursalId, tipoDte, anioFiscal, siguiente: 1 },
          include: { sucursal: true }
        })
      }

      const numeroUsado = correlativo.siguiente

      // Incrementar el siguiente correlativo
      await tx.correlativo.update({
        where: { id: correlativo.id },
        data: { siguiente: { increment: 1 } }
      })

      const sucursal = correlativo.sucursal
      const numeroControl = this.formatNumeroControl(
        tipoDte,
        sucursal.codMH,
        sucursal.puntoVenta,
        numeroUsado
      )

      return { numeroControl, correlativoUsado: numeroUsado }
    })
  }

  /**
   * Formatea el número de control según especificación MH:
   * DTE-{tipoDte}-{codEstablecimiento}{codPuntoVenta}-{correlativo15}
   * Longitud total: exactamente 31 caracteres
   * Ejemplo: DTE-01-M001P001-000000000000001
   */
  static formatNumeroControl(
    tipoDte: string,
    codMH: string,        // ej: "M001"
    puntoVenta: string,   // ej: "P001"
    numero: number
  ): string {
    const correlativoStr = numero.toString().padStart(15, '0')
    return `DTE-${tipoDte}-${codMH}${puntoVenta}-${correlativoStr}`
  }

  /**
   * Consulta el estado actual de los correlativos de una sucursal.
   */
  static async getEstadoCorrelativos(sucursalId: number) {
    const anioFiscal = new Date().getFullYear()
    return this.db.correlativo.findMany({
      where: { sucursalId, anioFiscal },
      include: { sucursal: true }
    })
  }

  /**
   * Verifica si el año cambió y se deben resetear los correlativos.
   * Llamar este método al iniciar la aplicación.
   */
  static async verificarResetAnual(): Promise<void> {
    const ahora = new Date()
    const anioActual = ahora.getFullYear()
    const esNuevoAnio = ahora.getMonth() === 0 && ahora.getDate() === 1

    if (esNuevoAnio) {
      // Los correlativos del año anterior siguen intactos en BD para historial
      // El año nuevo simplemente usa un nuevo registro con anioFiscal = anioActual
      console.log(`[Correlativo] Nuevo año fiscal ${anioActual} iniciado. Correlativos reiniciados.`)
    }
  }
}
