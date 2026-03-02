// ══════════════════════════════════════════════════════════
// LIBRO IVA VENTAS — Contribuyente (CCF) + Consumidor (FAC)
// Requisitos F07 v14 MH El Salvador (desde enero 2025)
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Card, Table, Button, Typography, Row, Col, Statistic,
  DatePicker, Space, message, Tag, Alert, Tabs, Descriptions
} from 'antd'
import {
  FileExcelOutlined, SearchOutlined, DollarOutlined,
  AuditOutlined, FilePdfOutlined, DownloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type ExcelJS from 'exceljs'
import dayjs, { Dayjs } from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Text, Title } = Typography

interface IVARow {
  correlativo: number
  fecha: string
  numeroControl: string
  codigoGeneracion: string
  selloRecepcion: string
  tipoDte: string
  estado: string
  clienteNombre: string
  clienteDocumento: string
  clienteNrc: string
  ventasExentas: number
  ventasNoSujetas: number
  ventasGravadas: number
  iva: number
  total: number
}

// ── Helpers ───────────────────────────────────────────────

function sumField(rows: IVARow[], key: keyof IVARow): number {
  return rows.reduce((a, r) => a + Number(r[key] ?? 0), 0)
}

/** Exportar CSV en formato F07 MH — todas las casillas texto */
function exportarCSVF07(datos: IVARow[], tipo: 'contribuyente' | 'consumidor', periodo: string) {
  let headers: string[]
  let rows: string[][]

  if (tipo === 'contribuyente') {
    headers = ['Correlativo', 'Fecha', 'Tipo DTE', 'N° Control', 'Código Generación', 'Sello Recepción',
      'NRC Receptor', 'NIT/DUI Receptor', 'Nombre Receptor',
      'Gravadas', 'Exentas', 'No Sujetas', 'IVA Débito', 'Total']
    rows = datos.map(r => [
      String(r.correlativo), r.fecha, r.tipoDte, r.numeroControl, r.codigoGeneracion, r.selloRecepcion,
      r.clienteNrc, r.clienteDocumento, `"${r.clienteNombre}"`,
      r.ventasGravadas.toFixed(2), r.ventasExentas.toFixed(2), r.ventasNoSujetas.toFixed(2),
      r.iva.toFixed(2), r.total.toFixed(2)
    ])
  } else {
    headers = ['Correlativo', 'Fecha', 'Tipo DTE', 'N° Control', 'Código Generación', 'Sello Recepción',
      'Nombre Receptor', 'Gravadas', 'Exentas', 'No Sujetas', 'IVA Débito', 'Total']
    rows = datos.map(r => [
      String(r.correlativo), r.fecha, r.tipoDte, r.numeroControl, r.codigoGeneracion, r.selloRecepcion,
      `"${r.clienteNombre}"`,
      r.ventasGravadas.toFixed(2), r.ventasExentas.toFixed(2), r.ventasNoSujetas.toFixed(2),
      r.iva.toFixed(2), r.total.toFixed(2)
    ])
  }

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `libro_ventas_${tipo}_${periodo}.csv`
  a.click()
  URL.revokeObjectURL(url)
  message.success(`CSV F07 ${tipo} exportado`)
}

function exportarXLSX(datos: IVARow[], titulo: string, filename: string) {
  import('exceljs').then(({ default: ExcelJS }) => {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Speeddansys ERP'
    const ws = wb.addWorksheet('Libro IVA Ventas')

    const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1677FF' } }
    const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

    ws.mergeCells('A1:L1')
    const tc = ws.getCell('A1')
    tc.value = titulo
    tc.font = { bold: true, size: 14, color: { argb: 'FF1677FF' } }
    tc.alignment = { horizontal: 'center' }
    ws.getRow(1).height = 28
    ws.addRow([])

    const headers = ['#', 'Fecha', 'N° Control', 'Cód. Generación', 'Sello', 'Tipo', 'Cliente',
      'Documento', 'V. Exentas', 'V. No Sujetas', 'V. Gravadas', 'IVA', 'Total']
    const hdrRow = ws.addRow(headers)
    hdrRow.eachCell(cell => { cell.fill = hdrFill; cell.font = hdrFont; cell.alignment = { horizontal: 'center' } })

    ws.columns = [
      { width: 5 }, { width: 12 }, { width: 26 }, { width: 36 }, { width: 10 }, { width: 7 },
      { width: 28 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 11 }, { width: 12 }
    ]

    const mf = '"$"#,##0.00'
    datos.forEach(r => {
      const row = ws.addRow([r.correlativo, r.fecha, r.numeroControl, r.codigoGeneracion,
      r.selloRecepcion, r.tipoDte === '01' ? 'FAC' : 'CCF', r.clienteNombre, r.clienteDocumento,
      r.ventasExentas, r.ventasNoSujetas, r.ventasGravadas, r.iva, r.total
      ]);
      [9, 10, 11, 12, 13].forEach(c => { row.getCell(c).numFmt = mf })
    })

    ws.addRow([])
    const tot = ws.addRow(['', '', '', '', '', '', 'TOTALES', '',
      sumField(datos, 'ventasExentas'), sumField(datos, 'ventasNoSujetas'),
      sumField(datos, 'ventasGravadas'), sumField(datos, 'iva'), sumField(datos, 'total')
    ]);
    [9, 10, 11, 12, 13].forEach(c => {
      tot.getCell(c).numFmt = mf; tot.getCell(c).font = { bold: true }
    })

    wb.xlsx.writeBuffer().then(buf => {
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      message.success('Excel exportado')
    })
  })
}

// ══════════════════════════════════════════════════════════

export default function LibroVentasPage() {
  const [datos, setDatos] = useState<IVARow[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [mes, setMes] = useState<Dayjs>(dayjs())

  const handleBuscar = async () => {
    setLoading(true)
    try {
      const desde = mes.startOf('month').format('YYYY-MM-DD')
      const hasta = mes.endOf('month').format('YYYY-MM-DD')
      const res = await window.reportes.libroVentas(desde, hasta)
      setDatos(res)
      setBuscado(true)
    } catch {
      message.error('Error al generar el libro de ventas')
    } finally {
      setLoading(false)
    }
  }

  const periodoStr = mes.format('YYYY-MM')
  const periodoLabel = mes.format('MMMM YYYY')

  // Separar CCF vs FAC
  const ccf = datos.filter(r => r.tipoDte === '03')
  const fac = datos.filter(r => r.tipoDte !== '03') // 01 y otros

  const makeColumns = (showNrc: boolean): ColumnsType<IVARow> => [
    { title: '#', dataIndex: 'correlativo', width: 50, align: 'center' },
    {
      title: 'Fecha', dataIndex: 'fecha', width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'N° Control', dataIndex: 'numeroControl', width: 180,
      render: (v: string) => <Text code style={{ fontSize: 10 }}>{v}</Text>
    },
    {
      title: 'Estado', dataIndex: 'estado', width: 90,
      render: (v: string) => (
        <Tag color={v === 'RECIBIDO' ? 'green' : v === 'BORRADOR' ? 'orange' : 'blue'}>{v}</Tag>
      )
    },
    {
      title: 'Cliente', key: 'cliente',
      render: (_, r) => (
        <div>
          <Text>{r.clienteNombre}</Text>
          {r.clienteDocumento && <div><Text type="secondary" style={{ fontSize: 11 }}>{r.clienteDocumento}</Text></div>}
          {showNrc && r.clienteNrc && <div><Text type="secondary" style={{ fontSize: 10 }}>NRC: {r.clienteNrc}</Text></div>}
        </div>
      )
    },
    {
      title: 'V. Exentas', dataIndex: 'ventasExentas', width: 100, align: 'right',
      render: (v: number) => <Text>{formatCurrency(v)}</Text>
    },
    {
      title: 'V. Gravadas', dataIndex: 'ventasGravadas', width: 110, align: 'right',
      render: (v: number) => <Text strong>{formatCurrency(v)}</Text>
    },
    {
      title: 'IVA (13%)', dataIndex: 'iva', width: 100, align: 'right',
      render: (v: number) => <Text>{formatCurrency(v)}</Text>
    },
    {
      title: 'Total', dataIndex: 'total', width: 100, align: 'right',
      render: (v: number) => <Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(v)}</Text>
    }
  ]

  const renderSummary = (rows: IVARow[]) => rows.length > 0 ? (
    <Table.Summary.Row style={{ background: '#e6f4ff' }}>
      <Table.Summary.Cell index={0} colSpan={5} align="right">
        <Text strong>TOTALES ({rows.length} registros):</Text>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={5} align="right"><Text strong>{formatCurrency(sumField(rows, 'ventasExentas'))}</Text></Table.Summary.Cell>
      <Table.Summary.Cell index={6} align="right"><Text strong>{formatCurrency(sumField(rows, 'ventasGravadas'))}</Text></Table.Summary.Cell>
      <Table.Summary.Cell index={7} align="right"><Text strong>{formatCurrency(sumField(rows, 'iva'))}</Text></Table.Summary.Cell>
      <Table.Summary.Cell index={8} align="right"><Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(sumField(rows, 'total'))}</Text></Table.Summary.Cell>
    </Table.Summary.Row>
  ) : null

  // Resumen IVA débito fiscal
  const totalDebitoFiscal = sumField(datos, 'iva')

  return (
    <>
      {/* Controles */}
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
              <Button icon={<DownloadOutlined />} onClick={() => exportarCSVF07(ccf, 'contribuyente', periodoStr)}
                disabled={ccf.length === 0} style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                CSV F07 Contrib.
              </Button>
              <Button icon={<DownloadOutlined />} onClick={() => exportarCSVF07(fac, 'consumidor', periodoStr)}
                disabled={fac.length === 0} style={{ color: '#13c2c2', borderColor: '#13c2c2' }}>
                CSV F07 Consum.
              </Button>
              <Button icon={<FilePdfOutlined />}
                onClick={() => exportarXLSX(datos, `LIBRO IVA VENTAS — ${periodoLabel}`, `libro_ventas_${periodoStr}.xlsx`)}
                disabled={datos.length === 0} style={{ color: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' }}>
                Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {buscado && datos.length === 0 && (
        <Alert type="info" message="No se encontraron ventas en el período seleccionado." style={{ marginBottom: 16 }} />
      )}

      {/* KPIs */}
      {datos.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total DTE" value={datos.length} prefix={<AuditOutlined />}
                suffix={<Text type="secondary" style={{ fontSize: 11 }}> ({ccf.length} CCF + {fac.length} FAC)</Text>} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Ventas Gravadas" value={sumField(datos, 'ventasGravadas')} precision={2}
                formatter={v => formatCurrency(Number(v))} prefix={<DollarOutlined style={{ color: '#52c41a' }} />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="IVA Débito Fiscal" value={totalDebitoFiscal} precision={2}
                formatter={v => formatCurrency(Number(v))} prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14', fontWeight: 700 }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total Ventas" value={sumField(datos, 'total')} precision={2}
                formatter={v => formatCurrency(Number(v))} prefix={<DollarOutlined style={{ color: 'var(--theme-primary)' }} />} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Libro con tabs */}
      <Card title={<Title level={5} style={{ margin: 0 }}>Libro IVA Ventas — {periodoLabel}</Title>}>
        <Tabs
          defaultActiveKey="todos"
          items={[
            {
              key: 'todos',
              label: `Todas las Ventas (${datos.length})`,
              children: (
                <Table dataSource={datos} columns={makeColumns(true)} rowKey="codigoGeneracion"
                  loading={loading} size="small" scroll={{ x: 1100 }}
                  pagination={{ pageSize: 50, showTotal: t => `${t} registros` }}
                  summary={() => renderSummary(datos)} />
              )
            },
            {
              key: 'ccf',
              label: <span style={{ color: '#722ed1' }}>Contribuyente CCF ({ccf.length})</span>,
              children: (
                <>
                  {ccf.length > 0 && (
                    <Descriptions size="small" bordered column={4} style={{ marginBottom: 12 }}>
                      <Descriptions.Item label="Gravadas"><Text strong>{formatCurrency(sumField(ccf, 'ventasGravadas'))}</Text></Descriptions.Item>
                      <Descriptions.Item label="Exentas">{formatCurrency(sumField(ccf, 'ventasExentas'))}</Descriptions.Item>
                      <Descriptions.Item label="IVA Débito"><Text style={{ color: '#faad14' }} strong>{formatCurrency(sumField(ccf, 'iva'))}</Text></Descriptions.Item>
                      <Descriptions.Item label="Total"><Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(sumField(ccf, 'total'))}</Text></Descriptions.Item>
                    </Descriptions>
                  )}
                  <Table dataSource={ccf} columns={makeColumns(true)} rowKey="codigoGeneracion"
                    loading={loading} size="small" scroll={{ x: 1100 }} pagination={false}
                    summary={() => renderSummary(ccf)} />
                </>
              )
            },
            {
              key: 'fac',
              label: <span style={{ color: 'var(--theme-primary)' }}>Consumidor FAC ({fac.length})</span>,
              children: (
                <>
                  {fac.length > 0 && (
                    <Descriptions size="small" bordered column={4} style={{ marginBottom: 12 }}>
                      <Descriptions.Item label="Gravadas"><Text strong>{formatCurrency(sumField(fac, 'ventasGravadas'))}</Text></Descriptions.Item>
                      <Descriptions.Item label="Exentas">{formatCurrency(sumField(fac, 'ventasExentas'))}</Descriptions.Item>
                      <Descriptions.Item label="IVA Débito"><Text style={{ color: '#faad14' }} strong>{formatCurrency(sumField(fac, 'iva'))}</Text></Descriptions.Item>
                      <Descriptions.Item label="Total"><Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(sumField(fac, 'total'))}</Text></Descriptions.Item>
                    </Descriptions>
                  )}
                  <Table dataSource={fac} columns={makeColumns(false)} rowKey="codigoGeneracion"
                    loading={loading} size="small" scroll={{ x: 1100 }} pagination={false}
                    summary={() => renderSummary(fac)} />
                </>
              )
            }
          ]}
        />
      </Card>
    </>
  )
}
