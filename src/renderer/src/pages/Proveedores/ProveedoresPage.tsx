import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Input, Select, Space, Tag, Typography,
  Tooltip, Popconfirm, Row, Col, Statistic, message
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, ShopOutlined, PhoneOutlined, MailOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ProveedorFormModal from '@components/Forms/ProveedorFormModal'

const { Text, Title } = Typography

const TIPO_COLORS: Record<string, string> = {
  NACIONAL: 'blue',
  IMPORTADOR: 'purple',
  SERVICIOS: 'cyan',
  OTRO: 'default'
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState<ProveedorRow | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async (p = page, ps = pageSize, b = busqueda, t = tipoFiltro) => {
    setLoading(true)
    try {
      const res = await window.proveedores.listar(p, ps, b || undefined, t)
      setProveedores(res.proveedores)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, busqueda, tipoFiltro])

  useEffect(() => { cargar() }, []) // eslint-disable-line

  const handleGuardar = async (values: unknown) => {
    setGuardando(true)
    try {
      if (proveedorEditando) {
        await window.proveedores.actualizar(proveedorEditando.id, values)
        message.success('Proveedor actualizado')
      } else {
        const res = await window.proveedores.crear(values)
        message.success(`Proveedor "${(res as ProveedorRow).nombre}" creado`)
      }
      setModalOpen(false)
      cargar(1, pageSize, busqueda, tipoFiltro)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleDesactivar = async (id: number, nombre: string) => {
    try {
      await window.proveedores.desactivar(id)
      message.success(`Proveedor "${nombre}" desactivado`)
      cargar()
    } catch {
      message.error('Error al desactivar proveedor')
    }
  }

  const conNRC = proveedores.filter(p => p.nrc).length
  const conCredito = proveedores.filter(p => (p.plazoCredito ?? 0) > 0).length

  const columns: ColumnsType<ProveedorRow> = [
    {
      title: 'Nombre / Razón Social',
      key: 'nombre',
      render: (_, r) => (
        <div>
          <Text strong>{r.nombre}</Text>
          {r.contacto && (
            <div><Text type="secondary" style={{ fontSize: 11 }}>{r.contacto}</Text></div>
          )}
        </div>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoProveedor',
      key: 'tipo',
      width: 110,
      render: (v: string) => <Tag color={TIPO_COLORS[v] ?? 'default'}>{v ?? '—'}</Tag>
    },
    {
      title: 'NIT / NRC',
      key: 'docs',
      width: 160,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          {r.nit && <Text style={{ fontSize: 12 }}>NIT: <Text code>{r.nit}</Text></Text>}
          {r.nrc && <Text style={{ fontSize: 12 }}>NRC: <Text code>{r.nrc}</Text></Text>}
          {!r.nit && !r.nrc && <Text type="secondary">—</Text>}
        </Space>
      )
    },
    {
      title: 'Contacto',
      key: 'contacto',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          {r.correo && (
            <Text style={{ fontSize: 12 }}>
              <MailOutlined /> {r.correo}
            </Text>
          )}
          {r.telefono && (
            <Text style={{ fontSize: 12 }}>
              <PhoneOutlined /> {r.telefono}
            </Text>
          )}
          {!r.correo && !r.telefono && <Text type="secondary">—</Text>}
        </Space>
      )
    },
    {
      title: 'Crédito',
      key: 'credito',
      width: 100,
      render: (_, r) => r.plazoCredito && r.plazoCredito > 0
        ? <Tag color="green">{r.plazoCredito} días</Tag>
        : <Tag>Contado</Tag>
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
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => { setProveedorEditando(record); setModalOpen(true) }}
            />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar este proveedor?"
            description="No aparecerá en búsquedas pero conserva su historial."
            okText="Desactivar"
            cancelText="Cancelar"
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
            <Statistic title="Total Proveedores" value={total} prefix={<ShopOutlined style={{ color: 'var(--theme-primary)' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Con NRC (contribuyentes)" value={conNRC} prefix={<ShopOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title="Con Crédito" value={conCredito} prefix={<ShopOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>Proveedores</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setProveedorEditando(null); setModalOpen(true) }}>
            Nuevo Proveedor
          </Button>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Buscar por nombre, NIT, correo..."
              prefix={<SearchOutlined />}
              allowClear
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onPressEnter={() => cargar(1, pageSize, busqueda, tipoFiltro)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Tipo"
              allowClear
              style={{ width: '100%' }}
              value={tipoFiltro}
              onChange={setTipoFiltro}
              options={[
                { value: 'NACIONAL', label: 'Nacional' },
                { value: 'IMPORTADOR', label: 'Importador' },
                { value: 'SERVICIOS', label: 'Servicios' },
                { value: 'OTRO', label: 'Otro' }
              ]}
            />
          </Col>
          <Col xs={12} sm={4} md={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />}
                onClick={() => cargar(1, pageSize, busqueda, tipoFiltro)}>
                Buscar
              </Button>
              <Tooltip title="Limpiar">
                <Button icon={<ReloadOutlined />} onClick={() => {
                  setBusqueda(''); setTipoFiltro(undefined); cargar(1, pageSize, '', undefined)
                }} />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={proveedores}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} proveedores`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); cargar(p, ps) }
          }}
        />
      </Card>

      <ProveedorFormModal
        open={modalOpen}
        proveedor={proveedorEditando}
        onOk={handleGuardar}
        onCancel={() => setModalOpen(false)}
        loading={guardando}
      />
    </>
  )
}
