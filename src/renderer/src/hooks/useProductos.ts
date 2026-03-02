import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'

export interface ProductoFiltros {
  busqueda?: string
  categoriaId?: number
  soloStockBajo?: boolean
  page: number
  pageSize: number
}

export function useProductos() {
  const [productos, setProductos] = useState<ProductoRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState<ProductoFiltros>({ page: 1, pageSize: 20 })
  const [categorias, setCategorias] = useState<CategoriaRow[]>([])
  const [resumen, setResumen] = useState({ totalProductos: 0, productosStockBajo: 0, valorInventario: 0 })

  const cargar = useCallback(async (nuevos?: Partial<ProductoFiltros>) => {
    const params: ProductoFiltros = { ...filtros, ...nuevos }
    setFiltros(params)
    setLoading(true)
    try {
      const [res, resumenData] = await Promise.all([
        window.products.listar(params.page, params.pageSize, params.busqueda, params.categoriaId, params.soloStockBajo),
        window.products.getResumenInventario()
      ])
      setProductos(res.productos)
      setTotal(res.total)
      setResumen(resumenData)
    } catch {
      message.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  const cargarCategorias = useCallback(async () => {
    const cats = await window.products.listarCategorias()
    setCategorias(cats)
  }, [])

  const crear = useCallback(async (data: unknown) => {
    const res = await window.products.crear(data)
    message.success(`Producto "${(res as ProductoRow).nombre}" creado`)
    await cargar({ page: 1 })
    return res
  }, [cargar])

  const actualizar = useCallback(async (id: number, data: unknown) => {
    const res = await window.products.actualizar(id, data)
    message.success(`Producto "${(res as ProductoRow).nombre}" actualizado`)
    await cargar()
    return res
  }, [cargar])

  const desactivar = useCallback(async (id: number, nombre: string) => {
    await window.products.desactivar(id)
    message.success(`Producto "${nombre}" desactivado`)
    await cargar()
  }, [cargar])

  const ajustarStock = useCallback(async (productoId: number, data: unknown) => {
    await window.products.ajustarStock(productoId, data)
    message.success('Stock ajustado correctamente')
    await cargar()
  }, [cargar])

  useEffect(() => {
    cargar()
    cargarCategorias()
  }, []) // eslint-disable-line

  return {
    productos, total, loading, filtros, categorias, resumen,
    cargar, cargarCategorias, crear, actualizar, desactivar, ajustarStock
  }
}
