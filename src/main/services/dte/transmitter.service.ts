// ══════════════════════════════════════════════════════════
// SERVICIO DE TRANSMISIÓN AL MINISTERIO DE HACIENDA
// ══════════════════════════════════════════════════════════
// Maneja la comunicación con la API del MH:
//  1. Autenticación → JWT token
//  2. Transmisión del DTE firmado → Sello de Recepción
//
// Endpoints oficiales:
//  Pruebas:    https://apitest.dtes.mh.gob.sv
//  Producción: https://api.dtes.mh.gob.sv
// ══════════════════════════════════════════════════════════

import axios from 'axios'
import type { AmbienteDTE, MHAuthResponse, MHTransmitResponse, TipoDTE } from '@shared/types/dte.types'

const MH_URLS: Record<AmbienteDTE, string> = {
  '00': 'https://apitest.dtes.mh.gob.sv',
  '01': 'https://api.dtes.mh.gob.sv'
}

// Vigencia del token en ms (usamos margen de seguridad de 1 hora)
const TOKEN_VALIDITY_MS: Record<AmbienteDTE, number> = {
  '00': 47 * 60 * 60 * 1000,  // 47h (max 48h en pruebas)
  '01': 23 * 60 * 60 * 1000   // 23h (max 24h en producción)
}

interface TokenCache {
  token: string
  expiresAt: number
}

export interface TransmitResult {
  ok: boolean
  selloRecepcion?: string
  estado?: string
  fhProcesamiento?: string
  error?: string
  codigoMsg?: string
  descripcionMsg?: string
  observaciones: string[]
}

export class MHTransmitterService {
  private static tokenCache: Map<string, TokenCache> = new Map()

  /**
   * Autentica con el MH y obtiene un JWT token.
   * Reutiliza el token cacheado si aún es válido.
   */
  static async authenticate(
    nit: string,
    password: string,
    ambiente: AmbienteDTE
  ): Promise<string> {
    const cacheKey = `${nit}-${ambiente}`
    const cached = this.tokenCache.get(cacheKey)

    if (cached && Date.now() < cached.expiresAt) {
      return cached.token
    }

    const baseURL = MH_URLS[ambiente]
    const response = await axios.post<MHAuthResponse>(
      `${baseURL}/seguridad/auth/`,
      null,
      {
        headers: {
          'user': nit,
          'pwd': password,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    if (response.data.status !== 'OK' || !response.data.body?.token) {
      throw new Error('Autenticación rechazada por el MH')
    }

    const token = response.data.body.token
    this.tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + TOKEN_VALIDITY_MS[ambiente]
    })

    return token
  }

  /**
   * Transmite un DTE firmado al Ministerio de Hacienda.
   * Retorna el sello de recepción si fue aceptado.
   */
  static async transmitir(
    jwsSigned: string,
    tipoDte: TipoDTE,
    ambiente: AmbienteDTE,
    nit: string,
    apiPassword: string
  ): Promise<TransmitResult> {
    try {
      const token = await this.authenticate(nit, apiPassword, ambiente)
      const baseURL = MH_URLS[ambiente]

      const response = await axios.post<MHTransmitResponse>(
        `${baseURL}/fesv/recepciondte`,
        {
          ambiente,
          idEnvio: Date.now(),
          version: 3,
          tipoDte,
          documento: jwsSigned
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      )

      const data = response.data

      if (data.estado === 'RECIBIDO' && data.selloRecibido) {
        return {
          ok: true,
          selloRecepcion: data.selloRecibido,
          estado: data.estado,
          fhProcesamiento: data.fhProcesamiento,
          observaciones: data.observaciones || []
        }
      }

      return {
        ok: false,
        error: data.descripcionMsg || 'Documento rechazado por el MH',
        codigoMsg: data.codigoMsg,
        descripcionMsg: data.descripcionMsg,
        observaciones: data.observaciones || []
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Error de conectividad — modo contingencia
        if (!error.response) {
          return {
            ok: false,
            error: 'Sin conexión con el Ministerio de Hacienda. Usar modo contingencia.',
            codigoMsg: 'NETWORK_ERROR',
            descripcionMsg: error.message,
            observaciones: ['El documento puede guardarse en modo contingencia']
          }
        }

        const errData = error.response.data
        return {
          ok: false,
          error: errData?.descripcionMsg || 'Error del servidor MH',
          codigoMsg: errData?.codigoMsg || `HTTP_${error.response.status}`,
          descripcionMsg: errData?.descripcionMsg || error.message,
          observaciones: errData?.observaciones || []
        }
      }

      return {
        ok: false,
        error: String(error),
        codigoMsg: 'UNKNOWN_ERROR',
        descripcionMsg: String(error),
        observaciones: []
      }
    }
  }

  /**
   * Invalida el token cacheado (útil al cambiar credenciales).
   */
  static clearTokenCache(nit?: string): void {
    if (nit) {
      this.tokenCache.delete(`${nit}-00`)
      this.tokenCache.delete(`${nit}-01`)
    } else {
      this.tokenCache.clear()
    }
  }

  /**
   * Verifica conectividad con el MH antes de transmitir.
   */
  static async checkConnectivity(ambiente: AmbienteDTE): Promise<boolean> {
    try {
      await axios.get(`${MH_URLS[ambiente]}/seguridad/auth/`, { timeout: 10000 })
      return true
    } catch {
      return false
    }
  }
}
