// ══════════════════════════════════════════════════════════
// TENANT CONTEXT — AsyncLocalStorage
// Propaga el empresaId del JWT a través de todo el stack HTTP
// sin necesidad de pasar parámetros manualmente entre funciones.
//
// Uso en Express:
//   runWithEmpresa(empresaId, next)  ← middleware de auth
//   getEmpresaId()                   ← en cualquier punto del stack
//
// En Electron (IPC): getStore() → undefined → getEmpresaId() → null
// El Prisma middleware no aplica filtros cuando empresaId === null.
// ══════════════════════════════════════════════════════════

import { AsyncLocalStorage } from 'async_hooks'

interface TenantStore {
  empresaId: number
}

const tenantStorage = new AsyncLocalStorage<TenantStore>()

/**
 * Lee el empresaId del contexto del request actual.
 * Retorna null si no hay contexto (Electron, tests, etc.).
 */
export function getEmpresaId(): number | null {
  return tenantStorage.getStore()?.empresaId ?? null
}

/**
 * Ejecuta fn dentro del contexto de una empresa.
 * Llamar desde el middleware de autenticación:
 *   runWithEmpresa(payload.empresaId, next)
 */
export function runWithEmpresa<T>(empresaId: number, fn: () => T): T {
  return tenantStorage.run({ empresaId }, fn)
}
