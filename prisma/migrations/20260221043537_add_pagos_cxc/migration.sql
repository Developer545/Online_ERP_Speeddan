-- CreateTable
CREATE TABLE "PagoCxC" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoCxC_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PagoCxC" ADD CONSTRAINT "PagoCxC_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
