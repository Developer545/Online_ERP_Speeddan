// ══════════════════════════════════════════════════════════
// PÁGINA DE QUINCENA 25 (Decreto 499)
// 50% del salario para empleados ≤$1,500/mes
// Aplicable desde enero 2027 — Sin descuentos
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
    Card, Table, Button, Typography, Space, Tag, Row, Col, Statistic,
    Tooltip, message, InputNumber, Alert
} from 'antd'
import {
    ReloadOutlined, FileExcelOutlined, CalendarOutlined, TeamOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type ExcelJS from 'exceljs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

interface Quincena25Row {
    empleadoId: number
    nombre: string
    cargo: string
    salarioMensual: number
    fechaIngreso: string | null
    monto: number
    aplica: boolean
    esProporcional: boolean
    mesesTrabajados: number
}

export default function Quincena25Page() {
    const [data, setData] = useState<Quincena25Row[]>([])
    const [loading, setLoading] = useState(false)
    const [anio, setAnio] = useState(Math.max(2027, new Date().getFullYear()))

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await (window as any).planilla.quincena25(anio)
            setData(res)
        } catch {
            message.error('Error al calcular Quincena 25')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargar() }, [anio])

    const aplican = data.filter(d => d.aplica)
    const noAplican = data.filter(d => !d.aplica)
    const totalQ25 = aplican.reduce((a, d) => a + d.monto, 0)

    const exportarExcel = async () => {
        if (!aplican.length) return
        try {
            const ExcelJSMod = (await import('exceljs')).default
            const wb = new ExcelJSMod.Workbook()
            wb.creator = 'Speeddansys ERP'
            const ws = wb.addWorksheet('Quincena 25')

            const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFeb2f96' } }
            const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

            ws.mergeCells('A1:G1')
            const tc = ws.getCell('A1')
            tc.value = `QUINCENA 25 — Decreto 499 — ${anio}`
            tc.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
            tc.fill = hdrFill
            tc.alignment = { horizontal: 'center' }
            ws.getRow(1).height = 28

            ws.addRow([])
            const headers = ['#', 'Nombre', 'Cargo', 'Salario', 'Tipo', 'Meses', 'Monto']
            const hdrRow = ws.addRow(headers)
            hdrRow.eachCell(cell => { cell.fill = hdrFill; cell.font = hdrFont; cell.alignment = { horizontal: 'center' } })

            ws.columns = [
                { width: 5 }, { width: 28 }, { width: 16 }, { width: 12 },
                { width: 14 }, { width: 8 }, { width: 12 }
            ]

            const moneyFmt = '"$"#,##0.00'
            aplican.forEach((d, idx) => {
                const row = ws.addRow([
                    idx + 1, d.nombre, d.cargo, d.salarioMensual,
                    d.esProporcional ? 'Proporcional' : 'Completo',
                    d.mesesTrabajados, d.monto
                ])
                row.getCell(4).numFmt = moneyFmt
                row.getCell(7).numFmt = moneyFmt
                if (idx % 2 === 0) {
                    row.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfff0f6' } }
                    })
                }
            })

            ws.addRow([])
            const totRow = ws.addRow(['', 'TOTAL', '', '', '', '', totalQ25])
            totRow.getCell(2).font = { bold: true }
            totRow.getCell(7).numFmt = moneyFmt
            totRow.getCell(7).font = { bold: true, color: { argb: 'FFeb2f96' } }

            const buffer = await wb.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `quincena25_${anio}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
            message.success('Excel exportado')
        } catch {
            message.error('Error al exportar')
        }
    }

    const columns: ColumnsType<Quincena25Row> = [
        {
            title: 'Empleado', key: 'nombre',
            render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{r.nombre}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{r.cargo}</Text>
                </Space>
            )
        },
        {
            title: 'Salario', dataIndex: 'salarioMensual', width: 110, align: 'right' as const,
            render: (v: number) => <Text>{formatCurrency(v)}</Text>
        },
        {
            title: 'Aplica', key: 'aplica', width: 90, align: 'center' as const,
            render: (_, r) => r.aplica
                ? <Tag color="success">Sí</Tag>
                : <Tag color="error">No (≥$1,500)</Tag>
        },
        {
            title: 'Tipo', key: 'tipo', width: 110, align: 'center' as const,
            render: (_, r) => r.aplica ? (
                <Tag color={r.esProporcional ? 'orange' : 'magenta'}>
                    {r.esProporcional ? 'Proporcional' : 'Completa'}
                </Tag>
            ) : <Text type="secondary">—</Text>
        },
        {
            title: 'Monto', dataIndex: 'monto', width: 130, align: 'right' as const,
            render: (v: number) => v > 0
                ? <Text strong style={{ color: '#eb2f96', fontSize: 14 }}>{formatCurrency(v)}</Text>
                : <Text type="secondary">$0.00</Text>
        }
    ]

    return (
        <>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Empleados que aplican" value={aplican.length} prefix={<TeamOutlined style={{ color: '#eb2f96' }} />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="No aplican (≥$1,500)" value={noAplican.length} valueStyle={{ color: '#8c8c8c' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic
                            title="Total Quincena 25"
                            value={totalQ25}
                            precision={2}
                            formatter={v => formatCurrency(Number(v))}
                            valueStyle={{ color: '#eb2f96', fontWeight: 700 }}
                            prefix={<CalendarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Promedio" value={aplican.length ? totalQ25 / aplican.length : 0} precision={2} formatter={v => formatCurrency(Number(v))} />
                    </Card>
                </Col>
            </Row>

            <Card
                title={<Title level={5} style={{ margin: 0 }}><CalendarOutlined style={{ color: '#eb2f96', marginRight: 8 }} />Quincena 25 — Decreto 499</Title>}
                extra={
                    <Space>
                        <Text>Año:</Text>
                        <InputNumber size="small" value={anio} onChange={v => v && setAnio(v)} min={2027} max={2035} style={{ width: 80 }} />
                        <Tooltip title="Actualizar"><Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} /></Tooltip>
                        <Button icon={<FileExcelOutlined />} onClick={exportarExcel} disabled={!aplican.length}
                            style={{ color: '#eb2f96', borderColor: '#eb2f96' }}>Excel</Button>
                    </Space>
                }
            >
                <Alert
                    type="warning"
                    message="Decreto 499 — Vigente desde enero 2027"
                    description="50% del salario mensual para empleados con salario ≤$1,500. Proporcional si <1 año de servicio al 25 de enero. Sin descuentos (ISSS, AFP, ISR). Pago del 15 al 25 de enero."
                    style={{ marginBottom: 12 }}
                />

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="empleadoId"
                    loading={loading}
                    size="small"
                    scroll={{ x: 600 }}
                    pagination={false}
                    summary={() => aplican.length > 0 ? (
                        <Table.Summary.Row style={{ background: '#fff0f6' }}>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <Text strong>TOTAL ({aplican.length} empleados aplican)</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4} align="right">
                                <Text strong style={{ color: '#eb2f96', fontSize: 14 }}>{formatCurrency(totalQ25)}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    ) : undefined}
                />
            </Card>
        </>
    )
}
