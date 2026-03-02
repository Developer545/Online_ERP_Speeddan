import { useState, useEffect } from 'react'
import {
  Card, Form, Input, Select, Button, Space, Typography,
  Alert, Tabs, Divider, message, Badge, Row, Col,
  Table, Popconfirm, Tooltip, Modal, Tag, Switch
} from 'antd'
import {
  SaveOutlined, SafetyOutlined, GlobalOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, ReloadOutlined, CheckCircleOutlined,
  ExperimentOutlined, WarningOutlined
} from '@ant-design/icons'
import {
  DEPARTAMENTOS, MUNICIPIOS, TIPOS_ESTABLECIMIENTO
} from '@shared/constants/catalogs'

const { Title, Text } = Typography

// Actividades económicas más comunes (CIIU simplificado)
const ACTIVIDADES = [
  { codigo: '01010', nombre: 'Agricultura y ganadería' },
  { codigo: '10110', nombre: 'Elaboración de productos alimenticios' },
  { codigo: '45000', nombre: 'Construcción' },
  { codigo: '46100', nombre: 'Comercio al por mayor' },
  { codigo: '47110', nombre: 'Comercio al por menor (supermercados)' },
  { codigo: '47710', nombre: 'Venta al por menor de prendas de vestir' },
  { codigo: '47780', nombre: 'Venta al por menor - otros artículos' },
  { codigo: '56100', nombre: 'Restaurantes y servicios de comida' },
  { codigo: '62010', nombre: 'Actividades de programación y consultoría' },
  { codigo: '69100', nombre: 'Actividades jurídicas' },
  { codigo: '69200', nombre: 'Actividades de contabilidad' },
  { codigo: '70200', nombre: 'Actividades de consultoría de gestión' },
  { codigo: '73110', nombre: 'Publicidad' },
  { codigo: '77100', nombre: 'Alquiler de vehículos' },
  { codigo: '85100', nombre: 'Educación' },
  { codigo: '86100', nombre: 'Actividades de hospitales' },
  { codigo: '95110', nombre: 'Reparación de computadoras' },
  { codigo: '99000', nombre: 'Otro' }
]

export default function BillingSettingsPage() {
  const [formEmisor] = Form.useForm()
  const [formCred] = Form.useForm()
  const [formSucursal] = Form.useForm()
  const [deptoEmisor, setDeptoEmisor] = useState('')
  const [deptoSucursal, setDeptoSucursal] = useState('')
  const [certStatus, setCertStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [guardandoEmisor, setGuardandoEmisor] = useState(false)
  const [guardandoCred, setGuardandoCred] = useState(false)
  const [sucursales, setSucursales] = useState<SucursalRow[]>([])
  const [modalSucursalOpen, setModalSucursalOpen] = useState(false)
  const [sucursalEditando, setSucursalEditando] = useState<SucursalRow | null>(null)
  const [guardandoSucursal, setGuardandoSucursal] = useState(false)
  const [loading, setLoading] = useState(true)
  // ── Simulación ─────────────────────────────────────────────
  const [modoSimulacion, setModoSimulacion] = useState(false)
  const [activandoSim, setActivandoSim] = useState(false)

  const municipiosEmisor = deptoEmisor ? MUNICIPIOS.filter(m => m.departamento === deptoEmisor) : []
  const municipiosSucursal = deptoSucursal ? MUNICIPIOS.filter(m => m.departamento === deptoSucursal) : []

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const emisor = await window.configuracion.getEmisor()
      if (emisor) {
        formEmisor.setFieldsValue({
          nombre: emisor.nombre,
          nombreComercial: emisor.nombreComercial,
          nit: emisor.nit,
          nrc: emisor.nrc,
          codActividad: emisor.codActividad,
          descActividad: emisor.descActividad,
          tipoEstablecimiento: emisor.tipoEstablecimiento,
          departamentoCod: emisor.departamentoCod,
          municipioCod: emisor.municipioCod,
          complementoDireccion: emisor.complementoDireccion,
          telefono: emisor.telefono,
          correo: emisor.correo
        })
        setDeptoEmisor(emisor.departamentoCod)

        formCred.setFieldsValue({
          mhAmbiente: emisor.mhAmbiente,
          mhApiUser: emisor.mhApiUser ?? '',
          certPath: emisor.certPath ?? ''
        })

        setSucursales(emisor.sucursales ?? [])
        setModoSimulacion(emisor.modoSimulacion ?? false)
      }
    } catch {
      message.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleActivarSimulacion = async () => {
    setActivandoSim(true)
    try {
      await window.configuracion.activarModoSimulacion()
      setModoSimulacion(true)
      message.success('✅ Modo Simulación activado — Ya puedes emitir facturas de prueba')
      cargarDatos()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al activar simulación')
    } finally {
      setActivandoSim(false)
    }
  }

  const handleToggleSimulacion = async (val: boolean) => {
    try {
      await window.configuracion.toggleSimulacion(val)
      setModoSimulacion(val)
      message.success(val ? '🟡 Modo Simulación activado' : '✅ Modo Simulación desactivado — usando credenciales reales')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al cambiar modo')
    }
  }

  useEffect(() => { cargarDatos() }, []) // eslint-disable-line

  const handleGuardarEmisor = async () => {
    const values = await formEmisor.validateFields()
    setGuardandoEmisor(true)
    try {
      // codActividad seleccionado → descripción automática
      const act = ACTIVIDADES.find(a => a.codigo === values.codActividad)
      await window.configuracion.guardarEmisor({
        ...values,
        descActividad: act?.nombre ?? values.descActividad ?? values.codActividad
      })
      message.success('Datos del emisor guardados correctamente')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar emisor')
    } finally {
      setGuardandoEmisor(false)
    }
  }

  const handleGuardarCredenciales = async () => {
    const values = await formCred.validateFields()
    setGuardandoCred(true)
    try {
      await window.configuracion.guardarCredencialesMH(values)
      message.success('Credenciales MH guardadas correctamente')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar credenciales')
    } finally {
      setGuardandoCred(false)
    }
  }

  const handleTestCert = async () => {
    const values = formCred.getFieldsValue()
    if (!values.certPath || !values.certPassword) {
      message.warning('Ingrese la ruta del certificado y su contraseña')
      return
    }
    setCertStatus('checking')
    const certFileName = values.certPath.split('\\').pop() ?? values.certPath
    const result = await window.billing.verificarCertificado(certFileName, values.certPassword)
    setCertStatus(result.valid ? 'ok' : 'error')
    if (!result.valid) message.error(result.error ?? 'Certificado inválido')
    else message.success('Certificado válido y funcional')
  }

  const handleAbrirSucursal = (suc?: SucursalRow) => {
    setSucursalEditando(suc ?? null)
    if (suc) {
      formSucursal.setFieldsValue({ ...suc })
      setDeptoSucursal(suc.departamentoCod)
    } else {
      formSucursal.resetFields()
    }
    setModalSucursalOpen(true)
  }

  const handleGuardarSucursal = async () => {
    const values = await formSucursal.validateFields()
    setGuardandoSucursal(true)
    try {
      await window.configuracion.guardarSucursal({
        ...values,
        ...(sucursalEditando ? { id: sucursalEditando.id } : {})
      })
      message.success(sucursalEditando ? 'Sucursal actualizada' : 'Sucursal creada')
      setModalSucursalOpen(false)
      cargarDatos()
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Error al guardar sucursal')
    } finally {
      setGuardandoSucursal(false)
    }
  }

  const handleDesactivarSucursal = async (id: number, nombre: string) => {
    try {
      await window.configuracion.desactivarSucursal(id)
      message.success(`Sucursal "${nombre}" desactivada`)
      cargarDatos()
    } catch {
      message.error('Error al desactivar sucursal')
    }
  }

  const sucursalCols = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (v: string) => <Text strong>{v}</Text>
    },
    {
      title: 'Código MH',
      dataIndex: 'codMH',
      key: 'codMH',
      width: 110,
      render: (v: string) => <Text code>{v}</Text>
    },
    {
      title: 'Punto Venta',
      dataIndex: 'puntoVenta',
      key: 'pv',
      width: 110,
      render: (v: string) => <Text code>{v}</Text>
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoEstab',
      key: 'tipo',
      width: 90,
      render: (v: string) => {
        const t = TIPOS_ESTABLECIMIENTO.find(x => x.codigo === v)
        return <Tag>{t?.nombre ?? v}</Tag>
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: SucursalRow) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button size="small" type="primary" ghost icon={<EditOutlined />}
              onClick={() => handleAbrirSucursal(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar esta sucursal?"
            okText="Desactivar" cancelText="Cancelar" okButtonProps={{ danger: true }}
            onConfirm={() => handleDesactivarSucursal(record.id, record.nombre)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const tabItems = [
    // ── TAB 1: Datos del Emisor ──────────────────────────────
    {
      key: 'emisor',
      label: 'Datos del Emisor',
      children: (
        <Form form={formEmisor} layout="vertical" onFinish={handleGuardarEmisor}>
          <Title level={5}>Información Fiscal</Title>
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item label="Razón Social" name="nombre" rules={[{ required: true }]}>
                <Input placeholder="Empresa Ejemplo S.A. de C.V." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Nombre Comercial" name="nombreComercial">
                <Input placeholder="Nombre comercial (opcional)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item label="NIT (14 dígitos)" name="nit" rules={[{ required: true, len: 14, message: 'NIT debe tener 14 dígitos' }]}>
                <Input placeholder="00000000000000" maxLength={14} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="NRC" name="nrc" rules={[{ required: true }]}>
                <Input placeholder="000000-0" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Correo Electrónico" name="correo" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="empresa@correo.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="Actividad Económica" name="codActividad" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Seleccionar actividad"
                  options={ACTIVIDADES.map(a => ({ value: a.codigo, label: `${a.codigo} — ${a.nombre}` }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label="Tipo de Establecimiento" name="tipoEstablecimiento" rules={[{ required: true }]}>
                <Select
                  options={TIPOS_ESTABLECIMIENTO.map(t => ({ value: t.codigo, label: t.nombre }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item label="Teléfono" name="telefono">
                <Input placeholder="2222-3333" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Dirección Fiscal</Divider>
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item label="Departamento" name="departamentoCod" rules={[{ required: true }]}>
                <Select
                  showSearch optionFilterProp="label" placeholder="Seleccionar"
                  options={DEPARTAMENTOS.map(d => ({ value: d.codigo, label: d.nombre }))}
                  onChange={cod => { setDeptoEmisor(cod); formEmisor.setFieldValue('municipioCod', undefined) }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Municipio" name="municipioCod" rules={[{ required: true }]}>
                <Select
                  showSearch optionFilterProp="label" placeholder="Seleccionar"
                  disabled={!deptoEmisor}
                  options={municipiosEmisor.map(m => ({ value: m.codigo, label: m.nombre }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Complemento de Dirección" name="complementoDireccion" rules={[{ required: true }]}>
                <Input placeholder="Calle, Colonia, Número..." />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={guardandoEmisor}>
            Guardar Datos del Emisor
          </Button>
        </Form>
      )
    },

    // ── TAB 2: Credenciales MH ───────────────────────────────
    {
      key: 'credenciales',
      label: <Space><GlobalOutlined />Credenciales API MH</Space>,
      children: (
        <Form form={formCred} layout="vertical" onFinish={handleGuardarCredenciales}>

          {/* ─── PANEL DE SIMULACIÓN ─────────────────────── */}
          <Card
            style={{
              marginBottom: 24,
              border: modoSimulacion ? '2px solid #faad14' : '2px dashed #d9d9d9',
              background: modoSimulacion ? '#fffbe6' : '#fafafa',
              borderRadius: 8
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Space align="center">
                <ExperimentOutlined style={{ fontSize: 22, color: modoSimulacion ? '#faad14' : '#8c8c8c' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    Simulación de Credenciales
                    {modoSimulacion && <Tag color="orange" style={{ marginLeft: 8 }}>ACTIVO</Tag>}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    Emite facturas de prueba sin credenciales reales del MH. Cuando tengas tus credenciales originales, desactiva este modo.
                  </div>
                </div>
              </Space>
              <Space wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<ExperimentOutlined />}
                  loading={activandoSim}
                  disabled={modoSimulacion}
                  onClick={handleActivarSimulacion}
                  style={{
                    background: modoSimulacion ? undefined : 'linear-gradient(135deg, #fa8c16 0%, #faad14 100%)',
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  {modoSimulacion ? '✅ Simulación Activa' : '🚀 Activar Simulación de Credenciales'}
                </Button>
                {modoSimulacion && (
                  <Button
                    danger
                    size="large"
                    icon={<WarningOutlined />}
                    onClick={() => handleToggleSimulacion(false)}
                  >
                    Desactivar — Usar Credenciales Reales
                  </Button>
                )}
                <Switch
                  checked={modoSimulacion}
                  onChange={handleToggleSimulacion}
                  checkedChildren="SIM ON"
                  unCheckedChildren="SIM OFF"
                />
              </Space>
              {modoSimulacion && (
                <Alert
                  type="warning"
                  showIcon
                  message="Los DTEs generados en modo simulación NO son válidos fiscalmente y NO se transmiten al Ministerio de Hacienda."
                />
              )}
            </Space>
          </Card>
          {/* ────────────────────────────────────────────── */}

          <Alert
            type="info" showIcon style={{ marginBottom: 16 }}
            message="Credenciales del Ministerio de Hacienda"
            description="Obténgalas en admin.factura.gob.sv después de registrarse como Emisor DTE."
          />

          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item label="Ambiente MH" name="mhAmbiente" initialValue="00" rules={[{ required: true }]}>
                <Select options={[
                  { value: '00', label: 'Pruebas / Homologación' },
                  { value: '01', label: '⚠ Producción (real)' }
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="NIT para autenticación MH" name="mhApiUser" rules={[{ required: true }]}>
                <Input placeholder="00000000000000" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Clave API del MH" name="mhApiPassword">
                <Input.Password placeholder="Mínimo 8 chars, 1 mayúscula, 1 especial" />
              </Form.Item>
            </Col>
          </Row>

          <Divider><SafetyOutlined /> Certificado de Firma Digital</Divider>

          <Alert type="warning" showIcon style={{ marginBottom: 16 }}
            message="Archivo .crt de firma digital"
            description={
              <div>
                <Text>Coloque el archivo en la carpeta: </Text>
                <Text code>%APPDATA%\Speeddansys\certificates\</Text>
                <br />
                <Text type="secondary">En desarrollo se usa: </Text>
                <Text code>resources/certificates/</Text>
              </div>
            }
          />

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="Nombre del archivo .crt" name="certPath" rules={[{ required: true }]}>
                <Input placeholder="06141804941035.crt" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Contraseña del certificado" name="certPassword">
                <Input.Password placeholder="Contraseña del archivo .crt" />
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ marginBottom: 16 }}>
            <Button
              icon={<SafetyOutlined />}
              onClick={handleTestCert}
              loading={certStatus === 'checking'}
            >
              Verificar Certificado
            </Button>
            {certStatus === 'ok' && <Badge status="success" text="Certificado válido" />}
            {certStatus === 'error' && <Badge status="error" text="Certificado inválido o incorrecto" />}
          </Space>

          <Divider />
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={guardandoCred}>
            Guardar Credenciales MH
          </Button>
        </Form>
      )
    },

    // ── TAB 3: Sucursales ────────────────────────────────────
    {
      key: 'sucursales',
      label: 'Sucursales / Establecimientos',
      children: (
        <div>
          <Alert type="info" showIcon style={{ marginBottom: 16 }}
            message="Codificación de Establecimientos y Puntos de Venta"
            description="Los códigos MH son asignados por el Ministerio de Hacienda. El formato del número de control DTE usa estos códigos: DTE-01-{codMH}{puntoVenta}-{correlativo}"
          />
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5} style={{ margin: 0 }}>Sucursales Activas</Title>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={cargarDatos}>Actualizar</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAbrirSucursal()}>
                Nueva Sucursal
              </Button>
            </Space>
          </div>

          <Table
            dataSource={sucursales}
            columns={sucursalCols}
            rowKey="id"
            size="small"
            loading={loading}
            pagination={false}
            locale={{ emptyText: 'Sin sucursales configuradas. Agregue al menos una para poder emitir DTEs.' }}
          />

          {sucursales.length > 0 && (
            <Alert type="success" showIcon style={{ marginTop: 12 }}
              icon={<CheckCircleOutlined />}
              message={`${sucursales.length} sucursal(es) configurada(s) correctamente`}
            />
          )}
        </div>
      )
    }
  ]

  return (
    <Card title="Configuración de Facturación Electrónica DTE" loading={loading}>

      {/* ── BANNER DE SIMULACIÓN ACTIVA ─────────────── */}
      {modoSimulacion && (
        <Alert
          type="warning"
          showIcon
          icon={<ExperimentOutlined />}
          style={{ marginBottom: 24, border: '2px solid #faad14', background: '#fffbe6' }}
          message={
            <Space>
              <span style={{ fontWeight: 700, fontSize: 15 }}>🟡 MODO SIMULACIÓN ACTIVO</span>
              <Tag color="orange">Sin conexión real al MH</Tag>
            </Space>
          }
          description="Las facturas y DTEs emitidos son de prueba y NO se envían al Ministerio de Hacienda. Los documentos quedan en estado RECIBIDO con un sello simulado."
          action={
            <Button
              danger
              size="small"
              onClick={() => handleToggleSimulacion(false)}
              icon={<WarningOutlined />}
            >
              Desactivar Simulación
            </Button>
          }
        />
      )}

      {!loading && !modoSimulacion && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 24 }}
          message="Complete todos los datos antes de emitir facturas"
          description="1. Configure datos del emisor → 2. Configure credenciales MH → 3. Agregue al menos una sucursal"
        />
      )}
      <Tabs items={tabItems} />

      {/* Modal Sucursal */}
      <Modal
        title={sucursalEditando ? 'Editar Sucursal' : 'Nueva Sucursal'}
        open={modalSucursalOpen}
        onOk={handleGuardarSucursal}
        onCancel={() => setModalSucursalOpen(false)}
        okText={sucursalEditando ? 'Guardar cambios' : 'Crear sucursal'}
        cancelText="Cancelar"
        confirmLoading={guardandoSucursal}
        width={600}
        destroyOnClose
      >
        <Form form={formSucursal} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item label="Nombre de la Sucursal" name="nombre" rules={[{ required: true }]}>
                <Input placeholder="Casa Matriz, Sucursal Norte, etc." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Tipo de Establecimiento" name="tipoEstab" rules={[{ required: true }]}>
                <Select options={TIPOS_ESTABLECIMIENTO.map(t => ({ value: t.codigo, label: t.nombre }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Código Establecimiento MH"
                name="codMH"
                rules={[{ required: true, pattern: /^M\d{3}$/, message: 'Formato: M001' }]}
                tooltip="Asignado por MH. Formato: M001"
              >
                <Input placeholder="M001" maxLength={4} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Código Punto de Venta MH"
                name="puntoVenta"
                rules={[{ required: true, pattern: /^P\d{3}$/, message: 'Formato: P001' }]}
                tooltip="Asignado por MH. Formato: P001"
              >
                <Input placeholder="P001" maxLength={4} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Teléfono" name="telefono">
                <Input placeholder="2222-3333" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item label="Departamento" name="departamentoCod" rules={[{ required: true }]}>
                <Select
                  showSearch optionFilterProp="label" placeholder="Seleccionar"
                  options={DEPARTAMENTOS.map(d => ({ value: d.codigo, label: d.nombre }))}
                  onChange={cod => { setDeptoSucursal(cod); formSucursal.setFieldValue('municipioCod', undefined) }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Municipio" name="municipioCod" rules={[{ required: true }]}>
                <Select
                  showSearch optionFilterProp="label" placeholder="Seleccionar"
                  disabled={!deptoSucursal}
                  options={municipiosSucursal.map(m => ({ value: m.codigo, label: m.nombre }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Complemento de Dirección" name="complemento" rules={[{ required: true }]}>
            <Input placeholder="Calle, Colonia, Número..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
