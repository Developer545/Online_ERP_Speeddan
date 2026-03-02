import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Tag, Typography, Row, Col, Select,
  Space, Button, DatePicker, Tooltip, Drawer
} from 'antd'
import {
  ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined,
  SwapOutlined, EyeOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency, formatNumber } from '@utils/format'
import dayjs from 'dayjs'

const { Text, Title } = Typography
const { RangePicker } = DatePicker

const TIPO_COLORS: Record<string, string> = {
  ENTRADA: 'green',
  SALIDA: 'red',
  AJUSTE: 'blue',
  VENTA: 'volcano',
  COMPRA: 'cyan'
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  ENTRADA: <ArrowUpOutlined />,
  SALIDA: <ArrowDownOutlined />,
  AJUSTE: <SwapOutlined />,
  VENTA: <ArrowDownOutlined />,
  COMPRA: <ArrowUpOutlined />
}

export default function KardexPage() {
  const [movimientos, setMovimientos] = useState<KardexMovimiento[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [productoFiltro, setProductoFiltro] = useState<number | undefined>()
  const [productos, setProductos] = useState<ProductoRow[]>([])
  const [detalle, setDetalle] = useState<KardexMovimiento | null>(null)

  const cargar = useCallback(async (p = page, ps = pageSize, pid = productoFiltro) => {
    setLoading(true)
    try {
      const res = await window.products.getKardexGeneral(p, ps, pid)
      setMovimientos(res.movimientos)
      setTotal(res.total)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, productoFiltro])

  useEffect(() => {
    cargar()
    window.products.listar(1, 200).then(r => setProductos(r.productos))
  }, []) // eslint-disable-line

  const handleFiltrar = () => {
    setPage(1)
    cargar(1, pageSize, productoFiltro)
  }

  const columns: ColumnsType<KardexMovimiento> = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 150,
      render: (v: string) => (
        <Text style={{ fontSize: 12 }}>
          {dayjs(v).format('DD/MM/YYYY HH:mm')}
        </Text>
      )
    },
    {
      title: 'Producto',
      key: 'producto',
      render: (_, r) => r.producto ? (
        <div>
          <Text code style={{ fontSize: 11 }}>{r.producto.codigo}</Text>
          <div><Text style={{ fontSize: 12 }}>{r.producto.nombre}</Text></div>
        </div>
      ) : <Text type="secondary">—</Text>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoMovimiento',
      key: 'tipo',
      width: 110,
      render: (v: string) => (
        <Tag color={TIPO_COLORS[v] ?? 'default'} icon={TIPO_ICONS[v]}>
          {v}
        </Tag>
      )
    },
    {
      title: 'Referencia',
      dataIndex: 'referencia',
      key: 'referencia',
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 90,
      align: 'right',
      render: (v: number | string, r) => {
        const tipo = r.tipoMovimiento
        const isNeg = tipo === 'SALIDA' || tipo === 'VENTA'
        return (
          <Text strong style={{ color: isNeg ? '#ff4d4f' : '#52c41a' }}>
            {isNeg ? '-' : '+'}{formatNumber(v)}
          </Text>
        )
      }
    },
    {
      title: 'Costo U.',
      dataIndex: 'costoUnitario',
      key: 'costoUnitario',
      width: 90,
      align: 'right',
      render: (v: number | string) => <Text>{formatCurrency(v)}</Text>
    },
    {
      title: 'Stock Antes',
      dataIndex: 'stockAnterior',
      key: 'stockAnterior',
      width: 100,
      align: 'right',
      render: (v: number | string) => <Text type="secondary">{formatNumber(v)}</Text>
    },
    {
      title: 'Stock Nuevo',
      dataIndex: 'stockNuevo',
      key: 'stockNuevo',
      width: 100,
      align: 'right',
      render: (v: number | string) => (
        <Text strong style={{ color: Number(v) <= 0 ? '#ff4d4f' : '#262626' }}>
          {formatNumber(v)}
        </Text>
      )
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        <Tooltip title="Ver detalle">
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetalle(r)} />
        </Tooltip>
      )
    }
  ]

  return (
    <>
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Kardex — Movimientos de Inventario</Title>}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => cargar()} loading={loading}>
            Actualizar
          </Button>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Filtrar por producto..."
              allowClear
              style={{ width: '100%' }}
              value={productoFiltro}
              onChange={setProductoFiltro}
              options={productos.map(p => ({ value: p.id, label: `${p.codigo} — ${p.nombre}` }))}
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Space>
              <Button type="primary" onClick={handleFiltrar}>Filtrar</Button>
              <Button onClick={() => { setProductoFiltro(undefined); cargar(1, pageSize, undefined) }}>
                Limpiar
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={movimientos}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} movimientos`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
              cargar(p, ps, productoFiltro)
            }
          }}
        />
      </Card>

      {/* Drawer detalle */}
      <Drawer
        title="Detalle del Movimiento"
        open={!!detalle}
        onClose={() => setDetalle(null)}
        width={400}
      >
        {detalle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={12}><Text type="secondary">Fecha:</Text></Col>
              <Col span={12}><Text strong>{dayjs(detalle.fecha).format('DD/MM/YYYY HH:mm')}</Text></Col>

              <Col span={12}><Text type="secondary">Tipo:</Text></Col>
              <Col span={12}>
                <Tag color={TIPO_COLORS[detalle.tipoMovimiento] ?? 'default'}>
                  {detalle.tipoMovimiento}
                </Tag>
              </Col>

              {detalle.producto && (
                <>
                  <Col span={12}><Text type="secondary">Producto:</Text></Col>
                  <Col span={12}>
                    <Text>{detalle.producto.nombre}</Text>
                    <br />
                    <Text code style={{ fontSize: 11 }}>{detalle.producto.codigo}</Text>
                  </Col>
                </>
              )}

              <Col span={12}><Text type="secondary">Referencia:</Text></Col>
              <Col span={12}><Text>{detalle.referencia}</Text></Col>

              <Col span={12}><Text type="secondary">Cantidad:</Text></Col>
              <Col span={12}><Text strong>{formatNumber(detalle.cantidad)}</Text></Col>

              <Col span={12}><Text type="secondary">Costo Unitario:</Text></Col>
              <Col span={12}><Text>{formatCurrency(detalle.costoUnitario)}</Text></Col>

              <Col span={12}><Text type="secondary">Costo Total:</Text></Col>
              <Col span={12}><Text strong>{formatCurrency(detalle.costoTotal)}</Text></Col>

              <Col span={12}><Text type="secondary">Stock Anterior:</Text></Col>
              <Col span={12}><Text type="secondary">{formatNumber(detalle.stockAnterior)}</Text></Col>

              <Col span={12}><Text type="secondary">Stock Nuevo:</Text></Col>
              <Col span={12}>
                <Text strong style={{ color: Number(detalle.stockNuevo) <= 0 ? '#ff4d4f' : '#52c41a' }}>
                  {formatNumber(detalle.stockNuevo)}
                </Text>
              </Col>

              {detalle.notas && (
                <>
                  <Col span={12}><Text type="secondary">Notas:</Text></Col>
                  <Col span={12}><Text>{detalle.notas}</Text></Col>
                </>
              )}
            </Row>
          </div>
        )}
      </Drawer>
    </>
  )
}
