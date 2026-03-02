// ══════════════════════════════════════════════════════════
// PÁGINA DE VACACIONES
// Art. 177+ Código de Trabajo de El Salvador
// 15 días + 30% recargo
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
    Card, Table, Button, Typography, Space, Tag, Row, Col, Statistic,
    Tooltip, message, Alert
} from 'antd'
import {
    ReloadOutlined, FileExcelOutlined, SmileOutlined, TeamOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type ExcelJS from 'exceljs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

interface VacacionesRow {
    empleadoId: number
    nombre: string
    cargo: string
    salarioMensual: number
    fechaIngreso: string | null
    monto: number
    dias: number
    esProporcional: boolean
    mesesTrabajados: number
}

export default function VacacionesPage() {
    const [data, setData] = useState<VacacionesRow[]>([])
    const [loading, setLoading] = useState(false)

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await (window as any).planilla.vacaciones()
            setData(res)
        } catch {
            message.error('Error al calcular vacaciones')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const totalVacaciones = data.reduce((a, d) => a + d.monto, 0)

    const exportarExcel = async () => {
        if (!data.length) return
        try {
            const ExcelJSMod = (await import('exceljs')).default
            const wb = new ExcelJSMod.Workbook()
            wb.creator = 'Speeddansys ERP'
            const ws = wb.addWorksheet('Vacaciones')

            const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF13c2c2' } }
            const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

            ws.mergeCells('A1:G1')
            const tc = ws.getCell('A1')
            tc.value = 'CÁLCULO DE VACACIONES'
            tc.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
            tc.fill = hdrFill
            tc.alignment = { horizontal: 'center' }
            ws.getRow(1).height = 28

            ws.addRow([])
            const headers = ['#', 'Nombre', 'Cargo', 'Salario', 'Días', 'Tipo', 'Monto Vacaciones']
            const hdrRow = ws.addRow(headers)
            hdrRow.eachCell(cell => { cell.fill = hdrFill; cell.font = hdrFont; cell.alignment = { horizontal: 'center' } })

            ws.columns = [
                { width: 5 }, { width: 28 }, { width: 16 }, { width: 12 },
                { width: 8 }, { width: 14 }, { width: 16 }
            ]

            const moneyFmt = '"$"#,##0.00'
            data.forEach((d, idx) => {
                const row = ws.addRow([
                    idx + 1, d.nombre, d.cargo, d.salarioMensual,
                    d.dias, d.esProporcional ? 'Proporcional' : 'Completo', d.monto
                ])
                row.getCell(4).numFmt = moneyFmt
                row.getCell(7).numFmt = moneyFmt
                if (idx % 2 === 0) {
                    row.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe6fffb' } }
                    })
                }
            })

            ws.addRow([])
            const totRow = ws.addRow(['', 'TOTAL', '', '', '', '', totalVacaciones])
            totRow.getCell(2).font = { bold: true }
            totRow.getCell(7).numFmt = moneyFmt
            totRow.getCell(7).font = { bold: true, color: { argb: 'FF13c2c2' } }

            const buffer = await wb.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `vacaciones_${new Date().getFullYear()}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
            message.success('Excel exportado')
        } catch {
            message.error('Error al exportar')
        }
    }

    const columns: ColumnsType<VacacionesRow> = [
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
            title: 'Días', dataIndex: 'dias', width: 70, align: 'center' as const,
            render: (v: number) => <Text strong>{v}</Text>
        },
        {
            title: 'Tipo', key: 'tipo', width: 110, align: 'center' as const,
            render: (_, r) => (
                <Tag color={r.esProporcional ? 'orange' : 'cyan'}>
                    {r.esProporcional ? 'Proporcional' : 'Completas'}
                </Tag>
            )
        },
        {
            title: 'Monto Vacaciones', dataIndex: 'monto', width: 150, align: 'right' as const,
            render: (v: number) => <Text strong style={{ color: '#13c2c2', fontSize: 14 }}>{formatCurrency(v)}</Text>
        }
    ]

    return (
        <>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic title="Empleados" value={data.length} prefix={<TeamOutlined style={{ color: '#13c2c2' }} />} />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Total Vacaciones"
                            value={totalVacaciones}
                            precision={2}
                            formatter={v => formatCurrency(Number(v))}
                            valueStyle={{ color: '#13c2c2', fontWeight: 700 }}
                            prefix={<SmileOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic title="Promedio" value={data.length ? totalVacaciones / data.length : 0} precision={2} formatter={v => formatCurrency(Number(v))} />
                    </Card>
                </Col>
            </Row>

            <Card
                title={<Title level={5} style={{ margin: 0 }}><SmileOutlined style={{ color: '#13c2c2', marginRight: 8 }} />Vacaciones</Title>}
                extra={
                    <Space>
                        <Tooltip title="Actualizar"><Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} /></Tooltip>
                        <Button icon={<FileExcelOutlined />} onClick={exportarExcel} style={{ color: '#13c2c2', borderColor: '#13c2c2' }}>Excel</Button>
                    </Space>
                }
            >
                <Alert
                    type="info"
                    message="Vacaciones según Art. 177 CT: 15 días + 30% recargo = 19.5 días de salario tras 1 año de servicio. Proporcional si <1 año."
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
                    summary={() => data.length > 0 ? (
                        <Table.Summary.Row style={{ background: '#e6fffb' }}>
                            <Table.Summary.Cell index={0} colSpan={4}><Text strong>TOTAL ({data.length} empleados)</Text></Table.Summary.Cell>
                            <Table.Summary.Cell index={4} align="right">
                                <Text strong style={{ color: '#13c2c2', fontSize: 14 }}>{formatCurrency(totalVacaciones)}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    ) : undefined}
                />
            </Card>
        </>
    )
}
