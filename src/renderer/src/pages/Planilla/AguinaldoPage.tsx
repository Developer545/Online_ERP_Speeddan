// ══════════════════════════════════════════════════════════
// PÁGINA DE AGUINALDO
// Art. 196-202 Código de Trabajo de El Salvador
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
    Card, Table, Button, Typography, Space, Tag, Row, Col, Statistic,
    Tooltip, message, InputNumber, Switch, Alert
} from 'antd'
import {
    ReloadOutlined, FileExcelOutlined, GiftOutlined, TeamOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type ExcelJS from 'exceljs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

interface AguinaldoRow {
    empleadoId: number
    nombre: string
    cargo: string
    salarioMensual: number
    fechaIngreso: string | null
    monto: number
    dias: number
    esProporcional: boolean
    mesesTrabajados: number
    antiguedadAnios: number
}

export default function AguinaldoPage() {
    const [data, setData] = useState<AguinaldoRow[]>([])
    const [loading, setLoading] = useState(false)
    const [anio, setAnio] = useState(new Date().getFullYear())
    const [completo, setCompleto] = useState(false)

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await (window as any).planilla.aguinaldo(anio, completo)
            setData(res)
        } catch {
            message.error('Error al calcular aguinaldo')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargar() }, [anio, completo])

    const totalAguinaldo = data.reduce((a, d) => a + d.monto, 0)

    const exportarExcel = async () => {
        if (!data.length) return
        try {
            const ExcelJSMod = (await import('exceljs')).default
            const wb = new ExcelJSMod.Workbook()
            wb.creator = 'Speeddansys ERP'
            const ws = wb.addWorksheet('Aguinaldo')

            const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF722ed1' } }
            const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

            ws.mergeCells('A1:H1')
            const tc = ws.getCell('A1')
            tc.value = `AGUINALDO ${anio}`
            tc.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
            tc.fill = hdrFill
            tc.alignment = { horizontal: 'center' }
            ws.getRow(1).height = 28

            ws.addRow([])
            const headers = ['#', 'Nombre', 'Cargo', 'Salario', 'Antigüedad', 'Días', 'Tipo', 'Monto']
            const hdrRow = ws.addRow(headers)
            hdrRow.eachCell(cell => { cell.fill = hdrFill; cell.font = hdrFont; cell.alignment = { horizontal: 'center' } })

            ws.columns = [
                { width: 5 }, { width: 28 }, { width: 16 }, { width: 12 },
                { width: 12 }, { width: 8 }, { width: 14 }, { width: 12 }
            ]

            const moneyFmt = '"$"#,##0.00'
            data.forEach((d, idx) => {
                const row = ws.addRow([
                    idx + 1, d.nombre, d.cargo, d.salarioMensual,
                    `${d.antiguedadAnios} años`, d.dias,
                    d.esProporcional ? 'Proporcional' : 'Completo', d.monto
                ])
                row.getCell(4).numFmt = moneyFmt
                row.getCell(8).numFmt = moneyFmt
                if (idx % 2 === 0) {
                    row.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf9f0ff' } }
                    })
                }
            })

            ws.addRow([])
            const totRow = ws.addRow(['', 'TOTAL', '', '', '', '', '', totalAguinaldo])
            totRow.getCell(2).font = { bold: true }
            totRow.getCell(8).numFmt = moneyFmt
            totRow.getCell(8).font = { bold: true, color: { argb: 'FF722ed1' } }

            const buffer = await wb.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `aguinaldo_${anio}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
            message.success('Excel exportado')
        } catch {
            message.error('Error al exportar')
        }
    }

    const columns: ColumnsType<AguinaldoRow> = [
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
            title: 'Antigüedad', key: 'ant', width: 100, align: 'center' as const,
            render: (_, r) => {
                const y = r.antiguedadAnios
                const color = y >= 10 ? 'gold' : y >= 3 ? 'blue' : y >= 1 ? 'green' : 'default'
                return <Tag color={color}>{y.toFixed(1)} años</Tag>
            }
        },
        {
            title: 'Días', dataIndex: 'dias', width: 70, align: 'center' as const,
            render: (v: number) => <Text strong>{v}</Text>
        },
        {
            title: 'Tipo', key: 'tipo', width: 110, align: 'center' as const,
            render: (_, r) => (
                <Tag color={r.esProporcional ? 'orange' : 'green'}>
                    {r.esProporcional ? 'Proporcional' : 'Completo'}
                </Tag>
            )
        },
        {
            title: 'Monto Aguinaldo', dataIndex: 'monto', width: 140, align: 'right' as const,
            render: (v: number) => <Text strong style={{ color: '#722ed1', fontSize: 14 }}>{formatCurrency(v)}</Text>
        }
    ]

    return (
        <>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic title="Empleados" value={data.length} prefix={<TeamOutlined style={{ color: '#722ed1' }} />} />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Total Aguinaldo"
                            value={totalAguinaldo}
                            precision={2}
                            formatter={v => formatCurrency(Number(v))}
                            valueStyle={{ color: '#722ed1', fontWeight: 700 }}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic title="Promedio" value={data.length ? totalAguinaldo / data.length : 0} precision={2} formatter={v => formatCurrency(Number(v))} />
                    </Card>
                </Col>
            </Row>

            <Card
                title={<Title level={5} style={{ margin: 0 }}><GiftOutlined style={{ color: '#722ed1', marginRight: 8 }} />Aguinaldo {anio}</Title>}
                extra={
                    <Space>
                        <Text>Año:</Text>
                        <InputNumber size="small" value={anio} onChange={v => v && setAnio(v)} min={2020} max={2030} style={{ width: 80 }} />
                        <Space size="small">
                            <Text>Completo a todos:</Text>
                            <Switch checked={completo} onChange={setCompleto} size="small" />
                        </Space>
                        <Tooltip title="Actualizar"><Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} /></Tooltip>
                        <Button icon={<FileExcelOutlined />} onClick={exportarExcel} style={{ color: '#722ed1', borderColor: '#722ed1' }}>Excel</Button>
                    </Space>
                }
            >
                <Alert
                    type="info"
                    message="Aguinaldo según Art. 196-202 CT: 1-3 años → 15 días, 3-10 años → 19 días, ≥10 años → 21 días. Sin descuentos (ISSS, AFP, ISR)."
                    style={{ marginBottom: 12 }}
                />

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="empleadoId"
                    loading={loading}
                    size="small"
                    scroll={{ x: 700 }}
                    pagination={false}
                    summary={() => data.length > 0 ? (
                        <Table.Summary.Row style={{ background: '#f9f0ff' }}>
                            <Table.Summary.Cell index={0} colSpan={5}><Text strong>TOTAL ({data.length} empleados)</Text></Table.Summary.Cell>
                            <Table.Summary.Cell index={5} align="right">
                                <Text strong style={{ color: '#722ed1', fontSize: 14 }}>{formatCurrency(totalAguinaldo)}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    ) : undefined}
                />
            </Card>
        </>
    )
}
