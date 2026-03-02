import { useState, useCallback, useEffect } from 'react'
import { message } from 'antd'

export interface ClienteFiltros {
  busqueda?: string
  tipoDocumento?: string
  page: number
  pageSize: number
}

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState<ClienteFiltros>({ page: 1, pageSize: 20 })

  const cargar = useCallback(async (nuevos?: Partial<ClienteFiltros>) => {
    const params: ClienteFiltros = { ...filtros, ...nuevos }
    setFiltros(params)
    setLoading(true)
    try {
      const res = await window.clients.listar(
        params.page,
        params.pageSize,
        params.busqueda,
        params.tipoDocumento
      )
      setClientes(res.clientes)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  const crear = useCallback(async (data: Omit<ClienteRow, 'id'>) => {
    const res = await window.clients.crear(data)
    message.success(`Cliente "${res.nombre}" creado correctamente`)
    await cargar({ page: 1 })
    return res
  }, [cargar])

  const actualizar = useCallback(async (id: number, data: Partial<ClienteRow>) => {
    const res = await window.clients.actualizar(id, data)
    message.success(`Cliente "${res.nombre}" actualizado`)
    await cargar()
    return res
  }, [cargar])

  const desactivar = useCallback(async (id: number, nombre: string) => {
    await window.clients.desactivar(id)
    message.success(`Cliente "${nombre}" desactivado`)
    await cargar()
  }, [cargar])

  useEffect(() => { cargar() }, []) // eslint-disable-line

  return { clientes, total, loading, filtros, cargar, crear, actualizar, desactivar }
}
