// ══════════════════════════════════════════════════════════
// SERVICIO DE FIRMA DIGITAL DTE
// ══════════════════════════════════════════════════════════
// Firma el JSON del DTE con el certificado digital del emisor
// usando el algoritmo RSA-SHA512 (JWS RS512).
//
// El certificado es emitido por una AC autorizada por el MH
// (BCR o SVNet). Se almacena como archivo .crt en una carpeta
// dedicada del sistema (resources/certificates/).
//
// LA LLAVE NUNCA SE GUARDA EN BASE64 NI EN BD — solo la ruta.
//
// FLUJO:
//  1. Leer archivo .crt desde la carpeta configurada
//  2. Deserializar par de claves RSA con node-forge
//  3. Firmar el JSON del DTE → retorna JWS string (RS512)
//  4. El JWS firmado se envía al MH
// ══════════════════════════════════════════════════════════

import forge from 'node-forge'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { DTEDocument } from '@shared/types/dte.types'

// Carpeta donde se almacenan los certificados .crt
// En producción: %APPDATA%/Speeddansys/certificates/
// En desarrollo: /resources/certificates/
export function getCertificatesFolder(): string {
  return app.isPackaged
    ? path.join(app.getPath('userData'), 'certificates')
    : path.join(process.cwd(), 'resources', 'certificates')
}

export interface SignResult {
  ok: boolean
  jwsSigned?: string
  error?: string
  code?: string
}

export class DTESignerService {

  /**
   * Firma el DTE JSON con el certificado del emisor.
   * @param dteJson - JSON del DTE a firmar
   * @param certFileName - Nombre del archivo .crt (ej: "06141804941035.crt")
   * @param certPassword - Contraseña del certificado
   */
  static async sign(
    dteJson: DTEDocument,
    certFileName: string,
    certPassword: string
  ): Promise<SignResult> {
    try {
      const certFolder = getCertificatesFolder()
      const certPath = path.join(certFolder, certFileName)

      if (!fs.existsSync(certPath)) {
        return {
          ok: false,
          error: `Certificado no encontrado: ${certPath}`,
          code: 'COD_812'
        }
      }

      // Leer el archivo del disco directamente (no Base64, no BD)
      const certBuffer = fs.readFileSync(certPath)

      const { privateKey, publicCert } = this.parseCertificate(certBuffer, certPassword)

      if (!privateKey) {
        return {
          ok: false,
          error: 'Contraseña del certificado incorrecta o certificado inválido',
          code: 'COD_814'
        }
      }

      const dteJsonString = JSON.stringify(dteJson)
      const jwsSigned = this.createJWS(dteJsonString, privateKey, publicCert)

      return { ok: true, jwsSigned }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      return { ok: false, error: `Error al firmar: ${msg}`, code: 'COD_815' }
    }
  }

  /**
   * Parsea el certificado .crt del MH.
   * Soporta formato PKCS#12 (.p12/.pfx) que el MH entrega como .crt
   */
  private static parseCertificate(
    certBuffer: Buffer,
    password: string
  ): { privateKey: forge.pki.rsa.PrivateKey | null; publicCert: string } {
    try {
      const p12Asn1 = forge.asn1.fromDer(certBuffer.toString('binary'))
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })

      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
      const certBag = certBags[forge.pki.oids.certBag]?.[0]

      if (!keyBag?.key || !certBag?.cert) {
        return { privateKey: null, publicCert: '' }
      }

      const publicCert = forge.pki.certificateToPem(certBag.cert)
      return {
        privateKey: keyBag.key as forge.pki.rsa.PrivateKey,
        publicCert
      }
    } catch {
      return { privateKey: null, publicCert: '' }
    }
  }

  /**
   * Crea el token JWS RS512 (JSON Web Signature).
   * Formato: base64url(header).base64url(payload).base64url(signature)
   */
  private static createJWS(
    payload: string,
    privateKey: forge.pki.rsa.PrivateKey,
    publicCert: string
  ): string {
    const certBase64 = publicCert
      .replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '')

    const header = { alg: 'RS512', typ: 'JWT', x5c: [certBase64] }
    const headerB64 = toBase64Url(Buffer.from(JSON.stringify(header)).toString('base64'))
    const payloadB64 = toBase64Url(Buffer.from(payload).toString('base64'))
    const signingInput = `${headerB64}.${payloadB64}`

    const md = forge.md.sha512.create()
    md.update(signingInput, 'utf8')
    const signatureForge = privateKey.sign(md)
    const signatureB64 = toBase64Url(
      Buffer.from(signatureForge, 'binary').toString('base64')
    )

    return `${signingInput}.${signatureB64}`
  }

  /**
   * Lista los certificados disponibles en la carpeta.
   */
  static listCertificates(): string[] {
    const folder = getCertificatesFolder()
    if (!fs.existsSync(folder)) return []
    return fs.readdirSync(folder).filter(f => f.endsWith('.crt') || f.endsWith('.pfx'))
  }

  /**
   * Valida que el certificado sea accesible y la contraseña sea correcta.
   */
  static validateCertificate(
    certFileName: string,
    certPassword: string
  ): { valid: boolean; error?: string } {
    try {
      const certPath = path.join(getCertificatesFolder(), certFileName)
      if (!fs.existsSync(certPath)) {
        return { valid: false, error: 'Archivo no encontrado' }
      }
      const certBuffer = fs.readFileSync(certPath)
      const { privateKey } = this.parseCertificate(certBuffer, certPassword)
      if (!privateKey) {
        return { valid: false, error: 'Contraseña incorrecta' }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: String(error) }
    }
  }
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
