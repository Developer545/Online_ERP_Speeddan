-- ══════════════════════════════════════════════════════════
-- Migración: Agregar campos de suscripción al modelo Emisor
-- Fecha: 2026-03-09
-- ══════════════════════════════════════════════════════════

-- Campos de plan y suscripción
ALTER TABLE "Emisor" ADD COLUMN IF NOT EXISTS "plan"             TEXT NOT NULL DEFAULT 'emprendedor';
ALTER TABLE "Emisor" ADD COLUMN IF NOT EXISTS "estado"           TEXT NOT NULL DEFAULT 'activa';
ALTER TABLE "Emisor" ADD COLUMN IF NOT EXISTS "fechaVencimiento" TIMESTAMP(3);
ALTER TABLE "Emisor" ADD COLUMN IF NOT EXISTS "modulosActivos"   JSONB NOT NULL DEFAULT '{}';

-- Subdominio único para identificar empresa por URL
ALTER TABLE "Emisor" ADD COLUMN IF NOT EXISTS "subdominio" TEXT;

-- Índice único en subdominio (solo filas no nulas)
CREATE UNIQUE INDEX IF NOT EXISTS "Emisor_subdominio_key"
  ON "Emisor" ("subdominio")
  WHERE "subdominio" IS NOT NULL;
