import { getPrismaClient } from '../database/prisma.client'

const db = getPrismaClient()

// ─── Función auxiliar para serializar productos ─────────
function serializarProducto(producto: any) {
  return {
    ...producto,
    precioVenta: producto.precioVenta ? Number(producto.precioVenta) : 0,
    costoPromedio: producto.costoPromedio ? Number(producto.costoPromedio) : 0,
    stockMinimo: producto.stockMinimo ? Number(producto.stockMinimo) : 0,
    stockActual: producto.stockActual ? Number(producto.stockActual) : 0
  }
}

// Función auxiliar para serializar movimientos de kardex
function serializarKardex(movimiento: any) {
  return {
    ...movimiento,
    cantidad: movimiento.cantidad ? Number(movimiento.cantidad) : 0,
    costoUnitario: movimiento.costoUnitario ? Number(movimiento.costoUnitario) : 0,
    costoTotal: movimiento.costoTotal ? Number(movimiento.costoTotal) : 0,
    stockAnterior: movimiento.stockAnterior ? Number(movimiento.stockAnterior) : 0,
    stockNuevo: movimiento.stockNuevo ? Number(movimiento.stockNuevo) : 0
  }
}

export class ProductsController {

  // ─── Búsqueda rápida (para formulario de factura) ─────
  static async buscar(query: string) {
    if (!query || query.trim().length < 1) return []
    const q = query.trim()
    const productos = await db.producto.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { codigo: { contains: q, mode: 'insensitive' } },
          { descripcion: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { categoria: { select: { nombre: true } } },
      take: 15,
      orderBy: { nombre: 'asc' }
    })
    return productos.map(serializarProducto)
  }

  // ─── Listado paginado con filtros ─────────────────────
  static async listar(
    page = 1,
    pageSize = 20,
    busqueda?: string,
    categoriaId?: number,
    soloStockBajo?: boolean
  ) {
    const skip = (page - 1) * pageSize
    const where: Record<string, unknown> = { activo: true }

    if (categoriaId) where.categoriaId = categoriaId

    if (busqueda && busqueda.trim()) {
      const q = busqueda.trim()
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { codigo: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } }
      ]
    }

    const [productos, total] = await Promise.all([
      db.producto.findMany({
        where,
        include: { categoria: { select: { id: true, nombre: true } } },
        orderBy: { nombre: 'asc' },
        skip,
        take: pageSize
      }),
      db.producto.count({ where })
    ])

    // Filtrar stock bajo en memoria (Prisma no soporta comparación de campo vs campo directamente)
    const lista = soloStockBajo
      ? productos.filter(p => Number(p.stockActual) <= Number(p.stockMinimo))
      : productos

    return { productos: lista.map(serializarProducto), total, page, pageSize }
  }

  static async getById(id: number) {
    const producto = await db.producto.findUnique({
      where: { id },
      include: { categoria: { select: { id: true, nombre: true } } }
    })
    return producto ? serializarProducto(producto) : null
  }

  static async crear(data: {
    codigo: string
    nombre: string
    descripcion?: string
    categoriaId?: number
    uniMedida: number
    precioVenta: number
    costoPromedio?: number
    stockMinimo?: number
    stockActual?: number
    tipoItem?: number
    esGravado?: boolean
  }) {
    const producto = await db.producto.create({ data })
    return serializarProducto(producto)
  }

  static async actualizar(id: number, data: Partial<{
    nombre: string
    descripcion: string
    categoriaId: number
    uniMedida: number
    precioVenta: number
    costoPromedio: number
    stockMinimo: number
    tipoItem: number
    esGravado: boolean
  }>) {
    const producto = await db.producto.update({ where: { id }, data })
    return serializarProducto(producto)
  }

  static async desactivar(id: number) {
    const producto = await db.producto.update({ where: { id }, data: { activo: false } })
    return serializarProducto(producto)
  }

  // ─── Categorías ───────────────────────────────────────
  static async listarCategorias() {
    return db.categoria.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    })
  }

  static async crearCategoria(nombre: string) {
    return db.categoria.create({ data: { nombre } })
  }

  // ─── Ajuste manual de stock (entrada/salida/ajuste) ───
  static async ajustarStock(productoId: number, data: {
    tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
    cantidad: number
    costoUnitario: number
    referencia: string
    notas?: string
  }) {
    const producto = await db.producto.findUnique({ where: { id: productoId } })
    if (!producto) throw new Error('Producto no encontrado')

    const stockAnterior = Number(producto.stockActual)
    const stockNuevo = data.tipoMovimiento === 'SALIDA'
      ? stockAnterior - data.cantidad
      : data.tipoMovimiento === 'AJUSTE'
        ? data.cantidad               // ajuste = valor absoluto
        : stockAnterior + data.cantidad

    if (data.tipoMovimiento === 'SALIDA' && stockNuevo < 0) {
      throw new Error(`Stock insuficiente. Disponible: ${stockAnterior}`)
    }

    const costoTotal = data.cantidad * data.costoUnitario

    // Actualizar costo promedio ponderado en entradas
    let nuevoCostoPromedio = Number(producto.costoPromedio)
    if (data.tipoMovimiento === 'ENTRADA' && data.cantidad > 0) {
      const totalValor = stockAnterior * nuevoCostoPromedio + costoTotal
      const totalUnidades = stockAnterior + data.cantidad
      nuevoCostoPromedio = totalUnidades > 0 ? totalValor / totalUnidades : data.costoUnitario
    }

    const results = await db.$transaction([
      db.producto.update({
        where: { id: productoId },
        data: {
          stockActual: stockNuevo,
          costoPromedio: nuevoCostoPromedio
        }
      }),
      db.kardex.create({
        data: {
          productoId,
          tipoMovimiento: data.tipoMovimiento,
          referencia: data.referencia,
          cantidad: data.cantidad,
          costoUnitario: data.costoUnitario,
          costoTotal,
          stockAnterior,
          stockNuevo,
          notas: data.notas
        }
      })
    ])
    return {
      producto: serializarProducto(results[0]),
      kardex: serializarKardex(results[1])
    }
  }

  // ─── Kardex de un producto ────────────────────────────
  static async getKardex(productoId: number, page = 1, pageSize = 30) {
    const skip = (page - 1) * pageSize
    const [movimientos, total] = await Promise.all([
      db.kardex.findMany({
        where: { productoId },
        orderBy: { fecha: 'desc' },
        skip,
        take: pageSize
      }),
      db.kardex.count({ where: { productoId } })
    ])
    return {
      movimientos: movimientos.map(m => serializarKardex(m)),
      total,
      page,
      pageSize
    }
  }

  // ─── Kardex general (todos los productos) ────────────
  static async getKardexGeneral(page = 1, pageSize = 30, productoId?: number) {
    const skip = (page - 1) * pageSize
    const where = productoId ? { productoId } : {}
    const [movimientos, total] = await Promise.all([
      db.kardex.findMany({
        where,
        include: { producto: { select: { codigo: true, nombre: true } } },
        orderBy: { fecha: 'desc' },
        skip,
        take: pageSize
      }),
      db.kardex.count({ where })
    ])
    return {
      movimientos: movimientos.map(m => serializarKardex(m)),
      total,
      page,
      pageSize
    }
  }

  // ─── Resumen de inventario ────────────────────────────
  static async getResumenInventario() {
    const productos = await db.producto.findMany({
      where: { activo: true },
      select: {
        id: true,
        stockActual: true,
        stockMinimo: true,
        costoPromedio: true,
        precioVenta: true
      }
    })
    const totalProductos = productos.length
    const productosStockBajo = productos.filter(
      p => Number(p.stockActual) <= Number(p.stockMinimo)
    ).length
    const valorInventario = productos.reduce(
      (s, p) => s + Number(p.stockActual) * Number(p.costoPromedio), 0
    )
    return {
      totalProductos,
      productosStockBajo,
      valorInventario: Number(valorInventario)
    }
  }
}
