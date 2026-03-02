// Notas de Crédito Electrónica (DTE-05)
// Reduce el valor de un DTE previamente emitido

import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Tag, Space, Typography, Tooltip, Badge,
  message, Modal, Form, Input, InputNumber, Select, Divider,
  Row, Col, Statistic, AutoComplete, Result
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, FilePdfOutlined, SearchOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { formatCurrency, formatNumber } from '@utils/format'
import type { FacturaRow } from '@shared/types/billing.types'
import { imprimirFacturaPDF } from '@renderer/utils/factura.pdf'
import { FORMAS_PAGO } from '@shared/constants/catalogs'

const { Title, Text } = Typography

const ESTADO_COLORS: Record<string, string> = {
  RECIBIDO: 'green', RECHAZADO: 'red',
  CONTINGENCIA: 'gold', PENDIENTE_ENVIO: 'blue',
  BORRADOR: 'default', ANULADO: 'default'
}

interface ItemNota {
  key: string
  descripcion: string
  cantidad: number
  precioUni: number
  esGravado: boolean
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

function calcTotales(items: ItemNota[]) {
  let gravada = 0, exenta = 0, iva = 0
  for (const i of items) {
    const base = r2(i.cantidad * i.precioUni)
    if (i.esGravado) { gravada += base; iva += r2(base * 0.13) }
    else exenta += base
  }
  return { gravada: r2(gravada), exenta: r2(exenta), iva: r2(iva), total: r2(gravada + exenta + iva) }
}

export default function NotaCreditoPage() {
  const [notas, setNotas] = useState<FacturaRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Modal Nueva Nota
  const [modalOpen, setModalOpen] = useState(false)
  const [emitiendo, setEmitiendo] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; numeroControl?: string; selloRecepcion?: string; error?: string } | null>(null)
  const [form] = Form.useForm()

  // Búsqueda de DTE relacionado
  const [dteOptions, setDteOptions] = useState<{ value: string; label: string; data: FacturaRow }[]>([])
  const [dteSeleccionado, setDteSeleccionado] = useState<FacturaRow | null>(null)

  // Items de la nota
  const [items, setItems] = useState<ItemNota[]>([])
  const [sucursales, setSucursales] = useState<SucursalRow[]>([])
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [loadingPdf, setLoadingPdf] = useState<number | null>(null)

  const cargar = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const res = await window.billing.listar({ tipoDte: '05', page: p, pageSize })
      setNotas(res.facturas)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar notas de crédito')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    cargar()
    window.sucursales.listar().then(s => {
      setSucursales(s)
      if (s.length > 0) setSucursalId(s[0].id)
    })
  }, []) // eslint-disable-line

  const buscarDTE = async (q: string) => {
    if (q.length < 3) return
    const res = await window.billing.listar({ page: 1, pageSize: 20 })
    const filtered = res.facturas.filter(f =>
      f.tipoDte !== '05' && f.tipoDte !== '06' &&
      (f.numeroControl.toLowerCase().includes(q.toLowerCase()) ||
        f.cliente?.nombre.toLowerCase().includes(q.toLowerCase()))
    )
    setDteOptions(filtered.map(f => ({
      value: f.numeroControl,
      label: `${f.tipoDte === '01' ? 'FAC' : 'CCF'} ${f.numeroControl.slice(-20)} — ${f.cliente?.nombre ?? 'C. Final'} — ${formatCurrency(Number(f.totalPagar))}`,
      data: f
    })))
  }

  const agregarItem = () => {
    setItems(prev => [...prev, { key: Date.now().toString(), descripcion: '', cantidad: 1, precioUni: 0, esGravado: true }])
  }

  const actualizarItem = (key: string, campo: keyof ItemNota, valor: unknown) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, [campo]: valor } : i))
  }

  const eliminarItem = (key: string) => {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  const { gravada, exenta, iva, total: totalItems } = calcTotales(items)

  const handleEmitir = async () => {
    if (!sucursalId) { message.error('Seleccione una sucursal'); return }
    if (!dteSeleccionado) { message.error('Seleccione el DTE relacionado'); return }
    if (items.length === 0) { message.error('Agregue al menos un ítem'); return }
    if (items.some(i => !i.descripcion || i.cantidad <= 0 || i.precioUni <= 0)) {
      message.error('Complete todos los campos de los ítems'); return
    }

    const values = await form.validateFields()
    setEmitiendo(true)
    try {
      const res = await window.billing.emitir({
        tipoDte: '05',
        sucursalId,
        clienteId: undefined,
        documentoRelacionado: {
          tipoDte: dteSeleccionado.tipoDte,
          numDoc: dteSeleccionado.numeroControl,
          fecha: dteSeleccionado.fechaEmision.slice(0, 10)
        },
        items: items.map(i => ({
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUni: i.precioUni,
          descuento: 0,
          tipoItem: 1,
          uniMedida: 59,
          esGravado: i.esGravado
        })),
        formaPago: [{ codigo: values.formaPago, monto: totalItems }],
        condicionOperacion: 1,
        notas: values.notas
      })
      setResultado(res)
      if (res.ok) cargar(1)
    } catch (err: unknown) {
      setResultado({ ok: false, error: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setEmitiendo(false)
    }
  }

  const resetModal = () => {
    setModalOpen(false)
    setResultado(null)
    setDteSeleccionado(null)
    setItems([])
    form.resetFields()
  }

  const handlePDF = async (id: number) => {
    setLoadingPdf(id)
    try {
      const det = await window.billing.getById(id)
      if (det) await imprimirFacturaPDF(det)
    } catch { message.error('Error al generar PDF') }
    finally { setLoadingPdf(null) }
  }

  const totalRecibidas = notas.filter(n => n.estado === 'RECIBIDO').length
  const totalMonto = notas.reduce((a, n) => a + Number(n.totalPagar), 0)

  const columns: ColumnsType<FacturaRow> = [
    {
      title: 'N° Control DTE',
      dataIndex: 'numeroControl',
      key: 'num',
      width: 270,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaEmision',
      key: 'fecha',
      width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, r) => r.cliente?.nombre
        ? <Text>{r.cliente.nombre}</Text>
        : <Text type="secondary">Sin receptor</Text>
    },
    {
      title: 'Total',
      dataIndex: 'totalPagar',
      key: 'total',
      width: 110,
      align: 'right',
      render: (v: number | string) => <Text strong>{formatCurrency(v)}</Text>
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 130,
      render: (v: string) => <Tag color={ESTADO_COLORS[v] || 'default'}>{v.replace('_', ' ')}</Tag>
    },
    {
      title: 'Sello MH',
      dataIndex: 'selloRecepcion',
      key: 'sello',
      width: 100,
      render: (v: string) => v
        ? <Badge status="success" text="Recibido" />
        : <Badge status="default" text="Pendiente" />
    },
    {
      title: 'PDF',
      key: 'pdf',
      width: 60,
      render: (_, record) => (
        <Tooltip title="Descargar PDF">
          <Button
            size="small"
            icon={<FilePdfOutlined />}
            loading={loadingPdf === record.id}
            onClick={() => handlePDF(record.id)}
          />
        </Tooltip>
      )
    }
  ]

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Total Notas de Crédito" value={total} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Recibidas MH" value={totalRecibidas} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Monto Total" value={totalMonto} precision={2} formatter={v => formatCurrency(Number(v))} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>Notas de Crédito Electrónica</Title>
            <Tag color="orange">DTE-05</Tag>
          </Space>
        }
        extra={
          <Space>
            <Tooltip title="Actualizar"><Button icon={<ReloadOutlined />} onClick={() => cargar(1)} loading={loading} /></Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Nueva Nota de Crédito
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={notas}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 900 }}
          pagination={{
            current: page, pageSize, total,
            showTotal: t => `${t} notas de crédito`,
            onChange: p => { setPage(p); cargar(p) }
          }}
        />
      </Card>

      {/* ── Modal nueva nota de crédito ─────────────────────── */}
      <Modal
        title={<Space><span>Nueva Nota de Crédito</span><Tag color="orange">DTE-05</Tag></Space>}
        open={modalOpen}
        onCancel={resetModal}
        footer={null}
        width={780}
        destroyOnClose
      >
        {resultado ? (
          resultado.ok ? (
            <Result
              status="success"
              title="Nota de Crédito emitida exitosamente"
              subTitle={
                <Space direction="vertical">
                  <Text>N° Control: <Text strong>{resultado.numeroControl}</Text></Text>
                  {resultado.selloRecepcion
                    ? <Text type="success">Sello MH: {resultado.selloRecepcion}</Text>
                    : <Text type="warning">Pendiente de envío al MH (contingencia)</Text>}
                </Space>
              }
              extra={[
                <Button type="primary" key="ok" onClick={resetModal}>Cerrar</Button>
              ]}
            />
          ) : (
            <Result
              status="error"
              title="Error al emitir la nota de crédito"
              subTitle={resultado.error}
              extra={[
                <Button key="retry" onClick={() => setResultado(null)}>Reintentar</Button>,
                <Button key="close" onClick={resetModal}>Cerrar</Button>
              ]}
            />
          )
        ) : (
          <Form form={form} layout="vertical" size="middle">
            {/* Sucursal */}
            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item label="Sucursal emisora" required>
                  <Select
                    value={sucursalId}
                    onChange={setSucursalId}
                    options={sucursales.map(s => ({ value: s.id, label: `${s.nombre} — ${s.codMH}` }))}
                    placeholder="Seleccionar sucursal"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" plain style={{ marginTop: 0 }}>Documento Relacionado (DTE original a ajustar)</Divider>
            <Form.Item label="Buscar DTE original (N° control o cliente)" required>
              <AutoComplete
                options={dteOptions}
                onSearch={buscarDTE}
                onSelect={(_: string, option: { value: string; label: string; data: FacturaRow }) => {
                  setDteSeleccionado(option.data)
                }}
                placeholder="Escribe N° control o nombre del cliente..."
                style={{ width: '100%' }}
              />
            </Form.Item>
            {dteSeleccionado && (
              <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                <Space>
                  <Tag color="orange">{dteSeleccionado.tipoDte === '01' ? 'FAC' : 'CCF'}</Tag>
                  <Text strong style={{ fontSize: 12 }}>{dteSeleccionado.numeroControl}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(dteSeleccionado.fechaEmision).format('DD/MM/YYYY')}</Text>
                  <Text style={{ fontSize: 12 }}>{dteSeleccionado.cliente?.nombre ?? 'Consumidor Final'}</Text>
                  <Tag color="blue">{formatCurrency(Number(dteSeleccionado.totalPagar))}</Tag>
                </Space>
              </div>
            )}

            <Divider orientation="left" plain>Ítems a acreditar</Divider>
            <Button size="small" icon={<PlusOutlined />} onClick={agregarItem} style={{ marginBottom: 8 }}>
              Agregar Ítem
            </Button>
            <div style={{ overflowX: 'auto', marginBottom: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left', fontSize: 12 }}>Descripción</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', fontSize: 12, width: 80 }}>Cant.</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', fontSize: 12, width: 100 }}>Precio U.</th>
                    <th style={{ padding: '5px 8px', textAlign: 'center', fontSize: 12, width: 80 }}>Gravado</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right', fontSize: 12, width: 90 }}>Subtotal</th>
                    <th style={{ width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const base = r2(item.cantidad * item.precioUni)
                    const ivaLinea = item.esGravado ? r2(base * 0.13) : 0
                    return (
                      <tr key={item.key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '4px 8px' }}>
                          <Input size="small" value={item.descripcion} placeholder="Concepto a acreditar"
                            onChange={e => actualizarItem(item.key, 'descripcion', e.target.value)} />
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <InputNumber size="small" style={{ width: '100%' }} value={item.cantidad} min={0.01} precision={2}
                            onChange={v => actualizarItem(item.key, 'cantidad', v ?? 1)} />
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <InputNumber size="small" style={{ width: '100%' }} value={item.precioUni} min={0} precision={2} prefix="$"
                            onChange={v => actualizarItem(item.key, 'precioUni', v ?? 0)} />
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                          <input type="checkbox" checked={item.esGravado}
                            onChange={e => actualizarItem(item.key, 'esGravado', e.target.checked)} />
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                          <Text strong>{formatCurrency(base + ivaLinea)}</Text>
                        </td>
                        <td style={{ padding: '4px 8px' }}>
                          <Button size="small" danger type="text" onClick={() => eliminarItem(item.key)}>✕</Button>
                        </td>
                      </tr>
                    )
                  })}
                  {items.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#8c8c8c', fontSize: 12 }}>
                      Sin ítems. Haz clic en "Agregar Ítem".
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {items.length > 0 && (
              <div style={{ textAlign: 'right', background: '#fafafa', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
                <Space direction="vertical" size={2} style={{ textAlign: 'right' }}>
                  {gravada > 0 && <Text>Gravado: <Text strong>{formatCurrency(gravada)}</Text></Text>}
                  {exenta > 0 && <Text>Exento: <Text strong>{formatCurrency(exenta)}</Text></Text>}
                  {iva > 0 && <Text>IVA 13%: <Text strong>{formatCurrency(iva)}</Text></Text>}
                  <Text style={{ fontSize: 14 }}>Total: <Text strong style={{ color: '#fa8c16', fontSize: 14 }}>{formatCurrency(totalItems)}</Text></Text>
                </Space>
              </div>
            )}

            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item label="Forma de Pago" name="formaPago" rules={[{ required: true }]} initialValue="01">
                  <Select options={FORMAS_PAGO.map(fp => ({ value: fp.codigo, label: `${fp.codigo} — ${fp.nombre}` }))} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Notas" name="notas">
                  <Input placeholder="Observaciones (opcional)" />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={resetModal}>Cancelar</Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={emitiendo}
                onClick={handleEmitir}
                style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
              >
                Emitir Nota de Crédito
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </>
  )
}
