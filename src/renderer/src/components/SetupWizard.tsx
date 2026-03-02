// ══════════════════════════════════════════════════════════
// SETUP WIZARD — Configuración inicial de PostgreSQL
// Se muestra cuando la conexión automática falla.
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Steps,
  Typography,
  Alert,
  Space,
  Spin,
  ConfigProvider,
  theme as antTheme
} from 'antd'
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  UserOutlined,
  GlobalOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface SetupWizardProps {
  onComplete: () => void
}

type Step = 'credentials' | 'testing' | 'creating' | 'done' | 'error'

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [form] = Form.useForm()
  const [step, setStep] = useState<Step>('credentials')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const steps = [
    { title: 'Credenciales', description: 'Datos de PostgreSQL' },
    { title: 'Verificando', description: 'Probando conexión' },
    { title: 'Creando BD', description: 'Configurando base de datos' },
    { title: 'Listo', description: 'Instalación completa' }
  ]

  async function handleConnect() {
    try {
      await form.validateFields()
    } catch {
      return
    }

    const values = form.getFieldsValue()
    const creds = {
      host: values.host || 'localhost',
      port: values.port || 5432,
      user: values.user || 'postgres',
      password: values.password || ''
    }

    // Paso 1: probar conexión
    setStep('testing')
    setCurrentStepIndex(1)
    setErrorMsg('')

    // @ts-ignore
    const testResult = await window.setup.testConnection(creds)

    if (!testResult.success) {
      setStep('error')
      setErrorMsg(testResult.error || 'No se pudo conectar a PostgreSQL.')
      setCurrentStepIndex(0)
      return
    }

    // Paso 2: crear base de datos
    setStep('creating')
    setCurrentStepIndex(2)

    // @ts-ignore
    const createResult = await window.setup.createDatabase(creds)

    if (!createResult.success) {
      setStep('error')
      setErrorMsg(createResult.error || 'Error al crear la base de datos.')
      setCurrentStepIndex(0)
      return
    }

    // Paso 3: listo
    setStep('done')
    setCurrentStepIndex(3)
  }

  return (
    <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm }}>
      <div style={{
        minHeight: '100vh',
        background: '#0d1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <div style={{
          width: '100%',
          maxWidth: 560,
          background: '#161b22',
          borderRadius: 12,
          border: '1px solid #30363d',
          padding: '40px 48px'
        }}>
          {/* Header */}
          <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 32, textAlign: 'center' }}>
            <DatabaseOutlined style={{ fontSize: 40, color: '#1677ff' }} />
            <Title level={3} style={{ color: '#e6edf3', margin: 0 }}>
              Configuración de Base de Datos
            </Title>
            <Text style={{ color: '#8b949e', fontSize: 13 }}>
              Ingresa las credenciales de tu PostgreSQL para continuar
            </Text>
          </Space>

          {/* Stepper */}
          <Steps
            current={currentStepIndex}
            size="small"
            items={steps}
            style={{ marginBottom: 32 }}
          />

          {/* Error */}
          {step === 'error' && (
            <Alert
              type="error"
              message="Error de conexión"
              description={errorMsg}
              showIcon
              style={{ marginBottom: 24, borderRadius: 8 }}
              closable
              onClose={() => setStep('credentials')}
            />
          )}

          {/* Formulario */}
          {(step === 'credentials' || step === 'error') && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{ host: 'localhost', port: 5432, user: 'postgres', password: '' }}
              onFinish={handleConnect}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                <Form.Item
                  label={<Text style={{ color: '#8b949e' }}>Host</Text>}
                  name="host"
                  rules={[{ required: true, message: 'Ingresa el host' }]}
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    prefix={<GlobalOutlined style={{ color: '#8b949e' }} />}
                    placeholder="localhost"
                    style={{ background: '#0d1117', borderColor: '#30363d', color: '#e6edf3' }}
                  />
                </Form.Item>
                <Form.Item
                  label={<Text style={{ color: '#8b949e' }}>Puerto</Text>}
                  name="port"
                  rules={[{ required: true, message: 'Ingresa el puerto' }]}
                  style={{ marginBottom: 16 }}
                >
                  <InputNumber
                    min={1}
                    max={65535}
                    style={{ width: '100%', background: '#0d1117', borderColor: '#30363d' }}
                  />
                </Form.Item>
              </div>

              <Form.Item
                label={<Text style={{ color: '#8b949e' }}>Usuario de PostgreSQL</Text>}
                name="user"
                rules={[{ required: true, message: 'Ingresa el usuario' }]}
                style={{ marginBottom: 16 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#8b949e' }} />}
                  placeholder="postgres"
                  style={{ background: '#0d1117', borderColor: '#30363d', color: '#e6edf3' }}
                />
              </Form.Item>

              <Form.Item
                label={<Text style={{ color: '#8b949e' }}>Contraseña de PostgreSQL</Text>}
                name="password"
                style={{ marginBottom: 24 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#8b949e' }} />}
                  placeholder="Dejar vacío si no tiene contraseña"
                  style={{ background: '#0d1117', borderColor: '#30363d', color: '#e6edf3' }}
                />
              </Form.Item>

              <Paragraph style={{ color: '#8b949e', fontSize: 12, marginBottom: 24 }}>
                Speeddansys ERP necesita PostgreSQL 14 o superior instalado en esta computadora.
                El sistema creará automáticamente la base de datos <Text code style={{ fontSize: 12 }}>cliente_db</Text>.
              </Paragraph>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                icon={<DatabaseOutlined />}
                style={{ height: 44, borderRadius: 8 }}
              >
                Verificar y Configurar Base de Datos
              </Button>
            </Form>
          )}

          {/* En proceso */}
          {(step === 'testing' || step === 'creating') && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 40, color: '#1677ff' }} />} />
              <div style={{ marginTop: 20 }}>
                <Text style={{ color: '#e6edf3', fontSize: 15 }}>
                  {step === 'testing' ? 'Verificando conexión a PostgreSQL...' : 'Creando base de datos y aplicando configuración...'}
                </Text>
                <br />
                <Text style={{ color: '#8b949e', fontSize: 12 }}>
                  {step === 'creating' ? 'Esto puede tomar hasta 30 segundos' : ''}
                </Text>
              </div>
            </div>
          )}

          {/* Completado */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#e6edf3', marginBottom: 8 }}>
                ¡Base de datos configurada!
              </Title>
              <Paragraph style={{ color: '#8b949e', marginBottom: 28 }}>
                La base de datos fue creada exitosamente. Las credenciales han sido guardadas para próximas sesiones.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                block
                style={{ height: 44, borderRadius: 8, background: '#3fb950', borderColor: '#3fb950' }}
                onClick={onComplete}
              >
                Continuar con la Activación
              </Button>
            </div>
          )}
        </div>
      </div>
    </ConfigProvider>
  )
}
