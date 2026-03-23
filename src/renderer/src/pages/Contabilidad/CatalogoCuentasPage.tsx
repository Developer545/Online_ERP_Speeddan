import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card, Table, Button, Form, Modal, Input, Select, Space, Row, Col,
  Statistic, message, Tag, TreeSelect, Popconfirm, Typography, InputNumber,
  Checkbox
} from 'antd'
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, EditOutlined,
  ImportOutlined, CheckOutlined, CloseOutlined, SearchOutlined,
  AccountBookOutlined, ApartmentOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

const TIPO_OPTIONS = [
  'ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'COSTO',
  'GASTO', 'CIERRE', 'ORDEN_DEUDORA', 'ORDEN_ACREEDORA'
]

const NATURALEZA_OPTIONS = ['DEUDORA', 'ACREEDORA']

const TIPO_COLORS: Record<string, string> = {
  ACTIVO: 'blue',
  PASIVO: 'red',
  PATRIMONIO: 'purple',
  INGRESO: 'green',
  COSTO: 'orange',
  GASTO: 'volcano',
  CIERRE: 'default',
  ORDEN_DEUDORA: 'cyan',
  ORDEN_ACREEDORA: 'magenta'
}

/** Build tree structure for Table expandable rows */
function buildTree(cuentas: CatalogoCuentaRow[]): CatalogoCuentaRow[] {
  const map = new Map<number, CatalogoCuentaRow & { children?: CatalogoCuentaRow[] }>()
  const roots: (CatalogoCuentaRow & { children?: CatalogoCuentaRow[] })[] = []

  // First pass: index all accounts
  for (const c of cuentas) {
    map.set(c.id, { ...c })
  }

  // Second pass: build hierarchy
  for (const c of cuentas) {
    const node = map.get(c.id)!
    if (c.cuentaPadreId && map.has(c.cuentaPadreId)) {
      const parent = map.get(c.cuentaPadreId)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

/** Build TreeSelect data from flat accounts list */
function buildTreeSelectData(cuentas: CatalogoCuentaRow[], excludeId?: number): { title: string; value: number; children?: unknown[] }[] {
  const map = new Map<number, { title: string; value: number; children: unknown[] }>()
  const roots: { title: string; value: number; children: unknown[] }[] = []

  for (const c of cuentas) {
    if (c.id === excludeId) continue
    map.set(c.id, { title: `${c.codigo} - ${c.nombre}`, value: c.id, children: [] })
  }

  for (const c of cuentas) {
    if (c.id === excludeId) continue
    const node = map.get(c.id)!
    if (c.cuentaPadreId && map.has(c.cuentaPadreId)) {
      map.get(c.cuentaPadreId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Remove empty children arrays
  const clean = (items: unknown[]): unknown[] =>
    items.map((item: unknown) => {
      const i = item as { children: unknown[] }
      if (i.children.length === 0) {
        const { children: _, ...rest } = i
        return rest
      }
      i.children = clean(i.children)
      return i
    })

  return clean(roots) as { title: string; value: number; children?: unknown[] }[]
}

export default function CatalogoCuentasPage() {
  const [cuentas, setCuentas] = useState<CatalogoCuentaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>()

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<CatalogoCuentaRow | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [form] = Form.useForm()

  const [importando, setImportando] = useState(false)

  // ── Cargar datos ──────────────────────────────────────────
  const cargar = useCallback(async (b = busqueda, t = filtroTipo) => {
    setLoading(true)
    try {
      const res = await window.contabilidad.listarCuentas(b || undefined, t)
      setCuentas(res)
    } catch {
      message.error('Error al cargar catálogo de cuentas')
    } finally {
      setLoading(false)
    }
  }, [busqueda, filtroTipo])

  useEffect(() => {
    cargar()
  }, []) // eslint-disable-line

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = cuentas.length
    const movimiento = cuentas.filter(c => c.aceptaMovimiento).length
    const porTipo: Record<string, number> = {}
    for (const c of cuentas) {
      porTipo[c.tipo] = (porTipo[c.tipo] || 0) + 1
    }
    return { total, movimiento, porTipo }
  }, [cuentas])

  // ── Tree data ─────────────────────────────────────────────
  const treeData = useMemo(() => buildTree(cuentas), [cuentas])

  const treeSelectData = useMemo(
    () => buildTreeSelectData(cuentas, editando?.id),
    [cuentas, editando]
  )

  // ── Handlers ──────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null)
    form.resetFields()
    form.setFieldsValue({ nivel: 1, aceptaMovimiento: false })
    setModalOpen(true)
  }

  const abrirEditar = (cuenta: CatalogoCuentaRow) => {
    setEditando(cuenta)
    form.setFieldsValue({
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      descripcion: cuenta.descripcion || '',
      tipo: cuenta.tipo,
      naturaleza: cuenta.naturaleza,
      nivel: cuenta.nivel,
      cuentaPadreId: cuenta.cuentaPadreId || undefined,
      aceptaMovimiento: cuenta.aceptaMovimiento
    })
    setModalOpen(true)
  }

  const guardar = async () => {
    try {
      const values = await form.validateFields()
      setGuardando(true)
      if (editando) {
        await window.contabilidad.editarCuenta(editando.id, values)
        message.success('Cuenta actualizada')
      } else {
        await window.contabilidad.crearCuenta(values)
        message.success('Cuenta creada')
      }
      setModalOpen(false)
      cargar()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('Error al guardar cuenta')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id: number) => {
    try {
      await window.contabilidad.eliminarCuenta(id)
      message.success('Cuenta eliminada')
      cargar()
    } catch {
      message.error('Error al eliminar cuenta')
    }
  }

  const importarCatalogo = async () => {
    setImportando(true)
    try {
      const catalogo = await window.contabilidad.obtenerCatalogoEstandar()
      const result = await window.contabilidad.importarCatalogo(catalogo)
      message.success(`Catálogo importado: ${result.created} cuentas creadas de ${result.total}`)
      cargar()
    } catch {
      message.error('Error al importar catálogo estándar')
    } finally {
      setImportando(false)
    }
  }

  // ── Filtros ───────────────────────────────────────────────
  const handleBusqueda = (value: string) => {
    setBusqueda(value)
    cargar(value, filtroTipo)
  }

  const handleFiltroTipo = (value: string | undefined) => {
    setFiltroTipo(value)
    cargar(busqueda, value)
  }

  // ── Columnas ──────────────────────────────────────────────
  const columns: ColumnsType<CatalogoCuentaRow> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 140,
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text>
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      ellipsis: true
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 150,
      render: (v: string) => <Tag color={TIPO_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: 'Naturaleza',
      dataIndex: 'naturaleza',
      key: 'naturaleza',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Nivel',
      dataIndex: 'nivel',
      key: 'nivel',
      width: 70,
      align: 'center'
    },
    {
      title: 'Acepta Mov.',
      dataIndex: 'aceptaMovimiento',
      key: 'aceptaMovimiento',
      width: 110,
      align: 'center',
      render: (v: boolean) =>
        v ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CloseOutlined style={{ color: '#ff4d4f' }} />
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 120,
      align: 'center',
      render: (_: unknown, record: CatalogoCuentaRow) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => abrirEditar(record)}
          />
          <Popconfirm
            title="Eliminar cuenta"
            description={
              record._count?.subcuentas
                ? `Esta cuenta tiene ${record._count.subcuentas} subcuenta(s). No se puede eliminar.`
                : '¿Estás seguro de eliminar esta cuenta?'
            }
            onConfirm={() => eliminar(record.id)}
            okText="Sí"
            cancelText="No"
            disabled={!!record._count?.subcuentas || !!record._count?.detallesAsiento}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!!record._count?.subcuentas || !!record._count?.detallesAsiento}
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Total Cuentas"
              value={kpis.total}
              prefix={<AccountBookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Cuentas de Movimiento"
              value={kpis.movimiento}
              prefix={<ApartmentOutlined />}
            />
          </Card>
        </Col>
        {Object.entries(kpis.porTipo).slice(0, 4).map(([tipo, count]) => (
          <Col xs={12} sm={6} key={tipo}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic
                title={tipo}
                value={count}
                valueStyle={{ color: TIPO_COLORS[tipo] === 'default' ? undefined : undefined }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabla */}
      <Card
        size="small"
        style={{ borderRadius: 10 }}
        title="Catálogo de Cuentas"
        extra={
          <Space>
            <Input.Search
              placeholder="Buscar código o nombre..."
              allowClear
              onSearch={handleBusqueda}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Filtrar tipo"
              allowClear
              style={{ width: 180 }}
              onChange={handleFiltroTipo}
              value={filtroTipo}
              options={TIPO_OPTIONS.map(t => ({ label: t, value: t }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => cargar()}>
              Recargar
            </Button>
            <Button
              icon={<ImportOutlined />}
              onClick={importarCatalogo}
              loading={importando}
            >
              Importar Catálogo Estándar SV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrear}>
              Nueva Cuenta
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={treeData}
          expandable={{
            defaultExpandAllRows: false,
            childrenColumnName: 'children'
          }}
          pagination={false}
          scroll={{ y: 'calc(100vh - 380px)' }}
        />
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        title={editando ? 'Editar Cuenta' : 'Nueva Cuenta'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={guardar}
        confirmLoading={guardando}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="codigo"
                label="Código"
                rules={[{ required: true, message: 'Ingrese el código' }]}
              >
                <Input placeholder="Ej: 1101" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre"
                rules={[{ required: true, message: 'Ingrese el nombre' }]}
              >
                <Input placeholder="Ej: Efectivo y Equivalentes" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={2} placeholder="Descripción opcional" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="tipo"
                label="Tipo"
                rules={[{ required: true, message: 'Seleccione el tipo' }]}
              >
                <Select
                  placeholder="Tipo de cuenta"
                  options={TIPO_OPTIONS.map(t => ({ label: t, value: t }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="naturaleza"
                label="Naturaleza"
                rules={[{ required: true, message: 'Seleccione la naturaleza' }]}
              >
                <Select
                  placeholder="Naturaleza"
                  options={NATURALEZA_OPTIONS.map(n => ({ label: n, value: n }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="nivel"
                label="Nivel"
                rules={[{ required: true, message: 'Ingrese el nivel' }]}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="cuentaPadreId" label="Cuenta Padre">
            <TreeSelect
              placeholder="Seleccione cuenta padre (opcional)"
              allowClear
              treeData={treeSelectData}
              treeDefaultExpandAll={false}
              showSearch
              treeNodeFilterProp="title"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="aceptaMovimiento" valuePropName="checked">
            <Checkbox>Acepta movimiento (cuenta de detalle)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
