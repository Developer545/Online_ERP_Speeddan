import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card, Table, Button, Form, Modal, Select, Space, Row, Col,
  Statistic, message, Tag, Popconfirm, Typography, InputNumber
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, LockOutlined, UnlockOutlined,
  CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const ESTADO_COLORS: Record<string, string> = {
  ABIERTO: 'green',
  CERRADO: 'red'
}

export default function PeriodosContablesPage() {
  const [periodos, setPeriodos] = useState<PeriodoContableRow[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroAnio, setFiltroAnio] = useState<number | undefined>()

  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form] = Form.useForm()

  // ── Cargar datos ──────────────────────────────────────────
  const cargar = useCallback(async (anio = filtroAnio) => {
    setLoading(true)
    try {
      const res = await window.contabilidad.listarPeriodos(anio)
      setPeriodos(res)
    } catch {
      message.error('Error al cargar períodos contables')
    } finally {
      setLoading(false)
    }
  }, [filtroAnio])

  useEffect(() => {
    cargar()
  }, []) // eslint-disable-line

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = periodos.length
    const abiertos = periodos.filter(p => p.estado === 'ABIERTO').length
    const cerrados = periodos.filter(p => p.estado === 'CERRADO').length
    return { total, abiertos, cerrados }
  }, [periodos])

  // ── Datos ordenados ───────────────────────────────────────
  const periodosOrdenados = useMemo(() => {
    return [...periodos].sort((a, b) => {
      if (b.anio !== a.anio) return b.anio - a.anio
      return b.mes - a.mes
    })
  }, [periodos])

  // ── Años disponibles para filtro ──────────────────────────
  const aniosDisponibles = useMemo(() => {
    const set = new Set(periodos.map(p => p.anio))
    return Array.from(set).sort((a, b) => b - a)
  }, [periodos])

  // ── Handlers ──────────────────────────────────────────────
  const abrirCrear = () => {
    form.resetFields()
    const now = new Date()
    form.setFieldsValue({ anio: now.getFullYear(), mes: now.getMonth() + 1 })
    setModalOpen(true)
  }

  const guardar = async () => {
    try {
      const values = await form.validateFields()
      setGuardando(true)
      const nombre = `${MESES[values.mes - 1]} ${values.anio}`
      await window.contabilidad.crearPeriodo({
        nombre,
        anio: values.anio,
        mes: values.mes
      })
      message.success('Período creado')
      setModalOpen(false)
      cargar()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('Error al crear período')
    } finally {
      setGuardando(false)
    }
  }

  const cerrarPeriodo = async (id: number) => {
    try {
      await window.contabilidad.cerrarPeriodo(id)
      message.success('Período cerrado')
      cargar()
    } catch {
      message.error('Error al cerrar período')
    }
  }

  const reabrirPeriodo = async (id: number) => {
    try {
      await window.contabilidad.reabrirPeriodo(id)
      message.success('Período reabierto')
      cargar()
    } catch {
      message.error('Error al reabrir período')
    }
  }

  const handleFiltroAnio = (value: number | undefined) => {
    setFiltroAnio(value)
    cargar(value)
  }

  // ── Columnas ──────────────────────────────────────────────
  const columns: ColumnsType<PeriodoContableRow> = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (v: string) => <Text strong>{v}</Text>
    },
    {
      title: 'Año',
      dataIndex: 'anio',
      key: 'anio',
      width: 80,
      align: 'center'
    },
    {
      title: 'Mes',
      dataIndex: 'mes',
      key: 'mes',
      width: 120,
      render: (v: number) => MESES[v - 1] || v
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      width: 130,
      render: (v: string) => v ? new Date(v).toLocaleDateString('es-SV') : '-'
    },
    {
      title: 'Fecha Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      width: 130,
      render: (v: string) => v ? new Date(v).toLocaleDateString('es-SV') : '-'
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      align: 'center',
      render: (v: string) => (
        <Tag color={ESTADO_COLORS[v] || 'default'} icon={v === 'ABIERTO' ? <UnlockOutlined /> : <LockOutlined />}>
          {v}
        </Tag>
      )
    },
    {
      title: 'Asientos',
      key: 'asientos',
      width: 90,
      align: 'center',
      render: (_: unknown, record: PeriodoContableRow) => record._count?.asientos ?? 0
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      align: 'center',
      render: (_: unknown, record: PeriodoContableRow) => (
        <Space size="small">
          {record.estado === 'ABIERTO' ? (
            <Popconfirm
              title="Cerrar período"
              description="¿Estás seguro de cerrar este período? No se podrán crear ni editar asientos."
              onConfirm={() => cerrarPeriodo(record.id)}
              okText="Sí, cerrar"
              cancelText="No"
            >
              <Button
                type="link"
                size="small"
                icon={<LockOutlined />}
                danger
              >
                Cerrar
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Reabrir período"
              description="¿Estás seguro de reabrir este período?"
              onConfirm={() => reabrirPeriodo(record.id)}
              okText="Sí, reabrir"
              cancelText="No"
            >
              <Button
                type="link"
                size="small"
                icon={<UnlockOutlined />}
                style={{ color: '#52c41a' }}
              >
                Reabrir
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Períodos"
              value={kpis.total}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Abiertos"
              value={kpis.abiertos}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Cerrados"
              value={kpis.cerrados}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla */}
      <Card
        size="small"
        style={{ borderRadius: 10 }}
        title="Períodos Contables"
        extra={
          <Space>
            <Select
              placeholder="Filtrar por año"
              allowClear
              style={{ width: 140 }}
              onChange={handleFiltroAnio}
              value={filtroAnio}
              options={aniosDisponibles.map(a => ({ label: String(a), value: a }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => cargar()}>
              Recargar
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
              Nuevo Período
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={periodosOrdenados}
          pagination={{ pageSize: 24, showSizeChanger: false }}
        />
      </Card>

      {/* Modal Crear */}
      <Modal
        title="Nuevo Período Contable"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={guardar}
        confirmLoading={guardando}
        width={420}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="anio"
                label="Año"
                rules={[{ required: true, message: 'Ingrese el año' }]}
              >
                <InputNumber min={2020} max={2099} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mes"
                label="Mes"
                rules={[{ required: true, message: 'Seleccione el mes' }]}
              >
                <Select
                  placeholder="Seleccione mes"
                  options={MESES.map((m, i) => ({ label: m, value: i + 1 }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary">
            El nombre del período se generará automáticamente (ej: "Enero 2026").
            Las fechas de inicio y fin se calculan según el mes y año seleccionados.
          </Text>
        </Form>
      </Modal>
    </div>
  )
}
