-- Migration: tipo_asiento_config
-- Convierte tipo de enum a TEXT y crea tabla de tipos personalizados

-- 1. Tabla de tipos de asiento configurables
CREATE TABLE IF NOT EXISTS "TipoAsientoConfig" (
    "id"        SERIAL PRIMARY KEY,
    "nombre"    TEXT NOT NULL,
    "color"     TEXT NOT NULL DEFAULT 'blue',
    "activo"    BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TipoAsientoConfig_empresaId_fkey" FOREIGN KEY ("empresaId")
        REFERENCES "Emisor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TipoAsientoConfig_empresaId_nombre_key" ON "TipoAsientoConfig"("empresaId", "nombre");
CREATE INDEX IF NOT EXISTS "TipoAsientoConfig_empresaId_idx" ON "TipoAsientoConfig"("empresaId");

-- 2. Insertar tipos por defecto solo si no existen
INSERT INTO "TipoAsientoConfig" ("nombre", "color", "empresaId")
SELECT nombre, color, NULL FROM (VALUES
    ('DIARIO',   'blue'),
    ('AJUSTE',   'orange'),
    ('CIERRE',   'red'),
    ('APERTURA', 'green')
) AS v(nombre, color)
WHERE NOT EXISTS (
    SELECT 1 FROM "TipoAsientoConfig" WHERE "empresaId" IS NULL AND "nombre" = v.nombre
);

-- 3. Cambiar columna tipo de enum a TEXT (solo si aún es enum)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'AsientoContable'
          AND column_name = 'tipo'
          AND udt_name = 'TipoAsiento'
    ) THEN
        -- Primero quitar el DEFAULT que depende del enum
        ALTER TABLE "AsientoContable" ALTER COLUMN "tipo" DROP DEFAULT;
        -- Convertir columna de enum a TEXT
        ALTER TABLE "AsientoContable" ALTER COLUMN "tipo" TYPE TEXT USING "tipo"::TEXT;
        -- Restaurar DEFAULT como TEXT
        ALTER TABLE "AsientoContable" ALTER COLUMN "tipo" SET DEFAULT 'DIARIO';
    END IF;
END $$;

-- 4. Eliminar enum si existe (CASCADE para limpiar cualquier dependencia restante)
DROP TYPE IF EXISTS "TipoAsiento" CASCADE;
