// ══════════════════════════════════════════════════════════
// LIBRO IVA COMPRAS
// Formato F07 v14 MH El Salvador (desde enero 2025)
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Card, Table, Button, Typography, Row, Col, Statistic,
  DatePicker, Space, message, Tag, Alert
} from 'antd'
import {
  SearchOutlined, DollarOutlined,
  ShoppingCartOutlined, FilePdfOutlined, DownloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type ExcelJS from 'exceljs'
import dayjs, { Dayjs } from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Text, Title } = Typography

interface CompraRow {
  correlativo: number
  fecha: string
  numeroDocumento: string
  tipoDocumento: string
  proveedorNombre: string
  proveedorNit: string
  proveedorNrc: string
  subtotal: number
  iva: number
  total: number
}

function sumField(rows: CompraRow[], key: keyof CompraRow): number {
  return rows.reduce((a, r) => a + Number(r[key] ?? 0), 0)
}

/** CSV F07 MH — Libro de Compras */
function exportarCSVF07(datos: CompraRow[], periodo: string) {
  const headers = ['Correlativo', 'Fecha', 'Tipo Documento', 'N° Documento',
    'NRC Proveedor', 'NIT Proveedor', 'Nombre Proveedor',
    'Compras Gravadas', 'IVA Crédito Fiscal', 'Compras Exentas', 'Total']
  const rows = datos.map(r => [
    String(r.correlativo), r.fecha, r.tipoDocumento, r.numeroDocumento,
    r.proveedorNrc, r.proveedorNit, `"${r.proveedorNombre}"`,
    r.subtotal.toFixed(2), r.iva.toFixed(2), '0.00', r.total.toFixed(2)
  ])

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `libro_compras_${periodo}.csv`
  a.click()
  URL.revokeObjectURL(url)
  message.success('CSV F07 compras exportado')
}

function exportarXLSX(datos: CompraRow[], periodo: string) {
  import('exceljs').then(({ default: ExcelJS }) => {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Speeddansys ERP'
    const ws = wb.addWorksheet('Libro IVA Compras')

    const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF52C41A' } }
    const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

    ws.mergeCells('A1:I1')
    const tc = ws.getCell('A1')
    tc.value = `LIBRO IVA COMPRAS — ${periodo}`
    tc.font = { bold: true, size: 14, color: { argb: 'FF52C41A' } }
    tc.alignment = { horizontal: 'center' }
    ws.getRow(1).height = 28
    ws.addRow([])

    const headers = ['#', 'Fecha', 'N° Documento', 'Tipo', 'Proveedor', 'NIT', 'Subtotal', 'IVA Crédito', 'Total']
    const hdrRow = ws.addRow(headers)
    hdrRow.eachCell(cell => { cell.fill = hdrFill; cell.font = hdrFont; cell.alignment = { horizontal: 'center' } })

    ws.columns = [
      { width: 5 }, { width: 12 }, { width: 22 }, { width: 12 }, { width: 30 },
      { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }
    ]

    const mf = '"$"#,##0.00'
    datos.forEach((r, idx) => {
      const row = ws.addRow([r.correlativo, r.fecha, r.numeroDocumento, r.tipoDocumento,
      r.proveedorNombre, r.proveedorNit, r.subtotal, r.iva, r.total
      ]);
      [7, 8, 9].forEach(c => { row.getCell(c).numFmt = mf })
      if (idx % 2 === 0) {
        row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf6ffed' } } })
      }
    })

    ws.addRow([])
    const tot = ws.addRow(['', '', '', '', 'TOTALES', '',
      sumField(datos, 'subtotal'), sumField(datos, 'iva'), sumField(datos, 'total')
    ]);
    [7, 8, 9].forEach(c => { tot.getCell(c).numFmt = mf; tot.getCell(c).font = { bold: true } })
    tot.getCell(5).font = { bold: true }

    wb.xlsx.writeBuffer().then(buf => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `libro_compras_${periodo}.xlsx`; a.click()
      URL.revokeObjectURL(url)
      message.success('Excel exportado')
    })
  })
}

export default function LibroComprasPage() {
  const [datos, setDatos] = useState<CompraRow[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [mes, setMes] = useState<Dayjs>(dayjs())

  const handleBuscar = async () => {
    setLoading(true)
    try {
      const desde = mes.startOf('month').format('YYYY-MM-DD')
      const hasta = mes.endOf('month').format('YYYY-MM-DD')
      const res = await window.reportes.libroCompras(desde, hasta)
      setDatos(res)
      setBuscado(true)
    } catch {
      message.error('Error al generar el libro de compras')
    } finally {
      setLoading(false)
    }
  }

  const periodoStr = mes.format('YYYY-MM')
  const periodoLabel = mes.format('MMMM YYYY')

  const totalSubtotal = sumField(datos, 'subtotal')
  const totalIVA = sumField(datos, 'iva')
  const totalGeneral = sumField(datos, 'total')

  const columns: ColumnsType<CompraRow> = [
    { title: '#', dataIndex: 'correlativo', width: 50, align: 'center' },
    {
      title: 'Fecha', dataIndex: 'fecha', width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'N° Documento', dataIndex: 'numeroDocumento', width: 160,
      render: (v: string) => <Text code>{v}</Text>
    },
    {
      title: 'Tipo', dataIndex: 'tipoDocumento', width: 90,
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Proveedor', key: 'proveedor',
      render: (_, r) => (
        <div>
          <Text>{r.proveedorNombre}</Text>
          {r.proveedorNit && <div><Text type="secondary" style={{ fontSize: 11 }}>NIT: {r.proveedorNit}</Text></div>}
        </div>
      )
    },
    {
      title: 'Subtotal', dataIndex: 'subtotal', width: 110, align: 'right',
      render: (v: number) => <Text>{formatCurrency(v)}</Text>
    },
    {
      title: 'IVA Crédito', dataIndex: 'iva', width: 110, align: 'right',
      render: (v: number) => <Text style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>
    },
    {
      title: 'Total', dataIndex: 'total', width: 110, align: 'right',
      render: (v: number) => <Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(v)}</Text>
    }
  ]

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col><Text strong>Mes tributario:</Text></Col>
          <Col>
            <DatePicker
              picker="month"
              value={mes}
              onChange={v => v && setMes(v)}
              format="MMMM YYYY"
              style={{ width: 200 }}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleBuscar} loading={loading}>
                Generar Libro
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => exportarCSVF07(datos, periodoStr)}
                disabled={datos.length === 0} style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                CSV F07
              </Button>
              <Button icon={<FilePdfOutlined />} onClick={() => exportarXLSX(datos, periodoStr)}
                disabled={datos.length === 0} style={{ color: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' }}>
                Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {buscado && datos.length === 0 && (
        <Alert type="info" message="No se encontraron compras en el período seleccionado." style={{ marginBottom: 16 }} />
      )}

      {datos.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Registros" value={datos.length} prefix={<ShoppingCartOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Subtotal Compras" value={totalSubtotal} precision={2}
                formatter={v => formatCurrency(Number(v))} prefix={<DollarOutlined style={{ color: 'var(--theme-primary)' }} />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="IVA Crédito Fiscal" value={totalIVA} precision={2}
                formatter={v => formatCurrency(Number(v))} prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total Compras" value={totalGeneral} precision={2}
                formatter={v => formatCurrency(Number(v))} prefix={<DollarOutlined style={{ color: '#faad14' }} />} />
            </Card>
          </Col>
        </Row>
      )}

      <Card title={<Title level={5} style={{ margin: 0 }}>Libro IVA Compras — {periodoLabel}</Title>}>
        <Table
          dataSource={datos}
          columns={columns}
          rowKey={(r, i) => `${r.fecha}-${r.numeroDocumento}-${i}`}
          loading={loading}
          size="small"
          scroll={{ x: 800 }}
          pagination={{ pageSize: 50, showTotal: t => `${t} registros` }}
          summary={() => datos.length > 0 ? (
            <Table.Summary.Row style={{ background: '#f6ffed' }}>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                <Text strong>TOTALES ({datos.length} registros):</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right"><Text strong>{formatCurrency(totalSubtotal)}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right"><Text strong style={{ color: '#52c41a' }}>{formatCurrency(totalIVA)}</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right"><Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(totalGeneral)}</Text></Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null}
        />
      </Card>
    </>
  )
}
