-- Migration: add_modulo_contable
-- Módulo de Contabilidad completo para Speeddansys ERP

-- Enums
CREATE TYPE "TipoCuenta" AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'COSTO', 'GASTO', 'CIERRE', 'ORDEN_DEUDORA', 'ORDEN_ACREEDORA');
CREATE TYPE "NaturalezaCuenta" AS ENUM ('DEUDORA', 'ACREEDORA');
CREATE TYPE "EstadoPeriodo" AS ENUM ('ABIERTO', 'CERRADO');
CREATE TYPE "TipoAsiento" AS ENUM ('DIARIO', 'AJUSTE', 'CIERRE', 'APERTURA');
CREATE TYPE "EstadoAsiento" AS ENUM ('BORRADOR', 'APROBADO', 'ANULADO');

-- Catálogo de Cuentas
CREATE TABLE "CatalogoCuenta" (
    "id" SERIAL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoCuenta" NOT NULL,
    "naturaleza" "NaturalezaCuenta" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "cuentaPadreId" INTEGER,
    "aceptaMovimiento" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "empresaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogoCuenta_cuentaPadreId_fkey" FOREIGN KEY ("cuentaPadreId") REFERENCES "CatalogoCuenta"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CatalogoCuenta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CatalogoCuenta_empresaId_codigo_key" ON "CatalogoCuenta"("empresaId", "codigo");
CREATE INDEX "CatalogoCuenta_empresaId_idx" ON "CatalogoCuenta"("empresaId");
CREATE INDEX "CatalogoCuenta_cuentaPadreId_idx" ON "CatalogoCuenta"("cuentaPadreId");

-- Períodos Contables
CREATE TABLE "PeriodoContable" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPeriodo" NOT NULL DEFAULT 'ABIERTO',
    "empresaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PeriodoContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PeriodoContable_empresaId_anio_mes_key" ON "PeriodoContable"("empresaId", "anio", "mes");
CREATE INDEX "PeriodoContable_empresaId_idx" ON "PeriodoContable"("empresaId");

-- Asientos Contables
CREATE TABLE "AsientoContable" (
    "id" SERIAL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "tipo" "TipoAsiento" NOT NULL DEFAULT 'DIARIO',
    "estado" "EstadoAsiento" NOT NULL DEFAULT 'BORRADOR',
    "documentoRef" TEXT,
    "totalDebe" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalHaber" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creadoPor" TEXT,
    "empresaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AsientoContable_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "PeriodoContable"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AsientoContable_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Emisor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AsientoContable_empresaId_idx" ON "AsientoContable"("empresaId");
CREATE INDEX "AsientoContable_periodoId_idx" ON "AsientoContable"("periodoId");
CREATE INDEX "AsientoContable_fecha_idx" ON "AsientoContable"("fecha");

-- Detalle de Asientos
CREATE TABLE "DetalleAsiento" (
    "id" SERIAL PRIMARY KEY,
    "asientoId" INTEGER NOT NULL,
    "cuentaId" INTEGER NOT NULL,
    "descripcion" TEXT,
    "debe" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "haber" DECIMAL(65,30) NOT NULL DEFAULT 0,
    CONSTRAINT "DetalleAsiento_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "AsientoContable"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetalleAsiento_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CatalogoCuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "DetalleAsiento_asientoId_idx" ON "DetalleAsiento"("asientoId");
CREATE INDEX "DetalleAsiento_cuentaId_idx" ON "DetalleAsiento"("cuentaId");

-- Saldos de Cuentas (pre-calculados)
CREATE TABLE "SaldoCuenta" (
    "id" SERIAL PRIMARY KEY,
    "cuentaId" INTEGER NOT NULL,
    "periodoId" INTEGER NOT NULL,
    "saldoAnterior" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "debitos" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "creditos" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldoFinal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "empresaId" INTEGER,
    CONSTRAINT "SaldoCuenta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CatalogoCuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaldoCuenta_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "PeriodoContable"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SaldoCuenta_cuentaId_periodoId_key" ON "SaldoCuenta"("cuentaId", "periodoId");
CREATE INDEX "SaldoCuenta_empresaId_idx" ON "SaldoCuenta"("empresaId");
CREATE INDEX "SaldoCuenta_periodoId_idx" ON "SaldoCuenta"("periodoId");
