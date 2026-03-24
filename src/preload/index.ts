import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const billingAPI = {
  emitir: (input: unknown) => ipcRenderer.invoke('billing:emitir', input),
  listar: (filtros: unknown) => ipcRenderer.invoke('billing:listar', filtros),
  getById: (id: number) => ipcRenderer.invoke('billing:getById', id),
  reenviar: (facturaId: number) => ipcRenderer.invoke('billing:reenviar', facturaId),
  invalidar: (input: unknown) => ipcRenderer.invoke('billing:invalidar', input),
  verificarCertificado: (certFileName: string, certPassword: string) =>
    ipcRenderer.invoke('billing:verificarCertificado', certFileName, certPassword),
  listCertificados: () => ipcRenderer.invoke('billing:listCertificados')
}

const clientsAPI = {
  buscar: (query: string) => ipcRenderer.invoke('clients:buscar', query),
  listar: (page?: number, pageSize?: number, busqueda?: string, tipoDocumento?: string) =>
    ipcRenderer.invoke('clients:listar', page, pageSize, busqueda, tipoDocumento),
  getById: (id: number) => ipcRenderer.invoke('clients:getById', id),
  crear: (data: unknown) => ipcRenderer.invoke('clients:crear', data),
  actualizar: (id: number, data: unknown) => ipcRenderer.invoke('clients:actualizar', id, data),
  desactivar: (id: number) => ipcRenderer.invoke('clients:desactivar', id)
}

const productsAPI = {
  buscar: (query: string) => ipcRenderer.invoke('products:buscar', query),
  listar: (page?: number, pageSize?: number, busqueda?: string, categoriaId?: number, soloStockBajo?: boolean) =>
    ipcRenderer.invoke('products:listar', page, pageSize, busqueda, categoriaId, soloStockBajo),
  getById: (id: number) => ipcRenderer.invoke('products:getById', id),
  crear: (data: unknown) => ipcRenderer.invoke('products:crear', data),
  actualizar: (id: number, data: unknown) => ipcRenderer.invoke('products:actualizar', id, data),
  desactivar: (id: number) => ipcRenderer.invoke('products:desactivar', id),
  listarCategorias: () => ipcRenderer.invoke('products:listarCategorias'),
  crearCategoria: (nombre: string) => ipcRenderer.invoke('products:crearCategoria', nombre),
  ajustarStock: (productoId: number, data: unknown) => ipcRenderer.invoke('products:ajustarStock', productoId, data),
  getKardex: (productoId: number, page?: number, pageSize?: number) =>
    ipcRenderer.invoke('products:getKardex', productoId, page, pageSize),
  getKardexGeneral: (page?: number, pageSize?: number, productoId?: number) =>
    ipcRenderer.invoke('products:getKardexGeneral', page, pageSize, productoId),
  getResumenInventario: () => ipcRenderer.invoke('products:getResumenInventario')
}

const sucursalesAPI = {
  listar: () => ipcRenderer.invoke('sucursales:listar'),
  getEmisor: () => ipcRenderer.invoke('sucursales:getEmisor')
}

const proveedoresAPI = {
  buscar: (query: string) => ipcRenderer.invoke('proveedores:buscar', query),
  listar: (page?: number, pageSize?: number, busqueda?: string, tipoProveedor?: string) =>
    ipcRenderer.invoke('proveedores:listar', page, pageSize, busqueda, tipoProveedor),
  getById: (id: number) => ipcRenderer.invoke('proveedores:getById', id),
  crear: (data: unknown) => ipcRenderer.invoke('proveedores:crear', data),
  actualizar: (id: number, data: unknown) => ipcRenderer.invoke('proveedores:actualizar', id, data),
  desactivar: (id: number) => ipcRenderer.invoke('proveedores:desactivar', id)
}

const empleadosAPI = {
  listar: (page?: number, pageSize?: number, busqueda?: string, cargo?: string) =>
    ipcRenderer.invoke('empleados:listar', page, pageSize, busqueda, cargo),
  getById: (id: number) => ipcRenderer.invoke('empleados:getById', id),
  crear: (data: unknown) => ipcRenderer.invoke('empleados:crear', data),
  actualizar: (id: number, data: unknown) => ipcRenderer.invoke('empleados:actualizar', id, data),
  desactivar: (id: number) => ipcRenderer.invoke('empleados:desactivar', id)
}

const comprasAPI = {
  listar: (page?: number, pageSize?: number, busqueda?: string, proveedorId?: number) =>
    ipcRenderer.invoke('compras:listar', page, pageSize, busqueda, proveedorId),
  getById: (id: number) => ipcRenderer.invoke('compras:getById', id),
  crear: (data: unknown) => ipcRenderer.invoke('compras:crear', data),
  anular: (id: number, motivo: string) => ipcRenderer.invoke('compras:anular', id, motivo)
}

const seguridadAPI = {
  listarUsuarios: (page?: number, pageSize?: number, busqueda?: string) =>
    ipcRenderer.invoke('seguridad:listarUsuarios', page, pageSize, busqueda),
  crearUsuario: (data: unknown) => ipcRenderer.invoke('seguridad:crearUsuario', data),
  actualizarUsuario: (id: number, data: unknown) => ipcRenderer.invoke('seguridad:actualizarUsuario', id, data),
  desactivarUsuario: (id: number) => ipcRenderer.invoke('seguridad:desactivarUsuario', id),
  listarRoles: () => ipcRenderer.invoke('seguridad:listarRoles'),
  crearRol: (data: unknown) => ipcRenderer.invoke('seguridad:crearRol', data),
  actualizarRol: (id: number, data: unknown) => ipcRenderer.invoke('seguridad:actualizarRol', id, data),
  eliminarRol: (id: number) => ipcRenderer.invoke('seguridad:eliminarRol', id),
  login: (username: string, password: string) => ipcRenderer.invoke('seguridad:login', username, password),
  provisionUser: (username: string, password: string) => ipcRenderer.invoke('seguridad:provisionUser', username, password),
  guardarTema: (userId: number, tema: string, colorCustom?: string) =>
    ipcRenderer.invoke('seguridad:guardarTema', userId, tema, colorCustom)
}

const configuracionAPI = {
  getEmisor: () => ipcRenderer.invoke('config:getEmisor'),
  guardarEmisor: (data: unknown) => ipcRenderer.invoke('config:guardarEmisor', data),
  guardarCredencialesMH: (data: unknown) => ipcRenderer.invoke('config:guardarCredencialesMH', data),
  listarSucursales: () => ipcRenderer.invoke('config:listarSucursales'),
  guardarSucursal: (data: unknown) => ipcRenderer.invoke('config:guardarSucursal', data),
  desactivarSucursal: (id: number) => ipcRenderer.invoke('config:desactivarSucursal', id),
  toggleSimulacion: (activar: boolean) => ipcRenderer.invoke('config:toggleSimulacion', activar),
  activarModoSimulacion: () => ipcRenderer.invoke('config:activarModoSimulacion')
}

const reportesAPI = {
  libroVentas: (desde: string, hasta: string) =>
    ipcRenderer.invoke('reportes:libroVentas', desde, hasta),
  libroCompras: (desde: string, hasta: string) =>
    ipcRenderer.invoke('reportes:libroCompras', desde, hasta),
  rentabilidad: () =>
    ipcRenderer.invoke('reportes:rentabilidad'),
  resumenF07: (mes: string) =>
    ipcRenderer.invoke('reportes:resumenF07', mes),
  cxcVencidas: () =>
    ipcRenderer.invoke('reportes:cxcVencidas')
}

const notificationsAPI = {
  checkAndFire: () => ipcRenderer.invoke('notifications:checkAndFire')
}

const cxcAPI = {
  listar: () => ipcRenderer.invoke('cxc:listar'),
  resumen: () => ipcRenderer.invoke('cxc:resumen')
}

const cxpAPI = {
  listar: () => ipcRenderer.invoke('cxp:listar'),
  resumen: () => ipcRenderer.invoke('cxp:resumen')
}

const pagosAPI = {
  registrar: (data: unknown) => ipcRenderer.invoke('pagos:registrar', data),
  historial: (facturaId: number) => ipcRenderer.invoke('pagos:historial', facturaId),
  anular: (pagoId: number) => ipcRenderer.invoke('pagos:anular', pagoId),
  registrarCxP: (data: unknown) => ipcRenderer.invoke('pagosCxp:registrar', data),
  historialCxP: (compraId: number) => ipcRenderer.invoke('pagosCxp:historial', compraId),
  anularCxP: (pagoId: number) => ipcRenderer.invoke('pagosCxp:anular', pagoId)
}

const analyticsAPI = {
  ventasPorDia: () => ipcRenderer.invoke('analytics:ventasPorDia'),
  topProductos: () => ipcRenderer.invoke('analytics:topProductos'),
  ventasVsCompras: () => ipcRenderer.invoke('analytics:ventasVsCompras'),
  distribucionTipo: () => ipcRenderer.invoke('analytics:distribucionTipo'),
  kpiResumen: () => ipcRenderer.invoke('analytics:kpiResumen'),
  utilidadReal: () => ipcRenderer.invoke('analytics:utilidadReal')
}

const gastosAPI = {
  listarCategorias: () => ipcRenderer.invoke('gastos:listarCategorias'),
  crearCategoria: (data: unknown) => ipcRenderer.invoke('gastos:crearCategoria', data),
  editarCategoria: (id: number, data: unknown) => ipcRenderer.invoke('gastos:editarCategoria', id, data),
  eliminarCategoria: (id: number) => ipcRenderer.invoke('gastos:eliminarCategoria', id),
  listar: (page?: number, pageSize?: number, categoriaId?: number, desde?: string, hasta?: string) =>
    ipcRenderer.invoke('gastos:listar', page, pageSize, categoriaId, desde, hasta),
  crear: (data: unknown) => ipcRenderer.invoke('gastos:crear', data),
  editar: (id: number, data: unknown) => ipcRenderer.invoke('gastos:editar', id, data),
  eliminar: (id: number) => ipcRenderer.invoke('gastos:eliminar', id),
  resumenPorCategoria: (mes: number, anio: number) => ipcRenderer.invoke('gastos:resumenPorCategoria', mes, anio)
}

const appControlAPI = {
  getEnvMode: (): Promise<'test' | 'production'> => ipcRenderer.invoke('app:getEnvMode'),
  canSwitchToProd: (): Promise<boolean> => ipcRenderer.invoke('app:canSwitchToProd'),
  setEnvMode: (mode: 'test' | 'production'): Promise<{ ok: boolean; mode: string }> =>
    ipcRenderer.invoke('app:setEnvMode', mode)
}

const documentosAPI = {
  leerJson: (codigoGeneracion: string) => ipcRenderer.invoke('documentos:leerJson', codigoGeneracion),
  leerPlantilla: (tipoDte: string) => ipcRenderer.invoke('documentos:leerPlantilla', tipoDte),
  listarJson: () => ipcRenderer.invoke('documentos:listarJson')
}

const licenseAPI = {
  getStatus: (): Promise<{ active: boolean; hwid: string; expired?: boolean }> =>
    ipcRenderer.invoke('license:getStatus'),
  save: (data: { key: string; expDate: string }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('license:save', data)
}

const setupAPI = {
  getStatus: (): Promise<{ needsSetup: boolean }> =>
    ipcRenderer.invoke('setup:getStatus'),
  testConnection: (creds: { host: string; port: number; user: string; password: string }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('setup:testConnection', creds),
  createDatabase: (creds: { host: string; port: number; user: string; password: string }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('setup:createDatabase', creds)
}

const planillaAPI = {
  // Configuración
  getConfig: () => ipcRenderer.invoke('planilla:getConfig'),
  updateConfig: (items: unknown) => ipcRenderer.invoke('planilla:updateConfig', items),
  seedConfig: () => ipcRenderer.invoke('planilla:seedConfig'),
  // Planillas
  listar: (page?: number, pageSize?: number) => ipcRenderer.invoke('planilla:listar', page, pageSize),
  getById: (id: number) => ipcRenderer.invoke('planilla:getById', id),
  generar: (periodo: string, tipoPago?: string) => ipcRenderer.invoke('planilla:generar', periodo, tipoPago),
  aprobar: (id: number) => ipcRenderer.invoke('planilla:aprobar', id),
  eliminar: (id: number) => ipcRenderer.invoke('planilla:eliminar', id),
  // Boletas y constancia
  getBoleta: (planillaId: number, empleadoId: number) => ipcRenderer.invoke('planilla:getBoleta', planillaId, empleadoId),
  constanciaSalarial: (empleadoId: number, meses?: number) => ipcRenderer.invoke('planilla:constanciaSalarial', empleadoId, meses),
  // Prestaciones
  aguinaldo: (anio?: number, completo?: boolean) => ipcRenderer.invoke('planilla:aguinaldo', anio, completo),
  vacaciones: () => ipcRenderer.invoke('planilla:vacaciones'),
  quincena25: (anio?: number) => ipcRenderer.invoke('planilla:quincena25', anio)
}

const contabilidadAPI = {
  // Catálogo
  listarCuentas: (busqueda?: string, tipo?: string) =>
    ipcRenderer.invoke('contabilidad:listarCuentas', busqueda, tipo),
  crearCuenta: (data: unknown) => ipcRenderer.invoke('contabilidad:crearCuenta', data),
  editarCuenta: (id: number, data: unknown) => ipcRenderer.invoke('contabilidad:editarCuenta', id, data),
  eliminarCuenta: (id: number) => ipcRenderer.invoke('contabilidad:eliminarCuenta', id),
  importarCatalogo: (cuentas: unknown) => ipcRenderer.invoke('contabilidad:importarCatalogo', cuentas),
  obtenerCatalogoEstandar: () => ipcRenderer.invoke('contabilidad:obtenerCatalogoEstandar'),
  // Períodos
  listarPeriodos: (anio?: number) => ipcRenderer.invoke('contabilidad:listarPeriodos', anio),
  crearPeriodo: (data: unknown) => ipcRenderer.invoke('contabilidad:crearPeriodo', data),
  cerrarPeriodo: (id: number) => ipcRenderer.invoke('contabilidad:cerrarPeriodo', id),
  reabrirPeriodo: (id: number) => ipcRenderer.invoke('contabilidad:reabrirPeriodo', id),
  // Asientos
  listarAsientos: (periodoId?: number, estado?: string, page?: number, pageSize?: number) =>
    ipcRenderer.invoke('contabilidad:listarAsientos', periodoId, estado, page, pageSize),
  obtenerAsiento: (id: number) => ipcRenderer.invoke('contabilidad:obtenerAsiento', id),
  crearAsiento: (data: unknown) => ipcRenderer.invoke('contabilidad:crearAsiento', data),
  editarAsiento: (id: number, data: unknown) => ipcRenderer.invoke('contabilidad:editarAsiento', id, data),
  aprobarAsiento: (id: number) => ipcRenderer.invoke('contabilidad:aprobarAsiento', id),
  anularAsiento: (id: number) => ipcRenderer.invoke('contabilidad:anularAsiento', id),
  eliminarAsiento: (id: number) => ipcRenderer.invoke('contabilidad:eliminarAsiento', id),
  // Reportes
  balanceComprobacion: (periodoId?: number, desde?: string, hasta?: string) =>
    ipcRenderer.invoke('contabilidad:balanceComprobacion', periodoId, desde, hasta),
  estadoResultados: (desde: string, hasta: string) =>
    ipcRenderer.invoke('contabilidad:estadoResultados', desde, hasta),
  balanceGeneral: (fecha: string) => ipcRenderer.invoke('contabilidad:balanceGeneral', fecha),
  libroMayor: (cuentaId: number, desde: string, hasta: string) =>
    ipcRenderer.invoke('contabilidad:libroMayor', cuentaId, desde, hasta),
  libroDiario: (desde: string, hasta: string) =>
    ipcRenderer.invoke('contabilidad:libroDiario', desde, hasta),
  auxiliarCuenta: (cuentaId: number, desde: string, hasta: string) =>
    ipcRenderer.invoke('contabilidad:auxiliarCuenta', cuentaId, desde, hasta),
  listarTiposAsiento: (empresaId?: number) =>
    ipcRenderer.invoke('contabilidad:listarTiposAsiento', empresaId),
  crearTipoAsiento: (data: unknown) =>
    ipcRenderer.invoke('contabilidad:crearTipoAsiento', data),
  eliminarTipoAsiento: (id: number) =>
    ipcRenderer.invoke('contabilidad:eliminarTipoAsiento', id)
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('setup', setupAPI)
  contextBridge.exposeInMainWorld('appControl', appControlAPI)
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('billing', billingAPI)
  contextBridge.exposeInMainWorld('clients', clientsAPI)
  contextBridge.exposeInMainWorld('products', productsAPI)
  contextBridge.exposeInMainWorld('sucursales', sucursalesAPI)
  contextBridge.exposeInMainWorld('proveedores', proveedoresAPI)
  contextBridge.exposeInMainWorld('empleados', empleadosAPI)
  contextBridge.exposeInMainWorld('compras', comprasAPI)
  contextBridge.exposeInMainWorld('seguridad', seguridadAPI)
  contextBridge.exposeInMainWorld('configuracion', configuracionAPI)
  contextBridge.exposeInMainWorld('reportes', reportesAPI)
  contextBridge.exposeInMainWorld('analytics', analyticsAPI)
  contextBridge.exposeInMainWorld('notifications', notificationsAPI)
  contextBridge.exposeInMainWorld('cxc', cxcAPI)
  contextBridge.exposeInMainWorld('cxp', cxpAPI)
  contextBridge.exposeInMainWorld('pagos', pagosAPI)
  contextBridge.exposeInMainWorld('documentos', documentosAPI)
  contextBridge.exposeInMainWorld('planilla', planillaAPI)
  contextBridge.exposeInMainWorld('gastos', gastosAPI)
  contextBridge.exposeInMainWorld('license', licenseAPI)
  contextBridge.exposeInMainWorld('contabilidad', contabilidadAPI)
} else {
  // @ts-ignore
  window.setup = setupAPI
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.billing = billingAPI
  // @ts-ignore
  window.clients = clientsAPI
  // @ts-ignore
  window.products = productsAPI
  // @ts-ignore
  window.sucursales = sucursalesAPI
  // @ts-ignore
  window.proveedores = proveedoresAPI
  // @ts-ignore
  window.empleados = empleadosAPI
  // @ts-ignore
  window.compras = comprasAPI
  // @ts-ignore
  window.seguridad = seguridadAPI
  // @ts-ignore
  window.configuracion = configuracionAPI
  // @ts-ignore
  window.reportes = reportesAPI
  // @ts-ignore
  window.analytics = analyticsAPI
  // @ts-ignore
  window.notifications = notificationsAPI
  // @ts-ignore
  window.cxc = cxcAPI
  // @ts-ignore
  window.cxp = cxpAPI
  // @ts-ignore
  window.pagos = pagosAPI
  // @ts-ignore
  window.appControl = appControlAPI
  // @ts-ignore
  window.planilla = planillaAPI
  // @ts-ignore
  window.gastos = gastosAPI
  // @ts-ignore
  window.license = licenseAPI
  // @ts-ignore
  window.contabilidad = contabilidadAPI
}
