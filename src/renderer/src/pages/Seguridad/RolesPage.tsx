import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Space, Tag, Typography,
  Tooltip, Popconfirm, Row, Col, Statistic, message,
  Modal, Form, Input, Checkbox, Divider
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SafetyOutlined, TeamOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Text, Title } = Typography

const PERMISOS_DISPONIBLES = [
  { grupo: 'Clientes', items: ['clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar'] },
  { grupo: 'Proveedores', items: ['proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar'] },
  { grupo: 'Empleados', items: ['empleados:ver', 'empleados:crear', 'empleados:editar', 'empleados:eliminar'] },
  { grupo: 'Inventario', items: ['inventario:ver', 'inventario:ajustar', 'productos:crear', 'productos:editar', 'productos:eliminar'] },
  { grupo: 'Compras', items: ['compras:ver', 'compras:crear', 'compras:anular'] },
  { grupo: 'Facturación', items: ['facturacion:ver', 'facturacion:emitir', 'facturacion:anular', 'facturacion:configurar'] },
  { grupo: 'Reportes', items: ['reportes:ver', 'reportes:exportar'] },
  { grupo: 'Seguridad', items: ['seguridad:ver', 'seguridad:usuarios', 'seguridad:roles'] }
]

export default function RolesPage() {
  const [roles, setRoles] = useState<RolRow[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<RolRow | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form] = Form.useForm()

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.seguridad.listarRoles()
      setRoles(res)
    } catch {
      message.error('Error al cargar roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, []) // eslint-disable-line

  const handleAbrir = (rol?: RolRow) => {
    setEditando(rol ?? null)
    if (rol) {
      let permisos: string[] = []
      try { permisos = JSON.parse(rol.permisos) } catch { permisos = [] }
      form.setFieldsValue({ nombre: rol.nombre, permisos })
    } else {
      form.resetFields()
    }
    setModalOpen(true)
  }

  const handleGuardar = async () => {
    const values = await form.validateFields()
    setGuardando(true)
    try {
      if (editando) {
        await window.seguridad.actualizarRol(editando.id, values)
        message.success('Rol actualizado')
      } else {
        await window.seguridad.crearRol(values)
        message.success(`Rol "${values.nombre}" creado`)
      }
      setModalOpen(false)
      cargar()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar rol')
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id: number, nombre: string) => {
    try {
      await window.seguridad.eliminarRol(id)
      message.success(`Rol "${nombre}" eliminado`)
      cargar()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al eliminar rol')
    }
  }

  const columns: ColumnsType<RolRow> = [
    {
      title: 'Nombre del Rol',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (v: string) => <Text strong><SafetyOutlined style={{ marginRight: 6, color: 'var(--theme-primary)' }} />{v}</Text>
    },
    {
      title: 'Permisos',
      key: 'permisos',
      render: (_, r) => {
        let permisos: string[] = []
        try { permisos = JSON.parse(r.permisos) } catch { permisos = [] }
        return (
          <Space wrap>
            {permisos.slice(0, 5).map(p => (
              <Tag key={p} style={{ fontSize: 10 }}>{p}</Tag>
            ))}
            {permisos.length > 5 && <Tag>+{permisos.length - 5} más</Tag>}
            {permisos.length === 0 && <Text type="secondary">Sin permisos</Text>}
          </Space>
        )
      }
    },
    {
      title: 'Usuarios',
      key: 'usuarios',
      width: 90,
      render: (_, r) => (
        <Tag icon={<TeamOutlined />}>{r._count?.users ?? 0}</Tag>
      )
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
            title="¿Eliminar este rol?"
            description="Solo se puede eliminar si no tiene usuarios asignados."
            okText="Eliminar" cancelText="Cancelar" okButtonProps={{ danger: true }}
            onConfirm={() => handleEliminar(record.id, record.nombre)}
          >
            <Tooltip title="Eliminar">
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
        <Col xs={12} md={12}>
          <Card size="small">
            <Statistic title="Total Roles" value={roles.length} prefix={<SafetyOutlined style={{ color: 'var(--theme-primary)' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={12}>
          <Card size="small">
            <Statistic
              title="Usuarios con rol asignado"
              value={roles.reduce((a, r) => a + (r._count?.users ?? 0), 0)}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={5} style={{ margin: 0 }}>Roles y Permisos</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAbrir()}>
            Nuevo Rol
          </Button>
        }
      >
        <Table
          dataSource={roles}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
        />
      </Card>

      <Modal
        title={editando ? `Editar Rol — ${editando.nombre}` : 'Nuevo Rol'}
        open={modalOpen}
        onOk={handleGuardar}
        onCancel={() => setModalOpen(false)}
        okText={editando ? 'Guardar cambios' : 'Crear rol'}
        cancelText="Cancelar"
        confirmLoading={guardando}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Nombre del Rol" name="nombre" rules={[{ required: true, message: 'El nombre es requerido' }]}>
            <Input placeholder="Administrador, Cajero, Vendedor..." />
          </Form.Item>

          <Form.Item label="Permisos" name="permisos">
            <Checkbox.Group style={{ width: '100%' }}>
              {PERMISOS_DISPONIBLES.map(grupo => (
                <div key={grupo.grupo} style={{ marginBottom: 12 }}>
                  <Divider orientation="left" plain style={{ fontSize: 12, marginBottom: 6 }}>
                    {grupo.grupo}
                  </Divider>
                  <Row gutter={[8, 4]}>
                    {grupo.items.map(p => (
                      <Col key={p} xs={12} sm={8}>
                        <Checkbox value={p}>
                          <Text style={{ fontSize: 12 }}>{p.split(':')[1]}</Text>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
