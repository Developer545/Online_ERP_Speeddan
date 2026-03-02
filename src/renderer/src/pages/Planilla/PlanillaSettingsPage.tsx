// ══════════════════════════════════════════════════════════
// CONFIGURACIÓN DE PORCENTAJES DE PLANILLA
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import { Card, Table, InputNumber, Button, Typography, Space, message, Tag, Alert, Divider } from 'antd'
import { SaveOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface ConfigRow {
    id: number
    clave: string
    valor: number
    descripcion: string
    topeMaximo: number | null
}

const GRUPO: Record<string, string> = {
    ISSS_EMPLEADO: 'ISSS',
    ISSS_PATRONAL: 'ISSS',
    ISSS_TOPE_SALARIO: 'ISSS',
    AFP_EMPLEADO: 'AFP',
    AFP_PATRONAL: 'AFP',
    INSAFORP: 'INSAFORP/INCAF'
}

export default function PlanillaSettingsPage() {
    const [config, setConfig] = useState<ConfigRow[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editado, setEditado] = useState(false)

    const cargar = async () => {
        setLoading(true)
        try {
            const res = await (window as any).planilla.getConfig()
            setConfig(res)
            setEditado(false)
        } catch {
            message.error('Error al cargar configuración')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        (window as any).planilla.seedConfig().then(() => cargar()).catch(() => cargar())
    }, [])

    const updateValor = (clave: string, valor: number) => {
        setConfig(prev => prev.map(c => c.clave === clave ? { ...c, valor } : c))
        setEditado(true)
    }

    const updateTope = (clave: string, tope: number | null) => {
        setConfig(prev => prev.map(c => c.clave === clave ? { ...c, topeMaximo: tope } : c))
        setEditado(true)
    }

    const guardar = async () => {
        setSaving(true)
        try {
            const items = config.map(c => ({
                clave: c.clave,
                valor: c.valor,
                topeMaximo: c.topeMaximo,
                descripcion: c.descripcion
            }))
            await (window as any).planilla.updateConfig(items)
            message.success('Configuración guardada')
            setEditado(false)
        } catch {
            message.error('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    // Agrupar: ISR vs otros
    const isrConfig = config.filter(c => c.clave.startsWith('ISR_'))
    const otrosConfig = config.filter(c => !c.clave.startsWith('ISR_'))

    return (
        <>
            <Card
                title={
                    <Space>
                        <SettingOutlined style={{ color: '#096dd9' }} />
                        <Title level={5} style={{ margin: 0 }}>Configuración de Planilla</Title>
                    </Space>
                }
                extra={
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={cargar} loading={loading}>Recargar</Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={guardar} loading={saving} disabled={!editado}>
                            Guardar cambios
                        </Button>
                    </Space>
                }
            >
                <Alert
                    type="info"
                    message="Estos porcentajes se usan al generar planillas. Los cambios aplican a futuras planillas, no retroactivos."
                    style={{ marginBottom: 16 }}
                />

                <Title level={5}>Deducciones y Aportes</Title>
                <Table
                    dataSource={otrosConfig}
                    rowKey="clave"
                    loading={loading}
                    size="small"
                    pagination={false}
                    columns={[
                        {
                            title: 'Grupo', key: 'grupo', width: 130,
                            render: (_, r) => <Tag color="blue">{GRUPO[r.clave] ?? 'Otro'}</Tag>
                        },
                        {
                            title: 'Parámetro', dataIndex: 'descripcion', key: 'desc'
                        },
                        {
                            title: 'Valor', key: 'valor', width: 140,
                            render: (_, r) => (
                                <InputNumber
                                    size="small"
                                    value={r.valor}
                                    onChange={v => v !== null && updateValor(r.clave, v)}
                                    step={0.25}
                                    min={0}
                                    style={{ width: '100%' }}
                                    suffix={r.clave.includes('TOPE') || r.clave.includes('SALARIO') ? '$' : '%'}
                                />
                            )
                        },
                        {
                            title: 'Tope Máximo', key: 'tope', width: 130,
                            render: (_, r) => r.topeMaximo !== null ? (
                                <InputNumber
                                    size="small"
                                    value={r.topeMaximo}
                                    onChange={v => updateTope(r.clave, v)}
                                    prefix="$"
                                    min={0}
                                    style={{ width: '100%' }}
                                />
                            ) : <Text type="secondary">—</Text>
                        }
                    ]}
                />

                <Divider />

                <Title level={5}>Tabla ISR — Impuesto sobre la Renta (Tramos Mensuales)</Title>
                <Table
                    dataSource={isrConfig}
                    rowKey="clave"
                    loading={loading}
                    size="small"
                    pagination={false}
                    columns={[
                        {
                            title: 'Parámetro', dataIndex: 'descripcion', key: 'desc'
                        },
                        {
                            title: 'Valor', key: 'valor', width: 160,
                            render: (_, r) => (
                                <InputNumber
                                    size="small"
                                    value={r.valor}
                                    onChange={v => v !== null && updateValor(r.clave, v)}
                                    step={r.clave.includes('PORCENTAJE') ? 1 : 0.01}
                                    min={0}
                                    style={{ width: '100%' }}
                                    suffix={r.clave.includes('PORCENTAJE') ? '%' : '$'}
                                />
                            )
                        }
                    ]}
                />
            </Card>
        </>
    )
}
