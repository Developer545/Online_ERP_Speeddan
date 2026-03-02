export interface EmitirResult {
  ok: boolean
  facturaId?: number
  numeroControl?: string
  codigoGeneracion?: string
  selloRecepcion?: string
  estado?: string
  error?: string
  observaciones?: string[]
}

export interface ListarResult {
  facturas: FacturaRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FacturaRow {
  id: number
  tipoDte: string
  numeroControl: string
  codigoGeneracion: string
  fechaEmision: string
  totalPagar: number | string
  estado: string
  selloRecepcion?: string
  cliente?: { nombre: string; numDocumento: string }
}

export interface FacturaDetalle extends FacturaRow {
  dteJson?: string
  dteJsonFirmado?: string | null
  condicionPago?: string
  notas?: string | null
  totalNoSuj: number
  totalExenta: number
  totalGravada: number
  subTotal: number
  totalIva: number
  totalDescuento: number
  detalles: DetalleRow[]
}

export interface DetalleRow {
  id: number
  numItem: number
  descripcion: string
  cantidad: number | string
  precioUnitario: number | string
  descuento: number | string
  ventaNoSuj: number | string
  ventaExenta: number | string
  ventaGravada: number | string
  ivaItem: number | string
  producto?: { codigo: string; nombre: string } | null
}

// Input para el formulario de emisión
export interface ItemFacturaInput {
  key: string               // React key
  productoId?: number
  codigo?: string
  descripcion: string
  cantidad: number
  precioUni: number
  descuento: number
  tipoItem: 1 | 2 | 3
  uniMedida: number
  esGravado: boolean
  // Calculados automáticamente
  ventaGravada: number
  ventaExenta: number
  ivaItem: number
  total: number
}

export interface TotalesFactura {
  totalGravada: number
  totalExenta: number
  totalNoSuj: number
  totalDescuento: number
  subTotal: number
  totalIva: number
  totalPagar: number
}
