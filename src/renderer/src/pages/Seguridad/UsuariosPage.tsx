import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Input, Space, Tag, Typography,
  Tooltip, Popconfirm, Row, Col, Statistic, message,
  Modal, Form, Select, Switch, Avatar
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, UserOutlined, SafetyOutlined, LockOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Text, Title } = Typography

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [busqueda, setBusqueda] = useState('')
  const [roles, setRoles] = useState<RolRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<UsuarioRow | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form] = Form.useForm()

  const cargar = useCallback(async (p = page, ps = pageSize, b = busqueda) => {
    setLoading(true)
    try {
      const res = await window.seguridad.listarUsuarios(p, ps, b || undefined)
      setUsuarios(res.usuarios)
      setTotal(res.total)
    } catch {
      message.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, busqueda])

  useEffect(() => {
    cargar()
    window.seguridad.listarRoles().then(setRoles)
  }, []) // eslint-disable-line

  const handleAbrir = (usuario?: UsuarioRow) => {
    setEditando(usuario ?? null)
    if (usuario) {
      form.setFieldsValue({ ...usuario, password: '', activo: usuario.activo })
    } else {
      form.resetFields()
      form.setFieldsValue({ activo: true })
    }
    setModalOpen(true)
  }

  const handleGuardar = async () => {
    const values = await form.validateFields()
    setGuardando(true)
    try {
      if (editando) {
        await window.seguridad.actualizarUsuario(editando.id, {
          nombre: values.nombre,
          correo: values.correo,
          roleId: values.roleId,
          activo: values.activo,
          ...(values.password ? { password: values.password } : {})
        })
        message.success('Usuario actualizado')
      } else {
        await window.seguridad.crearUsuario(values)
        message.success(`Usuario "${values.username}" creado`)
      }
      setModalOpen(false)
      cargar(1)
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar usuario')
    } finally {
      setGuardando(false)
    }
  }

  const handleDesactivar = async (id: number, nombre: string) => {
    try {
      await window.seguridad.desactivarUsuario(id)
      message.success(`Usuario "${nombre}" desactivado`)
      cargar()
    } catch {
      message.error('Error al desactivar usuario')
    }
  }

  const activos = usuarios.filter(u => u.activo).length

  const columns: ColumnsType<UsuarioRow> = [
    {
      title: 'Usuario',
      key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: r.activo ? 'var(--theme-primary)' : '#bfbfbf' }} size="small">
            {r.nombre.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{r.nombre}</Text>
            <div><Text code style={{ fontSize: 11 }}>@{r.username}</Text></div>
          </div>
        </Space>
      )
    },
    {
      title: 'Correo',
      dataIndex: 'correo',
      key: 'correo',
      render: (v: string) => v ?? <Text type="secondary">—</Text>
    },
    {
      title: 'Rol',
      key: 'rol',
      width: 140,
      render: (_, r) => r.role
        ? <Tag color="blue" icon={<SafetyOutlined />}>{r.role.nombre}</Tag>
        : <Text type="secondary">—</Text>
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 90,
      render: (v: boolean) => v
        ? <Tag color="success">Activo</Tag>
        : <Tag color="error">Inactivo</Tag>
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={() => handleAbrir(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar este usuario?"
            okText="Desactivar" cancelText="Cancelar" okButtonProps={{ danger: true }}
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
            <Statistic title="Total Usuarios" value={total} prefix={<UserOutlined style={{ color: 'var(--theme-primary)' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small">
            <Statistic title="Activos" value={activos} prefix={<UserOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title="Roles configurados" value={roles.length} prefix={<SafetyOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>Usuarios del Sistema</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAbrir()}>
            Nuevo Usuario
          </Button>
        }
      >
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Buscar por nombre, usuario, correo..."
              prefix={<SearchOutlined />}
              allowClear
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onPressEnter={() => cargar(1, pageSize, busqueda)}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => cargar(1, pageSize, busqueda)}>Buscar</Button>
              <Tooltip title="Limpiar"><Button icon={<ReloadOutlined />} onClick={() => { setBusqueda(''); cargar(1, pageSize, '') }} /></Tooltip>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={usuarios}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 700 }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} usuarios`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); cargar(p, ps) }
          }}
        />
      </Card>

      {/* Modal crear/editar */}
      <Modal
        title={editando ? `Editar Usuario — ${editando.username}` : 'Nuevo Usuario'}
        open={modalOpen}
        onOk={handleGuardar}
        onCancel={() => setModalOpen(false)}
        okText={editando ? 'Guardar cambios' : 'Crear usuario'}
        cancelText="Cancelar"
        confirmLoading={guardando}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Nombre Completo" name="nombre" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Nombre del usuario" />
          </Form.Item>
          <Form.Item
            label="Nombre de Usuario"
            name="username"
            rules={[{ required: !editando, message: 'El username es requerido' }]}
          >
            <Input
              prefix="@"
              placeholder="usuario123"
              disabled={!!editando}
            />
          </Form.Item>
          <Form.Item label="Correo Electrónico" name="correo" rules={[{ type: 'email', message: 'Correo inválido' }]}>
            <Input placeholder="correo@empresa.com" />
          </Form.Item>
          <Form.Item
            label={editando ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            name="password"
            rules={editando ? [] : [{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item label="Rol" name="roleId" rules={[{ required: true, message: 'Seleccione un rol' }]}>
            <Select
              options={roles.map(r => ({ value: r.id, label: r.nombre }))}
              placeholder="Seleccionar rol"
            />
          </Form.Item>
          {editando && (
            <Form.Item label="Estado" name="activo" valuePropName="checked">
              <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  )
}
