// ══════════════════════════════════════════════════════════
// CRYPTO UTIL — Encriptación AES-256-GCM
// Portado desde Facturación DTE Online
// Usada para proteger campos sensibles:
//   - mhApiUser / mhApiPassword (credenciales Ministerio de Hacienda)
//   - certPassword (contraseña del certificado DTE)
// ══════════════════════════════════════════════════════════

import crypto from 'crypto'

const ALGORITHM  = 'aes-256-gcm'
const IV_BYTES   = 16   // 128 bits — tamaño estándar para GCM
const TAG_BYTES  = 16   // 128 bits — authentication tag GCM
const KEY_BYTES  = 32   // 256 bits

/**
 * Deriva una clave de 32 bytes a partir de ENCRYPTION_KEY env var.
 * Usa SHA-256 para normalizar cualquier longitud de clave de entrada.
 */
function getKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY
  if (!rawKey) {
    throw new Error('[crypto] ENCRYPTION_KEY no está configurada en las variables de entorno')
  }
  return crypto.createHash('sha256').update(rawKey).digest().subarray(0, KEY_BYTES)
}

/**
 * Encripta un texto plano con AES-256-GCM.
 *
 * Formato del resultado (todo en hex separado por `:`)
 *   `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 *
 * @param plaintext — Texto a encriptar (contraseña, usuario, etc.)
 * @returns Ciphertext en formato `iv:tag:ciphertext`
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext

  const key    = getKey()
  const iv     = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Desencripta un valor previamente encriptado con `encrypt()`.
 *
 * Si el valor no tiene el formato esperado (puede ser un valor
 * legado en texto plano), lo devuelve tal cual para compatibilidad.
 *
 * @param ciphertext — Formato `iv:tag:ciphertext`
 * @returns Texto original desencriptado
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext

  // Detectar si está encriptado (3 partes hex separadas por ':')
  if (!isEncrypted(ciphertext)) return ciphertext

  try {
    const key  = getKey()
    const parts = ciphertext.split(':')
    const iv        = Buffer.from(parts[0], 'hex')
    const tag       = Buffer.from(parts[1], 'hex')
    const encrypted = Buffer.from(parts[2], 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return (
      decipher.update(encrypted).toString('utf8') +
      decipher.final('utf8')
    )
  } catch (err) {
    // Si falla la desencriptación, devolver como está
    // (probablemente es un valor en texto plano legacy)
    console.warn('[crypto] No se pudo desencriptar valor — devolviendo como está:', err)
    return ciphertext
  }
}

/**
 * Verifica si un string parece estar encriptado con este módulo.
 * Patrón: `<hex32>:<hex32>:<hex+>` (iv:tag:ciphertext)
 */
export function isEncrypted(value: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i.test(value)
}

/**
 * Encripta solo si el valor no está ya encriptado (idempotente).
 * Útil para llamadas dobles accidentales.
 */
export function encryptIfNeeded(value: string): string {
  if (!value || isEncrypted(value)) return value
  return encrypt(value)
}
