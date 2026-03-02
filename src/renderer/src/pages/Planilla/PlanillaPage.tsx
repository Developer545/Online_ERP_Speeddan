// ══════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL DE PLANILLA / NÓMINA
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
    Card, Table, Button, Typography, Space, Tag, Row, Col, Statistic,
    Tooltip, message, Modal, DatePicker, Divider, Descriptions, Alert
} from 'antd'
import {
    PlusOutlined, ReloadOutlined, FileExcelOutlined, CheckCircleOutlined,
    DeleteOutlined, EyeOutlined, DollarOutlined, TeamOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type ExcelJS from 'exceljs'
import dayjs from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

// ── Tipos ─────────────────────────────────────────────────

interface PlanillaRow {
    id: number
    periodo: string
    tipoPago: string
    estado: string
    totalBruto: number
    totalISS: number
    totalAFP: number
    totalRenta: number
    totalDeducciones: number
    totalNeto: number
    totalPatronalISS: number
    totalPatronalAFP: number
    totalINSAFORP: number
    empleados: number
    createdAt: string
}

interface DetalleRow {
    id: number
    empleadoId: number
    nombre: string
    cargo: string
    salarioBruto: number
    isss: number
    afp: number
    renta: number
    otrasDeducciones: number
    totalDeducciones: number
    salarioNeto: number
    isssPatronal: number
    afpPatronal: number
    insaforp: number
}

// ══════════════════════════════════════════════════════════

export default function PlanillaPage() {
    const [planillas, setPlanillas] = useState<PlanillaRow[]>([])
    const [loading, setLoading] = useState(false)
    const [generando, setGenerando] = useState(false)
    const [modalGenerar, setModalGenerar] = useState(false)
    const [periodo, setPeriodo] = useState(dayjs().format('YYYY-MM'))

    // Detalle modal
    const [detalleVisible, setDetalleVisible] = useState(false)
    const [planillaActiva, setPlanillaActiva] = useState<(PlanillaRow & { detalles: DetalleRow[] }) | null>(null)
    const [loadingDetalle, setLoadingDetalle] = useState(false)

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await (window as any).planilla.listar(1, 100)
            setPlanillas(res.planillas)
        } catch {
            message.error('Error al cargar planillas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Seed config defaults on first load
        (window as any).planilla.seedConfig().catch(() => { })
        cargar()
    }, [])

    const handleGenerar = async () => {
        setGenerando(true)
        try {
            const res = await (window as any).planilla.generar(periodo)
            if (res.ok) {
                message.success(`Planilla ${periodo} generada — ${res.empleados} empleados, Neto: ${formatCurrency(res.totalNeto)}`)
                setModalGenerar(false)
                cargar()
            } else {
                message.error(res.error)
            }
        } catch {
            message.error('Error al generar planilla')
        } finally {
            setGenerando(false)
        }
    }

    const verDetalle = async (planilla: PlanillaRow) => {
        setDetalleVisible(true)
        setLoadingDetalle(true)
        try {
            const res = await (window as any).planilla.getById(planilla.id)
            setPlanillaActiva(res)
        } catch {
            message.error('Error al cargar detalle')
        } finally {
            setLoadingDetalle(false)
        }
    }

    const handleAprobar = async (id: number) => {
        Modal.confirm({
            title: '¿Aprobar planilla?',
            content: 'Una vez aprobada no podrá ser eliminada. ¿Desea continuar?',
            okText: 'Sí, aprobar',
            cancelText: 'Cancelar',
            onOk: async () => {
                const res = await (window as any).planilla.aprobar(id)
                if (res.ok) {
                    message.success('Planilla aprobada')
                    cargar()
                    if (planillaActiva?.id === id) {
                        setPlanillaActiva(prev => prev ? { ...prev, estado: 'APROBADA' } : null)
                    }
                } else {
                    message.error(res.error)
                }
            }
        })
    }

    const handleEliminar = async (id: number) => {
        Modal.confirm({
            title: '¿Eliminar planilla?',
            content: 'Se eliminarán todos los detalles permanentemente.',
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                const res = await (window as any).planilla.eliminar(id)
                if (res.ok) {
                    message.success('Planilla eliminada')
                    cargar()
                } else {
                    message.error(res.error)
                }
            }
        })
    }

    // ── Exportar Excel ──────────────────────────────────────

    const exportarExcel = async () => {
        if (!planillaActiva || !planillaActiva.detalles.length) return
        try {
            const ExcelJSMod = (await import('exceljs')).default
            const wb = new ExcelJSMod.Workbook()
            wb.creator = 'Speeddansys ERP'
            const ws = wb.addWorksheet('Planilla Nómina')

            const hdrFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF096dd9' } }
            const hdrFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

            ws.mergeCells('A1:L1')
            const titleCell = ws.getCell('A1')
            titleCell.value = `PLANILLA DE NÓMINA — ${planillaActiva.periodo}`
            titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
            titleCell.fill = hdrFill
            titleCell.alignment = { horizontal: 'center' }
            ws.getRow(1).height = 28

            ws.addRow([])

            const headers = ['#', 'Nombre', 'Cargo', 'Salario Bruto', 'ISSS', 'AFP', 'Renta ISR', 'Otras Ded.', 'Total Ded.', 'Salario Neto', 'ISSS Pat.', 'AFP Pat.']
            const hdrRow = ws.addRow(headers)
            hdrRow.eachCell(cell => {
                cell.fill = hdrFill
                cell.font = hdrFont
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
            })
            hdrRow.height = 22

            ws.columns = [
                { width: 5 }, { width: 28 }, { width: 16 }, { width: 14 }, { width: 10 },
                { width: 10 }, { width: 11 }, { width: 10 }, { width: 11 }, { width: 14 },
                { width: 10 }, { width: 10 }
            ]

            const moneyFmt = '"$"#,##0.00'
            planillaActiva.detalles.forEach((d, idx) => {
                const row = ws.addRow([
                    idx + 1, d.nombre, d.cargo, d.salarioBruto, d.isss, d.afp,
                    d.renta, d.otrasDeducciones, d.totalDeducciones, d.salarioNeto,
                    d.isssPatronal, d.afpPatronal
                ])
                    ;[4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(c => {
                        row.getCell(c).numFmt = moneyFmt
                        row.getCell(c).alignment = { horizontal: 'right' }
                    })
                if (idx % 2 === 0) {
                    row.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe6f4ff' } }
                    })
                }
            })

            ws.addRow([])
            const totRow = ws.addRow([
                '', 'TOTALES', '',
                planillaActiva.totalBruto, planillaActiva.totalISS, planillaActiva.totalAFP,
                planillaActiva.totalRenta, 0, planillaActiva.totalDeducciones, planillaActiva.totalNeto,
                planillaActiva.totalPatronalISS, planillaActiva.totalPatronalAFP
            ])
            totRow.getCell(2).font = { bold: true }
                ;[4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(c => {
                    const cell = totRow.getCell(c)
                    cell.numFmt = moneyFmt
                    cell.font = { bold: true, color: { argb: 'FF096dd9' } }
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFbae7ff' } }
                })

            const buffer = await wb.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `planilla_${planillaActiva.periodo}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
            message.success('Excel exportado')
        } catch {
            message.error('Error al exportar Excel')
        }
    }

    // ── Columnas lista de planillas ─────────────────────────

    const columns: ColumnsType<PlanillaRow> = [
        {
            title: 'Período', key: 'periodo', width: 110,
            render: (_, r) => <Text strong>{r.periodo}</Text>
        },
        {
            title: 'Estado', key: 'estado', width: 110,
            render: (_, r) => (
                <Tag color={r.estado === 'APROBADA' ? 'green' : r.estado === 'PAGADA' ? 'blue' : 'orange'}>
                    {r.estado}
                </Tag>
            )
        },
        {
            title: 'Empleados', dataIndex: 'empleados', key: 'emp', width: 100, align: 'center'
        },
        {
            title: 'Total Bruto', dataIndex: 'totalBruto', key: 'bruto', width: 120, align: 'right',
            render: (v: number) => <Text>{formatCurrency(v)}</Text>
        },
        {
            title: 'Total Ded.', dataIndex: 'totalDeducciones', key: 'ded', width: 110, align: 'right',
            render: (v: number) => <Text type="danger">-{formatCurrency(v)}</Text>
        },
        {
            title: 'Total Neto', dataIndex: 'totalNeto', key: 'neto', width: 120, align: 'right',
            render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>
        },
        {
            title: 'Costo Patronal', key: 'patronal', width: 120, align: 'right',
            render: (_, r) => {
                const total = (r.totalPatronalISS ?? 0) + (r.totalPatronalAFP ?? 0) + (r.totalINSAFORP ?? 0)
                return <Text type="warning">{formatCurrency(total)}</Text>
            }
        },
        {
            title: 'Acciones', key: 'acciones', width: 160,
            render: (_, r) => (
                <Space size="small">
                    <Tooltip title="Ver detalle"><Button size="small" icon={<EyeOutlined />} onClick={() => verDetalle(r)} /></Tooltip>
                    {r.estado === 'BORRADOR' && (
                        <>
                            <Tooltip title="Aprobar"><Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAprobar(r.id)} /></Tooltip>
                            <Tooltip title="Eliminar"><Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleEliminar(r.id)} /></Tooltip>
                        </>
                    )}
                </Space>
            )
        }
    ]

    // ── Columnas detalle ────────────────────────────────────

    const detColumns: ColumnsType<DetalleRow> = [
        {
            title: 'Empleado', key: 'nombre',
            render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{r.nombre}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{r.cargo}</Text>
                </Space>
            )
        },
        { title: 'Salario Bruto', dataIndex: 'salarioBruto', width: 110, align: 'right' as const, render: (v: number) => <Text strong>{formatCurrency(v)}</Text> },
        { title: 'ISSS', dataIndex: 'isss', width: 80, align: 'right' as const, render: (v: number) => <Text type="danger">-{formatCurrency(v)}</Text> },
        { title: 'AFP', dataIndex: 'afp', width: 80, align: 'right' as const, render: (v: number) => <Text type="danger">-{formatCurrency(v)}</Text> },
        {
            title: 'Renta', dataIndex: 'renta', width: 90, align: 'right' as const,
            render: (v: number) => v > 0 ? <Text type="danger">-{formatCurrency(v)}</Text> : <Tag color="success">Exento</Tag>
        },
        { title: 'Total Ded.', dataIndex: 'totalDeducciones', width: 100, align: 'right' as const, render: (v: number) => <Text type="danger" strong>-{formatCurrency(v)}</Text> },
        { title: 'Neto', dataIndex: 'salarioNeto', width: 110, align: 'right' as const, render: (v: number) => <Text strong style={{ color: '#52c41a', fontSize: 14 }}>{formatCurrency(v)}</Text> },
        {
            title: 'Patronal', key: 'patronal', width: 100, align: 'right' as const,
            render: (_, r) => <Text type="warning">{formatCurrency(r.isssPatronal + r.afpPatronal + r.insaforp)}</Text>
        }
    ]

    // ── Totales ──
    const ultimaPlanilla = planillas[0]

    return (
        <>
            {/* KPIs */}
            {ultimaPlanilla && (
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic title="Empleados (última)" value={ultimaPlanilla.empleados} prefix={<TeamOutlined style={{ color: '#096dd9' }} />} />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic title="Total Bruto" value={ultimaPlanilla.totalBruto} precision={2} formatter={v => formatCurrency(Number(v))} valueStyle={{ color: 'var(--theme-primary)' }} />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic title="Total Neto a Pagar" value={ultimaPlanilla.totalNeto} precision={2} formatter={v => formatCurrency(Number(v))} valueStyle={{ color: '#52c41a', fontWeight: 700 }} />
                        </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                        <Card size="small">
                            <Statistic
                                title="Costo Patronal"
                                value={(ultimaPlanilla.totalPatronalISS ?? 0) + (ultimaPlanilla.totalPatronalAFP ?? 0) + (ultimaPlanilla.totalINSAFORP ?? 0)}
                                precision={2}
                                formatter={v => formatCurrency(Number(v))}
                                valueStyle={{ color: '#faad14' }}
                                prefix={<DollarOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Lista de planillas */}
            <Card
                title={<Title level={5} style={{ margin: 0 }}>Planillas Generadas</Title>}
                extra={
                    <Space>
                        <Tooltip title="Actualizar"><Button icon={<ReloadOutlined />} onClick={cargar} loading={loading} /></Tooltip>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalGenerar(true)}>Generar Planilla</Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={planillas}
                    rowKey="id"
                    loading={loading}
                    size="small"
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 20, showTotal: t => `${t} planillas` }}
                />
            </Card>

            {/* Modal generar */}
            <Modal
                title="Generar Nueva Planilla"
                open={modalGenerar}
                onOk={handleGenerar}
                onCancel={() => setModalGenerar(false)}
                okText="Generar"
                confirmLoading={generando}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                        <Text strong>Período:</Text>
                        <DatePicker
                            picker="month"
                            value={dayjs(periodo, 'YYYY-MM')}
                            onChange={d => d && setPeriodo(d.format('YYYY-MM'))}
                            format="MMMM YYYY"
                            style={{ width: '100%', marginTop: 4 }}
                        />
                    </div>
                    <Alert
                        type="info"
                        message="Se calculará la nómina de todos los empleados activos con salario > $0"
                        description="Deducciones: ISSS, AFP, Renta ISR. Aportes patronales: ISSS, AFP, INSAFORP/INCAF."
                    />
                </Space>
            </Modal>

            {/* Modal detalle */}
            <Modal
                title={
                    <Space>
                        <SafetyCertificateOutlined style={{ color: '#096dd9' }} />
                        <span>Detalle Planilla — {planillaActiva?.periodo}</span>
                        {planillaActiva && (
                            <Tag color={planillaActiva.estado === 'APROBADA' ? 'green' : 'orange'}>{planillaActiva.estado}</Tag>
                        )}
                    </Space>
                }
                open={detalleVisible}
                onCancel={() => { setDetalleVisible(false); setPlanillaActiva(null) }}
                width={1100}
                footer={
                    <Space>
                        {planillaActiva?.estado === 'BORRADOR' && (
                            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => planillaActiva && handleAprobar(planillaActiva.id)}>
                                Aprobar
                            </Button>
                        )}
                        <Button icon={<FileExcelOutlined />} onClick={exportarExcel} disabled={!planillaActiva?.detalles?.length}
                            style={{ color: '#096dd9', borderColor: '#096dd9' }}>
                            Excel
                        </Button>
                        <Button onClick={() => { setDetalleVisible(false); setPlanillaActiva(null) }}>Cerrar</Button>
                    </Space>
                }
            >
                {planillaActiva && (
                    <>
                        <Descriptions size="small" bordered column={4} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Total Bruto"><Text strong>{formatCurrency(planillaActiva.totalBruto)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Total Deducciones"><Text type="danger">{formatCurrency(planillaActiva.totalDeducciones)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Total Neto"><Text strong style={{ color: '#52c41a' }}>{formatCurrency(planillaActiva.totalNeto)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Costo Patronal">
                                <Text type="warning">
                                    {formatCurrency((planillaActiva.totalPatronalISS ?? 0) + (planillaActiva.totalPatronalAFP ?? 0) + (planillaActiva.totalINSAFORP ?? 0))}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>

                        <Table
                            columns={detColumns}
                            dataSource={planillaActiva.detalles ?? []}
                            rowKey="id"
                            loading={loadingDetalle}
                            size="small"
                            scroll={{ x: 800 }}
                            pagination={false}
                        />

                        <Divider style={{ marginTop: 24 }} />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            * Tasas vigentes 2025-2026: ISSS empleado 3% (tope $30) · AFP empleado 7.25% ·
                            ISR por tramos (exento ≤$550, 10%, 20%, 30%). Patronal: ISSS 7.5%, AFP 8.75%, INSAFORP 1%.
                            Base ISR = Salario − ISSS − AFP.
                        </Text>
                    </>
                )}
            </Modal>
        </>
    )
}
