// Reporte de Nómina / Planilla — El Salvador
// Deducciones: ISSS 3% (tope $30), AFP 7.25%, Renta (ISR por tramos)

import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Typography, Space, Tag,
  Row, Col, Statistic, Tooltip, message, Divider
} from 'antd'
import {
  ReloadOutlined, FileExcelOutlined, TeamOutlined, DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

interface NominaRow {
  id: number
  nombre: string
  cargo: string
  salarioBruto: number
  isss: number
  afp: number
  renta: number
  totalDeducciones: number
  salarioNeto: number
}

// Cálculo de Renta mensual El Salvador (ISR) — tramos 2025-2026 (Decreto 10/2025 MH)
function calcularRenta(salarioBruto: number, isss: number, afp: number): number {
  const base = salarioBruto - isss - afp
  if (base <= 550) return 0
  if (base <= 895.24) return 17.67 + (base - 550) * 0.10
  if (base <= 2038.10) return 60.00 + (base - 895.24) * 0.20
  return 288.57 + (base - 2038.10) * 0.30
}

function calcularNomina(emp: EmpleadoRow): NominaRow {
  const salarioBruto = Number(emp.salario ?? 0)
  const isss = Math.min(salarioBruto * 0.03, 30)    // 3%, tope $30
  const afp = salarioBruto * 0.0725                  // 7.25%
  const renta = calcularRenta(salarioBruto, isss, afp)
  const totalDeducciones = isss + afp + renta
  const salarioNeto = salarioBruto - totalDeducciones

  return {
    id: emp.id,
    nombre: emp.nombre,
    cargo: emp.cargo ?? 'Sin cargo',
    salarioBruto,
    isss,
    afp,
    renta,
    totalDeducciones,
    salarioNeto
  }
}

export default function NominaPage() {
  const [nomina, setNomina] = useState<NominaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [exportando, setExportando] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await window.empleados.listar(1, 500, undefined, undefined)
      const activos = res.empleados.filter(e => e.activo && Number(e.salario ?? 0) > 0)
      setNomina(activos.map(calcularNomina))
    } catch {
      message.error('Error al cargar datos de empleados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Totales
  const totalBruto = nomina.reduce((a, n) => a + n.salarioBruto, 0)
  const totalISS = nomina.reduce((a, n) => a + n.isss, 0)
  const totalAFP = nomina.reduce((a, n) => a + n.afp, 0)
  const totalRenta = nomina.reduce((a, n) => a + n.renta, 0)
  const totalNeto = nomina.reduce((a, n) => a + n.salarioNeto, 0)

  const exportarXLSX = async () => {
    if (nomina.length === 0) { message.warning('No hay empleados para exportar'); return }
    setExportando(true)
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      wb.creator = 'Speeddansys ERP'
      wb.created = new Date()

      const ws = wb.addWorksheet('Nómina')

      // Título
      ws.mergeCells('A1:J1')
      const titleCell = ws.getCell('A1')
      const mes = new Date().toLocaleDateString('es-SV', { month: 'long', year: 'numeric' })
      titleCell.value = `Planilla de Nómina — ${mes}`
      titleCell.font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF096dd9' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      ws.getRow(1).height = 28

      // Info empresa
      ws.mergeCells('A2:J2')
      const empRow = ws.getCell('A2')
      empRow.value = 'Speeddansys ERP — Planilla de Empleados'
      empRow.alignment = { horizontal: 'center' }
      empRow.font = { size: 10, color: { argb: 'FF555555' } }

      ws.addRow([]) // espacio

      // Encabezados
      const headers = ['#', 'Nombre', 'Cargo', 'Salario Bruto', 'ISSS (3%)', 'AFP (7.25%)', 'Renta ISR', 'Total Ded.', 'Salario Neto', 'Firma']
      const headerRow = ws.addRow(headers)
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0050b3' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF002766' } } }
      })
      headerRow.height = 22

      ws.columns = [
        { width: 5 }, { width: 28 }, { width: 20 }, { width: 14 }, { width: 12 },
        { width: 13 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 22 }
      ]

      const moneyFmt = '"$"#,##0.00'

      nomina.forEach((n, idx) => {
        const row = ws.addRow([
          idx + 1, n.nombre, n.cargo,
          n.salarioBruto, n.isss, n.afp, n.renta, n.totalDeducciones, n.salarioNeto, ''
        ])

        if (idx % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe6f4ff' } }
          })
        }

        ;[4, 5, 6, 7, 8, 9].forEach(c => {
          const cell = row.getCell(c)
          cell.numFmt = moneyFmt
          cell.alignment = { horizontal: 'right' }
        })

        // Firma: borde inferior para firmar
        row.getCell(10).border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
        row.height = 20
      })

      ws.addRow([]) // espacio

      // Fila de totales
      const totRow = ws.addRow(['', 'TOTALES', '', totalBruto, totalISS, totalAFP, totalRenta, totalISS + totalAFP + totalRenta, totalNeto, ''])
      totRow.getCell(2).font = { bold: true }
        ;[4, 5, 6, 7, 8, 9].forEach(c => {
          const cell = totRow.getCell(c)
          cell.numFmt = moneyFmt
          cell.alignment = { horizontal: 'right' }
          cell.font = { bold: true, color: { argb: 'FF096dd9' }, size: 11 }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFbae7ff' } }
        })
      totRow.height = 24

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nomina_${new Date().toISOString().slice(0, 7)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      message.success('Planilla exportada correctamente')
    } catch {
      message.error('Error al exportar Excel')
    } finally {
      setExportando(false)
    }
  }

  const columns: ColumnsType<NominaRow> = [
    {
      title: 'Empleado',
      key: 'nombre',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.nombre}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.cargo}</Text>
        </Space>
      )
    },
    {
      title: 'Salario Bruto',
      dataIndex: 'salarioBruto',
      key: 'bruto',
      width: 120,
      align: 'right',
      render: (v: number) => <Text strong>{formatCurrency(v)}</Text>
    },
    {
      title: 'ISSS (3%)',
      dataIndex: 'isss',
      key: 'isss',
      width: 100,
      align: 'right',
      render: (v: number) => <Text type="danger">-{formatCurrency(v)}</Text>
    },
    {
      title: 'AFP (7.25%)',
      dataIndex: 'afp',
      key: 'afp',
      width: 110,
      align: 'right',
      render: (v: number) => <Text type="danger">-{formatCurrency(v)}</Text>
    },
    {
      title: 'Renta ISR',
      dataIndex: 'renta',
      key: 'renta',
      width: 100,
      align: 'right',
      render: (v: number) => (
        <Text style={{ color: v > 0 ? '#ff4d4f' : '#8c8c8c' }}>
          {v > 0 ? `-${formatCurrency(v)}` : <Tag color="success">Exento</Tag>}
        </Text>
      )
    },
    {
      title: 'Total Ded.',
      dataIndex: 'totalDeducciones',
      key: 'deducciones',
      width: 110,
      align: 'right',
      render: (v: number) => <Text type="danger" strong>-{formatCurrency(v)}</Text>
    },
    {
      title: 'Salario Neto',
      dataIndex: 'salarioNeto',
      key: 'neto',
      width: 120,
      align: 'right',
      render: (v: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: 14 }}>{formatCurrency(v)}</Text>
      )
    }
  ]

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Empleados en Nómina"
              value={nomina.length}
              prefix={<TeamOutlined style={{ color: '#096dd9' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Bruto"
              value={totalBruto}
              precision={2}
              formatter={(v) => formatCurrency(v as number)}
              valueStyle={{ color: 'var(--theme-primary)' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Deducciones"
              value={totalISS + totalAFP + totalRenta}
              precision={2}
              formatter={(v) => formatCurrency(v as number)}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Neto a Pagar"
              value={totalNeto}
              precision={2}
              formatter={(v) => formatCurrency(v as number)}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>Planilla de Nómina — {new Date().toLocaleDateString('es-SV', { month: 'long', year: 'numeric' })}</Title>}
        extra={
          <Space>
            <Tooltip title="Actualizar">
              <Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} />
            </Tooltip>
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportarXLSX}
              loading={exportando}
              style={{ color: '#096dd9', borderColor: '#096dd9' }}
            >
              Excel XLSX
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={nomina}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 800 }}
          pagination={false}
          summary={() => nomina.length > 0 ? (
            <Table.Summary.Row style={{ background: '#e6f4ff' }}>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong>TOTALES ({nomina.length} empleados)</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <Text strong>{formatCurrency(totalBruto)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <Text type="danger" strong>-{formatCurrency(totalISS)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <Text type="danger" strong>-{formatCurrency(totalAFP)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Text type="danger" strong>-{formatCurrency(totalRenta)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <Text type="danger" strong>-{formatCurrency(totalISS + totalAFP + totalRenta)}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <Text strong style={{ color: '#52c41a', fontSize: 14 }}>{formatCurrency(totalNeto)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : undefined}
        />

        <Divider style={{ marginTop: 24 }} />
        <Row gutter={[16, 8]}>
          <Col xs={24}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              * Tasas aplicadas: ISSS empleado 3% (tope $30.00) · AFP empleado 7.25% ·
              Renta ISR por tramos mensuales (El Salvador 2025-2026, Decreto 10/2025 MH): $0–$550 exento, $550.01–$895.24 → $17.67 + 10%,
              $895.25–$2,038.10 → $60.00 + 20%, mayor a $2,038.10 → $288.57 + 30%.
              Base imponible ISR = Salario Bruto − ISSS − AFP.
            </Text>
          </Col>
        </Row>
      </Card>
    </>
  )
}
