// Catálogos del Sistema de Transmisión MH El Salvador v1.2

export * from './departamentos'
export * from './municipios'

// CAT-001 — Tipos de DTE
export const TIPOS_DTE = [
  { codigo: '01', nombre: 'Factura Electrónica' },
  { codigo: '03', nombre: 'Comprobante de Crédito Fiscal' },
  { codigo: '05', nombre: 'Nota de Crédito Electrónica' },
  { codigo: '06', nombre: 'Nota de Débito Electrónica' },
  { codigo: '07', nombre: 'Nota de Remisión' },
  { codigo: '11', nombre: 'Comprobante de Retención' },
  { codigo: '14', nombre: 'Comprobante de Liquidación' },
  { codigo: '15', nombre: 'Documento Contable de Liquidación' },
  { codigo: '43', nombre: 'Factura de Exportación' },
  { codigo: '44', nombre: 'Factura de Sujeto Excluido' },
  { codigo: '46', nombre: 'Comprobante de Donación' }
] as const

// CAT-009 — Tipos de documento de identidad del receptor
export const TIPOS_DOCUMENTO_RECEPTOR = [
  { codigo: '13', nombre: 'DUI' },
  { codigo: '36', nombre: 'NIT' },
  { codigo: '37', nombre: 'Pasaporte' },
  { codigo: '03', nombre: 'Carné de Residente' },
  { codigo: '02', nombre: 'Carné de Minoridad' }
] as const

// CAT-015 — Formas de pago
export const FORMAS_PAGO = [
  { codigo: '01', nombre: 'Billetes y monedas' },
  { codigo: '02', nombre: 'Tarjeta Débito' },
  { codigo: '03', nombre: 'Tarjeta Crédito' },
  { codigo: '04', nombre: 'Cheque' },
  { codigo: '05', nombre: 'Transferencia - Depósito Bancario' },
  { codigo: '06', nombre: 'Vales - Gift cards' },
  { codigo: '07', nombre: 'Dinero electrónico' },
  { codigo: '08', nombre: 'Monedero electrónico' },
  { codigo: '09', nombre: 'Activos Bitcoin/Criptomonedas' },
  { codigo: '10', nombre: 'Daciones en pago' },
  { codigo: '11', nombre: 'Cesión de derechos' },
  { codigo: '12', nombre: 'Compensación' },
  { codigo: '13', nombre: 'Permuta' },
  { codigo: '14', nombre: 'Otros' }
] as const

// CAT-017 — Tipos de establecimiento
export const TIPOS_ESTABLECIMIENTO = [
  { codigo: '01', nombre: 'Sucursal/Agencia' },
  { codigo: '02', nombre: 'Casa Matriz' },
  { codigo: '04', nombre: 'Bodega' },
  { codigo: '07', nombre: 'Oficina Administrativa' },
  { codigo: '20', nombre: 'Otro' }
] as const

// CAT-004/014 — Unidades de medida más comunes
export const UNIDADES_MEDIDA = [
  { codigo: 59, nombre: 'Unidad' },
  { codigo: 1, nombre: 'Gramo' },
  { codigo: 2, nombre: 'Kilogramo' },
  { codigo: 3, nombre: 'Libra' },
  { codigo: 4, nombre: 'Tonelada Métrica' },
  { codigo: 10, nombre: 'Litro' },
  { codigo: 11, nombre: 'Galón' },
  { codigo: 20, nombre: 'Metro' },
  { codigo: 21, nombre: 'Metro Cuadrado' },
  { codigo: 22, nombre: 'Metro Cúbico' },
  { codigo: 30, nombre: 'Caja' },
  { codigo: 31, nombre: 'Paquete' },
  { codigo: 32, nombre: 'Docena' },
  { codigo: 33, nombre: 'Par' },
  { codigo: 99, nombre: 'Otro' }
] as const

// CAT-020 — Causales de anulación/invalidación
export const CAUSALES_ANULACION = [
  { codigo: '1', nombre: 'Error en la información del receptor' },
  { codigo: '2', nombre: 'Error en los valores de la operación' },
  { codigo: '3', nombre: 'Otro' }
] as const

// Tributos
export const TRIBUTOS = {
  IVA: { codigo: '20', descripcion: 'Impuesto al Valor Agregado 13%', tasa: 0.13 },
  FOVIAL: { codigo: 'C3', descripcion: 'FOVIAL', tasa: 0.02 },
  COTRANS: { codigo: '59', descripcion: 'COTRANS', tasa: 0.01 }
} as const

// Versiones de DTE por tipo
export const VERSION_DTE: Record<string, number> = {
  '01': 1,  // Factura
  '03': 3,  // CCF
  '05': 3,  // Nota de Crédito
  '06': 3,  // Nota de Débito
  '07': 1,  // Nota de Remisión
  '11': 2,  // Comprobante de Retención
  '14': 1,  // Comprobante de Liquidación
  '15': 1,  // Documento Contable de Liquidación
  '43': 1,  // Factura de Exportación
  '44': 1,  // Factura de Sujeto Excluido
  '46': 1   // Comprobante de Donación
}
