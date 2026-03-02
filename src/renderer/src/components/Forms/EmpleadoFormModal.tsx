import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, Row, Col, Divider, DatePicker } from 'antd'
import { DEPARTAMENTOS, MUNICIPIOS } from '@shared/constants/catalogs'
import dayjs from 'dayjs'

interface Props {
  open: boolean
  empleado?: EmpleadoRow | null
  onOk: (values: unknown) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const CARGOS = [
  'Gerente General', 'Contador', 'Vendedor', 'Cajero',
  'Bodeguero', 'Administrador', 'Asistente', 'Otro'
]

export default function EmpleadoFormModal({ open, empleado, onOk, onCancel, loading }: Props) {
  const [form] = Form.useForm()
  const deptoWatch = Form.useWatch('departamentoCod', form)
  const esEdicion = !!empleado

  const municipiosDisponibles = deptoWatch
    ? MUNICIPIOS.filter(m => m.departamento === deptoWatch)
    : []

  useEffect(() => {
    if (open && empleado) {
      form.setFieldsValue({
        ...empleado,
        salario: Number(empleado.salario ?? 0),
        fechaIngreso: empleado.fechaIngreso ? dayjs(empleado.fechaIngreso) : dayjs()
      })
    } else if (open) {
      form.resetFields()
      form.setFieldsValue({ fechaIngreso: dayjs() })
    }
  }, [open, empleado, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onOk({
      ...values,
      fechaIngreso: values.fechaIngreso ? values.fechaIngreso.format('YYYY-MM-DD') : undefined
    })
  }

  return (
    <Modal
      title={esEdicion ? `Editar Empleado — ${empleado!.nombre}` : 'Nuevo Empleado'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={esEdicion ? 'Guardar cambios' : 'Crear empleado'}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="middle">

        <Divider orientation="left" plain style={{ marginTop: 0 }}>Datos Personales</Divider>
        <Row gutter={12}>
          <Col xs={24} sm={16}>
            <Form.Item
              label="Nombre Completo"
              name="nombre"
              rules={[{ required: true, message: 'El nombre es requerido' }, { min: 2 }]}
            >
              <Input placeholder="Nombre completo del empleado" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Fecha de Ingreso" name="fechaIngreso">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item label="DUI" name="dui">
              <Input placeholder="00000000-0" maxLength={10} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="NIT" name="nit">
              <Input placeholder="0000-000000-000-0" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label="Teléfono" name="telefono">
              <Input placeholder="7000-0000" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Correo Electrónico"
          name="correo"
          rules={[{ type: 'email', message: 'Correo inválido' }]}
        >
          <Input placeholder="empleado@empresa.com" />
        </Form.Item>

        <Divider orientation="left" plain>Cargo y Salario</Divider>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Cargo" name="cargo">
              <Select
                showSearch
                placeholder="Seleccionar cargo"
                options={CARGOS.map(c => ({ value: c, label: c }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Salario Mensual" name="salario">
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                precision={2}
                min={0}
                step={50}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>Domicilio</Divider>
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
          <Input.TextArea rows={2} placeholder="Dirección de residencia" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}
