import { useEffect, useState } from 'react'
import {
  Modal, Form, Input, InputNumber, Select, Switch,
  Row, Col, Divider, Space, Tag, Button, message
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { UNIDADES_MEDIDA } from '@shared/constants/catalogs'

interface Props {
  open: boolean
  producto?: ProductoRow | null
  categorias: CategoriaRow[]
  onOk: (values: unknown) => Promise<void>
  onCancel: () => void
  onCategoriaCreada?: () => void
  loading?: boolean
}

export default function ProductoFormModal({
  open, producto, categorias, onOk, onCancel, onCategoriaCreada, loading
}: Props) {
  const [form] = Form.useForm()
  const [esGravado, setEsGravado] = useState(true)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const esEdicion = !!producto

  useEffect(() => {
    if (open && producto) {
      form.setFieldsValue({
        ...producto,
        precioVenta: Number(producto.precioVenta),
        costoPromedio: Number(producto.costoPromedio),
        stockMinimo: Number(producto.stockMinimo),
        stockActual: Number(producto.stockActual),
        categoriaId: (producto.categoria as CategoriaRow | undefined)?.id
      })
      setEsGravado(producto.esGravado)
    } else if (open) {
      form.resetFields()
      form.setFieldsValue({ tipoItem: 1, uniMedida: 59, esGravado: true })
      setEsGravado(true)
    }
  }, [open, producto, form])

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.trim()) return
    setCreandoCategoria(true)
    try {
      await window.products.crearCategoria(nuevaCategoria.trim())
      message.success(`Categoría "${nuevaCategoria}" creada`)
      setNuevaCategoria('')
      onCategoriaCreada?.()
    } catch {
      message.error('Error al crear la categoría')
    } finally {
      setCreandoCategoria(false)
    }
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk(values)
  }

  return (
    <Modal
      title={esEdicion ? `Editar Producto — ${producto!.codigo}` : 'Nuevo Producto'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={esEdicion ? 'Guardar cambios' : 'Crear producto'}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="middle">

        {/* ── Identificación ─────────────────────────── */}
        <Divider orientation="left" plain style={{ marginTop: 0 }}>Identificación</Divider>
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Código"
              name="codigo"
              rules={[{ required: true, message: 'El código es requerido' }]}
            >
              <Input
                placeholder="PROD-001"
                style={{ textTransform: 'uppercase' }}
                disabled={esEdicion}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={16}>
            <Form.Item
              label="Nombre del Producto / Servicio"
              name="nombre"
              rules={[{ required: true, message: 'El nombre es requerido' }, { min: 2 }]}
            >
              <Input placeholder="Nombre descriptivo del producto" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Descripción" name="descripcion">
          <Input.TextArea rows={2} placeholder="Descripción adicional (opcional)" maxLength={200} showCount />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Categoría" name="categoriaId">
              <Select
                placeholder="Seleccionar categoría"
                allowClear
                options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
                dropdownRender={menu => (
                  <>
                    {menu}
                    <Divider style={{ margin: '4px 0' }} />
                    <div style={{ padding: '0 8px 4px', display: 'flex', gap: 8 }}>
                      <Input
                        size="small"
                        placeholder="Nueva categoría..."
                        value={nuevaCategoria}
                        onChange={e => setNuevaCategoria(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrearCategoria() } }}
                      />
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlusOutlined />}
                        loading={creandoCategoria}
                        onClick={handleCrearCategoria}
                      >
                        Agregar
                      </Button>
                    </div>
                  </>
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Unidad de Medida"
              name="uniMedida"
              rules={[{ required: true }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={UNIDADES_MEDIDA.map(u => ({ value: u.codigo, label: u.nombre }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Tipo y Tributación ──────────────────────── */}
        <Divider orientation="left" plain>Tipo y Tributación (DTE)</Divider>
        <Row gutter={12} align="middle">
          <Col xs={12} sm={8}>
            <Form.Item label="Tipo de Ítem" name="tipoItem" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 1, label: 'Bien' },
                  { value: 2, label: 'Servicio' },
                  { value: 3, label: 'Ambos' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item label="Aplica IVA (13%)" name="esGravado" valuePropName="checked">
              <Switch
                checkedChildren="Gravado"
                unCheckedChildren="Exento"
                onChange={setEsGravado}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            {esGravado
              ? <Tag color="green" style={{ marginTop: 8 }}>IVA 13% incluido en precio final</Tag>
              : <Tag color="orange" style={{ marginTop: 8 }}>Exento de IVA</Tag>
            }
          </Col>
        </Row>

        {/* ── Precios ─────────────────────────────────── */}
        <Divider orientation="left" plain>Precios</Divider>
        <Row gutter={12}>
          <Col xs={12} sm={8}>
            <Form.Item
              label="Precio de Venta"
              name="precioVenta"
              rules={[{ required: true, type: 'number', min: 0 }]}
              tooltip="Precio unitario sin IVA"
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                precision={2}
                min={0}
                step={0.01}
              />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item
              label="Costo Promedio"
              name="costoPromedio"
              tooltip="Se actualiza automáticamente con entradas de compra"
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                precision={2}
                min={0}
                step={0.01}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Stock Mínimo" name="stockMinimo" tooltip="Alerta cuando el stock baje de este valor">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Col>
        </Row>

        {/* Stock inicial solo en creación */}
        {!esEdicion && (
          <>
            <Divider orientation="left" plain>Stock Inicial</Divider>
            <Row gutter={12}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Cantidad Inicial en Inventario"
                  name="stockActual"
                  initialValue={0}
                >
                  <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Modal>
  )
}
