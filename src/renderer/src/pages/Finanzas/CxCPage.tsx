import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Typography, Row, Col, Statistic, Tag, Space,
  Button, Badge, Tooltip, message, Input, Modal, Form, Select, InputNumber, Switch
} from 'antd'
import {
  DollarOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ReloadOutlined, FileExcelOutlined, SearchOutlined,
  PayCircleOutlined, HistoryOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency } from '@utils/format'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function exportarXLSX(datos: CxCItem[]) {
  import('exceljs').then(({ default: ExcelJS }) => {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Speeddansys ERP'
    const ws = wb.addWorksheet('Cuentas por Cobrar')

    // Estilos
    const hdrFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } } as any
    const hdrFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 } as any

    ws.columns = [
      { header: 'N° Control', key: 'numeroControl', width: 30 },
      { header: 'Tipo DTE', key: 'tipoDte', width: 10 },
      { header: 'Cliente', key: 'cliente', width: 35 },
      { header: 'Documento', key: 'documento', width: 18 },
      { header: 'Fecha Emisión', key: 'fechaEmision', width: 15 },
      { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 18 },
      { header: 'Días Restantes', key: 'diasRestantes', width: 16 },
      { header: 'Total ($)', key: 'total', width: 14 },
      { header: 'Estado', key: 'estadoCxC', width: 15 }
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
        numeroControl: item.numeroControl,
        tipoDte: item.tipoDte === '01' ? 'FAC' : 'CCF',
        cliente: item.cliente?.nombre ?? 'Consumidor Final',
        documento: item.cliente?.numDocumento ?? '',
        fechaEmision: item.fechaEmision,
        fechaVencimiento: item.fechaVencimiento,
        diasRestantes: item.diasRestantes,
        total: Number(item.total),
        estadoCxC: item.estadoCxC === 'VENCIDA' ? 'VENCIDA'
          : item.estadoCxC === 'POR_VENCER' ? 'POR VENCER' : 'VIGENTE'
      })

      const totalCell = row.getCell('total')
      totalCell.numFmt = '"$"#,##0.00'
      totalCell.font = { bold: true }

      const estadoCell = row.getCell('estadoCxC')
      if (item.estadoCxC === 'VENCIDA') {
        estadoCell.font = { color: { argb: 'FFFF4D4F' }, bold: true }
      } else if (item.estadoCxC === 'POR_VENCER') {
        estadoCell.font = { color: { argb: 'FFFAAD14' }, bold: true }
      } else {
        estadoCell.font = { color: { argb: 'FF52C41A' }, bold: true }
      }

      const diasCell = row.getCell('diasRestantes')
      if (item.diasRestantes < 0) diasCell.font = { color: { argb: 'FFFF4D4F' } }
      else if (item.diasRestantes <= 5) diasCell.font = { color: { argb: 'FFFAAD14' } }
    })

    // Fila de totales
    ws.addRow([])
    const totalRow = ws.addRow({
      cliente: 'TOTAL GENERAL',
      total: datos.reduce((a, i) => a + i.total, 0)
    })
    totalRow.getCell('cliente').font = { bold: true }
    totalRow.getCell('total').numFmt = '"$"#,##0.00'
    totalRow.getCell('total').font = { bold: true, color: { argb: 'FF1677FF' } }

    wb.xlsx.writeBuffer().then(buf => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cuentas_cobrar_${dayjs().format('YYYY-MM-DD')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    })
  })
}

export default function CxCPage() {
  const [datos, setDatos] = useState<CxCItem[]>([])
  const [resumen, setResumen] = useState<CxCResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarPagadas, setMostrarPagadas] = useState(false)

  // Estados para Modal de Pago
  const [pagoVisible, setPagoVisible] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<CxCItem | null>(null)
  const [montoPago, setMontoPago] = useState<number | null>(null)
  const [metodoPago, setMetodoPago] = useState('01')
  const [referenciaPago, setReferenciaPago] = useState('')
  const [notasPago, setNotasPago] = useState('')
  const [guardandoPago, setGuardandoPago] = useState(false)

  // Estados para Modal de Historial
  const [historialVisible, setHistorialVisible] = useState(false)
  const [historialPagos, setHistorialPagos] = useState<PagoCxCRow[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [lista, res] = await Promise.all([
        window.cxc.listar(),
        window.cxc.resumen()
      ])
      setDatos(lista)
      setResumen(res)
    } catch {
      message.error('Error al cargar cuentas por cobrar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  let datosArea = mostrarPagadas ? datos : datos.filter(d => d.estadoCxC !== 'PAGADA')

  const datosFiltrados = busqueda
    ? datosArea.filter(d =>
      d.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.numeroControl?.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.cliente?.numDocumento?.includes(busqueda)
    )
    : datosArea

  const estadoTag = (estado: string, dias: number) => {
    if (estado === 'PAGADA') return <Tag color="green" icon={<CheckCircleOutlined />}>PAGADA</Tag>
    if (estado === 'ABONADA') return <Tag color="blue" icon={<PayCircleOutlined />}>ABONADA</Tag>
    if (estado === 'VENCIDA') return <Tag color="red" icon={<ExclamationCircleOutlined />}>VENCIDA ({Math.abs(dias)}d atrás)</Tag>
    if (estado === 'POR_VENCER') return <Tag color="orange" icon={<ClockCircleOutlined />}>VENCE EN {dias}d</Tag>
    return <Tag color="green" icon={<CheckCircleOutlined />}>VIGENTE ({dias}d)</Tag>
  }

  const columns: ColumnsType<CxCItem> = [
    {
      title: 'N° Control',
      dataIndex: 'numeroControl',
      key: 'nc',
      width: 200,
      render: (v: string) => <Text code style={{ fontSize: 10 }}>{v?.slice(-18)}</Text>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoDte',
      key: 'tipo',
      width: 70,
      render: (v: string) => <Tag color={v === '01' ? 'blue' : 'purple'}>{v === '01' ? 'FAC' : 'CCF'}</Tag>
    },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, r) => (
        <div>
          <Text>{r.cliente?.nombre ?? 'Consumidor Final'}</Text>
          {r.cliente?.numDocumento && (
            <div><Text type="secondary" style={{ fontSize: 11 }}>{r.cliente.numDocumento}</Text></div>
          )}
        </div>
      )
    },
    {
      title: 'Emisión',
      dataIndex: 'fechaEmision',
      key: 'emision',
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
      width: 100,
      align: 'right',
      render: (v: number) => <Text>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.total - b.total
    },
    {
      title: 'Abonado',
      dataIndex: 'abonado',
      key: 'abonado',
      width: 100,
      align: 'right',
      render: (v: number) => <Text style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Saldo',
      dataIndex: 'saldo',
      key: 'saldo',
      width: 100,
      align: 'right',
      render: (v: number) => <Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.saldo - b.saldo
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 140,
      render: (_, r) => estadoTag(r.estadoCxC, r.diasRestantes),
      filters: [
        { text: 'Pagada', value: 'PAGADA' },
        { text: 'Abonada', value: 'ABONADA' },
        { text: 'Vencida', value: 'VENCIDA' },
        { text: 'Por Vencer', value: 'POR_VENCER' },
        { text: 'Vigente', value: 'VIGENTE' }
      ],
      onFilter: (value, r) => r.estadoCxC === value
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 130,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="Registrar Pago">
            <Button
              type="primary"
              size="small"
              icon={<DollarOutlined />}
              disabled={r.estadoCxC === 'PAGADA'}
              onClick={() => {
                setFacturaSeleccionada(r)
                setMontoPago(r.saldo)
                setMetodoPago('01') // Efectivo
                setReferenciaPago('')
                setNotasPago('')
                setPagoVisible(true)
              }}
            />
          </Tooltip>
          <Tooltip title="Ver Historial Pagos">
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={async () => {
                setFacturaSeleccionada(r)
                setHistorialVisible(true)
                setCargandoHistorial(true)
                try {
                  const pagos = await window.pagos.historial(r.id)
                  setHistorialPagos(pagos)
                } catch (error) {
                  message.error('No se pudo cargar el historial')
                } finally {
                  setCargandoHistorial(false)
                }
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>Cuentas por Cobrar</Title></Col>
        <Col>
          <Space>
            <div style={{ marginRight: 24 }}>
              <Text strong style={{ marginRight: 8 }}>Mostrar Pagadas</Text>
              <Switch checked={mostrarPagadas} onChange={setMostrarPagadas} />
            </div>
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
              title="Total por Cobrar"
              value={resumen?.totalMonto ?? 0}
              precision={2}
              formatter={v => formatCurrency(Number(v))}
              prefix={<DollarOutlined style={{ color: 'var(--theme-primary)' }} />}
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
        title="Facturas a Crédito Pendientes de Cobro"
        extra={
          <Input
            placeholder="Buscar cliente, N° control..."
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
          scroll={{ x: 900 }}
          pagination={{ pageSize: 20, showTotal: t => `${t} documentos` }}
          rowClassName={r =>
            r.estadoCxC === 'VENCIDA' ? 'row-vencida'
              : r.estadoCxC === 'POR_VENCER' ? 'row-por-vencer' : ''
          }
          summary={() => datosFiltrados.length > 0 ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                <Text strong>TOTAL:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ color: 'var(--theme-primary)' }}>
                  {formatCurrency(datosFiltrados.reduce((a, i) => a + i.saldo, 0))}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Space>
                  <Tooltip title="Vencidas">
                    <Badge count={datosFiltrados.filter(d => d.estadoCxC === 'VENCIDA').length} color="red" showZero />
                  </Tooltip>
                  <Tooltip title="Por vencer">
                    <Badge count={datosFiltrados.filter(d => d.estadoCxC === 'POR_VENCER').length} color="orange" showZero />
                  </Tooltip>
                </Space>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null}
        />
      </Card>

      <style>{`
        .row-vencida td { background: rgba(255, 77, 79, 0.04) !important; }
        .row-por-vencer td { background: rgba(250, 173, 20, 0.04) !important; }
      `}</style>

      {/* MODAL: REGISTRAR PAGO */}
      <Modal
        title="Registrar Pago a Cuenta por Cobrar"
        open={pagoVisible}
        onCancel={() => !guardandoPago && setPagoVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPagoVisible(false)} disabled={guardandoPago}>
            Cancelar
          </Button>,
          <Button
            key="full"
            onClick={() => facturaSeleccionada && setMontoPago(facturaSeleccionada.saldo)}
            disabled={guardandoPago}
          >
            Pago Total
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={guardandoPago}
            onClick={async () => {
              if (!facturaSeleccionada || !montoPago || montoPago <= 0) {
                message.error('Debe ingresar un monto válido')
                return
              }
              if (montoPago > facturaSeleccionada.saldo) {
                message.error('El monto no puede ser mayor al saldo pendiente')
                return
              }

              setGuardandoPago(true)
              try {
                await window.pagos.registrar({
                  facturaId: facturaSeleccionada.id,
                  monto: montoPago,
                  metodoPago,
                  referencia: referenciaPago,
                  notas: notasPago
                })
                message.success('Pago registrado correctamente')
                setPagoVisible(false)
                cargar() // Refresca la tabla y KPIs
              } catch (error: any) {
                message.error(error.message || 'Error al guardar el pago')
              } finally {
                setGuardandoPago(false)
              }
            }}
          >
            Guardar Abono
          </Button>
        ]}
      >
        {facturaSeleccionada && (
          <div style={{ marginBottom: 20 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Cliente</Text><br />
                <Text strong>{facturaSeleccionada.cliente?.nombre || 'Consumidor Final'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">N° Control</Text><br />
                <Text>{facturaSeleccionada.numeroControl.slice(-18)}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Total Factura</Text><br />
                <Text strong>{formatCurrency(facturaSeleccionada.total)}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ color: 'var(--theme-primary)' }}>Saldo Pendiente</Text><br />
                <Text strong style={{ fontSize: 18, color: 'var(--theme-primary)' }}>{formatCurrency(facturaSeleccionada.saldo)}</Text>
              </Col>
            </Row>
          </div>
        )}

        <Form layout="vertical">
          <Form.Item label="Monto a Abonar" required>
            <InputNumber
              value={montoPago}
              onChange={setMontoPago}
              style={{ width: '100%' }}
              prefix="$"
              min={0.01}
              max={facturaSeleccionada?.saldo}
              precision={2}
            />
          </Form.Item>

          <Form.Item label="Método de Pago" required>
            <Select value={metodoPago} onChange={setMetodoPago}>
              <Select.Option value="01">01 - Billetes y Monedas (Efectivo)</Select.Option>
              <Select.Option value="02">02 - Tarjeta Débito/Crédito</Select.Option>
              <Select.Option value="03">03 - Cheque</Select.Option>
              <Select.Option value="04">04 - Transferencia Depósito Bancario</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="N° Referencia / Cheque / Transferencia">
            <Input
              value={referenciaPago}
              onChange={e => setReferenciaPago(e.target.value)}
              placeholder="Opcional..."
            />
          </Form.Item>

          <Form.Item label="Notas">
            <Input.TextArea
              value={notasPago}
              onChange={e => setNotasPago(e.target.value)}
              placeholder="Opcional..."
              rows={2}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL: HISTORIAL DE PAGOS */}
      <Modal
        title={`Historial de Pagos - ${facturaSeleccionada?.numeroControl.slice(-10)}`}
        open={historialVisible}
        onCancel={() => setHistorialVisible(false)}
        footer={[<Button key="close" onClick={() => setHistorialVisible(false)}>Cerrar</Button>]}
        width={700}
      >
        <Table
          dataSource={historialPagos}
          rowKey="id"
          loading={cargandoHistorial}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Fecha',
              dataIndex: 'fecha',
              render: v => dayjs(v).format('DD/MM/YYYY HH:mm')
            },
            {
              title: 'Método',
              dataIndex: 'metodoPago',
              render: v => {
                const metodos: Record<string, string> = { '01': 'Efectivo', '02': 'Tarjeta', '03': 'Cheque', '04': 'Transferencia' }
                return metodos[v] || v
              }
            },
            {
              title: 'Referencia',
              dataIndex: 'referencia',
              render: v => v || '-'
            },
            {
              title: 'Monto',
              dataIndex: 'monto',
              align: 'right',
              render: v => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(Number(v))}</Text>
            },
            {
              title: '',
              key: 'anular',
              width: 50,
              render: (_, r) => (
                <Button
                  danger
                  type="text"
                  size="small"
                  onClick={() => {
                    Modal.confirm({
                      title: '¿Anular este abono?',
                      content: 'Esta acción no se puede deshacer y el saldo de la factura regresará a su estado anterior.',
                      okText: 'Sí, Anular',
                      cancelText: 'Cancelar',
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        try {
                          await window.pagos.anular(r.id)
                          message.success('Abono anulado')
                          setHistorialPagos(prev => prev.filter(p => p.id !== r.id))
                          cargar()
                        } catch (e) { message.error('Error al anular') }
                      }
                    })
                  }}
                >
                  Anular
                </Button>
              )
            }
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3} align="right"><Text strong>TOTAL ABONADO:</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong style={{ color: 'var(--theme-primary)' }}>
                  {formatCurrency(historialPagos.reduce((a, i) => a + Number(i.monto), 0))}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}></Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Modal>
    </>
  )
}
