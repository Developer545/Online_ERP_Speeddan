import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Input, Select, Space, Tag, Typography,
  Tooltip, Popconfirm, Row, Col, Statistic, message, Avatar
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, UserOutlined, DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import EmpleadoFormModal from '@components/Forms/EmpleadoFormModal'
import { formatCurrency, formatNumber } from '@utils/format'
import dayjs from 'dayjs'

const { Text, Title } = Typography

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<EmpleadoRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busqueda, setBusqueda] = useState('')
  const [cargoFiltro, setCargoFiltro] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<EmpleadoRow | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async (p = page, ps = pageSize, b = busqueda, c = cargoFiltro) => {
    setLoading(true)
    try {
      const res = await window.empleados.listar(p, ps, b || undefined, c)
      setEmpleados(res.empleados)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, busqueda, cargoFiltro])

  useEffect(() => { cargar() }, []) // eslint-disable-line

  const handleGuardar = async (values: unknown) => {
    setGuardando(true)
    try {
      if (editando) {
        await window.empleados.actualizar(editando.id, values)
        message.success('Empleado actualizado')
      } else {
        const res = await window.empleados.crear(values)
        message.success(`Empleado "${(res as EmpleadoRow).nombre}" creado`)
      }
      setModalOpen(false)
      cargar(1, pageSize, busqueda, cargoFiltro)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleDesactivar = async (id: number, nombre: string) => {
    try {
      await window.empleados.desactivar(id)
      message.success(`Empleado "${nombre}" desactivado`)
      cargar()
    } catch {
      message.error('Error al desactivar empleado')
    }
  }

  const nominaTotal = empleados.reduce((acc, e) => acc + Number(e.salario ?? 0), 0)

  const columns: ColumnsType<EmpleadoRow> = [
    {
      title: 'Empleado',
      key: 'nombre',
      render: (_, r) => (
        <Space>
          <Avatar
            style={{ background: 'var(--theme-primary)', flexShrink: 0 }}
            size="small"
          >
            {r.nombre.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{r.nombre}</Text>
            {r.correo && (
              <div><Text type="secondary" style={{ fontSize: 11 }}>{r.correo}</Text></div>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'DUI / NIT',
      key: 'docs',
      width: 160,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          {r.dui && <Text style={{ fontSize: 12 }}>DUI: <Text code>{r.dui}</Text></Text>}
          {r.nit && <Text style={{ fontSize: 12 }}>NIT: <Text code>{r.nit}</Text></Text>}
          {!r.dui && !r.nit && <Text type="secondary">—</Text>}
        </Space>
      )
    },
    {
      title: 'Cargo',
      dataIndex: 'cargo',
      key: 'cargo',
      width: 130,
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <Text type="secondary">—</Text>
    },
    {
      title: 'Salario',
      dataIndex: 'salario',
      key: 'salario',
      width: 110,
      align: 'right',
      render: (v: number | string) => (
        <Text strong style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>
      )
    },
    {
      title: 'Ingreso',
      dataIndex: 'fechaIngreso',
      key: 'fechaIngreso',
      width: 100,
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—'
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      width: 100,
      render: (v: string) => v ?? <Text type="secondary">—</Text>
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button
              size="small" type="primary" ghost icon={<EditOutlined />}
              onClick={() => { setEditando(record); setModalOpen(true) }}
            />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar este empleado?"
            okText="Desactivar" cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDesactivar(record.id, record.nombre)}
          >
            <Tooltip title="Desactivar">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Total Empleados" value={total} prefix={<UserOutlined style={{ color: 'var(--theme-primary)' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic
              title="Nómina Total (en pantalla)"
              value={nominaTotal}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              formatter={(v) => formatNumber(v as number)}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title="Página" value={`${page} de ${Math.ceil(total / pageSize) || 1}`} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>Empleados</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditando(null); setModalOpen(true) }}>
            Nuevo Empleado
          </Button>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Buscar por nombre, DUI, correo..."
              prefix={<SearchOutlined />}
              allowClear
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onPressEnter={() => cargar(1, pageSize, busqueda, cargoFiltro)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Cargo"
              allowClear
              style={{ width: '100%' }}
              value={cargoFiltro}
              onChange={setCargoFiltro}
              options={['Gerente General', 'Contador', 'Vendedor', 'Cajero', 'Bodeguero', 'Administrador', 'Asistente', 'Otro']
                .map(c => ({ value: c, label: c }))}
            />
          </Col>
          <Col xs={12} sm={4} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}
                onClick={() => cargar(1, pageSize, busqueda, cargoFiltro)}>
                Buscar
              </Button>
              <Tooltip title="Limpiar">
                <Button icon={<ReloadOutlined />} onClick={() => {
                  setBusqueda(''); setCargoFiltro(undefined); cargar(1, pageSize, '', undefined)
                }} />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={empleados}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 900 }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} empleados`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); cargar(p, ps) }
          }}
        />
      </Card>

      <EmpleadoFormModal
        open={modalOpen}
        empleado={editando}
        onOk={handleGuardar}
        onCancel={() => setModalOpen(false)}
        loading={guardando}
      />
    </>
  )
}
