import { useState } from 'react'
import {
  Card, Table, Button, Input, Select, Space, Tag, Typography,
  Tooltip, Popconfirm, Row, Col, Statistic, Progress, Badge,
  Switch, message
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, InboxOutlined, DollarOutlined,
  ExclamationCircleOutlined, PlusCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency, formatNumber } from '@utils/format'
import { useProductos } from '@hooks/useProductos'
import ProductoFormModal from '@components/Forms/ProductoFormModal'
import AjusteStockModal from '@components/Forms/AjusteStockModal'
import { UNIDADES_MEDIDA } from '@shared/constants/catalogs'

const { Text, Title } = Typography

const TIPO_ITEM_LABELS: Record<number, string> = { 1: 'Bien', 2: 'Servicio', 3: 'Ambos' }

export default function ProductosPage() {
  const {
    productos, total, loading, filtros, categorias, resumen,
    cargar, cargarCategorias, crear, actualizar, desactivar, ajustarStock
  } = useProductos()

  const [modalOpen, setModalOpen] = useState(false)
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [productoEditando, setProductoEditando] = useState<ProductoRow | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [ajustando, setAjustando] = useState(false)
  const [soloStockBajo, setSoloStockBajo] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | undefined>()

  const handleNuevo = () => { setProductoEditando(null); setModalOpen(true) }
  const handleEditar = (p: ProductoRow) => { setProductoEditando(p); setModalOpen(true) }
  const handleAjuste = (p: ProductoRow) => { setProductoEditando(p); setAjusteOpen(true) }

  const handleGuardar = async (values: unknown) => {
    setGuardando(true)
    try {
      if (productoEditando) await actualizar(productoEditando.id, values)
      else await crear(values)
      setModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Unique constraint')) message.error('Ya existe un producto con ese código')
      else message.error('Error al guardar el producto')
    } finally {
      setGuardando(false)
    }
  }

  const handleAjustarStock = async (data: unknown) => {
    if (!productoEditando) return
    setAjustando(true)
    try {
      await ajustarStock(productoEditando.id, data)
      setAjusteOpen(false)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al ajustar stock')
    } finally {
      setAjustando(false)
    }
  }

  const handleBuscar = () =>
    cargar({ busqueda: busqueda || undefined, categoriaId: categoriaFiltro, soloStockBajo, page: 1 })

  const handleLimpiar = () => {
    setBusqueda('')
    setCategoriaFiltro(undefined)
    setSoloStockBajo(false)
    cargar({ busqueda: undefined, categoriaId: undefined, soloStockBajo: false, page: 1 })
  }

  // ── Columnas ──────────────────────────────────────────
  const columns: ColumnsType<ProductoRow> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 100,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>
    },
    {
      title: 'Producto / Servicio',
      key: 'nombre',
      render: (_, r) => (
        <div>
          <Text strong>{r.nombre}</Text>
          {r.descripcion && (
            <div><Text type="secondary" style={{ fontSize: 11 }}>{r.descripcion}</Text></div>
          )}
          {r.categoria && (
            <Tag color="default" style={{ fontSize: 10, marginTop: 2 }}>{(r.categoria as CategoriaRow).nombre}</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Tipo',
      key: 'tipo',
      width: 90,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag style={{ fontSize: 11 }}>{TIPO_ITEM_LABELS[r.tipoItem] ?? '—'}</Tag>
          <Tag color={r.esGravado ? 'green' : 'orange'} style={{ fontSize: 10 }}>
            {r.esGravado ? 'IVA 13%' : 'Exento'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'U.M.',
      key: 'um',
      width: 80,
      render: (_, r) => {
        const um = UNIDADES_MEDIDA.find(u => u.codigo === r.uniMedida)
        return <Text style={{ fontSize: 12 }}>{um?.nombre ?? r.uniMedida}</Text>
      }
    },
    {
      title: 'Precio Venta',
      key: 'precio',
      width: 100,
      align: 'right',
      render: (_, r) => (
        <Text strong style={{ color: 'var(--theme-primary)' }}>
          {formatCurrency(Number(r.precioVenta))}
        </Text>
      )
    },
    {
      title: 'Costo',
      key: 'costo',
      width: 90,
      align: 'right',
      render: (_, r) => <Text>{formatCurrency(Number(r.costoPromedio))}</Text>
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 130,
      render: (_, r) => {
        const actual = Number(r.stockActual)
        const minimo = Number(r.stockMinimo)
        const pct = minimo > 0 ? Math.min(100, (actual / (minimo * 2)) * 100) : 100
        const status = actual <= 0 ? 'exception' : actual <= minimo ? 'active' : 'success'
        const strokeColor = actual <= 0 ? '#ff4d4f' : actual <= minimo ? '#faad14' : '#52c41a'
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text strong style={{ fontSize: 13 }}>{formatNumber(actual)}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>mín: {formatNumber(minimo)}</Text>
            </div>
            <Progress
              percent={pct}
              size="small"
              status={status}
              strokeColor={strokeColor}
              showInfo={false}
            />
            {actual <= 0 && <Text type="danger" style={{ fontSize: 10 }}>SIN STOCK</Text>}
            {actual > 0 && actual <= minimo && (
              <Text style={{ fontSize: 10, color: '#faad14' }}>
                <ExclamationCircleOutlined /> Stock bajo
              </Text>
            )}
          </div>
        )
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Ajustar stock">
            <Button
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() => handleAjuste(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar este producto?"
            description="No aparecerá en búsquedas pero conserva su historial."
            okText="Desactivar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => desactivar(record.id, record.nombre)}
          >
            <Tooltip title="Desactivar">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      {/* ── Estadísticas ───────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic
              title="Total Productos"
              value={resumen.totalProductos}
              prefix={<InboxOutlined style={{ color: 'var(--theme-primary)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic
              title="Valor del Inventario"
              value={resumen.valorInventario}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic
              title="Con Stock Bajo"
              value={resumen.productosStockBajo}
              prefix={<ExclamationCircleOutlined style={{ color: resumen.productosStockBajo > 0 ? '#faad14' : '#52c41a' }} />}
              suffix={resumen.productosStockBajo > 0
                ? <Badge count="Revisar" style={{ backgroundColor: '#faad14' }} />
                : null}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Tabla ──────────────────────────────────────── */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Productos</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo Producto
          </Button>
        }
      >
        {/* Filtros */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={9} md={7}>
            <Input
              placeholder="Buscar por nombre o código..."
              prefix={<SearchOutlined />}
              allowClear
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onPressEnter={handleBuscar}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
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
            <Space>
              <Switch
                size="small"
                checked={soloStockBajo}
                onChange={setSoloStockBajo}
              />
              <Text style={{ fontSize: 12 }}>Solo stock bajo</Text>
            </Space>
          </Col>
          <Col xs={24} sm={4} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleBuscar}>
                Buscar
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
          scroll={{ x: 960 }}
          rowClassName={(r) =>
            Number(r.stockActual) <= 0 ? 'ant-table-row-danger' :
              Number(r.stockActual) <= Number(r.stockMinimo) ? 'ant-table-row-warning' : ''
          }
          pagination={{
            current: filtros.page,
            pageSize: filtros.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} productos`,
            onChange: (page, pageSize) => cargar({ page, pageSize })
          }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <InboxOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  {soloStockBajo
                    ? 'No hay productos con stock bajo. ¡Buen trabajo!'
                    : 'Sin productos. Cree el primero con "Nuevo Producto".'}
                </div>
              </div>
            )
          }}
        />
      </Card>

      <ProductoFormModal
        open={modalOpen}
        producto={productoEditando}
        categorias={categorias}
        onOk={handleGuardar}
        onCancel={() => setModalOpen(false)}
        onCategoriaCreada={cargarCategorias}
        loading={guardando}
      />

      <AjusteStockModal
        open={ajusteOpen}
        producto={productoEditando}
        onOk={handleAjustarStock}
        onCancel={() => setAjusteOpen(false)}
        loading={ajustando}
      />
    </>
  )
}
