-- ══════════════════════════════════════════════════════════
-- MIGRACIÓN: Multi-tenancy con empresa_id (Shared Database)
-- Fecha: 2026-03-02
-- Descripción: Agrega empresa_id a 13 tablas raíz para aislar
--   datos entre empresas en la versión online (Vercel + Neon).
--   Datos existentes conservan empresa_id = NULL (compatible
--   con instalaciones desktop que tienen DB propia).
-- ══════════════════════════════════════════════════════════

-- 1. Agregar licenseKey a Emisor (mapeo license_key → empresa)
ALTER TABLE "Emisor" ADD COLUMN IF NOT EXISTS "licenseKey" TEXT;
ALTER TABLE "Emisor" ADD COLUMN IF NOT EXISTS "simulada" BOOLEAN DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "Emisor_licenseKey_key" ON "Emisor"("licenseKey");

-- 2. Agregar empresa_id a las tablas raíz
-- Role
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Role" ADD CONSTRAINT "Role_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID; -- NOT VALID: no valida registros existentes (NULL)
ALTER TABLE "Role" VALIDATE CONSTRAINT "Role_empresaId_fkey";

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "User" ADD CONSTRAINT "User_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "User" VALIDATE CONSTRAINT "User_empresaId_fkey";

-- Cliente
ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Cliente" VALIDATE CONSTRAINT "Cliente_empresaId_fkey";

-- Proveedor
ALTER TABLE "Proveedor" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Proveedor" VALIDATE CONSTRAINT "Proveedor_empresaId_fkey";

-- Empleado
ALTER TABLE "Empleado" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Empleado" VALIDATE CONSTRAINT "Empleado_empresaId_fkey";

-- Categoria
ALTER TABLE "Categoria" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Categoria" VALIDATE CONSTRAINT "Categoria_empresaId_fkey";

-- Producto
ALTER TABLE "Producto" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Producto" VALIDATE CONSTRAINT "Producto_empresaId_fkey";

-- Compra
ALTER TABLE "Compra" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Compra" VALIDATE CONSTRAINT "Compra_empresaId_fkey";

-- Factura
ALTER TABLE "Factura" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Factura" ADD COLUMN IF NOT EXISTS "simulada" BOOLEAN DEFAULT false;
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Factura" VALIDATE CONSTRAINT "Factura_empresaId_fkey";

-- CategoriaGasto
ALTER TABLE "CategoriaGasto" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "CategoriaGasto" ADD CONSTRAINT "CategoriaGasto_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "CategoriaGasto" VALIDATE CONSTRAINT "CategoriaGasto_empresaId_fkey";

-- Planilla
ALTER TABLE "Planilla" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "Planilla" ADD CONSTRAINT "Planilla_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "Planilla" VALIDATE CONSTRAINT "Planilla_empresaId_fkey";

-- ConfigPlanilla
ALTER TABLE "ConfigPlanilla" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "ConfigPlanilla" ADD CONSTRAINT "ConfigPlanilla_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "ConfigPlanilla" VALIDATE CONSTRAINT "ConfigPlanilla_empresaId_fkey";

-- AppConfig
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "empresaId" INTEGER;
ALTER TABLE "AppConfig" ADD CONSTRAINT "AppConfig_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
ALTER TABLE "AppConfig" VALIDATE CONSTRAINT "AppConfig_empresaId_fkey";

-- 3. Eliminar constraints únicos globales
ALTER TABLE "Role"     DROP CONSTRAINT IF EXISTS "Role_nombre_key";
ALTER TABLE "User"     DROP CONSTRAINT IF EXISTS "User_username_key";
ALTER TABLE "Categoria" DROP CONSTRAINT IF EXISTS "Categoria_nombre_key";
ALTER TABLE "Producto"  DROP CONSTRAINT IF EXISTS "Producto_codigo_key";
ALTER TABLE "Proveedor" DROP CONSTRAINT IF EXISTS "Proveedor_nit_key";
ALTER TABLE "Empleado"  DROP CONSTRAINT IF EXISTS "Empleado_dui_key";
ALTER TABLE "ConfigPlanilla" DROP CONSTRAINT IF EXISTS "ConfigPlanilla_clave_key";
ALTER TABLE "AppConfig"      DROP CONSTRAINT IF EXISTS "AppConfig_clave_key";
ALTER TABLE "Planilla"       DROP CONSTRAINT IF EXISTS "Planilla_periodo_tipoPago_key";
ALTER TABLE "Cliente"        DROP CONSTRAINT IF EXISTS "Cliente_tipoDocumento_numDocumento_key";

-- 4. Crear constraints únicos compuestos por empresa
-- (NULL != NULL en PostgreSQL, por lo que los registros de desktop
-- con empresaId = NULL no entran en conflicto entre sí)
CREATE UNIQUE INDEX IF NOT EXISTS "Role_empresaId_nombre_key"
  ON "Role"("empresaId", "nombre");

CREATE UNIQUE INDEX IF NOT EXISTS "User_empresaId_username_key"
  ON "User"("empresaId", "username");

CREATE UNIQUE INDEX IF NOT EXISTS "Categoria_empresaId_nombre_key"
  ON "Categoria"("empresaId", "nombre");

CREATE UNIQUE INDEX IF NOT EXISTS "Producto_empresaId_codigo_key"
  ON "Producto"("empresaId", "codigo");

CREATE UNIQUE INDEX IF NOT EXISTS "Proveedor_empresaId_nit_key"
  ON "Proveedor"("empresaId", "nit");

CREATE UNIQUE INDEX IF NOT EXISTS "Empleado_empresaId_dui_key"
  ON "Empleado"("empresaId", "dui");

CREATE UNIQUE INDEX IF NOT EXISTS "ConfigPlanilla_empresaId_clave_key"
  ON "ConfigPlanilla"("empresaId", "clave");

CREATE UNIQUE INDEX IF NOT EXISTS "AppConfig_empresaId_clave_key"
  ON "AppConfig"("empresaId", "clave");

CREATE UNIQUE INDEX IF NOT EXISTS "Planilla_empresaId_periodo_tipoPago_key"
  ON "Planilla"("empresaId", "periodo", "tipoPago");

CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_empresaId_tipoDocumento_numDocumento_key"
  ON "Cliente"("empresaId", "tipoDocumento", "numDocumento");

-- 5. Índices de performance por empresa
CREATE INDEX IF NOT EXISTS "Role_empresaId_idx"          ON "Role"("empresaId");
CREATE INDEX IF NOT EXISTS "User_empresaId_idx"          ON "User"("empresaId");
CREATE INDEX IF NOT EXISTS "Cliente_empresaId_idx"       ON "Cliente"("empresaId");
CREATE INDEX IF NOT EXISTS "Proveedor_empresaId_idx"     ON "Proveedor"("empresaId");
CREATE INDEX IF NOT EXISTS "Empleado_empresaId_idx"      ON "Empleado"("empresaId");
CREATE INDEX IF NOT EXISTS "Categoria_empresaId_idx"     ON "Categoria"("empresaId");
CREATE INDEX IF NOT EXISTS "Producto_empresaId_idx"      ON "Producto"("empresaId");
CREATE INDEX IF NOT EXISTS "Compra_empresaId_idx"        ON "Compra"("empresaId");
CREATE INDEX IF NOT EXISTS "Factura_empresaId_idx"       ON "Factura"("empresaId");
CREATE INDEX IF NOT EXISTS "CategoriaGasto_empresaId_idx" ON "CategoriaGasto"("empresaId");
CREATE INDEX IF NOT EXISTS "Planilla_empresaId_idx"      ON "Planilla"("empresaId");
CREATE INDEX IF NOT EXISTS "ConfigPlanilla_empresaId_idx" ON "ConfigPlanilla"("empresaId");
CREATE INDEX IF NOT EXISTS "AppConfig_empresaId_idx"     ON "AppConfig"("empresaId");
