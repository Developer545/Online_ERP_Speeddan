// Nuevo Comprobante de Crédito Fiscal (DTE-03)
// Para transacciones B2B entre contribuyentes. Requiere NRC del receptor.

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Form, Select, Button, Space, Typography, Row, Col,
  InputNumber, Input, Table, Divider, Tag, Alert, Spin,
  message, Result, Statistic, Tooltip, AutoComplete
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, SaveOutlined,
  SendOutlined, ArrowLeftOutlined, SearchOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, BankOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { v4 as uuidv4 } from 'uuid'
import { formatCurrency, formatNumber } from '@utils/format'
import { FORMAS_PAGO, UNIDADES_MEDIDA } from '@shared/constants/catalogs'
import type { ItemFacturaInput, TotalesFactura } from '@shared/types/billing.types'

const { Title, Text } = Typography

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

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

function calcularTotales(items: ItemFacturaInput[]): TotalesFactura {
  const totalGravada = r2(items.reduce((s, i) => s + i.ventaGravada, 0))
  const totalExenta = r2(items.reduce((s, i) => s + i.ventaExenta, 0))
  const totalDescuento = r2(items.reduce((s, i) => s + i.descuento, 0))
  const totalIva = r2(items.reduce((s, i) => s + i.ivaItem, 0))
  const subTotal = r2(totalGravada + totalExenta)
  const totalPagar = r2(subTotal + totalIva)

  return { totalGravada, totalExenta, totalNoSuj: 0, totalDescuento, subTotal, totalIva, totalPagar }
}

export default function NuevoCCFPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState<ItemFacturaInput[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteRow | null>(null)
  const [sucursales, setSucursales] = useState<SucursalRow[]>([])
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [condicion, setCondicion] = useState<1 | 2>(1)
  const [formaPago, setFormaPago] = useState<{ codigo: string; monto: number }[]>([
    { codigo: '01', monto: 0 }
  ])
  const [emitiendo, setEmitiendo] = useState(false)
  const [resultado, setResultado] = useState<{
    ok: boolean; numeroControl?: string; selloRecepcion?: string; error?: string; observaciones?: string[]
  } | null>(null)

  const [clienteOptions, setClienteOptions] = useState<{ value: string; label: string; data: ClienteRow }[]>([])
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [productoOptions, setProductoOptions] = useState<ProductoRow[]>([])
  const [itemEditandoKey, setItemEditandoKey] = useState<string | null>(null)

  const totales = calcularTotales(items)

  useState(() => {
    window.sucursales.listar().then(lista => {
      setSucursales(lista)
      if (lista.length === 1) setSucursalId(lista[0].id)
    })
  })

  const buscarCliente = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setClienteOptions([]); return }
    setBuscandoCliente(true)
    const res = await window.clients.buscar(query)
    // Para CCF, filtrar o mostrar solo contribuyentes con NRC
    setClienteOptions(res.map(c => ({
      value: String(c.id),
      label: c.nrc
        ? `${c.nombre} — NRC: ${c.nrc}`
        : `${c.nombre} — ${c.numDocumento} (sin NRC)`,
      data: c
    })))
    setBuscandoCliente(false)
  }, [])

  const onClienteSelect = (_val: string, opt: { data: ClienteRow }) => {
    const c = opt.data
    if (!c.nrc) {
      message.warning('El cliente seleccionado no tiene NRC. Para emitir un CCF el receptor debe ser contribuyente con NRC registrado.')
    }
    setClienteSeleccionado(c)
    actualizarMontoPago(totales.totalPagar)
  }

  const buscarProducto = useCallback(async (query: string) => {
    if (!query || query.length < 1) { setProductoOptions([]); return }
    const res = await window.products.buscar(query)
    setProductoOptions(res)
  }, [])

  const agregarItem = () => {
    const key = uuidv4()
    setItems(prev => [...prev, {
      key, descripcion: '', cantidad: 1, precioUni: 0, descuento: 0,
      tipoItem: 1, uniMedida: 59, esGravado: true,
      ventaGravada: 0, ventaExenta: 0, ivaItem: 0, total: 0
    }])
  }

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

  const updateItem = (key: string, field: keyof ItemFacturaInput, value: unknown) => {
    setItems(prev => prev.map(item => {
      if (item.key !== key) return item
      return calcularItem({ ...item, [field]: value }) as ItemFacturaInput
    }))
  }

  const eliminarItem = (key: string) => setItems(prev => prev.filter(i => i.key !== key))

  const actualizarMontoPago = (total: number) => {
    setFormaPago(prev => prev.map((p, idx) => idx === 0 ? { ...p, monto: r2(total) } : p))
  }

  const emitir = async () => {
    if (!sucursalId) { message.error('Seleccione una sucursal'); return }
    if (!clienteSeleccionado) { message.error('Debe seleccionar un cliente contribuyente para emitir un CCF'); return }
    if (!clienteSeleccionado.nrc) {
      message.error('El cliente debe tener NRC registrado para emitir un Comprobante de Crédito Fiscal')
      return
    }
    if (items.length === 0) { message.error('Agregue al menos un producto o servicio'); return }
    if (items.some(i => !i.descripcion || i.cantidad <= 0 || i.precioUni <= 0)) {
      message.error('Todos los ítems deben tener descripción, cantidad y precio válidos'); return
    }

    const totalPago = r2(formaPago.reduce((s, p) => s + p.monto, 0))
    if (Math.abs(totalPago - totales.totalPagar) > 0.01) {
      message.error(`Total de pago (${formatCurrency(totalPago)}) no coincide con el total (${formatCurrency(totales.totalPagar)})`); return
    }

    setEmitiendo(true)
    try {
      const result = await window.billing.emitir({
        tipoDte: '03',
        sucursalId,
        clienteId: clienteSeleccionado.id,
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
    } catch {
      message.error('Error inesperado al emitir el CCF')
    } finally {
      setEmitiendo(false)
    }
  }

  const columns: ColumnsType<ItemFacturaInput> = [
    {
      title: '#', width: 40,
      render: (_, __, idx) => <Text type="secondary" style={{ fontSize: 12 }}>{idx + 1}</Text>
    },
    {
      title: 'Producto / Servicio', key: 'descripcion',
      render: (_, record) => (
        <div style={{ minWidth: 200 }}>
          {itemEditandoKey === record.key ? (
            <Select
              showSearch autoFocus style={{ width: '100%' }}
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
            <div onClick={() => setItemEditandoKey(record.key)} style={{ cursor: 'pointer', padding: '4px 0' }}>
              {record.descripcion ? (
                <>
                  {record.codigo && <Tag color="default" style={{ fontSize: 10, marginRight: 4 }}>{record.codigo}</Tag>}
                  <Text>{record.descripcion}</Text>
                </>
              ) : (
                <Text type="secondary"><SearchOutlined /> Seleccionar producto...</Text>
              )}
            </div>
          )}
          {!record.productoId && record.descripcion === '' && (
            <Input
              placeholder="O escribir descripción manual"
              size="small" style={{ marginTop: 4 }}
              onChange={e => updateItem(record.key, 'descripcion', e.target.value)}
            />
          )}
        </div>
      )
    },
    {
      title: 'Tipo', width: 100,
      render: (_, record) => (
        <Select size="small" value={record.tipoItem} style={{ width: 90 }}
          onChange={val => updateItem(record.key, 'tipoItem', val)}
          options={[{ value: 1, label: 'Bien' }, { value: 2, label: 'Servicio' }, { value: 3, label: 'Ambos' }]}
        />
      )
    },
    {
      title: 'U.M.', width: 100,
      render: (_, record) => (
        <Select size="small" value={record.uniMedida} style={{ width: 90 }}
          onChange={val => updateItem(record.key, 'uniMedida', val)}
          options={UNIDADES_MEDIDA.map(u => ({ value: u.codigo, label: u.nombre }))}
        />
      )
    },
    {
      title: 'Cantidad', width: 90,
      render: (_, record) => (
        <InputNumber size="small" min={0.01} step={1} value={record.cantidad} style={{ width: 80 }}
          onChange={val => updateItem(record.key, 'cantidad', val ?? 0)}
        />
      )
    },
    {
      title: 'Precio Unit.', width: 110,
      render: (_, record) => (
        <InputNumber size="small" min={0} step={0.01} precision={2} prefix="$"
          value={record.precioUni} style={{ width: 100 }}
          onChange={val => updateItem(record.key, 'precioUni', val ?? 0)}
        />
      )
    },
    {
      title: 'Descuento', width: 100,
      render: (_, record) => (
        <InputNumber size="small" min={0} step={0.01} precision={2} prefix="$"
          value={record.descuento} style={{ width: 90 }}
          onChange={val => updateItem(record.key, 'descuento', val ?? 0)}
        />
      )
    },
    {
      title: 'IVA', width: 80, align: 'right',
      render: (_, record) => <Text style={{ fontSize: 13 }}>{formatCurrency(record.ivaItem)}</Text>
    },
    {
      title: 'Total', width: 90, align: 'right',
      render: (_, record) => <Text strong style={{ fontSize: 13 }}>{formatCurrency(record.total)}</Text>
    },
    {
      title: '', width: 40,
      render: (_, record) => (
        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => eliminarItem(record.key)} />
      )
    }
  ]

  if (resultado) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto' }}>
        <Card>
          {resultado.ok ? (
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="CCF emitido correctamente"
              subTitle="El Ministerio de Hacienda ha recibido y sellado el comprobante."
              extra={[
                <Button key="nuevo" type="primary" icon={<PlusOutlined />}
                  onClick={() => { setResultado(null); setItems([]); setClienteSeleccionado(null) }}>
                  Nuevo CCF
                </Button>,
                <Button key="lista" onClick={() => navigate('/facturacion/ccf')}>
                  Ver Listado
                </Button>
              ]}
            >
              <Alert type="success" showIcon={false} message={
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
              } />
              {resultado.observaciones && resultado.observaciones.length > 0 && (
                <Alert type="warning" showIcon style={{ marginTop: 12 }}
                  message="Observaciones" description={resultado.observaciones.join(', ')} />
              )}
            </Result>
          ) : (
            <Result
              status="error"
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              title="Error al emitir el CCF"
              subTitle={resultado.error}
              extra={[
                <Button key="retry" type="primary" onClick={() => setResultado(null)}>Corregir y reintentar</Button>,
                <Button key="lista" onClick={() => navigate('/facturacion/ccf')}>Ver Listado</Button>
              ]}
            />
          )}
        </Card>
      </div>
    )
  }

  return (
    <Spin spinning={emitiendo} tip="Firmando y transmitiendo al Ministerio de Hacienda...">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/facturacion/ccf')}>Volver</Button>
          <Title level={4} style={{ margin: 0 }}>Nuevo Comprobante de Crédito Fiscal</Title>
          <Tag color="purple"><BankOutlined /> DTE-03</Tag>
        </div>

        <Alert
          type="info"
          showIcon
          message="CCF para Contribuyentes"
          description="El receptor debe ser un contribuyente registrado ante el MH con NRC vigente."
          style={{ marginBottom: 16 }}
          closable
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={17}>

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

            <Card size="small"
              title={
                <Space>
                  <BankOutlined style={{ color: '#722ed1' }} />
                  Receptor (Contribuyente)
                  {clienteSeleccionado?.nrc
                    ? <Tag color="green">NRC: {clienteSeleccionado.nrc}</Tag>
                    : <Tag color="red">NRC requerido</Tag>
                  }
                </Space>
              }
              style={{ marginBottom: 12 }}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} md={16}>
                  <AutoComplete
                    style={{ width: '100%' }}
                    placeholder="Buscar contribuyente por nombre, NIT o NRC..."
                    options={clienteOptions}
                    onSearch={buscarCliente}
                    onSelect={onClienteSelect}
                    notFoundContent={buscandoCliente ? <Spin size="small" /> : null}
                  />
                </Col>
                <Col xs={24} md={8}>
                  {clienteSeleccionado ? (
                    <Space>
                      <Tag color={clienteSeleccionado.nrc ? 'purple' : 'red'}>
                        {clienteSeleccionado.tipoDocumento}
                      </Tag>
                      <Text style={{ fontSize: 12 }}>{clienteSeleccionado.numDocumento}</Text>
                      <Button size="small" type="text" danger onClick={() => setClienteSeleccionado(null)}>
                        Quitar
                      </Button>
                    </Space>
                  ) : (
                    <Tag color="red">Seleccione un contribuyente</Tag>
                  )}
                </Col>
              </Row>

              {clienteSeleccionado && (
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={24}>
                    <Space wrap>
                      <Text type="secondary" style={{ fontSize: 12 }}>Nombre:</Text>
                      <Text style={{ fontSize: 12 }}>{clienteSeleccionado.nombre}</Text>
                      {clienteSeleccionado.nrc && (
                        <>
                          <Text type="secondary" style={{ fontSize: 12 }}>NRC:</Text>
                          <Text style={{ fontSize: 12 }} strong>{clienteSeleccionado.nrc}</Text>
                        </>
                      )}
                      {clienteSeleccionado.correo && (
                        <>
                          <Text type="secondary" style={{ fontSize: 12 }}>Correo:</Text>
                          <Text style={{ fontSize: 12 }}>{clienteSeleccionado.correo}</Text>
                        </>
                      )}
                    </Space>
                  </Col>
                </Row>
              )}
            </Card>

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
                  dataSource={items} columns={columns} rowKey="key"
                  size="small" pagination={false} scroll={{ x: 860 }}
                  footer={() => (
                    <Button type="dashed" icon={<PlusOutlined />} onClick={agregarItem} style={{ width: '100%' }}>
                      Agregar ítem
                    </Button>
                  )}
                />
              )}
            </Card>

            <Card size="small" title="Forma de Pago" style={{ marginBottom: 12 }}>
              {formaPago.map((pago, idx) => (
                <Row gutter={8} key={idx} align="middle" style={{ marginBottom: 8 }}>
                  <Col xs={12} md={10}>
                    <Select
                      style={{ width: '100%' }}
                      value={pago.codigo}
                      onChange={val => setFormaPago(prev => prev.map((p, i) => i === idx ? { ...p, codigo: val } : p))}
                      options={FORMAS_PAGO.map(f => ({ value: f.codigo, label: f.nombre }))}
                    />
                  </Col>
                  <Col xs={8} md={8}>
                    <InputNumber
                      style={{ width: '100%' }} prefix="$" precision={2} min={0} value={pago.monto}
                      onChange={val => setFormaPago(prev => prev.map((p, i) => i === idx ? { ...p, monto: val ?? 0 } : p))}
                    />
                  </Col>
                  <Col xs={4} md={2}>
                    {idx > 0 && (
                      <Button type="text" danger icon={<DeleteOutlined />}
                        onClick={() => setFormaPago(prev => prev.filter((_, i) => i !== idx))} />
                    )}
                  </Col>
                </Row>
              ))}
              <Button type="dashed" size="small" icon={<PlusOutlined />}
                onClick={() => setFormaPago(prev => [...prev, { codigo: '01', monto: 0 }])}>
                Agregar forma de pago
              </Button>
            </Card>
          </Col>

          <Col xs={24} xl={7}>
            <Card title="Resumen CCF" style={{ position: 'sticky', top: 80 }} size="small">
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
                  <Text strong style={{ fontSize: 15 }}>TOTAL:</Text>
                  <Statistic
                    value={totales.totalPagar}
                    precision={2}
                    formatter={v => formatCurrency(Number(v))}
                    valueStyle={{ fontSize: 20, color: '#722ed1', fontWeight: 700 }}
                  />
                </Row>
                <Divider style={{ margin: '8px 0' }} />

                <Text type="secondary" style={{ fontSize: 12 }}>
                  {items.length} ítem{items.length !== 1 ? 's' : ''}
                  {clienteSeleccionado ? ` | ${clienteSeleccionado.nombre}` : ' | Sin receptor'}
                </Text>

                {!sucursalId && (
                  <Alert type="warning" showIcon message="Seleccione una sucursal" style={{ fontSize: 12 }} />
                )}
                {!clienteSeleccionado && (
                  <Alert type="error" showIcon message="Seleccione un contribuyente" style={{ fontSize: 12 }} />
                )}
                {clienteSeleccionado && !clienteSeleccionado.nrc && (
                  <Alert type="error" showIcon message="El cliente no tiene NRC" style={{ fontSize: 12 }} />
                )}

                <Divider style={{ margin: '8px 0' }} />

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size="large"
                  block
                  loading={emitiendo}
                  disabled={!sucursalId || !clienteSeleccionado || !clienteSeleccionado.nrc || items.length === 0}
                  onClick={emitir}
                  style={{ height: 48, fontSize: 15, background: '#722ed1', borderColor: '#722ed1' }}
                >
                  Emitir CCF DTE-03
                </Button>
                <Button icon={<SaveOutlined />} block disabled={items.length === 0}>
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
