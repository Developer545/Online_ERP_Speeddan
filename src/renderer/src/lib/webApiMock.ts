// ══════════════════════════════════════════════════════════
// WEB API MOCK — Modo Online (Render / Vercel)
// Cuando la app corre en un navegador (no en Electron),
// redirige todas las llamadas IPC hacia el servidor REST.
// ══════════════════════════════════════════════════════════

// En producción web: VITE_API_URL = 'https://tu-app.onrender.com'
// En dev local:      VITE_API_URL = ''  (usa /api relativo)
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api'

// ── Helper: headers con auth token si existe ─────────────
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('speeddansys_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function apiFetch(input: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) }
  })
  const data = await res.json()

  if (res.status === 402) {
    window.dispatchEvent(new CustomEvent('api-payment-required', { detail: data?.error || 'Suscripción requerida' }))
  } else if (res.status === 401 && !input.includes('/seguridad/login')) {
    window.dispatchEvent(new CustomEvent('api-unauthorized'))
  }

  return data
}

// ── Detección de entorno ──────────────────────────────────
// VITE_CLOUD_MODE=true → Desktop Cloud (Electron wrapper + servidor online)
// El renderer siempre usa HTTP aunque esté dentro de Electron.
const IS_CLOUD_BUILD = import.meta.env.VITE_CLOUD_MODE === 'true'

function isElectron(): boolean {
  if (IS_CLOUD_BUILD) return false   // Cloud Desktop: forzar modo web (HTTP)
  // @ts-ignore
  return typeof window !== 'undefined' && !!window.electron
}

export function initializeWebMock(): void {
  if (isElectron()) {
    console.log('[Web Mock] Entorno Electron detectado. Usando IPC nativo.')
    return
  }

  if (IS_CLOUD_BUILD) {
    console.log('[Web Mock] Desktop Cloud — servidor online:', API_BASE_URL)
  }

  console.log('[Web Mock] Entorno Web detectado. Usando REST API:', API_BASE_URL)

  // ── setup: en modo web no hay setup de BD local ──────────
  // @ts-ignore
  window.setup = {
    getStatus: async () => ({ needsSetup: false }),
    testConnection: async () => ({ success: false, error: 'No aplica en modo web' }),
    createDatabase: async () => ({ success: false, error: 'No aplica en modo web' })
  }

  // ── license: en modo web la licencia siempre está activa ──
  // La activación por hardware no aplica en versión web.
  // El control de acceso se hace mediante login (usuario/contraseña).
  // @ts-ignore
  window.license = {
    getStatus: async () => ({ active: true, hwid: 'web-mode', expired: false }),
    save: async (_data: unknown) => ({ success: true })
  }

  // ── App Control ──────────────────────────────────────────
  // @ts-ignore
  window.appControl = {
    getEnvMode: async () => 'production' as const,
    canSwitchToProd: async () => false,
    setEnvMode: async (mode: string) => ({ ok: false, mode, error: 'No aplica en modo web' })
  }

  // ── Seguridad ─────────────────────────────────────────────
  // @ts-ignore
  window.seguridad = {
    login: async (username: string, password: string) => {
      try {
        const result = await apiFetch('/seguridad/login', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        })
        // Guardar token si viene en la respuesta
        if (result.token) localStorage.setItem('speeddansys_token', result.token)
        return result
      } catch (err: any) {
        return { ok: false, error: err.message }
      }
    },
    provisionUser: async (username: string, password: string) => {
      return apiFetch('/seguridad/provision', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
    },
    guardarTema: async (userId: number, tema: string, colorCustom?: string) =>
      apiFetch('/seguridad/tema', { method: 'POST', body: JSON.stringify({ userId, tema, colorCustom }) }),
    listarUsuarios: async (page?: number, pageSize?: number, busqueda?: string) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 20) })
      if (busqueda) params.set('busqueda', busqueda)
      return apiFetch(`/seguridad/usuarios?${params}`)
    },
    crearUsuario: async (data: unknown) =>
      apiFetch('/seguridad/usuarios', { method: 'POST', body: JSON.stringify(data) }),
    actualizarUsuario: async (id: number, data: unknown) =>
      apiFetch(`/seguridad/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    desactivarUsuario: async (id: number) =>
      apiFetch(`/seguridad/usuarios/${id}`, { method: 'DELETE' }),
    listarRoles: async () => apiFetch('/seguridad/roles'),
    crearRol: async (data: unknown) =>
      apiFetch('/seguridad/roles', { method: 'POST', body: JSON.stringify(data) }),
    actualizarRol: async (id: number, data: unknown) =>
      apiFetch(`/seguridad/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminarRol: async (id: number) =>
      apiFetch(`/seguridad/roles/${id}`, { method: 'DELETE' })
  }

  // ── Configuración ─────────────────────────────────────────
  // @ts-ignore
  window.configuracion = {
    getEmisor: async () => apiFetch('/configuracion/emisor'),
    guardarEmisor: async (data: unknown) =>
      apiFetch('/configuracion/emisor', { method: 'POST', body: JSON.stringify(data) }),
    guardarCredencialesMH: async (data: unknown) =>
      apiFetch('/configuracion/credenciales-mh', { method: 'POST', body: JSON.stringify(data) }),
    toggleSimulacion: async (activar: boolean) =>
      apiFetch('/configuracion/simulacion/toggle', { method: 'POST', body: JSON.stringify({ activar }) }),
    activarModoSimulacion: async () =>
      apiFetch('/configuracion/simulacion/activar', { method: 'POST' }),
    listarSucursales: async () => apiFetch('/configuracion/sucursales'),
    guardarSucursal: async (data: unknown) =>
      apiFetch('/configuracion/sucursales', { method: 'POST', body: JSON.stringify(data) }),
    desactivarSucursal: async (id: number) =>
      apiFetch(`/configuracion/sucursales/${id}`, { method: 'DELETE' })
  }

  // ── Sucursales ────────────────────────────────────────────
  // @ts-ignore
  window.sucursales = {
    listar: async () => apiFetch('/configuracion/sucursales'),
    getEmisor: async () => apiFetch('/configuracion/emisor')
  }

  // ── Clientes ──────────────────────────────────────────────
  // @ts-ignore
  window.clients = {
    buscar: async (query: string) =>
      apiFetch(`/clientes/buscar?query=${encodeURIComponent(query)}`),
    listar: async (page?: number, pageSize?: number, busqueda?: string, tipoDocumento?: string) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 20) })
      if (busqueda) params.set('busqueda', busqueda)
      if (tipoDocumento) params.set('tipoDocumento', tipoDocumento)
      return apiFetch(`/clientes?${params}`)
    },
    getById: async (id: number) => apiFetch(`/clientes/${id}`),
    crear: async (data: unknown) =>
      apiFetch('/clientes', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: async (id: number, data: unknown) =>
      apiFetch(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    desactivar: async (id: number) =>
      apiFetch(`/clientes/${id}`, { method: 'DELETE' })
  }

  // ── Proveedores ───────────────────────────────────────────
  // @ts-ignore
  window.proveedores = {
    buscar: async (query: string) =>
      apiFetch(`/proveedores/buscar?query=${encodeURIComponent(query)}`),
    listar: async (page?: number, pageSize?: number, busqueda?: string, tipoProveedor?: string) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 20) })
      if (busqueda) params.set('busqueda', busqueda)
      if (tipoProveedor) params.set('tipoProveedor', tipoProveedor)
      return apiFetch(`/proveedores?${params}`)
    },
    getById: async (id: number) => apiFetch(`/proveedores/${id}`),
    crear: async (data: unknown) =>
      apiFetch('/proveedores', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: async (id: number, data: unknown) =>
      apiFetch(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    desactivar: async (id: number) =>
      apiFetch(`/proveedores/${id}`, { method: 'DELETE' })
  }

  // ── Empleados ─────────────────────────────────────────────
  // @ts-ignore
  window.empleados = {
    listar: async (page?: number, pageSize?: number, busqueda?: string, cargo?: string) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 20) })
      if (busqueda) params.set('busqueda', busqueda)
      if (cargo) params.set('cargo', cargo)
      return apiFetch(`/empleados?${params}`)
    },
    getById: async (id: number) => apiFetch(`/empleados/${id}`),
    crear: async (data: unknown) =>
      apiFetch('/empleados', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: async (id: number, data: unknown) =>
      apiFetch(`/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    desactivar: async (id: number) =>
      apiFetch(`/empleados/${id}`, { method: 'DELETE' })
  }

  // ── Productos ─────────────────────────────────────────────
  // @ts-ignore
  window.products = {
    buscar: async (query: string) =>
      apiFetch(`/productos/buscar?query=${encodeURIComponent(query)}`),
    listar: async (page?: number, pageSize?: number, busqueda?: string, categoriaId?: number, soloStockBajo?: boolean) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 20) })
      if (busqueda) params.set('busqueda', busqueda)
      if (categoriaId) params.set('categoriaId', String(categoriaId))
      if (soloStockBajo) params.set('soloStockBajo', 'true')
      return apiFetch(`/productos?${params}`)
    },
    getById: async (id: number) => apiFetch(`/productos/${id}`),
    crear: async (data: unknown) =>
      apiFetch('/productos', { method: 'POST', body: JSON.stringify(data) }),
    actualizar: async (id: number, data: unknown) =>
      apiFetch(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    desactivar: async (id: number) =>
      apiFetch(`/productos/${id}`, { method: 'DELETE' }),
    listarCategorias: async () => apiFetch('/productos/categorias'),
    crearCategoria: async (nombre: string) =>
      apiFetch('/productos/categorias', { method: 'POST', body: JSON.stringify({ nombre }) }),
    getResumenInventario: async () => apiFetch('/productos/resumen'),
    ajustarStock: async (id: number, data: unknown) =>
      apiFetch(`/productos/${id}/ajustar-stock`, { method: 'POST', body: JSON.stringify(data) }),
    getKardex: async (id: number, page?: number, pageSize?: number) =>
      apiFetch(`/productos/${id}/kardex?page=${page ?? 1}&pageSize=${pageSize ?? 30}`),
    getKardexGeneral: async (page?: number, pageSize?: number, productoId?: number) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 30) })
      if (productoId) params.set('productoId', String(productoId))
      return apiFetch(`/productos/kardex/general?${params}`)
    }
  }

  // ── Compras ───────────────────────────────────────────────
  // @ts-ignore
  window.compras = {
    listar: async (page?: number, pageSize?: number, busqueda?: string, proveedorId?: number) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 20) })
      if (busqueda) params.set('busqueda', busqueda)
      if (proveedorId) params.set('proveedorId', String(proveedorId))
      return apiFetch(`/compras?${params}`)
    },
    getById: async (id: number) => apiFetch(`/compras/${id}`),
    crear: async (data: unknown) =>
      apiFetch('/compras', { method: 'POST', body: JSON.stringify(data) }),
    anular: async (id: number, motivo: string) =>
      apiFetch(`/compras/${id}/anular`, { method: 'POST', body: JSON.stringify({ motivo }) })
  }

  // ── Facturación ───────────────────────────────────────────
  // @ts-ignore
  window.billing = {
    emitir: async (data: unknown) =>
      apiFetch('/billing/emitir', { method: 'POST', body: JSON.stringify(data) }),
    listar: async (filtros: any) => {
      const params = new URLSearchParams({ page: String(filtros.page ?? 1), pageSize: String(filtros.pageSize ?? 20) })
      if (filtros.tipoDte) params.set('tipoDte', filtros.tipoDte)
      if (filtros.estado) params.set('estado', filtros.estado)
      if (filtros.desde) params.set('desde', filtros.desde)
      if (filtros.hasta) params.set('hasta', filtros.hasta)
      if (filtros.clienteId) params.set('clienteId', String(filtros.clienteId))
      return apiFetch(`/billing?${params}`)
    },
    getById: async (id: number) => apiFetch(`/billing/${id}`),
    reenviar: async (id: number) =>
      apiFetch(`/billing/${id}/reenviar`, { method: 'POST' }),
    invalidar: async (data: any) =>
      apiFetch(`/billing/${data.facturaId}/invalidar`, { method: 'POST', body: JSON.stringify(data) }),
    verificarCertificado: async (certFileName: string, certPassword: string) =>
      apiFetch('/billing/cert/verificar', { method: 'POST', body: JSON.stringify({ certFileName, certPassword }) }),
    listCertificados: async () => apiFetch('/billing/cert/listar')
  }

  // ── CxC / CxP / Pagos ─────────────────────────────────────
  // @ts-ignore
  window.cxc = {
    listar: async () => apiFetch('/cxc'),
    resumen: async () => apiFetch('/cxc/resumen')
  }
  // @ts-ignore
  window.cxp = {
    listar: async () => apiFetch('/cxp'),
    resumen: async () => apiFetch('/cxp/resumen')
  }
  // @ts-ignore
  window.pagos = {
    registrar: async (data: unknown) =>
      apiFetch('/pagos', { method: 'POST', body: JSON.stringify(data) }),
    historial: async (facturaId: number) =>
      apiFetch(`/pagos/historial/${facturaId}`),
    anular: async (id: number) =>
      apiFetch(`/pagos/${id}`, { method: 'DELETE' }),
    registrarCxP: async (data: unknown) =>
      apiFetch('/pagos/cxp', { method: 'POST', body: JSON.stringify(data) }),
    historialCxP: async (compraId: number) =>
      apiFetch(`/pagos/cxp/historial/${compraId}`),
    anularCxP: async (id: number) =>
      apiFetch(`/pagos/cxp/${id}`, { method: 'DELETE' })
  }

  // ── Reportes ──────────────────────────────────────────────
  // @ts-ignore
  window.reportes = {
    libroVentas: async (desde: string, hasta: string) =>
      apiFetch(`/reportes/ventas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`),
    libroCompras: async (desde: string, hasta: string) =>
      apiFetch(`/reportes/compras?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`),
    rentabilidad: async () => apiFetch('/reportes/rentabilidad'),
    resumenF07: async (mes: string) => apiFetch(`/reportes/f07/${mes}`),
    cxcVencidas: async () => apiFetch('/reportes/cxc-vencidas')
  }

  // ── Analytics ─────────────────────────────────────────────
  // @ts-ignore
  window.analytics = {
    ventasPorDia: async () => apiFetch('/analytics/ventas/dias/7'),
    topProductos: async () => apiFetch('/analytics/productos/top/10'),
    ventasVsCompras: async () => apiFetch('/analytics/ventas-compras/meses/6'),
    distribucionTipo: async () => apiFetch('/analytics/documentos/distribucion'),
    kpiResumen: async () => apiFetch('/analytics/kpi'),
    utilidadReal: async () => apiFetch('/analytics/utilidad-real/6')
  }

  // ── Gastos ────────────────────────────────────────────────
  // @ts-ignore
  window.gastos = {
    listarCategorias: async () => apiFetch('/gastos/categorias'),
    crearCategoria: async (data: unknown) =>
      apiFetch('/gastos/categorias', { method: 'POST', body: JSON.stringify(data) }),
    editarCategoria: async (id: number, data: unknown) =>
      apiFetch(`/gastos/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminarCategoria: async (id: number) =>
      apiFetch(`/gastos/categorias/${id}`, { method: 'DELETE' }),
    listar: async (page?: number, pageSize?: number, categoriaId?: number, desde?: string, hasta?: string) => {
      const params = new URLSearchParams({ page: String(page ?? 1), pageSize: String(pageSize ?? 20) })
      if (categoriaId) params.set('categoriaId', String(categoriaId))
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      return apiFetch(`/gastos?${params}`)
    },
    crear: async (data: unknown) =>
      apiFetch('/gastos', { method: 'POST', body: JSON.stringify(data) }),
    editar: async (id: number, data: unknown) =>
      apiFetch(`/gastos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminar: async (id: number) =>
      apiFetch(`/gastos/${id}`, { method: 'DELETE' }),
    resumenPorCategoria: async (mes: number, anio: number) =>
      apiFetch(`/gastos/resumen/${mes}/${anio}`)
  }

  // ── Planilla ──────────────────────────────────────────────
  // @ts-ignore
  window.planilla = {
    getConfig: async () => apiFetch('/planilla/config'),
    updateConfig: async (items: unknown) =>
      apiFetch('/planilla/config', { method: 'PUT', body: JSON.stringify(items) }),
    seedConfig: async () => apiFetch('/planilla/config/seed', { method: 'POST' }),
    listar: async (page?: number, pageSize?: number) =>
      apiFetch(`/planilla?page=${page ?? 1}&pageSize=${pageSize ?? 20}`),
    getById: async (id: number) => apiFetch(`/planilla/${id}`),
    generar: async (periodo: string, tipoPago?: string) =>
      apiFetch('/planilla/generar', { method: 'POST', body: JSON.stringify({ periodo, tipoPago: tipoPago ?? 'MENSUAL' }) }),
    aprobar: async (id: number) =>
      apiFetch(`/planilla/${id}/aprobar`, { method: 'POST' }),
    eliminar: async (id: number) =>
      apiFetch(`/planilla/${id}`, { method: 'DELETE' }),
    getBoleta: async (planillaId: number, empleadoId: number) =>
      apiFetch(`/planilla/${planillaId}/boleta/${empleadoId}`),
    constanciaSalarial: async (empleadoId: number, meses?: number) =>
      apiFetch(`/planilla/empleado/${empleadoId}/constancia?meses=${meses ?? 6}`),
    aguinaldo: async (anio?: number, otorgarCompleto?: boolean) => {
      const params = new URLSearchParams({ otorgarCompleto: otorgarCompleto ? 'true' : 'false' })
      if (anio) params.set('anio', String(anio))
      return apiFetch(`/planilla/calcular/aguinaldo?${params}`)
    },
    vacaciones: async () => apiFetch('/planilla/calcular/vacaciones'),
    quincena25: async (anio?: number) => {
      const params = anio ? `?anio=${anio}` : ''
      return apiFetch(`/planilla/calcular/quincena25${params}`)
    }
  }

  // ── Notificaciones (no aplica en web) ─────────────────────
  // @ts-ignore
  window.notifications = {
    checkAndFire: async () => ({ fired: [] })
  }

  // ── Documentos (no aplica en web) ─────────────────────────
  // @ts-ignore
  window.documentos = {
    leerJson: async (_c: string) => null,
    leerPlantilla: async (_t: string) => null,
    listarJson: async () => []
  }
}
