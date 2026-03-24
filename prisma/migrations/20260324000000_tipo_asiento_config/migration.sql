-- Migration: tipo_asiento_config
-- Convierte tipo de enum a TEXT y crea tabla de tipos personalizados

-- 1. Tabla de tipos de asiento configurables
CREATE TABLE "TipoAsientoConfig" (
    "id"        SERIAL PRIMARY KEY,
    "nombre"    TEXT NOT NULL,
    "color"     TEXT NOT NULL DEFAULT 'blue',
    "activo"    BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TipoAsientoConfig_empresaId_fkey" FOREIGN KEY ("empresaId")
        REFERENCES "Emisor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TipoAsientoConfig_empresaId_nombre_key" ON "TipoAsientoConfig"("empresaId", "nombre");
CREATE INDEX "TipoAsientoConfig_empresaId_idx" ON "TipoAsientoConfig"("empresaId");

-- 2. Insertar tipos por defecto globales (empresaId NULL = aplica a todos)
INSERT INTO "TipoAsientoConfig" ("nombre", "color", "empresaId") VALUES
    ('DIARIO',   'blue',   NULL),
    ('AJUSTE',   'orange', NULL),
    ('CIERRE',   'red',    NULL),
    ('APERTURA', 'green',  NULL);

-- 3. Cambiar columna tipo de enum a TEXT en AsientoContable
ALTER TABLE "AsientoContable" ALTER COLUMN "tipo" TYPE TEXT USING "tipo"::TEXT;

-- 4. Eliminar enum ya que la columna ahora es TEXT
DROP TYPE "TipoAsiento";
