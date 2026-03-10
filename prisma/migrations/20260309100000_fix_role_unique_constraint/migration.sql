-- ══════════════════════════════════════════════════════════
-- Migración: Corregir unique constraint en Role.nombre
-- El constraint original era UNIQUE(nombre) sin empresaId.
-- Debe ser UNIQUE(empresaId, nombre) para soportar multi-tenancy.
-- ══════════════════════════════════════════════════════════

-- Eliminar el constraint antiguo de unicidad simple en nombre (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = '"Role"'::regclass
      AND conname IN ('Role_nombre_key', 'role_nombre_key', 'Role_nombre_idx')
      AND contype = 'u'
  ) THEN
    ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_nombre_key";
    ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "role_nombre_key";
    ALTER TABLE "Role" DROP CONSTRAINT IF EXISTS "Role_nombre_idx";
  END IF;
END $$;

-- Asegurar que existe el índice compuesto (empresaId, nombre)
-- Este es el que el schema de Prisma define en @@unique([empresaId, nombre])
CREATE UNIQUE INDEX IF NOT EXISTS "Role_empresaId_nombre_key"
  ON "Role" ("empresaId", "nombre");

-- Para roles sin empresa (desktop): índice parcial que permite múltiples registros con nombre igual si empresaId es null
-- (PostgreSQL: NULL != NULL en UNIQUE, así que esto ya funciona naturalmente)
