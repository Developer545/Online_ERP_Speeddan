// ── Utilidades para documentos de identidad El Salvador ──

/** Formatea un DUI: 00000000-0 */
export function formatDUI(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 8) return digits
  return `${digits.slice(0, 8)}-${digits.slice(8)}`
}

/** Formatea un NIT: 0000-000000-000-0 */
export function formatNIT(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 4) return digits
  if (digits.length <= 10) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  if (digits.length <= 13) return `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10, 13)}-${digits.slice(13)}`
}

/** Valida DUI: exactamente 9 dígitos (con o sin guión) */
export function validarDUI(val: string): boolean {
  return /^\d{8}-\d$/.test(val) || /^\d{9}$/.test(val)
}

/** Valida NIT: exactamente 14 dígitos (con o sin guiones) */
export function validarNIT(val: string): boolean {
  const clean = val.replace(/\D/g, '')
  return clean.length === 14
}

/** Limpia dígitos del número de documento */
export function limpiarDoc(val: string): string {
  return val.replace(/\D/g, '')
}

/** Etiqueta del tipo de documento */
export const TIPOS_DOC_LABELS: Record<string, string> = {
  '13': 'DUI',
  '36': 'NIT',
  '37': 'Pasaporte',
  '03': 'Carné de Residente',
  '02': 'Carné de Minoridad'
}
