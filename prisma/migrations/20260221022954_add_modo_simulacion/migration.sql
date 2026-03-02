/*
  Warnings:

  - You are about to drop the column `nroDocumento` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `costoUnit` on the `DetalleCompra` table. All the data in the column will be lost.
  - You are about to drop the column `precioUni` on the `DetalleFactura` table. All the data in the column will be lost.
  - You are about to drop the column `afp` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `apellidos` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `complemento` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `isss` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `nombres` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `fecEmi` on the `Factura` table. All the data in the column will be lost.
  - You are about to drop the column `complemento` on the `Proveedor` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `usuario` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numeroDocumento` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costoUnitario` to the `DetalleCompra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioUnitario` to the `DetalleFactura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Empleado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fechaEmision` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_proveedorId_fkey";

-- DropIndex
DROP INDEX "User_usuario_key";

-- AlterTable
ALTER TABLE "Compra" DROP COLUMN "nroDocumento",
ADD COLUMN     "condicionPago" TEXT NOT NULL DEFAULT 'CONTADO',
ADD COLUMN     "numeroDocumento" TEXT NOT NULL,
ALTER COLUMN "proveedorId" DROP NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'REGISTRADA';

-- AlterTable
ALTER TABLE "DetalleCompra" DROP COLUMN "costoUnit",
ADD COLUMN     "costoUnitario" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "descripcion" TEXT;

-- AlterTable
ALTER TABLE "DetalleFactura" DROP COLUMN "precioUni",
ADD COLUMN     "esGravado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "precioUnitario" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "Emisor" ADD COLUMN     "modoSimulacion" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Empleado" DROP COLUMN "afp",
DROP COLUMN "apellidos",
DROP COLUMN "complemento",
DROP COLUMN "isss",
DROP COLUMN "nombres",
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "nombre" TEXT NOT NULL,
ALTER COLUMN "dui" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Factura" DROP COLUMN "fecEmi",
ADD COLUMN     "fechaEmision" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nombreReceptor" TEXT;

-- AlterTable
ALTER TABLE "Proveedor" DROP COLUMN "complemento",
ADD COLUMN     "contacto" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "plazoCredito" INTEGER DEFAULT 0,
ADD COLUMN     "tipoProveedor" TEXT DEFAULT 'NACIONAL';

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "permisos" SET DEFAULT '[]',
ALTER COLUMN "permisos" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "usuario",
ADD COLUMN     "colorCustom" TEXT,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "tema" TEXT NOT NULL DEFAULT 'ocean-blue',
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
