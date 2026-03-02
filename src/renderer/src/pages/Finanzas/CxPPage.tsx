import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Typography, Row, Col, Statistic, Tag, Space,
  Button, Badge, Tooltip, message, Input
} from 'antd'
import {
  DollarOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ReloadOutlined, FileExcelOutlined, SearchOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency } from '@utils/format'
import dayjs from 'dayjs'

const { Title, Text } = Typography

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

  const estadoTag = (estado: string, dias: number) => {
    if (estado === 'VENCIDA') return <Tag color="red" icon={<ExclamationCircleOutlined />}>VENCIDA ({Math.abs(dias)}d atrás)</Tag>
    if (estado === 'POR_VENCER') return <Tag color="orange" icon={<ClockCircleOutlined />}>VENCE EN {dias}d</Tag>
    return <Tag color="green" icon={<CheckCircleOutlined />}>VIGENTE ({dias}d)</Tag>
  }

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
          scroll={{ x: 900 }}
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
            </Table.Summary.Row>
          ) : null}
        />
      </Card>

      <style>{`
        .row-vencida td { background: rgba(255, 77, 79, 0.04) !important; }
        .row-por-vencer td { background: rgba(250, 173, 20, 0.04) !important; }
      `}</style>
    </>
  )
}
