import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider } from 'antd'
import { DEPARTAMENTOS, MUNICIPIOS } from '@shared/constants/catalogs'

interface Props {
  open: boolean
  proveedor?: ProveedorRow | null
  onOk: (values: unknown) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const TIPOS_PROVEEDOR = [
  { value: 'NACIONAL', label: 'Nacional' },
  { value: 'IMPORTADOR', label: 'Importador' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'OTRO', label: 'Otro' }
]

export default function ProveedorFormModal({ open, proveedor, onOk, onCancel, loading }: Props) {
  const [form] = Form.useForm()
  const deptoWatch = Form.useWatch('departamentoCod', form)
  const esEdicion = !!proveedor

  const municipiosDisponibles = deptoWatch
    ? MUNICIPIOS.filter(m => m.departamento === deptoWatch)
    : []

  useEffect(() => {
    if (open && proveedor) {
      form.setFieldsValue({ ...proveedor })
    } else if (open) {
      form.resetFields()
      form.setFieldsValue({ tipoProveedor: 'NACIONAL' })
    }
  }, [open, proveedor, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk(values)
  }

  return (
    <Modal
      title={esEdicion ? `Editar Proveedor — ${proveedor!.nombre}` : 'Nuevo Proveedor'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={esEdicion ? 'Guardar cambios' : 'Crear proveedor'}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="middle">

        <Divider orientation="left" plain style={{ marginTop: 0 }}>Información General</Divider>
        <Row gutter={12}>
          <Col xs={24} sm={16}>
            <Form.Item
              label="Nombre / Razón Social"
              name="nombre"
              rules={[{ required: true, message: 'El nombre es requerido' }, { min: 2 }]}
            >
              <Input placeholder="Nombre del proveedor" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Tipo de Proveedor" name="tipoProveedor">
              <Select options={TIPOS_PROVEEDOR} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item label="NIT" name="nit">
              <Input placeholder="0000-000000-000-0" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="NRC" name="nrc">
              <Input placeholder="Número de Registro de Contribuyente" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Plazo de Crédito (días)" name="plazoCredito">
              <InputNumber style={{ width: '100%' }} min={0} step={15} placeholder="30" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>Contacto</Divider>
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item label="Persona de Contacto" name="contacto">
              <Input placeholder="Nombre del contacto" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Correo Electrónico"
              name="correo"
              rules={[{ type: 'email', message: 'Correo inválido' }]}
            >
              <Input placeholder="correo@empresa.com" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Teléfono" name="telefono">
              <Input placeholder="2200-0000" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>Dirección</Divider>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Departamento" name="departamentoCod">
              <Select
                placeholder="Seleccionar departamento"
                allowClear
                showSearch
                optionFilterProp="label"
                options={DEPARTAMENTOS.map(d => ({ value: d.codigo, label: d.nombre }))}
                onChange={() => form.setFieldValue('municipioCod', undefined)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Municipio" name="municipioCod">
              <Select
                placeholder={deptoWatch ? 'Seleccionar municipio' : 'Primero seleccione departamento'}
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={!deptoWatch}
                options={municipiosDisponibles.map(m => ({ value: m.codigo, label: m.nombre }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Dirección" name="direccion">
          <Input.TextArea rows={2} placeholder="Dirección completa" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
