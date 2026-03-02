// ══════════════════════════════════════════════════════════
// CLIENTE PRISMA — INSTANCIA LAZY + MIDDLEWARE DE TENANT
//
// El cliente se crea en el PRIMER uso, no al importar el módulo.
// La URL se pasa explícitamente via setDatabaseUrl() para
// evitar que PrismaClient lea un process.env stale.
//
// Middleware de tenant (multi-tenancy):
//   - Solo activo cuando registerTenantResolver() ha sido llamado
//     (lo hace src/server/index.ts al arrancar el servidor Express).
//   - En Electron (IPC), este resolver NUNCA se registra →
//     empresaId = null → el middleware no aplica filtros →
//     los IPC handlers operan globalmente (correcto, cada
//     instalación de desktop tiene su propia DB privada).
// ══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'

let _client: PrismaClient | null = null
let _databaseUrl: string | undefined

// ── Tenant resolver ────────────────────────────────────────
// Función registrada por el servidor Express para leer el
// empresaId del AsyncLocalStorage del request actual.
// null = sin contexto (modo Electron / sin request HTTP).
let _tenantResolver: (() => number | null) | null = null

/**
 * El servidor Express llama esto UNA VEZ al arrancar para enlazar
 * el contexto de empresa con el Prisma middleware.
 * Electron nunca llama esto → todos los queries son globales.
 */
export function registerTenantResolver(fn: () => number | null): void {
  _tenantResolver = fn
}

// ── Modelos que deben filtrarse por empresa ────────────────
// Las tablas "hijo" (DetalleFactura, Kardex, etc.) siempre
// se consultan vía JOIN con su tabla padre, que ya está filtrada.
const TENANT_MODELS = new Set([
  'Role', 'User', 'Cliente', 'Proveedor', 'Empleado',
  'Categoria', 'Producto', 'Compra', 'Factura',
  'CategoriaGasto', 'Planilla', 'ConfigPlanilla', 'AppConfig'
])

// ── Creación del cliente ───────────────────────────────────
/** Fija la URL que usará PrismaClient al crearse. Llamar ANTES del primer uso. */
export function setDatabaseUrl(url: string): void {
  _databaseUrl = url
}

function createClient(): PrismaClient {
  const url = _databaseUrl || process.env['DATABASE_URL']
  console.log('[prisma] Creando PrismaClient, URL =', url?.replace(/:[^@]+@/, ':***@'))

  const client = new PrismaClient({
    log: ['error'],
    datasources: url ? { db: { url } } : undefined
  })

  // ── Middleware de tenant ───────────────────────────────
  // Inyecta WHERE empresa_id = X automáticamente en cada query.
  // No requiere cambios en los controllers — es completamente transparente.
  client.$use(async (params, next) => {
    const empresaId = _tenantResolver?.() ?? null

    // Solo aplicar si hay contexto de empresa (modo web) y el modelo es un tenant model
    if (empresaId !== null && params.model && TENANT_MODELS.has(params.model)) {
      const readOps = [
        'findFirst', 'findFirstOrThrow', 'findMany',
        'findUnique', 'findUniqueOrThrow',
        'count', 'aggregate', 'groupBy'
      ]
      const mutateOps = ['update', 'updateMany', 'delete', 'deleteMany']

      // Lectura: agregar WHERE empresa_id = X
      if (readOps.includes(params.action)) {
        params.args ??= {}
        params.args.where = { ...params.args.where, empresaId }
      }

      // Creación: agregar empresa_id al registro nuevo
      if (params.action === 'create') {
        params.args.data = { ...params.args.data, empresaId }
      }

      // Creación masiva: agregar empresa_id a cada registro
      if (params.action === 'createMany') {
        const d = params.args.data
        params.args.data = Array.isArray(d)
          ? d.map((r: Record<string, unknown>) => ({ ...r, empresaId }))
          : { ...d, empresaId }
      }

      // Modificación/eliminación: asegurar que el WHERE incluya empresa_id
      // (evita que un usuario modifique datos de otra empresa)
      if (mutateOps.includes(params.action)) {
        params.args ??= {}
        params.args.where = { ...params.args.where, empresaId }
      }

      // Upsert: aplicar en where y en create
      if (params.action === 'upsert') {
        params.args.where = { ...params.args.where, empresaId }
        params.args.create = { ...params.args.create, empresaId }
      }
    }

    return next(params)
  })

  return client
}

// ── Proxy transparente ─────────────────────────────────────
// El resto del código usa `prisma.user.findMany()` exactamente igual,
// pero el cliente se crea en el primer acceso real.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_client) _client = createClient()
    const value = (_client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function'
      ? (value as Function).bind(_client)
      : value
  }
})

/**
 * Devuelve el proxy lazy — NO crea el cliente inmediatamente.
 * Seguro para llamar a nivel de módulo.
 */
export function getPrismaClient(): PrismaClient {
  return prisma
}

/** Desconecta y destruye el cliente actual (para cambio de entorno en caliente). */
export async function resetPrismaClient(): Promise<void> {
  if (_client) {
    await _client.$disconnect()
    _client = null
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (_client) await _client.$disconnect()
}
