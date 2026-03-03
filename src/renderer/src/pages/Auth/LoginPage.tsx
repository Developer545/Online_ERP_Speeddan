import { useEffect, useRef, useState } from 'react'
import { Form, Input, Button, Typography, Alert, Modal } from 'antd'
import { UserOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import animeLib from 'animejs/lib/anime.es.js'
import logoWhite from '../../assets/logo_speeddansys_transparent_white.png'
import logoLight from '../../assets/logo_speeddansys_transparent.png'

const anime: any = animeLib || null
const { Text } = Typography

export default function LoginPage() {
  const { login, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [envMode, setEnvMode] = useState<'test' | 'production'>('test')
  const [switching, setSwitching] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const { currentTheme } = useTheme()
  const isDarkTheme = currentTheme.isDark

  // Leer el entorno activo desde el proceso principal
  useEffect(() => {
    window.appControl?.getEnvMode().then(setEnvMode).catch(() => { })
  }, [])

  // Animaciones de entrada
  useEffect(() => {
    if (!anime) {
      if (cardRef.current) cardRef.current.style.opacity = '1'
      if (logoRef.current) logoRef.current.style.opacity = '1'
      document.querySelectorAll('.login-anim').forEach((el) => {
        (el as HTMLElement).style.opacity = '1'
      })
      return
    }
    anime({ targets: cardRef.current, opacity: [0, 1], translateY: [50, 0], scale: [0.88, 1], duration: 900, easing: 'easeOutCubic' })
    anime({ targets: logoRef.current, scale: [0, 1], rotate: ['-180deg', '0deg'], opacity: [0, 1], duration: 1100, delay: 250, easing: 'spring(1, 80, 10, 0)' })
    anime({ targets: '.login-anim', opacity: [0, 1], translateY: [18, 0], duration: 600, delay: anime.stagger(110, { start: 550 }), easing: 'easeOutCubic' })
  }, [])

  const handleEnvSwitch = async (mode: 'test' | 'production') => {
    if (mode === envMode) return

    if (mode === 'production') {
      const canSwitch = await window.appControl?.canSwitchToProd().catch(() => false)
      if (!canSwitch) {
        Modal.warning({
          title: 'No configurado',
          content: 'DATABASE_URL_PROD no está definida en el archivo .env. Configúrala primero.',
        })
        return
      }
      Modal.confirm({
        title: 'Cambiar a PRODUCCIÓN',
        icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
        content: (
          <div>
            <p>Estás a punto de conectarte a la base de datos <strong>real del cliente</strong>.</p>
            <p style={{ color: '#ff4d4f', marginTop: 8 }}>⚠ Cualquier cambio afectará datos reales.</p>
          </div>
        ),
        okText: 'Sí, conectar a Producción',
        okButtonProps: { danger: true },
        cancelText: 'Cancelar',
        onOk: () => doSwitch('production'),
      })
    } else {
      doSwitch('test')
    }
  }

  const doSwitch = async (mode: 'test' | 'production') => {
    setSwitching(true)
    try {
      await window.appControl?.setEnvMode(mode)
      setEnvMode(mode)
    } catch {
      setError('No se pudo cambiar el entorno')
    } finally {
      setSwitching(false)
    }
  }

  const onFinish = async (values: { username: string; password: string }) => {
    setError(null)
    const result = await login(values.username, values.password)
    if (!result.ok) {
      if (anime && cardRef.current) {
        anime({ targets: cardRef.current, translateX: [-12, 12, -9, 9, -6, 6, 0], duration: 450, easing: 'easeInOutSine' })
      }
      setError(result.error || 'Error al iniciar sesión')
    }
  }

  const isProd = envMode === 'production'

  return (
    <div className={`login-bg ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />
      <div className="login-grid" />

      <div ref={cardRef} className={`login-card ${isDarkTheme ? 'dark' : 'light'}`} style={{ opacity: 0 }}>
        <div className="login-top-bar" />

        {/* Logo */}
        <div ref={logoRef} className="login-logo-section" style={{ opacity: 0, textAlign: 'center' }}>
          <img
            src={isDarkTheme ? logoWhite : logoLight}
            alt="Speeddansys ERP"
            style={{
              height: 120,
              objectFit: 'contain',
              marginBottom: 20,
              filter: isDarkTheme ? 'drop-shadow(0 4px 12px rgba(255,255,255,0.1))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
            }}
          />
          <Text style={{ color: isDarkTheme ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase', display: 'block' }}>
            Facturación Electrónica DTE · El Salvador
          </Text>
        </div>

        {/* Selector de entorno */}
        <div className="login-anim login-env-selector" style={{ opacity: 0 }}>
          <span className="login-env-label">Entorno de conexión</span>
          <div className="login-env-toggle">
            <button
              className={`login-env-opt ${!isProd ? 'active-test' : ''}`}
              onClick={() => handleEnvSwitch('test')}
              disabled={switching}
            >
              <span className="login-env-opt-dot" />
              Pruebas
            </button>
            <button
              className={`login-env-opt ${isProd ? 'active-prod' : ''}`}
              onClick={() => handleEnvSwitch('production')}
              disabled={switching}
            >
              <span className="login-env-opt-dot" />
              Producción
            </button>
          </div>
          {isProd && (
            <span className="login-env-warning">⚠ Datos reales del cliente</span>
          )}
        </div>

        <div className="login-divider login-anim" style={{ opacity: 0 }} />

        {error && (
          <Alert
            type="error" message={error} showIcon closable
            onClose={() => setError(null)}
            style={{ marginBottom: 20, borderRadius: 8, background: 'rgba(255,77,79,0.12)', border: '1px solid rgba(255,77,79,0.3)' }}
          />
        )}

        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <div className="login-anim" style={{ opacity: 0 }}>
            <Form.Item name="username" rules={[{ required: true, message: 'Ingrese su usuario' }]}>
              <Input prefix={<UserOutlined className="login-prefix-icon" />} placeholder="Usuario" className="login-input" autoFocus />
            </Form.Item>
          </div>
          <div className="login-anim" style={{ opacity: 0 }}>
            <Form.Item name="password" rules={[{ required: true, message: 'Ingrese su contraseña' }]}>
              <Input.Password prefix={<LockOutlined className="login-prefix-icon" />} placeholder="Contraseña" className="login-input" />
            </Form.Item>
          </div>
          <div className="login-anim" style={{ opacity: 0 }}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block
                className={`login-btn ${isProd ? 'login-btn-prod' : ''}`}>
                Iniciar Sesión
              </Button>
            </Form.Item>
          </div>
        </Form>

        <div className="login-anim login-footer-text" style={{ opacity: 0 }}>
          © 2025 Speeddansys · v1.0.0
        </div>
      </div>
    </div>
  )
}
