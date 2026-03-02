// Tipos globales expuestos por el preload vía contextBridge

interface Window {
  appControl: {
    getEnvMode: () => Promise<'test' | 'production'>
    canSwitchToProd: () => Promise<boolean>
    setEnvMode: (mode: 'test' | 'production') => Promise<{ ok: boolean; mode: string }>
  }
  billing: {
    emitir: (input: unknown) => Promise<import('./billing.types').EmitirResult>
    listar: (filtros: unknown) => Promise<import('./billing.types').ListarResult>
    getById: (id: number) => Promise<import('./billing.types').FacturaDetalle | null>
    reenviar: (facturaId: number) => Promise<{ ok: boolean; error?: string; selloRecepcion?: string }>
    invalidar: (input: unknown) => Promise<{ ok: boolean; error?: string }>
    verificarCertificado: (certFileName: string, certPassword: string) => Promise<{ valid: boolean; error?: string }>
    listCertificados: () => Promise<string[]>
  }
  clients: {
    buscar: (query: string) => Promise<ClienteRow[]>
    listar: (page?: number, pageSize?: number, busqueda?: string, tipoDocumento?: string) => Promise<{ clientes: ClienteRow[]; total: number; page: number; pageSize: number }>
    getById: (id: number) => Promise<ClienteRow | null>
    crear: (data: unknown) => Promise<ClienteRow>
    actualizar: (id: number, data: unknown) => Promise<ClienteRow>
    desactivar: (id: number) => Promise<ClienteRow>
  }
  products: {
    buscar: (query: string) => Promise<ProductoRow[]>
    listar: (page?: number, pageSize?: number, busqueda?: string, categoriaId?: number, soloStockBajo?: boolean) => Promise<{ productos: ProductoRow[]; total: number; page: number; pageSize: number }>
    getById: (id: number) => Promise<ProductoRow | null>
    crear: (data: unknown) => Promise<ProductoRow>
    actualizar: (id: number, data: unknown) => Promise<ProductoRow>
    desactivar: (id: number) => Promise<ProductoRow>
    listarCategorias: () => Promise<CategoriaRow[]>
    crearCategoria: (nombre: string) => Promise<CategoriaRow>
    ajustarStock: (productoId: number, data: unknown) => Promise<unknown>
    getKardex: (productoId: number, page?: number, pageSize?: number) => Promise<KardexResult>
    getKardexGeneral: (page?: number, pageSize?: number, productoId?: number) => Promise<KardexResult>
    getResumenInventario: () => Promise<{ totalProductos: number; productosStockBajo: number; valorInventario: number }>
  }
  sucursales: {
    listar: () => Promise<SucursalRow[]>
    getEmisor: () => Promise<EmisorRow | null>
  }
  proveedores: {
    buscar: (query: string) => Promise<ProveedorRow[]>
    listar: (page?: number, pageSize?: number, busqueda?: string, tipoProveedor?: string) => Promise<{ proveedores: ProveedorRow[]; total: number; page: number; pageSize: number }>
    getById: (id: number) => Promise<ProveedorRow | null>
    crear: (data: unknown) => Promise<ProveedorRow>
    actualizar: (id: number, data: unknown) => Promise<ProveedorRow>
    desactivar: (id: number) => Promise<ProveedorRow>
  }
  empleados: {
    listar: (page?: number, pageSize?: number, busqueda?: string, cargo?: string) => Promise<{ empleados: EmpleadoRow[]; total: number; page: number; pageSize: number }>
    getById: (id: number) => Promise<EmpleadoRow | null>
    crear: (data: unknown) => Promise<EmpleadoRow>
    actualizar: (id: number, data: unknown) => Promise<EmpleadoRow>
    desactivar: (id: number) => Promise<EmpleadoRow>
  }
  compras: {
    listar: (page?: number, pageSize?: number, busqueda?: string, proveedorId?: number) => Promise<{ compras: CompraRow[]; total: number; page: number; pageSize: number }>
    getById: (id: number) => Promise<CompraDetalle | null>
    crear: (data: unknown) => Promise<CompraRow>
    anular: (id: number, motivo: string) => Promise<CompraRow>
  }
  seguridad: {
    listarUsuarios: (page?: number, pageSize?: number, busqueda?: string) => Promise<{ usuarios: UsuarioRow[]; total: number; page: number; pageSize: number }>
    crearUsuario: (data: unknown) => Promise<UsuarioRow>
    actualizarUsuario: (id: number, data: unknown) => Promise<UsuarioRow>
    desactivarUsuario: (id: number) => Promise<UsuarioRow>
    listarRoles: () => Promise<RolRow[]>
    crearRol: (data: unknown) => Promise<RolRow>
    actualizarRol: (id: number, data: unknown) => Promise<RolRow>
    eliminarRol: (id: number) => Promise<RolRow>
    login: (username: string, password: string) => Promise<{ ok: boolean; user?: UserSession; error?: string }>
    provisionUser: (username: string, password: string) => Promise<{ ok: boolean; user?: UserSession; error?: string }>
    guardarTema: (userId: number, tema: string, colorCustom?: string) => Promise<{ id: number; tema: string }>
  }
  configuracion: {
    getEmisor: () => Promise<EmisorConfigRow | null>
    guardarEmisor: (data: unknown) => Promise<EmisorConfigRow>
    guardarCredencialesMH: (data: unknown) => Promise<EmisorConfigRow>
    listarSucursales: () => Promise<SucursalRow[]>
    guardarSucursal: (data: unknown) => Promise<SucursalRow>
    desactivarSucursal: (id: number) => Promise<SucursalRow>
    toggleSimulacion: (activar: boolean) => Promise<EmisorConfigRow>
    activarModoSimulacion: () => Promise<EmisorConfigRow>
  }
  reportes: {
    libroVentas: (desde: string, hasta: string) => Promise<ReporteIVARow[]>
    libroCompras: (desde: string, hasta: string) => Promise<ReporteComprasRow[]>
    rentabilidad: () => Promise<RentabilidadRow[]>
    resumenF07: (mes: string) => Promise<ResumenF07>
    cxcVencidas: () => Promise<CxCVencidaRow[]>
  }
  notifications: {
    checkAndFire: () => Promise<{ stockCritico: number; pendientesMH: number; cxcVencidas: number }>
  }
  cxc: {
    listar: () => Promise<CxCItem[]>
    resumen: () => Promise<CxCResumen>
  }
  pagos: {
    registrar: (data: { facturaId: number; monto: number; metodoPago: string; referencia?: string; notas?: string }) => Promise<PagoCxCRow>
    historial: (facturaId: number) => Promise<PagoCxCRow[]>
    anular: (pagoId: number) => Promise<boolean>
  }
  cxp: {
    listar: () => Promise<CxPItem[]>
    resumen: () => Promise<CxPResumen>
  }
  analytics: {
    ventasPorDia: () => Promise<VentaPorDia[]>
    topProductos: () => Promise<TopProducto[]>
    ventasVsCompras: () => Promise<VentasVsCompras[]>
    distribucionTipo: () => Promise<DistribucionTipo[]>
    kpiResumen: () => Promise<KpiResumen>
    utilidadReal: () => Promise<UtilidadRealMes[]>
  }
  gastos: {
    listarCategorias: () => Promise<CategoriaGastoRow[]>
    crearCategoria: (data: { nombre: string; descripcion?: string; color?: string }) => Promise<CategoriaGastoRow>
    editarCategoria: (id: number, data: { nombre?: string; descripcion?: string; color?: string }) => Promise<CategoriaGastoRow>
    eliminarCategoria: (id: number) => Promise<CategoriaGastoRow>
    listar: (page?: number, pageSize?: number, categoriaId?: number, desde?: string, hasta?: string) => Promise<{ gastos: GastoInternoRow[]; total: number; page: number; pageSize: number }>
    crear: (data: { categoriaId: number; fecha: string; monto: number; descripcion: string; notas?: string }) => Promise<GastoInternoRow>
    editar: (id: number, data: { categoriaId?: number; fecha?: string; monto?: number; descripcion?: string; notas?: string }) => Promise<GastoInternoRow>
    eliminar: (id: number) => Promise<void>
    resumenPorCategoria: (mes: number, anio: number) => Promise<{ categoria: string; total: number; color: string }[]>
  }
  documentos: {
    leerJson: (codigoGeneracion: string) => Promise<{ ok: boolean; json?: unknown; error?: string }>
    leerPlantilla: (tipoDte: string) => Promise<{ ok: boolean; html?: string; error?: string }>
    listarJson: () => Promise<string[]>
  }
}

// ── Rows ──────────────────────────────────────────────────

interface ClienteRow {
  id: number
  tipoDocumento: string
  numDocumento: string
  nombre: string
  nombreComercial?: string
  nrc?: string
  correo?: string
  telefono?: string
  departamentoCod?: string
  municipioCod?: string
  complemento?: string
}

interface ProductoRow {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number | string
  costoPromedio: number | string
  stockActual: number | string
  stockMinimo?: number | string
  uniMedida: number
  tipoItem: number
  esGravado: boolean
  categoria?: { nombre: string }
}

interface ProveedorRow {
  id: number
  nombre: string
  nit?: string
  nrc?: string
  correo?: string
  telefono?: string
  tipoProveedor?: string
  contacto?: string
  direccion?: string
  departamentoCod?: string
  municipioCod?: string
  plazoCredito?: number
  activo: boolean
}

interface EmpleadoRow {
  id: number
  nombre: string
  dui?: string
  nit?: string
  correo?: string
  telefono?: string
  cargo?: string
  salario?: number | string
  fechaIngreso?: string
  departamentoCod?: string
  municipioCod?: string
  direccion?: string
  activo: boolean
}

interface CompraRow {
  id: number
  numeroDocumento: string
  tipoDocumento: string
  fecha: string
  condicionPago: string
  subtotal: number | string
  iva: number | string
  total: number | string
  estado: string
  notas?: string
  proveedorId?: number
  proveedor?: { id: number; nombre: string; nit?: string }
}

interface CompraDetalle extends CompraRow {
  detalles: Array<{
    id: number
    productoId: number
    descripcion?: string
    cantidad: number | string
    costoUnitario: number | string
    descuento: number | string
    subtotal: number | string
    producto: ProductoRow
  }>
}

interface UsuarioRow {
  id: number
  username: string
  nombre: string
  correo?: string
  activo: boolean
  roleId: number
  role?: { id: number; nombre: string }
}

interface RolRow {
  id: number
  nombre: string
  permisos: string
  _count?: { users: number }
}

interface SucursalRow {
  id: number
  nombre: string
  codMH: string
  puntoVenta: string
  tipoEstab: string
  departamentoCod: string
  municipioCod: string
  complemento: string
  emisor: { nombre: string; nit: string; nrc: string }
}

interface CategoriaRow {
  id: number
  nombre: string
  activa: boolean
}

interface KardexMovimiento {
  id: number
  productoId: number
  tipoMovimiento: string
  referencia: string
  cantidad: number | string
  costoUnitario: number | string
  costoTotal: number | string
  stockAnterior: number | string
  stockNuevo: number | string
  notas?: string
  fecha: string
  producto?: { codigo: string; nombre: string }
}

interface KardexResult {
  movimientos: KardexMovimiento[]
  total: number
  page: number
  pageSize: number
}

interface EmisorRow {
  id: number
  nombre: string
  nit: string
  nrc: string
  mhAmbiente: string
  sucursales: SucursalRow[]
}

interface EmisorConfigRow {
  id: number
  nombre: string
  nombreComercial?: string
  nit: string
  nrc: string
  codActividad: string
  descActividad: string
  tipoEstablecimiento: string
  departamentoCod: string
  municipioCod: string
  complementoDireccion: string
  telefono?: string
  correo: string
  mhAmbiente: string
  mhApiUser?: string
  certPath?: string
  modoSimulacion?: boolean
  sucursales?: SucursalRow[]
}

interface ReporteIVARow {
  correlativo: number
  fecha: string
  numeroControl: string
  codigoGeneracion: string
  selloRecepcion: string
  tipoDte: string
  estado: string
  clienteNombre: string
  clienteDocumento: string
  clienteNrc: string
  ventasExentas: number
  ventasNoSujetas: number
  ventasGravadas: number
  iva: number
  total: number
}

interface UserSession {
  id: number
  username: string
  nombre: string
  correo?: string
  roleId: number
  role?: { id: number; nombre: string; permisos: string }
  tema?: string
  colorCustom?: string | null
}

interface CxCItem {
  id: number
  numeroControl: string
  tipoDte: string
  fechaEmision: string
  fechaVencimiento: string
  diasRestantes: number
  plazoCredito: number
  total: number
  abonado: number
  saldo: number
  estadoCxC: string
  cliente?: { id: number; nombre: string; numDocumento: string; tipoDocumento: string; telefono?: string; correo?: string } | null
}

interface CxCResumen {
  totalDocumentos: number
  totalMonto: number
  montoVencido: number
  montoPorVencer: number
  montoVigente: number
  countVencidas: number
  countPorVencer: number
  countVigentes: number
}

interface CxPItem {
  id: number
  numeroDocumento: string
  tipoDocumento: string
  fecha: string
  fechaVencimiento: string
  diasRestantes: number
  plazoCredito: number
  total: number
  estadoCxP: string
  proveedor?: { id: number; nombre: string; nit?: string; telefono?: string; correo?: string } | null
}

interface CxPResumen {
  totalDocumentos: number
  totalMonto: number
  montoVencido: number
  montoPorVencer: number
  montoVigente: number
  countVencidas: number
  countPorVencer: number
  countVigentes: number
}

interface VentaPorDia {
  fecha: string
  total: number
  cantidad: number
}

interface TopProducto {
  nombre: string
  cantidad: number
  ingreso: number
}

interface VentasVsCompras {
  mes: string
  ventas: number
  compras: number
}

interface DistribucionTipo {
  tipo: string
  cantidad: number
  total: number
}

interface KpiResumen {
  ventasHoy: number
  ventasMes: number
  ventasMesAnterior: number
  totalClientes: number
  totalProductos: number
  stockBajo: number
  valorInventario: number
  facturasPendientesMH: number
}

interface RentabilidadRow {
  id: number
  codigo: string
  nombre: string
  categoria: string
  precioVenta: number
  costoPromedio: number
  margenBruto: number
  margenPct: number
  stockActual: number
  valorInventario: number
}

interface ReporteComprasRow {
  correlativo: number
  fecha: string
  numeroDocumento: string
  tipoDocumento: string
  proveedorNombre: string
  proveedorNit: string
  proveedorNrc: string
  subtotal: number
  iva: number
  total: number
}

interface ResumenF07 {
  periodo: string
  ventasContribuyente: { registros: number; gravadas: number; exentas: number; noSujetas: number; iva: number; total: number }
  ventasConsumidor: { registros: number; gravadas: number; exentas: number; noSujetas: number; iva: number; total: number }
  compras: { registros: number; subtotal: number; iva: number; total: number }
  debitoFiscal: number
  creditoFiscal: number
  ivaAPagar: number
  remanente: number
}

interface CxCVencidaRow {
  facturaId: number
  fecha: string
  numeroControl: string
  clienteNombre: string
  clienteDocumento: string
  total: number
  pagado: number
  saldo: number
  plazo: number
  diasEmision: number
  diasVencido: number
  rango: string
}

interface PagoCxCRow {
  id: number
  facturaId: number
  monto: number
  fecha: string
  metodoPago: string
  referencia?: string | null
  notas?: string | null
  createdAt: string
}

interface CategoriaGastoRow {
  id: number
  nombre: string
  descripcion?: string | null
  color?: string | null
  activo: boolean
  _count?: { gastos: number }
}

interface GastoInternoRow {
  id: number
  categoriaId: number
  categoria: { id: number; nombre: string; color?: string | null }
  fecha: string
  monto: number | string
  descripcion: string
  notas?: string | null
  createdAt: string
}

interface UtilidadRealMes {
  mes: string
  ventas: number
  compras: number
  gastos: number
  utilidad: number
}
