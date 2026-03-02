-- ══════════════════════════════════════════════════════
-- Tablas faltantes: CategoriaGasto, GastoInterno,
--                   ConfigPlanilla, Planilla,
--                   DetallePlanilla, AppConfig
-- ══════════════════════════════════════════════════════

-- CreateTable: CategoriaGasto
CREATE TABLE IF NOT EXISTS "CategoriaGasto" (
    "id"          SERIAL        NOT NULL,
    "nombre"      TEXT          NOT NULL,
    "descripcion" TEXT,
    "color"       TEXT          DEFAULT '#1890ff',
    "activo"      BOOLEAN       NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "CategoriaGasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GastoInterno
CREATE TABLE IF NOT EXISTS "GastoInterno" (
    "id"          SERIAL        NOT NULL,
    "categoriaId" INTEGER       NOT NULL,
    "fecha"       TIMESTAMP(3)  NOT NULL,
    "monto"       DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT          NOT NULL,
    "notas"       TEXT,
    "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "GastoInterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConfigPlanilla
CREATE TABLE IF NOT EXISTS "ConfigPlanilla" (
    "id"          SERIAL        NOT NULL,
    "clave"       TEXT          NOT NULL,
    "valor"       DECIMAL(65,30) NOT NULL,
    "descripcion" TEXT,
    "topeMaximo"  DECIMAL(65,30),
    "updatedAt"   TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "ConfigPlanilla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ConfigPlanilla.clave unique
CREATE UNIQUE INDEX IF NOT EXISTS "ConfigPlanilla_clave_key" ON "ConfigPlanilla"("clave");

-- CreateTable: Planilla
CREATE TABLE IF NOT EXISTS "Planilla" (
    "id"               SERIAL        NOT NULL,
    "periodo"          TEXT          NOT NULL,
    "tipoPago"         TEXT          NOT NULL DEFAULT 'MENSUAL',
    "estado"           TEXT          NOT NULL DEFAULT 'BORRADOR',
    "totalBruto"       DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalISS"         DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAFP"         DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalRenta"       DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDeducciones" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalNeto"        DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPatronalISS" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPatronalAFP" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalINSAFORP"    DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notas"            TEXT,
    "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "Planilla_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Planilla unique period+tipoPago
CREATE UNIQUE INDEX IF NOT EXISTS "Planilla_periodo_tipoPago_key" ON "Planilla"("periodo", "tipoPago");

-- CreateTable: DetallePlanilla
CREATE TABLE IF NOT EXISTS "DetallePlanilla" (
    "id"               SERIAL        NOT NULL,
    "planillaId"       INTEGER       NOT NULL,
    "empleadoId"       INTEGER       NOT NULL,
    "nombre"           TEXT          NOT NULL,
    "cargo"            TEXT,
    "salarioBruto"     DECIMAL(65,30) NOT NULL,
    "isss"             DECIMAL(65,30) NOT NULL DEFAULT 0,
    "afp"              DECIMAL(65,30) NOT NULL DEFAULT 0,
    "renta"            DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otrasDeducciones" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDeducciones" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "salarioNeto"      DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isssPatronal"     DECIMAL(65,30) NOT NULL DEFAULT 0,
    "afpPatronal"      DECIMAL(65,30) NOT NULL DEFAULT 0,
    "insaforp"         DECIMAL(65,30) NOT NULL DEFAULT 0,
    CONSTRAINT "DetallePlanilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AppConfig
CREATE TABLE IF NOT EXISTS "AppConfig" (
    "id"        SERIAL        NOT NULL,
    "clave"     TEXT          NOT NULL,
    "valor"     TEXT,
    "updatedAt" TIMESTAMP(3)  NOT NULL,
    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AppConfig.clave unique
CREATE UNIQUE INDEX IF NOT EXISTS "AppConfig_clave_key" ON "AppConfig"("clave");

-- AddForeignKey: GastoInterno → CategoriaGasto
ALTER TABLE "GastoInterno"
    ADD CONSTRAINT "GastoInterno_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "CategoriaGasto"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DetallePlanilla → Planilla
ALTER TABLE "DetallePlanilla"
    ADD CONSTRAINT "DetallePlanilla_planillaId_fkey"
    FOREIGN KEY ("planillaId") REFERENCES "Planilla"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix: Compra.tipoCompra existe en schema.prisma pero faltaba en migraciones
ALTER TABLE "Compra" ADD COLUMN IF NOT EXISTS "tipoCompra" TEXT NOT NULL DEFAULT 'PRODUCTO';

-- Fix: DetalleCompra.productoId debe ser nullable (compras de servicios no tienen producto)
ALTER TABLE "DetalleCompra" ALTER COLUMN "productoId" DROP NOT NULL;
