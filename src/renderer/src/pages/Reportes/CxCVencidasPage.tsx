// ══════════════════════════════════════════════════════════
// REPORTE CxC VENCIDAS — Antigüedad de saldos
// 30 / 60 / 90 / +90 días
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
    Card, Table, Button, Typography, Row, Col, Statistic,
    Tooltip, message, Tag, Space
} from 'antd'
import {
    ReloadOutlined, FileExcelOutlined, WarningOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type ExcelJS from 'exceljs'
import dayjs from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

interface CxCRow {
    facturaId: number
    fecha: string
    numeroControl: string
    clienteNombre: string
    clienteDocumento: string
    total: number
    pagado: number
    saldo: number
    plazo: number
    diasEmision: number
    diasVencido: number
    rango: string
}

const rangoColor: Record<string, string> = {
    'VIGENTE': 'green',
    '1-30': 'gold',
    '31-60': 'orange',
    '61-90': 'volcano',
    '+90': 'red'
}

export default function CxCVencidasPage() {
    const [data, setData] = useState<CxCRow[]>([])
    const [loading, setLoading] = useState(false)

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await window.reportes.cxcVencidas()
            setData(res)
        } catch {
            message.error('Error al cargar CxC vencidas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { cargar() }, [])

    const totalSaldo = data.reduce((a, d) => a + d.saldo, 0)
    const vigentes = data.filter(d => d.rango === 'VIGENTE')
    const vencidas = data.filter(d => d.rango !== 'VIGENTE')
    const saldoVencido = vencidas.reduce((a, d) => a + d.saldo, 0)

    // Resumen por rango
    const rangos = ['VIGENTE', '1-30', '31-60', '61-90', '+90']
    const resumenRangos = rangos.map(r => ({
        rango: r,
        count: data.filter(d => d.rango === r).length,
        saldo: data.filter(d => d.rango === r).reduce((a, d) => a + d.saldo, 0)
    }))

    const exportarExcel = async () => {
        if (!data.length) return
        try {
            const ExcelJSMod = (await import('exceljs')).default
            const wb = new ExcelJSMod.Workbook()
            wb.creator = 'Speeddansys ERP'
            const ws = wb.addWorksheet('CxC Vencidas')

            const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfa541c' } }
            const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

            ws.mergeCells('A1:I1')
            const tc = ws.getCell('A1')
            tc.value = `ANTIGÜEDAD DE CUENTAS POR COBRAR — ${dayjs().format('DD/MM/YYYY')}`
            tc.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
            tc.fill = hdrFill
            tc.alignment = { horizontal: 'center' }
            ws.getRow(1).height = 28
            ws.addRow([])

            const headers = ['#', 'Fecha', 'N° Control', 'Cliente', 'Total', 'Pagado', 'Saldo', 'Días Vencido', 'Rango']
            const hdrRow = ws.addRow(headers)
            hdrRow.eachCell(cell => { cell.fill = hdrFill; cell.font = hdrFont; cell.alignment = { horizontal: 'center' } })

            ws.columns = [
                { width: 5 }, { width: 12 }, { width: 26 }, { width: 28 },
                { width: 12 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 10 }
            ]

            const mf = '"$"#,##0.00'
            data.forEach((d, idx) => {
                const row = ws.addRow([
                    idx + 1, d.fecha, d.numeroControl, d.clienteNombre,
                    d.total, d.pagado, d.saldo, d.diasVencido, d.rango
                ]);
                [5, 6, 7].forEach(c => { row.getCell(c).numFmt = mf })
                if (d.diasVencido > 60) {
                    row.getCell(7).font = { bold: true, color: { argb: 'FFff4d4f' } }
                }
            })

            ws.addRow([])
            const tot = ws.addRow(['', '', '', 'TOTAL', '', '', totalSaldo, '', ''])
            tot.getCell(7).numFmt = mf
            tot.getCell(7).font = { bold: true, color: { argb: 'FFfa541c' } }
            tot.getCell(4).font = { bold: true }

            const buffer = await wb.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `cxc_vencidas_${dayjs().format('YYYYMMDD')}.xlsx`; a.click()
            URL.revokeObjectURL(url)
            message.success('Excel exportado')
        } catch {
            message.error('Error al exportar')
        }
    }

    const columns: ColumnsType<CxCRow> = [
        {
            title: 'Fecha', dataIndex: 'fecha', width: 100,
            render: (v: string) => dayjs(v).format('DD/MM/YYYY')
        },
        {
            title: 'N° Control', dataIndex: 'numeroControl', width: 180,
            render: (v: string) => <Text code style={{ fontSize: 10 }}>{v}</Text>
        },
        {
            title: 'Cliente', key: 'cliente',
            render: (_, r) => (
                <div>
                    <Text strong>{r.clienteNombre}</Text>
                    {r.clienteDocumento && <div><Text type="secondary" style={{ fontSize: 11 }}>{r.clienteDocumento}</Text></div>}
                </div>
            )
        },
        {
            title: 'Total', dataIndex: 'total', width: 100, align: 'right',
            render: (v: number) => <Text>{formatCurrency(v)}</Text>
        },
        {
            title: 'Pagado', dataIndex: 'pagado', width: 100, align: 'right',
            render: (v: number) => <Text style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>
        },
        {
            title: 'Saldo', dataIndex: 'saldo', width: 110, align: 'right',
            render: (v: number) => <Text strong style={{ color: '#fa541c' }}>{formatCurrency(v)}</Text>
        },
        {
            title: 'Plazo', dataIndex: 'plazo', width: 70, align: 'center',
            render: (v: number) => <Text type="secondary">{v}d</Text>
        },
        {
            title: 'Vencido', dataIndex: 'diasVencido', width: 80, align: 'center',
            render: (v: number) => v > 0
                ? <Text strong style={{ color: v > 60 ? '#ff4d4f' : '#faad14' }}>{v}d</Text>
                : <Text style={{ color: '#52c41a' }}>Vigente</Text>
        },
        {
            title: 'Rango', dataIndex: 'rango', width: 80, align: 'center',
            render: (v: string) => <Tag color={rangoColor[v] || 'default'}>{v}</Tag>
        }
    ]

    return (
        <>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Documentos pendientes" value={data.length}
                            prefix={<ClockCircleOutlined style={{ color: '#fa541c' }} />} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Saldo Total CxC" value={totalSaldo} precision={2}
                            formatter={v => formatCurrency(Number(v))}
                            valueStyle={{ color: '#fa541c', fontWeight: 700 }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" style={{ border: saldoVencido > 0 ? '2px solid #ff4d4f' : undefined }}>
                        <Statistic title="Saldo Vencido" value={saldoVencido} precision={2}
                            formatter={v => formatCurrency(Number(v))}
                            prefix={saldoVencido > 0 ? <WarningOutlined style={{ color: '#ff4d4f' }} /> : undefined}
                            valueStyle={{ color: saldoVencido > 0 ? '#ff4d4f' : '#52c41a' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small">
                        <Statistic title="Vigentes" value={vigentes.reduce((a, d) => a + d.saldo, 0)} precision={2}
                            formatter={v => formatCurrency(Number(v))}
                            valueStyle={{ color: '#52c41a' }} />
                    </Card>
                </Col>
            </Row>

            {/* Resumen por rango */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[8, 8]}>
                    {resumenRangos.map(r => (
                        <Col key={r.rango} xs={12} sm={4}>
                            <div style={{ textAlign: 'center' }}>
                                <Tag color={rangoColor[r.rango]} style={{ fontSize: 12, marginBottom: 4 }}>
                                    {r.rango === 'VIGENTE' ? '✅ Vigente' : `⚠️ ${r.rango} días`}
                                </Tag>
                                <div><Text strong>{r.count}</Text> <Text type="secondary">docs</Text></div>
                                <div><Text strong style={{ color: rangoColor[r.rango] === 'green' ? '#52c41a' : '#fa541c' }}>
                                    {formatCurrency(r.saldo)}
                                </Text></div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Card>

            <Card
                title={<Title level={5} style={{ margin: 0 }}><WarningOutlined style={{ color: '#fa541c', marginRight: 8 }} />Antigüedad de Cuentas por Cobrar</Title>}
                extra={
                    <Space>
                        <Tooltip title="Actualizar"><Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} /></Tooltip>
                        <Button icon={<FileExcelOutlined />} onClick={exportarExcel} disabled={!data.length}
                            style={{ color: '#fa541c', borderColor: '#fa541c' }}>Excel</Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="facturaId"
                    loading={loading}
                    size="small"
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 50, showTotal: t => `${t} documentos` }}
                    summary={() => data.length > 0 ? (
                        <Table.Summary.Row style={{ background: '#fff2e8' }}>
                            <Table.Summary.Cell index={0} colSpan={5} align="right">
                                <Text strong>TOTAL ({data.length} docs):</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={5} align="right"><Text strong style={{ color: '#fa541c' }}>{formatCurrency(totalSaldo)}</Text></Table.Summary.Cell>
                            <Table.Summary.Cell index={6} colSpan={3} />
                        </Table.Summary.Row>
                    ) : null}
                />
            </Card>
        </>
    )
}
