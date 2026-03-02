// Reporte de Rentabilidad por Producto

import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Typography, Space, Tag, Progress,
  Row, Col, Statistic, Tooltip, message, Select
} from 'antd'
import {
  ReloadOutlined, FileExcelOutlined, RiseOutlined, FallOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency } from '@utils/format'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, Cell
} from 'recharts'

const { Title, Text } = Typography

type SortKey = 'margenPct' | 'margenBruto' | 'valorInventario' | 'nombre'

export default function RentabilidadPage() {
  const [datos, setDatos] = useState<RentabilidadRow[]>([])
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('margenPct')
  const [exportando, setExportando] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await window.reportes.rentabilidad()
      setDatos(res)
    } catch {
      message.error('Error al cargar el reporte de rentabilidad')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // KPIs
  const totalProductos = datos.length
  const promedioMargen = datos.length > 0
    ? datos.reduce((a, d) => a + d.margenPct, 0) / datos.length
    : 0
  const valorTotalInventario = datos.reduce((a, d) => a + d.valorInventario, 0)
  const productosRentables = datos.filter(d => d.margenPct >= 20).length

  // Top 10 para el gráfico
  const topChart = [...datos]
    .sort((a, b) => b.margenPct - a.margenPct)
    .slice(0, 10)
    .map(d => ({ nombre: d.nombre.slice(0, 20), margen: Number(d.margenPct.toFixed(1)) }))

  const exportarXLSX = async () => {
    if (datos.length === 0) { message.warning('No hay datos para exportar'); return }
    setExportando(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Speeddansys ERP'
      wb.created = new Date()

      const ws = wb.addWorksheet('Rentabilidad')

      // Título
      ws.mergeCells('A1:J1')
      const titleCell = ws.getCell('A1')
      titleCell.value = `Reporte de Rentabilidad por Producto — ${new Date().toLocaleDateString('es-SV')}`
      titleCell.font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF722ed1' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      ws.getRow(1).height = 28

      // Encabezados
      const headers = ['Código', 'Nombre', 'Categoría', 'Precio Venta', 'Costo Promedio', 'Margen Bruto', 'Margen %', 'Stock', 'Valor Inventario', 'Clasificación']
      const headerRow = ws.addRow(headers)
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF531dab' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFd9d9d9' } } }
      })
      headerRow.height = 20

      ws.columns = [
        { width: 14 }, { width: 30 }, { width: 18 }, { width: 14 },
        { width: 16 }, { width: 14 }, { width: 12 }, { width: 10 }, { width: 16 }, { width: 14 }
      ]

      const sorted = [...datos].sort((a, b) => b.margenPct - a.margenPct)
      sorted.forEach((d, idx) => {
        const clasificacion = d.margenPct >= 30 ? 'Alta' : d.margenPct >= 15 ? 'Media' : 'Baja'
        const row = ws.addRow([
          d.codigo, d.nombre, d.categoria, d.precioVenta, d.costoPromedio,
          d.margenBruto, d.margenPct / 100, d.stockActual, d.valorInventario, clasificacion
        ])

        if (idx % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F0FF' } }
          })
        }

        ;[4, 5, 6, 9].forEach(c => {
          const cell = row.getCell(c)
          cell.numFmt = '"$"#,##0.00'
          cell.alignment = { horizontal: 'right' }
        })
        const margenCell = row.getCell(7)
        margenCell.numFmt = '0.0%'
        margenCell.alignment = { horizontal: 'right' }
        if (d.margenPct >= 30) margenCell.font = { bold: true, color: { argb: 'FF52c41a' } }
        else if (d.margenPct < 10) margenCell.font = { bold: true, color: { argb: 'FFff4d4f' } }
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rentabilidad_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      message.success('Excel exportado correctamente')
    } catch {
      message.error('Error al exportar Excel')
    } finally {
      setExportando(false)
    }
  }

  const sortedDatos = [...datos].sort((a, b) => {
    if (sortKey === 'nombre') return a.nombre.localeCompare(b.nombre)
    return (b[sortKey] as number) - (a[sortKey] as number)
  })

  const columns: ColumnsType<RentabilidadRow> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 110,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>
    },
    {
      title: 'Producto',
      key: 'nombre',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{r.nombre}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.categoria}</Text>
        </Space>
      )
    },
    {
      title: 'Precio Venta',
      dataIndex: 'precioVenta',
      key: 'precio',
      width: 110,
      align: 'right',
      render: (v: number) => <Text>{formatCurrency(v)}</Text>
    },
    {
      title: 'Costo Prom.',
      dataIndex: 'costoPromedio',
      key: 'costo',
      width: 110,
      align: 'right',
      render: (v: number) => <Text type="secondary">{formatCurrency(v)}</Text>
    },
    {
      title: 'Margen Bruto',
      dataIndex: 'margenBruto',
      key: 'margen',
      width: 120,
      align: 'right',
      render: (v: number) => (
        <Text style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }} strong>
          {v >= 0 ? <RiseOutlined /> : <FallOutlined />} {formatCurrency(v)}
        </Text>
      )
    },
    {
      title: 'Margen %',
      dataIndex: 'margenPct',
      key: 'margenPct',
      width: 160,
      render: (v: number) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Progress
            percent={Math.min(Math.max(v, 0), 100)}
            size="small"
            strokeColor={v >= 30 ? '#52c41a' : v >= 15 ? '#faad14' : '#ff4d4f'}
            format={p => <Text style={{ fontSize: 11 }}>{p?.toFixed(1)}%</Text>}
          />
        </Space>
      )
    },
    {
      title: 'Stock',
      dataIndex: 'stockActual',
      key: 'stock',
      width: 80,
      align: 'right',
      render: (v: number) => v
    },
    {
      title: 'Valor Inv.',
      dataIndex: 'valorInventario',
      key: 'valorInv',
      width: 120,
      align: 'right',
      render: (v: number) => <Text>{formatCurrency(v)}</Text>
    },
    {
      title: 'Nivel',
      key: 'nivel',
      width: 80,
      render: (_, r) => {
        if (r.margenPct >= 30) return <Tag color="success">Alta</Tag>
        if (r.margenPct >= 15) return <Tag color="warning">Media</Tag>
        return <Tag color="error">Baja</Tag>
      }
    }
  ]

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Productos" value={totalProductos} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Margen Promedio"
              value={promedioMargen}
              precision={1}
              suffix="%"
              valueStyle={{ color: promedioMargen >= 20 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Valor Inventario"
              value={valorTotalInventario}
              precision={2}
              formatter={(v) => formatCurrency(v as number)}
              valueStyle={{ color: 'var(--theme-primary)' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Rentables (≥20%)"
              value={productosRentables}
              suffix={`/ ${totalProductos}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráfico Top 10 */}
      {topChart.length > 0 && (
        <Card title="Top 10 Productos por Margen %" style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topChart} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="nombre" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <RechartTooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Margen']} />
              <Bar dataKey="margen" radius={[4, 4, 0, 0]}>
                {topChart.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.margen >= 30 ? '#52c41a' : entry.margen >= 15 ? '#faad14' : '#ff4d4f'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card
        title={<Title level={5} style={{ margin: 0 }}>Rentabilidad por Producto</Title>}
        extra={
          <Space>
            <Select
              value={sortKey}
              onChange={setSortKey}
              size="small"
              style={{ width: 160 }}
              options={[
                { value: 'margenPct', label: 'Mayor margen %' },
                { value: 'margenBruto', label: 'Mayor margen $' },
                { value: 'valorInventario', label: 'Mayor valor inv.' },
                { value: 'nombre', label: 'Nombre A-Z' }
              ]}
            />
            <Tooltip title="Actualizar">
              <Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} />
            </Tooltip>
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportarXLSX}
              loading={exportando}
              style={{ color: '#531dab', borderColor: '#531dab' }}
            >
              Excel XLSX
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={sortedDatos}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 980 }}
          pagination={{ pageSize: 25, showTotal: t => `${t} productos` }}
        />
      </Card>
    </>
  )
}
