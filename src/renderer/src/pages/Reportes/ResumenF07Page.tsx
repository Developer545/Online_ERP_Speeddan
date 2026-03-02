// ══════════════════════════════════════════════════════════
// RESUMEN DECLARACIÓN F07 — IVA
// Débito fiscal (ventas) vs Crédito fiscal (compras)
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import {
    Card, Button, Typography, Row, Col, Statistic, DatePicker,
    message, Descriptions, Divider, Alert
} from 'antd'
import {
    SearchOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined,
    AuditOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { formatCurrency } from '@utils/format'

const { Title, Text } = Typography

interface F07Data {
    periodo: string
    ventasContribuyente: { registros: number; gravadas: number; exentas: number; noSujetas: number; iva: number; total: number }
    ventasConsumidor: { registros: number; gravadas: number; exentas: number; noSujetas: number; iva: number; total: number }
    compras: { registros: number; subtotal: number; iva: number; total: number }
    debitoFiscal: number
    creditoFiscal: number
    ivaAPagar: number
    remanente: number
}

export default function ResumenF07Page() {
    const [data, setData] = useState<F07Data | null>(null)
    const [loading, setLoading] = useState(false)
    const [mes, setMes] = useState<Dayjs>(dayjs())

    const handleGenerar = async () => {
        setLoading(true)
        try {
            const res = await window.reportes.resumenF07(mes.format('YYYY-MM'))
            setData(res)
        } catch {
            message.error('Error al generar resumen F07')
        } finally {
            setLoading(false)
        }
    }

    const periodoLabel = mes.format('MMMM YYYY')

    return (
        <>
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col><Text strong>Período tributario:</Text></Col>
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
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerar} loading={loading}>
                            Generar Resumen F07
                        </Button>
                    </Col>
                </Row>
            </Card>

            {data && (
                <>
                    {/* KPI Resultado IVA */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="IVA Débito Fiscal (Ventas)"
                                    value={data.debitoFiscal}
                                    precision={2}
                                    formatter={v => formatCurrency(Number(v))}
                                    prefix={<ArrowUpOutlined style={{ color: '#ff4d4f' }} />}
                                    valueStyle={{ color: '#ff4d4f' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="IVA Crédito Fiscal (Compras)"
                                    value={data.creditoFiscal}
                                    precision={2}
                                    formatter={v => formatCurrency(Number(v))}
                                    prefix={<ArrowDownOutlined style={{ color: '#52c41a' }} />}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small" style={{ border: data.ivaAPagar > 0 ? '2px solid #ff4d4f' : '2px solid #52c41a' }}>
                                <Statistic
                                    title={data.ivaAPagar > 0 ? '💰 IVA A PAGAR AL MH' : '✅ Remanente a favor'}
                                    value={data.ivaAPagar > 0 ? data.ivaAPagar : data.remanente}
                                    precision={2}
                                    formatter={v => formatCurrency(Number(v))}
                                    valueStyle={{
                                        color: data.ivaAPagar > 0 ? '#ff4d4f' : '#52c41a',
                                        fontWeight: 700,
                                        fontSize: 24
                                    }}
                                />
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card size="small">
                                <Statistic
                                    title="Total DTE emitidos"
                                    value={data.ventasContribuyente.registros + data.ventasConsumidor.registros}
                                    prefix={<AuditOutlined />}
                                    suffix={<Text type="secondary" style={{ fontSize: 11 }}>
                                        ({data.ventasContribuyente.registros} CCF + {data.ventasConsumidor.registros} FAC)
                                    </Text>}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Desglose */}
                    <Card title={<Title level={5} style={{ margin: 0 }}>Resumen Declaración F07 — {periodoLabel}</Title>}>

                        <Title level={5} style={{ color: 'var(--theme-primary)' }}>
                            <AuditOutlined /> VENTAS A CONTRIBUYENTES (CCF)
                        </Title>
                        <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Gravadas"><Text strong>{formatCurrency(data.ventasContribuyente.gravadas)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Exentas">{formatCurrency(data.ventasContribuyente.exentas)}</Descriptions.Item>
                            <Descriptions.Item label="No Sujetas">{formatCurrency(data.ventasContribuyente.noSujetas)}</Descriptions.Item>
                            <Descriptions.Item label="IVA Débito"><Text type="danger" strong>{formatCurrency(data.ventasContribuyente.iva)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Total Ventas"><Text strong style={{ color: 'var(--theme-primary)' }}>{formatCurrency(data.ventasContribuyente.total)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Registros">{data.ventasContribuyente.registros}</Descriptions.Item>
                        </Descriptions>

                        <Title level={5} style={{ color: '#13c2c2' }}>
                            <AuditOutlined /> VENTAS A CONSUMIDORES (FAC)
                        </Title>
                        <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Gravadas"><Text strong>{formatCurrency(data.ventasConsumidor.gravadas)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Exentas">{formatCurrency(data.ventasConsumidor.exentas)}</Descriptions.Item>
                            <Descriptions.Item label="No Sujetas">{formatCurrency(data.ventasConsumidor.noSujetas)}</Descriptions.Item>
                            <Descriptions.Item label="IVA Débito"><Text type="danger" strong>{formatCurrency(data.ventasConsumidor.iva)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Total Ventas"><Text strong style={{ color: '#13c2c2' }}>{formatCurrency(data.ventasConsumidor.total)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Registros">{data.ventasConsumidor.registros}</Descriptions.Item>
                        </Descriptions>

                        <Title level={5} style={{ color: '#52c41a' }}>
                            <DollarOutlined /> COMPRAS
                        </Title>
                        <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Subtotal Compras"><Text strong>{formatCurrency(data.compras.subtotal)}</Text></Descriptions.Item>
                            <Descriptions.Item label="IVA Crédito Fiscal"><Text style={{ color: '#52c41a' }} strong>{formatCurrency(data.compras.iva)}</Text></Descriptions.Item>
                            <Descriptions.Item label="Total Compras"><Text strong>{formatCurrency(data.compras.total)}</Text></Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <Title level={5}>⚖️ DETERMINACIÓN DEL IMPUESTO</Title>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="(+) IVA Débito Fiscal (Ventas)">
                                <Text type="danger" strong style={{ fontSize: 16 }}>{formatCurrency(data.debitoFiscal)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="(−) IVA Crédito Fiscal (Compras)">
                                <Text style={{ color: '#52c41a', fontSize: 16 }} strong>{formatCurrency(data.creditoFiscal)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={data.ivaAPagar > 0 ? '= IVA A PAGAR' : '= REMANENTE A FAVOR'} span={2}>
                                <Text strong style={{
                                    fontSize: 22,
                                    color: data.ivaAPagar > 0 ? '#ff4d4f' : '#52c41a'
                                }}>
                                    {formatCurrency(data.ivaAPagar > 0 ? data.ivaAPagar : data.remanente)}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>

                        <Alert
                            type="info"
                            message="Este resumen es un auxiliar para el llenado del formulario F07 en el portal del Ministerio de Hacienda."
                            description="Los montos deben trasladarse al formulario F07 v14 en el portal de la DGII. El cálculo no incluye percepciones ni retenciones de IVA."
                            style={{ marginTop: 16 }}
                        />
                    </Card>
                </>
            )}
        </>
    )
}
