import { useState } from 'react'
import {
  Card, Table, Tag, Typography, Row, Col, Statistic,
  Progress, Input, Select, Space, Button, Tooltip, Alert
} from 'antd'
import {
  InboxOutlined, SearchOutlined, ReloadOutlined,
  ExclamationCircleOutlined, DollarOutlined, CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency, formatNumber } from '@utils/format'
import { useProductos } from '@hooks/useProductos'

const { Text, Title } = Typography

export default function InventarioPage() {
  const {
    productos, total, loading, filtros, categorias, resumen,
    cargar
  } = useProductos()

  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | undefined>()
  const [soloStockBajo, setSoloStockBajo] = useState(false)

  const handleBuscar = () =>
    cargar({ busqueda: busqueda || undefined, categoriaId: categoriaFiltro, soloStockBajo, page: 1 })

  const handleLimpiar = () => {
    setBusqueda('')
    setCategoriaFiltro(undefined)
    setSoloStockBajo(false)
    cargar({ busqueda: undefined, categoriaId: undefined, soloStockBajo: false, page: 1 })
  }

  const sinStock = productos.filter(p => Number(p.stockActual) <= 0).length
  const stockBajo = productos.filter(p => {
    const a = Number(p.stockActual); const m = Number((p as any).stockMinimo ?? 0)
    return a > 0 && a <= m
  }).length

  const columns: ColumnsType<ProductoRow> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 100,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>
    },
    {
      title: 'Producto',
      key: 'nombre',
      render: (_, r) => (
        <div>
          <Text strong>{r.nombre}</Text>
          {r.categoria && (
            <div>
              <Tag color="default" style={{ fontSize: 10 }}>
                {(r.categoria as { nombre: string }).nombre}
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Stock Actual',
      key: 'stock',
      width: 160,
      render: (_, r) => {
        const actual = Number(r.stockActual)
        const minimo = Number((r as any).stockMinimo ?? 0)
        const pct = minimo > 0 ? Math.min(100, (actual / (minimo * 2)) * 100) : 100
        const strokeColor = actual <= 0 ? '#ff4d4f' : actual <= minimo ? '#faad14' : '#52c41a'
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text strong style={{ fontSize: 14 }}>{formatNumber(actual)}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>mín: {formatNumber(minimo)}</Text>
            </div>
            <Progress
              percent={pct}
              size="small"
              strokeColor={strokeColor}
              showInfo={false}
            />
          </div>
        )
      }
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 130,
      render: (_, r) => {
        const actual = Number(r.stockActual)
        const minimo = Number((r as any).stockMinimo ?? 0)
        if (actual <= 0)
          return <Tag color="error" icon={<ExclamationCircleOutlined />}>Sin Stock</Tag>
        if (actual <= minimo)
          return <Tag color="warning" icon={<WarningOutlined />}>Stock Bajo</Tag>
        return <Tag color="success" icon={<CheckCircleOutlined />}>OK</Tag>
      }
    },
    {
      title: 'Costo Promedio',
      key: 'costo',
      width: 110,
      align: 'right',
      render: (_, r) => <Text>{formatCurrency(r.costoPromedio)}</Text>
    },
    {
      title: 'Precio Venta',
      key: 'precio',
      width: 110,
      align: 'right',
      render: (_, r) => (
        <Text strong style={{ color: 'var(--theme-primary)' }}>
          {formatCurrency(r.precioVenta)}
        </Text>
      )
    },
    {
      title: 'Valor Inventario',
      key: 'valor',
      width: 130,
      align: 'right',
      render: (_, r) => {
        const valor = Number(r.stockActual) * Number(r.costoPromedio)
        return <Text strong>{formatCurrency(valor)}</Text>
      }
    }
  ]

  return (
    <>
      {/* Alertas */}
      {sinStock > 0 && (
        <Alert
          type="error"
          showIcon
          message={`${sinStock} producto(s) sin stock`}
          description="Requieren reabastecimiento inmediato."
          style={{ marginBottom: 12 }}
          closable
        />
      )}
      {stockBajo > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${stockBajo} producto(s) con stock bajo`}
          description="El stock está por debajo del mínimo configurado."
          style={{ marginBottom: 12 }}
          closable
        />
      )}

      {/* Estadísticas */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Productos"
              value={resumen.totalProductos}
              prefix={<InboxOutlined style={{ color: 'var(--theme-primary)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Valor Inventario"
              value={resumen.valorInventario}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Sin Stock"
              value={sinStock}
              valueStyle={{ color: sinStock > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Stock Bajo"
              value={resumen.productosStockBajo}
              valueStyle={{ color: resumen.productosStockBajo > 0 ? '#faad14' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Estado del Inventario</Title>}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => cargar()}
            loading={loading}
          >
            Actualizar
          </Button>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Buscar producto..."
              prefix={<SearchOutlined />}
              allowClear
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onPressEnter={handleBuscar}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder="Categoría"
              allowClear
              style={{ width: '100%' }}
              value={categoriaFiltro}
              onChange={setCategoriaFiltro}
              options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
            />
          </Col>
          <Col xs={12} sm={5} md={4}>
            <Select
              style={{ width: '100%' }}
              value={soloStockBajo ? 'bajo' : 'todos'}
              onChange={v => setSoloStockBajo(v === 'bajo')}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'bajo', label: 'Stock bajo' }
              ]}
            />
          </Col>
          <Col xs={24} sm={2} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleBuscar}>
                Filtrar
              </Button>
              <Tooltip title="Limpiar"><Button icon={<ReloadOutlined />} onClick={handleLimpiar} /></Tooltip>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={productos}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 900 }}
          rowClassName={(r) =>
            Number(r.stockActual) <= 0 ? 'ant-table-row-danger' :
              Number(r.stockActual) <= Number((r as any).stockMinimo ?? 0) ? 'ant-table-row-warning' : ''
          }
          pagination={{
            current: filtros.page,
            pageSize: filtros.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} productos`,
            onChange: (page, pageSize) => cargar({ page, pageSize })
          }}
          summary={pageData => {
            const totalValor = pageData.reduce(
              (acc, r) => acc + Number(r.stockActual) * Number(r.costoPromedio), 0
            )
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6} align="right">
                  <Text strong>Total valor (esta página):</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(totalValor)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </>
  )
}
