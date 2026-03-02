// ══════════════════════════════════════════════════════════
// MODAL: Crear / Editar Cliente
// ══════════════════════════════════════════════════════════
// Reutilizable para alta y modificación.
// Incluye: tipo de documento, validaciones, depto/municipio.
// ══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react'
import {
  Modal, Form, Input, Select, Row, Col, Divider, Alert, Space, Tag
} from 'antd'
import {
  DEPARTAMENTOS,
  getMunicipiosByDepartamento,
  TIPOS_DOCUMENTO_RECEPTOR
} from '@shared/constants/catalogs'
import { formatDUI, formatNIT, TIPOS_DOC_LABELS } from '@utils/documentos'

interface Props {
  open: boolean
  cliente?: ClienteRow | null    // null = modo creación
  onOk: (values: Omit<ClienteRow, 'id'>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function ClienteFormModal({ open, cliente, onOk, onCancel, loading }: Props) {
  const [form] = Form.useForm()
  const [tipoDoc, setTipoDoc] = useState('13')          // DUI por defecto
  const [departamento, setDepartamento] = useState('')
  const [municipios, setMunicipios] = useState(getMunicipiosByDepartamento(''))
  const esEdicion = !!cliente

  // Pre-llenar en modo edición
  useEffect(() => {
    if (open && cliente) {
      form.setFieldsValue(cliente)
      setTipoDoc(cliente.tipoDocumento)
      setDepartamento(cliente.departamentoCod ?? '')
      setMunicipios(getMunicipiosByDepartamento(cliente.departamentoCod ?? ''))
    } else if (open && !cliente) {
      form.resetFields()
      setTipoDoc('13')
      setDepartamento('')
    }
  }, [open, cliente, form])

  const onDeptChange = (cod: string) => {
    setDepartamento(cod)
    setMunicipios(getMunicipiosByDepartamento(cod))
    form.setFieldValue('municipioCod', undefined)
  }

  const onTipoDocChange = (val: string) => {
    setTipoDoc(val)
    form.setFieldValue('numDocumento', '')
  }

  // Formatear según tipo
  const onDocInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (tipoDoc === '13') form.setFieldValue('numDocumento', formatDUI(raw))
    else if (tipoDoc === '36') form.setFieldValue('numDocumento', formatNIT(raw))
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    // Guardar número de doc sin formato para BD
    await onOk(values)
  }

  // Placeholder y validador dinámico según tipo de documento
  const docPlaceholder: Record<string, string> = {
    '13': '00000000-0',
    '36': '0000-000000-000-0',
    '37': 'Número de pasaporte',
    '03': 'Número de carné',
    '02': 'Número de carné de minoridad'
  }

  const docValidator = (_: unknown, val: string) => {
    if (!val) return Promise.reject('Requerido')
    if (tipoDoc === '13' && !/^\d{8}-\d$/.test(val))
      return Promise.reject('DUI inválido. Formato: 00000000-0')
    if (tipoDoc === '36' && val.replace(/\D/g, '').length !== 14)
      return Promise.reject('NIT debe tener 14 dígitos')
    return Promise.resolve()
  }

  return (
    <Modal
      title={
        <Space>
          {esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
          {esEdicion && <Tag color="blue">{TIPOS_DOC_LABELS[cliente!.tipoDocumento]} {cliente!.numDocumento}</Tag>}
        </Space>
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={esEdicion ? 'Guardar cambios' : 'Crear cliente'}
      cancelText="Cancelar"
      confirmLoading={loading}
      width={680}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="middle">

        {/* ── Identificación ─────────────────────────── */}
        <Divider orientation="left" plain style={{ marginTop: 0 }}>
          Identificación
        </Divider>

        <Row gutter={12}>
          <Col xs={24} sm={9}>
            <Form.Item
              label="Tipo de Documento"
              name="tipoDocumento"
              initialValue="13"
              rules={[{ required: true }]}
            >
              <Select
                options={TIPOS_DOCUMENTO_RECEPTOR.map(t => ({ value: t.codigo, label: t.nombre }))}
                onChange={onTipoDocChange}
                disabled={esEdicion}  // no cambiar tipo en edición
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={15}>
            <Form.Item
              label="Número de Documento"
              name="numDocumento"
              rules={[{ validator: docValidator }]}
            >
              <Input
                placeholder={docPlaceholder[tipoDoc]}
                onChange={onDocInput}
                maxLength={tipoDoc === '13' ? 10 : tipoDoc === '36' ? 17 : 20}
                disabled={esEdicion}  // no editar documento
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Datos generales ────────────────────────── */}
        <Divider orientation="left" plain>Datos Generales</Divider>

        <Row gutter={12}>
          <Col xs={24} sm={14}>
            <Form.Item
              label="Nombre / Razón Social"
              name="nombre"
              rules={[{ required: true, message: 'El nombre es requerido' }, { min: 2 }]}
            >
              <Input placeholder="Nombre completo o razón social" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={10}>
            <Form.Item label="Nombre Comercial" name="nombreComercial">
              <Input placeholder="Nombre comercial (opcional)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item
              label="NRC"
              name="nrc"
              tooltip="Requerido si el cliente es contribuyente del IVA (para emitir CCF)"
            >
              <Input placeholder="000000-0" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Teléfono"
              name="telefono"
            >
              <Input placeholder="2222-3333" maxLength={15} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              label="Correo Electrónico"
              name="correo"
              rules={[{ type: 'email', message: 'Correo inválido' }]}
              tooltip="Se usa para enviar el DTE al receptor"
            >
              <Input placeholder="cliente@correo.com" />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Dirección ──────────────────────────────── */}
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
                onChange={onDeptChange}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Municipio" name="municipioCod">
              <Select
                placeholder="Seleccionar municipio"
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={!departamento}
                options={municipios.map(m => ({ value: m.codigo, label: m.nombre }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Dirección Complementaria" name="complemento">
          <Input.TextArea
            rows={2}
            placeholder="Calle, Colonia, Número de casa..."
            maxLength={200}
            showCount
          />
        </Form.Item>

        {/* Aviso DUI */}
        {tipoDoc === '13' && !esEdicion && (
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 4 }}
            message="Consumidor Final con DUI"
            description="Se emitirá Factura Electrónica (DTE-01). Para emitir Comprobante de Crédito Fiscal (DTE-03) el cliente debe tener NIT y NRC."
          />
        )}
      </Form>
    </Modal>
  )
}
