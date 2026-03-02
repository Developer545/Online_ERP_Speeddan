-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "permisos" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "correo" TEXT,
    "roleId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emisor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "nit" TEXT NOT NULL,
    "nrc" TEXT NOT NULL,
    "codActividad" TEXT NOT NULL,
    "descActividad" TEXT NOT NULL,
    "tipoEstablecimiento" TEXT NOT NULL,
    "departamentoCod" TEXT NOT NULL,
    "municipioCod" TEXT NOT NULL,
    "complementoDireccion" TEXT NOT NULL,
    "telefono" TEXT,
    "correo" TEXT NOT NULL,
    "mhApiUser" TEXT,
    "mhApiPassword" TEXT,
    "mhAmbiente" TEXT NOT NULL DEFAULT '00',
    "certPath" TEXT,
    "certPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Emisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "emisorId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codMH" TEXT NOT NULL,
    "puntoVenta" TEXT NOT NULL,
    "tipoEstab" TEXT NOT NULL,
    "departamentoCod" TEXT NOT NULL,
    "municipioCod" TEXT NOT NULL,
    "complemento" TEXT NOT NULL,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Correlativo" (
    "id" SERIAL NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "tipoDte" TEXT NOT NULL,
    "anioFiscal" INTEGER NOT NULL,
    "siguiente" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Correlativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numDocumento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "nrc" TEXT,
    "correo" TEXT,
    "telefono" TEXT,
    "departamentoCod" TEXT,
    "municipioCod" TEXT,
    "complemento" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "nrc" TEXT,
    "correo" TEXT,
    "telefono" TEXT,
    "departamentoCod" TEXT,
    "municipioCod" TEXT,
    "complemento" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dui" TEXT NOT NULL,
    "nit" TEXT,
    "isss" TEXT,
    "afp" TEXT,
    "cargo" TEXT,
    "salario" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fechaIngreso" TIMESTAMP(3),
    "departamentoCod" TEXT,
    "municipioCod" TEXT,
    "complemento" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoriaId" INTEGER,
    "uniMedida" INTEGER NOT NULL,
    "precioVenta" DECIMAL(65,30) NOT NULL,
    "costoPromedio" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stockActual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tipoItem" INTEGER NOT NULL DEFAULT 1,
    "codTributo" TEXT,
    "esGravado" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kardex" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "costoUnitario" DECIMAL(65,30) NOT NULL,
    "costoTotal" DECIMAL(65,30) NOT NULL,
    "stockAnterior" DECIMAL(65,30) NOT NULL,
    "stockNuevo" DECIMAL(65,30) NOT NULL,
    "notas" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kardex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" SERIAL NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "nroDocumento" TEXT,
    "tipoDocumento" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "iva" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleCompra" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "costoUnit" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "DetalleCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" SERIAL NOT NULL,
    "tipoDte" TEXT NOT NULL,
    "codigoGeneracion" TEXT NOT NULL,
    "numeroControl" TEXT NOT NULL,
    "ambiente" TEXT NOT NULL,
    "fecEmi" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER,
    "totalNoSuj" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalExenta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalGravada" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subTotal" DECIMAL(65,30) NOT NULL,
    "totalIva" DECIMAL(65,30) NOT NULL,
    "totalDescuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPagar" DECIMAL(65,30) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "selloRecepcion" TEXT,
    "mhEstado" TEXT,
    "mhRespuestaJson" TEXT,
    "mhFechaRecepcion" TIMESTAMP(3),
    "dteJson" TEXT NOT NULL,
    "dteJsonFirmado" TEXT,
    "facturaRelacionadaId" INTEGER,
    "condicionPago" TEXT NOT NULL DEFAULT '1',
    "plazoCredito" INTEGER,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleFactura" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "productoId" INTEGER,
    "numItem" INTEGER NOT NULL,
    "tipoItem" INTEGER NOT NULL,
    "codigo" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,
    "uniMedida" INTEGER NOT NULL,
    "precioUni" DECIMAL(65,30) NOT NULL,
    "descuento" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ventaNoSuj" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ventaExenta" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ventaGravada" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ivaItem" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "DetalleFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invalidacion" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "codigoGeneracion" TEXT NOT NULL,
    "tipoInvalidacion" TEXT NOT NULL,
    "motivoDescripcion" TEXT NOT NULL,
    "nombreResponsable" TEXT NOT NULL,
    "docResponsable" TEXT NOT NULL,
    "nombreSolicita" TEXT NOT NULL,
    "docSolicita" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "selloRecepcion" TEXT,
    "invalidacionJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invalidacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_nombre_key" ON "Role"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Emisor_nit_key" ON "Emisor"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "Emisor_nrc_key" ON "Emisor"("nrc");

-- CreateIndex
CREATE UNIQUE INDEX "Correlativo_sucursalId_tipoDte_anioFiscal_key" ON "Correlativo"("sucursalId", "tipoDte", "anioFiscal");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_tipoDocumento_numDocumento_key" ON "Cliente"("tipoDocumento", "numDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nit_key" ON "Proveedor"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_dui_key" ON "Empleado"("dui");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigo_key" ON "Producto"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_codigoGeneracion_key" ON "Factura"("codigoGeneracion");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numeroControl_key" ON "Factura"("numeroControl");

-- CreateIndex
CREATE UNIQUE INDEX "Invalidacion_facturaId_key" ON "Invalidacion"("facturaId");

-- CreateIndex
CREATE UNIQUE INDEX "Invalidacion_codigoGeneracion_key" ON "Invalidacion"("codigoGeneracion");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "Emisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correlativo" ADD CONSTRAINT "Correlativo_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kardex" ADD CONSTRAINT "Kardex_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCompra" ADD CONSTRAINT "DetalleCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleCompra" ADD CONSTRAINT "DetalleCompra_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_facturaRelacionadaId_fkey" FOREIGN KEY ("facturaRelacionadaId") REFERENCES "Factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleFactura" ADD CONSTRAINT "DetalleFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleFactura" ADD CONSTRAINT "DetalleFactura_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
