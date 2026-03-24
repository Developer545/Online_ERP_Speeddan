import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Typography, Row, Col, Statistic, Tag, Space,
  Button, Badge, Tooltip, message, Input, Modal, Form,
  InputNumber, Select, Descriptions, Divider
} from 'antd'
import {
  DollarOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ReloadOutlined, FileExcelOutlined, SearchOutlined,
  PlusOutlined, HistoryOutlined, DeleteOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency } from '@utils/format'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const METODOS_PAGO = [
  { value: '01', label: 'Efectivo' },
  { value: '02', label: 'Cheque' },
  { value: '03', label: 'Transferencia' },
  { value: '04', label: 'Tarjeta' }
]

function exportarXLSX(datos: CxPItem[]) {
  import('exceljs').then(({ default: ExcelJS }) => {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Speeddansys ERP'
    const ws = wb.addWorksheet('Cuentas por Pagar')

    const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF7875' } }
    const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }

    ws.columns = [
      { header: 'N° Documento', key: 'numeroDocumento', width: 25 },
      { header: 'Tipo Doc', key: 'tipoDocumento', width: 12 },
      { header: 'Proveedor', key: 'proveedor', width: 35 },
      { header: 'NIT Proveedor', key: 'nit', width: 18 },
      { header: 'Fecha Compra', key: 'fecha', width: 15 },
      { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 18 },
      { header: 'Días Restantes', key: 'diasRestantes', width: 16 },
      { header: 'Total ($)', key: 'total', width: 14 },
      { header: 'Estado', key: 'estadoCxP', width: 15 }
    ]

    const hdrRow = ws.getRow(1)
    hdrRow.eachCell(cell => {
      cell.fill = hdrFill
      cell.font = hdrFont
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
    hdrRow.height = 22

    datos.forEach(item => {
      const row = ws.addRow({
        numeroDocumento: item.numeroDocumento,
        tipoDocumento: item.tipoDocumento,
        proveedor: item.proveedor?.nombre ?? 'Sin proveedor',
        nit: item.proveedor?.nit ?? '',
        fecha: item.fecha,
        fechaVencimiento: item.fechaVencimiento,
        diasRestantes: item.diasRestantes,
        total: Number(item.total),
        estadoCxP: item.estadoCxP === 'VENCIDA' ? 'VENCIDA'
          : item.estadoCxP === 'POR_VENCER' ? 'POR VENCER' : 'VIGENTE'
      })

      const totalCell = row.getCell('total')
      totalCell.numFmt = '"$"#,##0.00'
      totalCell.font = { bold: true }

      const estadoCell = row.getCell('estadoCxP')
      if (item.estadoCxP === 'VENCIDA') estadoCell.font = { color: { argb: 'FFFF4D4F' }, bold: true }
      else if (item.estadoCxP === 'POR_VENCER') estadoCell.font = { color: { argb: 'FFFAAD14' }, bold: true }
      else estadoCell.font = { color: { argb: 'FF52C41A' }, bold: true }

      const diasCell = row.getCell('diasRestantes')
      if (item.diasRestantes < 0) diasCell.font = { color: { argb: 'FFFF4D4F' } }
      else if (item.diasRestantes <= 5) diasCell.font = { color: { argb: 'FFFAAD14' } }
    })

    ws.addRow([])
    const totalRow = ws.addRow({
      proveedor: 'TOTAL GENERAL',
      total: datos.reduce((a, i) => a + i.total, 0)
    })
    totalRow.getCell('proveedor').font = { bold: true }
    totalRow.getCell('total').numFmt = '"$"#,##0.00'
    totalRow.getCell('total').font = { bold: true, color: { argb: 'FFFF4D4F' } }

    wb.xlsx.writeBuffer().then(buf => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cuentas_pagar_${dayjs().format('YYYY-MM-DD')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    })
  })
}

export default function CxPPage() {
  const [datos, setDatos] = useState<CxPItem[]>([])
  const [resumen, setResumen] = useState<CxPResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  // Modal registrar pago
  const [pagoModal, setPagoModal] = useState(false)
  const [pagoCompra, setPagoCompra] = useState<CxPItem | null>(null)
  const [pagoLoading, setPagoLoading] = useState(false)
  const [pagoForm] = Form.useForm()

  // Modal historial
  const [histModal, setHistModal] = useState(false)
  const [histCompra, setHistCompra] = useState<CxPItem | null>(null)
  const [histData, setHistData] = useState<PagoCxPRow[]>([])
  const [histLoading, setHistLoading] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [lista, res] = await Promise.all([
        window.cxp.listar(),
        window.cxp.resumen()
      ])
      setDatos(lista)
      setResumen(res)
    } catch {
      message.error('Error al cargar cuentas por pagar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const datosFiltrados = busqueda
    ? datos.filter(d =>
      d.proveedor?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.numeroDocumento?.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.proveedor?.nit?.includes(busqueda)
    )
    : datos

  // ── Abrir modal de pago ─────────────────────────────────
  const abrirPago = (compra: CxPItem) => {
    setPagoCompra(compra)
    pagoForm.resetFields()
    pagoForm.setFieldsValue({ metodoPago: '01' })
    setPagoModal(true)
  }

  // ── Registrar pago ──────────────────────────────────────
  const registrarPago = async (values: { monto: number; metodoPago: string; referencia?: string; notas?: string }) => {
    if (!pagoCompra) return
    setPagoLoading(true)
    try {
      await window.pagos.registrarCxP({
        compraId: pagoCompra.id,
        monto: values.monto,
        metodoPago: values.metodoPago,
        referencia: values.referencia,
        notas: values.notas
      })
      message.success('Pago registrado correctamente')
      setPagoModal(false)
      cargar()
    } catch (err: any) {
      message.error(err?.message ?? 'Error al registrar pago')
    } finally {
      setPagoLoading(false)
    }
  }

  // ── Ver historial de pagos ──────────────────────────────
  const verHistorial = async (compra: CxPItem) => {
    setHistCompra(compra)
    setHistLoading(true)
    setHistModal(true)
    try {
      const hist = await window.pagos.historialCxP(compra.id)
      setHistData(hist)
    } catch {
      message.error('Error al cargar historial')
    } finally {
      setHistLoading(false)
    }
  }

  // ── Anular pago ─────────────────────────────────────────
  const anularPago = (pagoId: number) => {
    Modal.confirm({
      title: 'Anular pago',
      content: '¿Confirma que desea anular este pago? Esta acción no se puede deshacer.',
      okText: 'Anular',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await window.pagos.anularCxP(pagoId)
          message.success('Pago anulado')
          if (histCompra) {
            const hist = await window.pagos.historialCxP(histCompra.id)
            setHistData(hist)
          }
          cargar()
        } catch (err: any) {
          message.error(err?.message ?? 'Error al anular pago')
        }
      }
    })
  }

  const estadoTag = (estado: string, dias: number) => {
    if (estado === 'VENCIDA') return <Tag color="red" icon={<ExclamationCircleOutlined />}>VENCIDA ({Math.abs(dias)}d atrás)</Tag>
    if (estado === 'POR_VENCER') return <Tag color="orange" icon={<ClockCircleOutlined />}>VENCE EN {dias}d</Tag>
    return <Tag color="green" icon={<CheckCircleOutlined />}>VIGENTE ({dias}d)</Tag>
  }

  const metodoPagoLabel = (codigo: string) =>
    METODOS_PAGO.find(m => m.value === codigo)?.label ?? codigo

  const columns: ColumnsType<CxPItem> = [
    {
      title: 'N° Documento',
      dataIndex: 'numeroDocumento',
      key: 'num',
      width: 180,
      render: (v: string) => <Text code>{v}</Text>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoDocumento',
      key: 'tipo',
      width: 90,
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Proveedor',
      key: 'proveedor',
      render: (_, r) => (
        <div>
          <Text>{r.proveedor?.nombre ?? 'Sin proveedor'}</Text>
          {r.proveedor?.nit && (
            <div><Text type="secondary" style={{ fontSize: 11 }}>NIT: {r.proveedor.nit}</Text></div>
          )}
        </div>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Vencimiento',
      dataIndex: 'fechaVencimiento',
      key: 'vence',
      width: 110,
      render: (v: string) => <Text strong>{dayjs(v).format('DD/MM/YYYY')}</Text>
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 110,
      align: 'right',
      render: (v: number) => <Text strong style={{ color: '#ff4d4f' }}>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.total - b.total
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 170,
      render: (_, r) => estadoTag(r.estadoCxP, r.diasRestantes),
      filters: [
        { text: 'Vencida', value: 'VENCIDA' },
        { text: 'Por Vencer', value: 'POR_VENCER' },
        { text: 'Vigente', value: 'VIGENTE' }
      ],
      onFilter: (value, r) => r.estadoCxP === value
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Registrar abono">
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => abrirPago(r)}
            />
          </Tooltip>
          <Tooltip title="Ver historial de pagos">
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => verHistorial(r)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const histColumns: ColumnsType<PagoCxPRow> = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Método',
      dataIndex: 'metodoPago',
      key: 'metodo',
      width: 120,
      render: (v: string) => <Tag>{metodoPagoLabel(v)}</Tag>
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      align: 'right',
      render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Referencia',
      dataIndex: 'referencia',
      key: 'ref',
      render: (v: string | null) => v ? <Text type="secondary">{v}</Text> : <Text type="secondary">—</Text>
    },
    {
      title: '',
      key: 'acc',
      width: 60,
      align: 'center',
      render: (_, r) => (
        <Tooltip title="Anular pago">
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => anularPago(r.id)}
          />
        </Tooltip>
      )
    }
  ]

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>Cuentas por Pagar</Title></Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={cargar} loading={loading}>Actualizar</Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => exportarXLSX(datosFiltrados)}
              disabled={datos.length === 0}
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            >
              Exportar Excel
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Total por Pagar"
              value={resumen?.totalMonto ?? 0}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
              prefix={<DollarOutlined style={{ color: '#ff4d4f' }} />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>{resumen?.totalDocumentos ?? 0} documentos</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 10, borderColor: '#ff4d4f' }}>
            <Statistic
              title="Monto Vencido"
              value={resumen?.montoVencido ?? 0}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>{resumen?.countVencidas ?? 0} documentos</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 10, borderColor: '#faad14' }}>
            <Statistic
              title="Por Vencer (≤5 días)"
              value={resumen?.montoPorVencer ?? 0}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>{resumen?.countPorVencer ?? 0} documentos</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 10, borderColor: '#52c41a' }}>
            <Statistic
              title="Monto Vigente"
              value={resumen?.montoVigente ?? 0}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>{resumen?.countVigentes ?? 0} documentos</Text>
          </Card>
        </Col>
      </Row>

      <Card
        title="Compras a Crédito Pendientes de Pago"
        extra={
          <Input
            placeholder="Buscar proveedor, N° documento..."
            prefix={<SearchOutlined />}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
        }
        style={{ borderRadius: 10 }}
      >
        <Table
          dataSource={datosFiltrados}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 20, showTotal: t => `${t} documentos` }}
          rowClassName={r =>
            r.estadoCxP === 'VENCIDA' ? 'row-vencida'
              : r.estadoCxP === 'POR_VENCER' ? 'row-por-vencer' : ''
          }
          summary={() => datosFiltrados.length > 0 ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                <Text strong>TOTAL:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ color: '#ff4d4f' }}>
                  {formatCurrency(datosFiltrados.reduce((a, i) => a + i.total, 0))}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Space>
                  <Tooltip title="Vencidas">
                    <Badge count={datosFiltrados.filter(d => d.estadoCxP === 'VENCIDA').length} color="red" showZero />
                  </Tooltip>
                  <Tooltip title="Por vencer">
                    <Badge count={datosFiltrados.filter(d => d.estadoCxP === 'POR_VENCER').length} color="orange" showZero />
                  </Tooltip>
                </Space>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} />
            </Table.Summary.Row>
          ) : null}
        />
      </Card>

      {/* Modal: Registrar Abono */}
      <Modal
        title={
          <Space>
            <DollarOutlined style={{ color: '#ff4d4f' }} />
            Registrar Abono — {pagoCompra?.numeroDocumento}
          </Space>
        }
        open={pagoModal}
        onCancel={() => setPagoModal(false)}
        footer={null}
        width={480}
        destroyOnClose
      >
        {pagoCompra && (
          <>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Proveedor" span={2}>
                {pagoCompra.proveedor?.nombre ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Text strong style={{ color: '#ff4d4f' }}>{formatCurrency(pagoCompra.total)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Vencimiento">
                {dayjs(pagoCompra.fechaVencimiento).format('DD/MM/YYYY')}
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '8px 0 16px' }} />

            <Form form={pagoForm} layout="vertical" onFinish={registrarPago}>
              <Form.Item
                name="monto"
                label="Monto del abono"
                rules={[
                  { required: true, message: 'Ingrese el monto' },
                  { type: 'number', min: 0.01, message: 'El monto debe ser mayor a cero' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="$"
                  precision={2}
                  min={0.01}
                  max={pagoCompra.total}
                  placeholder="0.00"
                />
              </Form.Item>

              <Form.Item
                name="metodoPago"
                label="Método de pago"
                rules={[{ required: true, message: 'Seleccione el método' }]}
              >
                <Select options={METODOS_PAGO} />
              </Form.Item>

              <Form.Item name="referencia" label="Referencia / N° cheque / comprobante">
                <Input placeholder="Opcional" />
              </Form.Item>

              <Form.Item name="notas" label="Notas">
                <Input.TextArea rows={2} placeholder="Opcional" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setPagoModal(false)}>Cancelar</Button>
                  <Button type="primary" htmlType="submit" loading={pagoLoading} danger>
                    Registrar Abono
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Modal: Historial de pagos */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            Historial de Pagos — {histCompra?.numeroDocumento}
          </Space>
        }
        open={histModal}
        onCancel={() => setHistModal(false)}
        footer={<Button onClick={() => setHistModal(false)}>Cerrar</Button>}
        width={700}
        destroyOnClose
      >
        {histCompra && (
          <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
            <Descriptions.Item label="Proveedor" span={2}>
              {histCompra.proveedor?.nombre ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Total compra">
              <Text strong style={{ color: '#ff4d4f' }}>{formatCurrency(histCompra.total)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Total abonado">
              <Text strong style={{ color: '#52c41a' }}>
                {formatCurrency(histData.reduce((a, p) => a + Number(p.monto), 0))}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        )}
        <Table
          dataSource={histData}
          columns={histColumns}
          rowKey="id"
          loading={histLoading}
          size="small"
          pagination={false}
          locale={{ emptyText: 'Sin pagos registrados' }}
        />
      </Modal>

      <style>{`
        .row-vencida td { background: rgba(255, 77, 79, 0.04) !important; }
        .row-por-vencer td { background: rgba(250, 173, 20, 0.04) !important; }
      `}</style>
    </>
  )
}
