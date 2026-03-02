import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Form, Select, Button, Space, Typography, Row, Col,
  InputNumber, Input, Table, Divider, Tag, Alert, Spin,
  message, Modal, Result, Statistic, Tooltip, AutoComplete
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, SaveOutlined,
  SendOutlined, ArrowLeftOutlined, SearchOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { v4 as uuidv4 } from 'uuid'
import { formatCurrency, formatNumber } from '@utils/format'
import { FORMAS_PAGO, UNIDADES_MEDIDA } from '@shared/constants/catalogs'
import type { ItemFacturaInput, TotalesFactura } from '@shared/types/billing.types'

const { Title, Text } = Typography

// ── Utilidad de redondeo ──────────────────────────────────
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// ── Calcula un ítem dado precio, cantidad, descuento ─────
function calcularItem(item: Partial<ItemFacturaInput>): Partial<ItemFacturaInput> {
  const cantidad = item.cantidad ?? 0
  const precioUni = item.precioUni ?? 0
  const descuento = item.descuento ?? 0
  const esGravado = item.esGravado !== false

  const baseNeta = r2(cantidad * precioUni - descuento)
  const ventaGravada = esGravado ? baseNeta : 0
  const ventaExenta = esGravado ? 0 : baseNeta
  const ivaItem = esGravado ? r2(ventaGravada * 0.13) : 0
  const total = r2(baseNeta + ivaItem)

  return { ...item, ventaGravada, ventaExenta, ivaItem, total }
}

// ── Calcula totales de todos los ítems ───────────────────
function calcularTotales(items: ItemFacturaInput[]): TotalesFactura {
  const totalGravada = r2(items.reduce((s, i) => s + i.ventaGravada, 0))
  const totalExenta = r2(items.reduce((s, i) => s + i.ventaExenta, 0))
  const totalDescuento = r2(items.reduce((s, i) => s + i.descuento, 0))
  const totalIva = r2(items.reduce((s, i) => s + i.ivaItem, 0))
  const subTotal = r2(totalGravada + totalExenta)
  const totalPagar = r2(subTotal + totalIva)

  return { totalGravada, totalExenta, totalNoSuj: 0, totalDescuento, subTotal, totalIva, totalPagar }
}

// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────
export default function NuevaFacturaPage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  // Estado del formulario
  const [items, setItems] = useState<ItemFacturaInput[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteRow | null>(null)
  const [sucursales, setSucursales] = useState<SucursalRow[]>([])
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [condicion, setCondicion] = useState<1 | 2>(1)
  const [formaPago, setFormaPago] = useState<{ codigo: string; monto: number }[]>([
    { codigo: '01', monto: 0 }
  ])

  // Estado de carga/resultado
  const [emitiendo, setEmitiendo] = useState(false)
  const [resultado, setResultado] = useState<{
    ok: boolean
    numeroControl?: string
    selloRecepcion?: string
    error?: string
    observaciones?: string[]
  } | null>(null)

  // Búsqueda de clientes
  const [clienteOptions, setClienteOptions] = useState<{ value: string; label: string; data: ClienteRow }[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  // Búsqueda de productos
  const [productoOptions, setProductoOptions] = useState<ProductoRow[]>([])
  const [itemEditandoKey, setItemEditandoKey] = useState<string | null>(null)

  const totales = calcularTotales(items)

  // ── Cargar sucursales al montar ────────────────────────
  useState(() => {
    window.sucursales.listar().then(lista => {
      setSucursales(lista)
      if (lista.length === 1) setSucursalId(lista[0].id)
    })
  })

  // ── Buscar clientes ────────────────────────────────────
  const buscarCliente = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setClienteOptions([]); return }
    setBuscandoCliente(true)
    const res = await window.clients.buscar(query)
    setClienteOptions(res.map(c => ({
      value: String(c.id),
      label: `${c.nombre} — ${c.numDocumento}`,
      data: c
    })))
    setBuscandoCliente(false)
  }, [])

  const onClienteSelect = (_val: string, opt: { data: ClienteRow }) => {
    setClienteSeleccionado(opt.data)
    // Autocompletar forma de pago con total actual
    actualizarMontoPago(totales.totalPagar)
  }

  // ── Buscar productos ───────────────────────────────────
  const buscarProducto = useCallback(async (query: string) => {
    if (!query || query.length < 1) { setProductoOptions([]); return }
    const res = await window.products.buscar(query)
    setProductoOptions(res)
  }, [])

  // ── Añadir ítem vacío ──────────────────────────────────
  const agregarItem = () => {
    const key = uuidv4()
    setItems(prev => [...prev, {
      key,
      descripcion: '',
      cantidad: 1,
      precioUni: 0,
      descuento: 0,
      tipoItem: 1,
      uniMedida: 59,
      esGravado: true,
      ventaGravada: 0,
      ventaExenta: 0,
      ivaItem: 0,
      total: 0
    }])
  }

  // ── Seleccionar producto en un ítem ───────────────────
  const seleccionarProducto = (productoId: number, itemKey: string) => {
    const prod = productoOptions.find(p => p.id === productoId)
    if (!prod) return
    setItems(prev => prev.map(item => {
      if (item.key !== itemKey) return item
      const updated = calcularItem({
        ...item,
        productoId: prod.id,
        codigo: prod.codigo,
        descripcion: prod.nombre,
        precioUni: Number(prod.precioVenta),
        uniMedida: prod.uniMedida,
        tipoItem: prod.tipoItem as 1 | 2 | 3,
        esGravado: prod.esGravado
      })
      return updated as ItemFacturaInput
    }))
    setProductoOptions([])
    setItemEditandoKey(null)
  }

  // ── Actualizar campo de un ítem ───────────────────────
  const updateItem = (key: string, field: keyof ItemFacturaInput, value: unknown) => {
    setItems(prev => prev.map(item => {
      if (item.key !== key) return item
      const updated = calcularItem({ ...item, [field]: value })
      return updated as ItemFacturaInput
    }))
  }

  // ── Eliminar ítem ─────────────────────────────────────
  const eliminarItem = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  // ── Actualizar monto de pago ──────────────────────────
  const actualizarMontoPago = (total: number) => {
    setFormaPago(prev => prev.map((p, idx) => idx === 0 ? { ...p, monto: r2(total) } : p))
  }

  // ── Emitir factura ────────────────────────────────────
  const emitir = async () => {
    if (!sucursalId) { message.error('Seleccione una sucursal'); return }
    if (items.length === 0) { message.error('Agregue al menos un producto o servicio'); return }
    if (items.some(i => !i.descripcion || i.cantidad <= 0 || i.precioUni <= 0)) {
      message.error('Todos los ítems deben tener descripción, cantidad y precio válidos')
      return
    }

    const totalPago = r2(formaPago.reduce((s, p) => s + p.monto, 0))
    if (Math.abs(totalPago - totales.totalPagar) > 0.01) {
      message.error(`El total de pago (${formatCurrency(totalPago)}) debe coincidir con el total (${formatCurrency(totales.totalPagar)})`)
      return
    }

    setEmitiendo(true)
    try {
      const result = await window.billing.emitir({
        tipoDte: '01',
        sucursalId,
        clienteId: clienteSeleccionado?.id,
        items: items.map(i => ({
          productoId: i.productoId,
          codigo: i.codigo,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUni: i.precioUni,
          descuento: i.descuento,
          tipoItem: i.tipoItem,
          uniMedida: i.uniMedida,
          esGravado: i.esGravado
        })),
        formaPago: formaPago.map(p => ({ codigo: p.codigo, monto: p.monto })),
        condicionOperacion: condicion
      })
      setResultado(result)
    } catch (err) {
      message.error('Error inesperado al emitir la factura')
    } finally {
      setEmitiendo(false)
    }
  }

  // ── Columnas de la tabla de ítems ────────────────────
  const columns: ColumnsType<ItemFacturaInput> = [
    {
      title: '#',
      width: 40,
      render: (_, __, idx) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{idx + 1}</Text>
      )
    },
    {
      title: 'Producto / Servicio',
      key: 'descripcion',
      render: (_, record) => (
        <div style={{ minWidth: 200 }}>
          {itemEditandoKey === record.key ? (
            <Select
              showSearch
              autoFocus
              style={{ width: '100%' }}
              placeholder="Buscar producto..."
              filterOption={false}
              onSearch={buscarProducto}
              onSelect={(val: number) => seleccionarProducto(val, record.key)}
              onBlur={() => setItemEditandoKey(null)}
              options={productoOptions.map(p => ({
                value: p.id,
                label: (
                  <Space>
                    <Tag color="blue" style={{ fontSize: 11 }}>{p.codigo}</Tag>
                    <span>{p.nombre}</span>
                    <Text type="secondary" style={{ fontSize: 11 }}>{formatCurrency(Number(p.precioVenta))}</Text>
                  </Space>
                )
              }))}
              notFoundContent={<Text type="secondary">Buscar por nombre o código</Text>}
            />
          ) : (
            <div
              onClick={() => setItemEditandoKey(record.key)}
              style={{ cursor: 'pointer', padding: '4px 0' }}
            >
              {record.descripcion ? (
                <>
                  {record.codigo && (
                    <Tag color="default" style={{ fontSize: 10, marginRight: 4 }}>{record.codigo}</Tag>
                  )}
                  <Text>{record.descripcion}</Text>
                </>
              ) : (
                <Text type="secondary">
                  <SearchOutlined /> Seleccionar producto...
                </Text>
              )}
            </div>
          )}
          {!record.productoId && record.descripcion === '' && (
            <Input
              placeholder="O escribir descripción manual"
              size="small"
              style={{ marginTop: 4 }}
              onChange={e => updateItem(record.key, 'descripcion', e.target.value)}
            />
          )}
        </div>
      )
    },
    {
      title: 'Tipo',
      width: 100,
      render: (_, record) => (
        <Select
          size="small"
          value={record.tipoItem}
          style={{ width: 90 }}
          onChange={val => updateItem(record.key, 'tipoItem', val)}
          options={[
            { value: 1, label: 'Bien' },
            { value: 2, label: 'Servicio' },
            { value: 3, label: 'Ambos' }
          ]}
        />
      )
    },
    {
      title: 'U.M.',
      width: 100,
      render: (_, record) => (
        <Select
          size="small"
          value={record.uniMedida}
          style={{ width: 90 }}
          onChange={val => updateItem(record.key, 'uniMedida', val)}
          options={UNIDADES_MEDIDA.map(u => ({ value: u.codigo, label: u.nombre }))}
        />
      )
    },
    {
      title: 'Cantidad',
      width: 90,
      render: (_, record) => (
        <InputNumber
          size="small"
          min={0.01}
          step={1}
          value={record.cantidad}
          style={{ width: 80 }}
          onChange={val => updateItem(record.key, 'cantidad', val ?? 0)}
        />
      )
    },
    {
      title: 'Precio Unit.',
      width: 110,
      render: (_, record) => (
        <InputNumber
          size="small"
          min={0}
          step={0.01}
          precision={2}
          prefix="$"
          value={record.precioUni}
          style={{ width: 100 }}
          onChange={val => updateItem(record.key, 'precioUni', val ?? 0)}
        />
      )
    },
    {
      title: 'Descuento',
      width: 100,
      render: (_, record) => (
        <InputNumber
          size="small"
          min={0}
          step={0.01}
          precision={2}
          prefix="$"
          value={record.descuento}
          style={{ width: 90 }}
          onChange={val => updateItem(record.key, 'descuento', val ?? 0)}
        />
      )
    },
    {
      title: 'Gravado',
      width: 80,
      render: (_, record) => (
        <Tooltip title={record.esGravado ? 'Con IVA 13%' : 'Exento de IVA'}>
          <Tag
            color={record.esGravado ? 'green' : 'default'}
            style={{ cursor: 'pointer' }}
            onClick={() => updateItem(record.key, 'esGravado', !record.esGravado)}
          >
            {record.esGravado ? 'IVA' : 'EXE'}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'IVA',
      width: 80,
      align: 'right',
      render: (_, record) => (
        <Text style={{ fontSize: 13 }}>{formatCurrency(record.ivaItem)}</Text>
      )
    },
    {
      title: 'Total',
      width: 90,
      align: 'right',
      render: (_, record) => (
        <Text strong style={{ fontSize: 13 }}>{formatCurrency(record.total)}</Text>
      )
    },
    {
      title: '',
      width: 40,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => eliminarItem(record.key)}
        />
      )
    }
  ]

  // ── Modal de resultado ────────────────────────────────
  if (resultado) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto' }}>
        <Card>
          {resultado.ok ? (
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="Factura emitida correctamente"
              subTitle="El Ministerio de Hacienda ha recibido y sellado el documento."
              extra={[
                <Button key="nueva" type="primary" icon={<PlusOutlined />}
                  onClick={() => { setResultado(null); setItems([]); setClienteSeleccionado(null) }}>
                  Nueva Factura
                </Button>,
                <Button key="lista" onClick={() => navigate('/facturacion/facturas')}>
                  Ver Listado
                </Button>
              ]}
            >
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Alert
                    type="success"
                    showIcon={false}
                    message={
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Text type="secondary">N° Control:</Text>
                          <Text code style={{ fontSize: 12 }}>{resultado.numeroControl}</Text>
                        </Space>
                        <Space>
                          <Text type="secondary">Sello MH:</Text>
                          <Text code style={{ fontSize: 12 }}>{resultado.selloRecepcion}</Text>
                        </Space>
                      </Space>
                    }
                  />
                </Col>
              </Row>
              {resultado.observaciones && resultado.observaciones.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginTop: 12 }}
                  message="Observaciones del MH"
                  description={resultado.observaciones.join(', ')}
                />
              )}
            </Result>
          ) : (
            <Result
              status="error"
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              title="Error al emitir la factura"
              subTitle={resultado.error}
              extra={[
                <Button key="retry" type="primary" onClick={() => setResultado(null)}>
                  Corregir y reintentar
                </Button>,
                <Button key="lista" onClick={() => navigate('/facturacion/facturas')}>
                  Ver Listado
                </Button>
              ]}
            >
              {resultado.observaciones && resultado.observaciones.length > 0 && (
                <Alert
                  type="error"
                  showIcon
                  message="Detalle del error"
                  description={resultado.observaciones.join(' | ')}
                />
              )}
            </Result>
          )}
        </Card>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────
  return (
    <Spin spinning={emitiendo} tip="Firmando y transmitiendo al Ministerio de Hacienda...">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/facturacion/facturas')}>
            Volver
          </Button>
          <Title level={4} style={{ margin: 0 }}>Nueva Factura Electrónica</Title>
          <Tag color="blue">DTE-01</Tag>
          {sucursales[0] && (
            <Tag color="default">
              Ambiente: {sucursales[0]?.emisor?.nombre || '—'} |{' '}
              <span style={{ color: '#faad14' }}>PRUEBAS</span>
            </Tag>
          )}
        </div>

        <Row gutter={[16, 16]}>
          {/* Columna principal */}
          <Col xs={24} xl={17}>

            {/* ── SECCIÓN 1: Cabecera ── */}
            <Card size="small" title="Datos de Emisión" style={{ marginBottom: 12 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="Sucursal / Punto de Venta" style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="Seleccionar sucursal"
                      value={sucursalId ?? undefined}
                      onChange={setSucursalId}
                      options={sucursales.map(s => ({
                        value: s.id,
                        label: `${s.nombre} (${s.codMH}${s.puntoVenta})`
                      }))}
                      notFoundContent={
                        <Alert
                          type="warning"
                          message="Sin sucursales configuradas"
                          description="Configure el emisor en Facturación > Configuración DTE"
                          showIcon
                          style={{ fontSize: 12 }}
                        />
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Condición de Pago" style={{ marginBottom: 0 }}>
                    <Select
                      value={condicion}
                      onChange={setCondicion}
                      options={[
                        { value: 1, label: 'Contado' },
                        { value: 2, label: 'Crédito' },
                        { value: 3, label: 'Otro' }
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* ── SECCIÓN 2: Cliente ── */}
            <Card size="small" title="Receptor" style={{ marginBottom: 12 }}>
              <Row gutter={16} align="middle">
                <Col xs={24} md={16}>
                  <AutoComplete
                    style={{ width: '100%' }}
                    placeholder="Buscar cliente por nombre, DUI o NIT... (dejar vacío = Consumidor Final)"
                    options={clienteOptions}
                    onSearch={buscarCliente}
                    onSelect={onClienteSelect}
                    notFoundContent={buscandoCliente ? <Spin size="small" /> : null}
                  />
                </Col>
                <Col xs={24} md={8}>
                  {clienteSeleccionado ? (
                    <Space>
                      <Tag color="green">{clienteSeleccionado.tipoDocumento}</Tag>
                      <Text>{clienteSeleccionado.numDocumento}</Text>
                      <Button
                        size="small"
                        type="text"
                        danger
                        onClick={() => setClienteSeleccionado(null)}
                      >
                        Quitar
                      </Button>
                    </Space>
                  ) : (
                    <Tag color="default">Consumidor Final (sin identificación)</Tag>
                  )}
                </Col>
              </Row>

              {clienteSeleccionado && (
                <Row gutter={8} style={{ marginTop: 8 }}>
                  <Col><Text type="secondary" style={{ fontSize: 12 }}>Nombre:</Text></Col>
                  <Col><Text style={{ fontSize: 12 }}>{clienteSeleccionado.nombre}</Text></Col>
                  {clienteSeleccionado.correo && (
                    <>
                      <Col><Text type="secondary" style={{ fontSize: 12 }}>Correo:</Text></Col>
                      <Col><Text style={{ fontSize: 12 }}>{clienteSeleccionado.correo}</Text></Col>
                    </>
                  )}
                </Row>
              )}
            </Card>

            {/* ── SECCIÓN 3: Ítems ── */}
            <Card
              size="small"
              title="Detalle de Productos / Servicios"
              extra={
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={agregarItem}>
                  Agregar ítem
                </Button>
              }
              style={{ marginBottom: 12 }}
            >
              {items.length === 0 ? (
                <div
                  onClick={agregarItem}
                  style={{
                    textAlign: 'center', padding: '32px 0', cursor: 'pointer',
                    border: '2px dashed #d9d9d9', borderRadius: 6
                  }}
                >
                  <PlusOutlined style={{ fontSize: 24, color: '#bfbfbf' }} />
                  <div style={{ marginTop: 8, color: '#bfbfbf' }}>
                    Haga clic para agregar el primer producto o servicio
                  </div>
                </div>
              ) : (
                <Table
                  dataSource={items}
                  columns={columns}
                  rowKey="key"
                  size="small"
                  pagination={false}
                  scroll={{ x: 860 }}
                  footer={() => (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={agregarItem}
                      style={{ width: '100%' }}
                    >
                      Agregar ítem
                    </Button>
                  )}
                />
              )}
            </Card>

            {/* ── SECCIÓN 4: Forma de pago ── */}
            <Card size="small" title="Forma de Pago" style={{ marginBottom: 12 }}>
              {formaPago.map((pago, idx) => (
                <Row gutter={8} key={idx} align="middle" style={{ marginBottom: 8 }}>
                  <Col xs={12} md={10}>
                    <Select
                      style={{ width: '100%' }}
                      value={pago.codigo}
                      onChange={val => setFormaPago(prev =>
                        prev.map((p, i) => i === idx ? { ...p, codigo: val } : p)
                      )}
                      options={FORMAS_PAGO.map(f => ({ value: f.codigo, label: f.nombre }))}
                    />
                  </Col>
                  <Col xs={8} md={8}>
                    <InputNumber
                      style={{ width: '100%' }}
                      prefix="$"
                      precision={2}
                      min={0}
                      value={pago.monto}
                      onChange={val => setFormaPago(prev =>
                        prev.map((p, i) => i === idx ? { ...p, monto: val ?? 0 } : p)
                      )}
                    />
                  </Col>
                  <Col xs={4} md={2}>
                    {idx > 0 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setFormaPago(prev => prev.filter((_, i) => i !== idx))}
                      />
                    )}
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setFormaPago(prev => [...prev, { codigo: '01', monto: 0 }])}
              >
                Agregar forma de pago
              </Button>
            </Card>
          </Col>

          {/* Columna lateral — Totales */}
          <Col xs={24} xl={7}>
            <Card
              title="Resumen"
              style={{ position: 'sticky', top: 80 }}
              size="small"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Row justify="space-between">
                  <Text type="secondary">Ventas gravadas:</Text>
                  <Text>{formatCurrency(totales.totalGravada)}</Text>
                </Row>
                {totales.totalExenta > 0 && (
                  <Row justify="space-between">
                    <Text type="secondary">Ventas exentas:</Text>
                    <Text>{formatCurrency(totales.totalExenta)}</Text>
                  </Row>
                )}
                {totales.totalDescuento > 0 && (
                  <Row justify="space-between">
                    <Text type="secondary">Descuentos:</Text>
                    <Text type="danger">-{formatCurrency(totales.totalDescuento)}</Text>
                  </Row>
                )}
                <Row justify="space-between">
                  <Text type="secondary">Subtotal:</Text>
                  <Text>{formatCurrency(totales.subTotal)}</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary">IVA (13%):</Text>
                  <Text>{formatCurrency(totales.totalIva)}</Text>
                </Row>
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between" align="middle">
                  <Text strong style={{ fontSize: 15 }}>TOTAL A PAGAR:</Text>
                  <Statistic
                    value={totales.totalPagar}
                    precision={2}
                    formatter={v => formatCurrency(Number(v))}
                    valueStyle={{ fontSize: 20, color: 'var(--theme-primary)', fontWeight: 700 }}
                  />
                </Row>

                <Divider style={{ margin: '8px 0' }} />

                {/* Ítems resumen */}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {items.length} ítem{items.length !== 1 ? 's' : ''}
                  {clienteSeleccionado
                    ? ` | ${clienteSeleccionado.nombre}`
                    : ' | Consumidor Final'
                  }
                </Text>

                {/* Validaciones visuales */}
                {!sucursalId && (
                  <Alert type="warning" showIcon message="Seleccione una sucursal" style={{ fontSize: 12 }} />
                )}
                {items.length === 0 && (
                  <Alert type="info" showIcon message="Agregue al menos un ítem" style={{ fontSize: 12 }} />
                )}

                <Divider style={{ margin: '8px 0' }} />

                {/* Botones de acción */}
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size="large"
                  block
                  loading={emitiendo}
                  disabled={!sucursalId || items.length === 0}
                  onClick={emitir}
                  style={{ height: 48, fontSize: 15 }}
                >
                  Emitir Factura DTE
                </Button>
                <Button
                  icon={<SaveOutlined />}
                  block
                  disabled={items.length === 0}
                >
                  Guardar Borrador
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}
