// ══════════════════════════════════════════════════════════
// CLIENTE PRISMA — INSTANCIA LAZY
// Se crea en el PRIMER uso, no al importar el módulo.
// La URL se pasa explícitamente via setDatabaseUrl() para
// evitar que PrismaClient lea un process.env stale.
// ══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'

let _client: PrismaClient | null = null
let _databaseUrl: string | undefined

/** Fijar la URL que usará PrismaClient al crearse. Llamar ANTES del primer uso. */
export function setDatabaseUrl(url: string): void {
  _databaseUrl = url
}

function createClient(): PrismaClient {
  const url = _databaseUrl || process.env['DATABASE_URL']
  console.log('[prisma] Creando PrismaClient, URL =', url?.replace(/:[^@]+@/, ':***@'))
  return new PrismaClient({
    log: ['error'],
    datasources: url ? { db: { url } } : undefined
  })
}

// Proxy transparente: el resto del código usa `prisma.user.findMany()`
// exactamente igual, pero el cliente se crea en el primer acceso real.
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
 * Seguro para llamar a nivel de módulo: `const db = getPrismaClient()`
 * El PrismaClient real se creará en el primer acceso a propiedad
 * (p.ej. db.user.findMany()), cuando setDatabaseUrl() ya habrá sido llamado.
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
