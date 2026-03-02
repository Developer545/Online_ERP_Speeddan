// ════════════════════════════════════════════════════════════
// TIPOS DTE — Documentos Tributarios Electrónicos El Salvador
// Ministerio de Hacienda — Sistema de Transmisión v1.2
// ════════════════════════════════════════════════════════════

export type TipoDTE = '01' | '03' | '05' | '06' | '07' | '11' | '14' | '15' | '43' | '44' | '46'
export type AmbienteDTE = '00' | '01' // 00=pruebas, 01=producción
export type EstadoDTE =
  | 'BORRADOR'
  | 'PENDIENTE_ENVIO'
  | 'ENVIADO'
  | 'RECIBIDO'
  | 'RECHAZADO'
  | 'CONTINGENCIA'
  | 'ANULADO'

// ─── Identificación ───────────────────────────────────────
export interface DTEIdentificacion {
  version: number
  ambiente: AmbienteDTE
  tipoDte: TipoDTE
  numeroControl: string   // DTE-01-M001P001-000000000000001 (31 chars)
  codigoGeneracion: string // UUID v4 en MAYÚSCULAS
  tipoModelo: 1 | 2       // 1=Transmisión online, 2=Transmisión diferida
  tipoOperacion: 1 | 2    // 1=Normal, 2=Contingencia
  tipoContingencia: number | null
  motivoContigencia: string | null
  fecEmi: string          // YYYY-MM-DD
  horEmi: string          // HH:MM:SS
  tipoMoneda: 'USD'
}

// ─── Dirección ────────────────────────────────────────────
export interface DTEDireccion {
  departamento: string    // CAT-012, ej: "06" = San Salvador
  municipio: string       // CAT-013, ej: "23"
  complemento: string     // Calle, colonia, número
}

// ─── Emisor ───────────────────────────────────────────────
export interface DTEEmisor {
  nit: string             // 14 dígitos sin guiones
  nrc: string             // Sin guiones
  nombre: string
  codActividad: string    // CAT-008
  descActividad: string
  nombreComercial: string | null
  tipoEstablecimiento: string  // CAT-017
  direccion: DTEDireccion
  telefono: string | null
  correo: string
  codEstableMH: string | null  // Código establecimiento asignado por MH
  codEstable: string | null
  codPuntoVentaMH: string | null
  codPuntoVenta: string | null
}

// ─── Receptor ─────────────────────────────────────────────
export interface DTEReceptor {
  tipoDocumento: string | null  // CAT-009: "13"=DUI, "36"=NIT, "37"=Pasaporte
  numDocumento: string | null
  nrc: string | null
  nombre: string | null
  codActividad: string | null
  descActividad: string | null
  nombreComercial: string | null
  direccion: DTEDireccion | null
  telefono: string | null
  correo: string | null
}

// ─── Cuerpo del documento ─────────────────────────────────
export interface DTEItem {
  numItem: number
  tipoItem: 1 | 2 | 3 | 4 // 1=Bien, 2=Servicio, 3=Ambos, 4=Otros
  numeroDocumento: string | null
  cantidad: number
  codigo: string | null
  codTributo: string | null   // "20"=IVA, null=Exento
  uniMedida: number           // CAT-004/014
  descripcion: string
  precioUni: number
  montoDescu: number
  ventaNoSuj: number
  ventaExenta: number
  ventaGravada: number
  tributos: string[] | null   // ["20"] para IVA, null para exento
  psv: number                 // Precio sugerido de venta
  noGravado: number
  ivaItem: number
}

// ─── Pago ──────────────────────────────────────────────────
export interface DTEPago {
  codigo: string        // CAT-015: "01"=Efectivo, "02"=Tarjeta...
  montoPago: number
  referencia: string | null
  plazo: string | null
  periodo: number | null
}

// ─── Tributo en resumen ────────────────────────────────────
export interface DTETributo {
  codigo: string        // "20" para IVA 13%
  descripcion: string
  valor: number
}

// ─── Resumen ───────────────────────────────────────────────
export interface DTEResumen {
  totalNoSuj: number
  totalExenta: number
  totalGravada: number
  subTotalVentas: number
  descuNoSuj: number
  descuExenta: number
  descuGravada: number
  porcentajeDescuento: number
  totalDescu: number
  tributos: DTETributo[]
  subTotal: number
  ivaRete1: number
  reteRenta: number
  montoTotalOperacion: number
  totalNoGravado: number
  totalPagar: number
  totalLetras: string
  totalIva: number
  saldoFavor: number
  condicionOperacion: 1 | 2 | 3  // 1=Contado, 2=Crédito, 3=Otro
  pagos: DTEPago[]
  numPagoElectronico: string | null
}

// ─── DTE Completo ──────────────────────────────────────────
export interface DTEDocument {
  identificacion: DTEIdentificacion
  documentoRelacionado: DocumentoRelacionado[] | null
  emisor: DTEEmisor
  receptor: DTEReceptor
  otrosDocumentos: null
  ventaTercero: null
  cuerpoDocumento: DTEItem[]
  resumen: DTEResumen
  extension: null
  apendice: null
}

export interface DocumentoRelacionado {
  tipoDocumento: string
  tipoGeneracion: number
  numeroDocumento: string
  fechaEmision: string
}

// ─── Respuesta del MH ──────────────────────────────────────
export interface MHAuthResponse {
  status: 'OK' | 'ERROR'
  body: {
    token: string
  }
}

export interface MHTransmitResponse {
  version: number
  ambiente: AmbienteDTE
  versionApp: number
  estado: 'RECIBIDO' | 'RECHAZADO' | 'CONTINGENCIA'
  codigoGeneracion: string
  selloRecibido: string | null
  fhProcesamiento: string
  clasificaMsg: string
  codigoMsg: string
  descripcionMsg: string
  observaciones: string[]
}

// ─── Para el firmador ──────────────────────────────────────
export interface SignerRequest {
  nit: string
  activo: boolean
  passwordPri: string
  dteJson: DTEDocument
}

export interface SignerResponse {
  status: 'OK' | 'ERROR'
  body: string  // JWS string firmado
}
