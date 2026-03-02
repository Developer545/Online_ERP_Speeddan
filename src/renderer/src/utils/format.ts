/**
 * Utilidades de formato para la aplicación
 */

/**
 * Formatea un número como moneda con separadores de miles
 * @param value - Número a formatear
 * @param currency - Símbolo de moneda (por defecto "$")
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Cadena formateada
 */
export function formatCurrency(value: number | string | null | undefined, currency = '$', decimals = 2): string {
  const num = Number(value ?? 0)
  return `${currency}${num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`
}

/**
 * Formatea un número con separadores de miles
 * @param value - Número a formatear
 * @param decimals - Número de decimales
 * @returns Cadena formateada
 */
export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  const num = Number(value ?? 0)
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Formatea un porcentaje
 * @param value - Valor del porcentaje
 * @param decimals - Número de decimales
 * @returns Cadena formateada
 */
export function formatPercent(value: number | string | null | undefined, decimals = 2): string {
  const num = Number(value ?? 0)
  return `${num.toFixed(decimals)}%`
}
