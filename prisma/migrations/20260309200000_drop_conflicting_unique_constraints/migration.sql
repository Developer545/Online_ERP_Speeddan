-- ══════════════════════════════════════════════════════════
-- Migración: Eliminar constraints únicos incompatibles con multi-tenancy
-- Fecha: 2026-03-09
-- 
-- La BD de Neon tiene constraints UNIQUE individuales en campos
-- que en multi-tenancy deben ser únicos solo por empresa.
-- Esta migración los elimina de forma segura.
-- ══════════════════════════════════════════════════════════

-- ── Emisor: eliminar unique en nit (puede tener mismo NIT distintas empresas) ──
ALTER TABLE "Emisor" DROP CONSTRAINT IF EXISTS "Emisor_nit_key";
ALTER TABLE "Emisor" DROP CONSTRAINT IF EXISTS "emisor_nit_key";

-- ── Emisor: eliminar unique en nrc ──
ALTER TABLE "Emisor" DROP CONSTRAINT IF EXISTS "Emisor_nrc_key";
ALTER TABLE "Emisor" DROP CONSTRAINT IF EXISTS "emisor_nrc_key";

-- ── Emisor: eliminar unique en licenseKey si causa problemas (mantener si existe) ──
-- (licenseKey SÍ debe ser único — no lo eliminamos)

-- ── Role: eliminar unique simple en nombre ──
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_nombre_key";
ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "role_nombre_key";

-- ── Asegurar que el índice compuesto correcto existe ──
-- Role: unique por (empresaId, nombre)
CREATE UNIQUE INDEX IF NOT EXISTS "Role_empresaId_nombre_key"
  ON "Role" ("empresaId", "nombre");
