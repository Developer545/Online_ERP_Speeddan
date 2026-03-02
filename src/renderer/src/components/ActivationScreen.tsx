import { useState } from 'react'
import { Card, Input, Button, Typography, App as AntApp } from 'antd'
import { LockOutlined, SafetyCertificateOutlined, KeyOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title, Text } = Typography

interface ActivationScreenProps {
    onValidated: (user?: UserSession) => void
    hwid: string
    expired?: boolean
}

interface ServerResponse {
    success: boolean
    message: string
    expiration_date: string
}

const DEFAULT_USER = 'admin'
const DEFAULT_PASS = 'Admin123!'

export default function ActivationScreen({ onValidated, hwid, expired }: ActivationScreenProps) {
    const { message: antMessage } = AntApp.useApp()

    const [licenseKey, setLicenseKey] = useState('')
    const [loading, setLoading] = useState(false)

    // ─────────────────────────────────────────────
    // Validar clave de licencia y auto-login
    // ─────────────────────────────────────────────
    const handleActivate = async () => {
        if (!licenseKey.trim()) {
            antMessage.warning('Ingresa un código de licencia válido')
            return
        }

        setLoading(true)
        try {
            const SERVER_URL = 'https://admin-licencias.vercel.app/api/licenses/activate'

            const { data } = await axios.post<ServerResponse>(SERVER_URL, {
                license_key: licenseKey.trim(),
                hardware_id: hwid
            })

            if (data.success) {
                // Guardar licencia localmente
                // @ts-ignore
                const res = await window.license.save({
                    key: licenseKey.trim(),
                    expDate: data.expiration_date
                })

                if (!res.success) {
                    antMessage.error(`Error al guardar licencia: ${res.error ?? 'Error desconocido'}`)
                    return
                }

                antMessage.success(data.message)

                // Crear/asegurar usuario admin y entrar al sistema
                await setupAndLogin()
            }
        } catch (error: any) {
            if (error.response?.data?.error) {
                antMessage.error(error.response.data.error)
            } else {
                antMessage.error('Error de conexión con el servidor de licencias. Verifica tu internet.')
            }
        } finally {
            setLoading(false)
        }
    }

    // ─────────────────────────────────────────────
    // Crear usuario admin en BD local y entrar
    // ─────────────────────────────────────────────
    const setupAndLogin = async () => {
        try {
            // @ts-ignore
            const result = await window.seguridad.provisionUser(DEFAULT_USER, DEFAULT_PASS)
            if (result.ok && result.user) {
                onValidated(result.user)
            } else {
                const msg = result.error ?? 'No se pudo iniciar sesión. Reinicia la aplicación.'
                antMessage.error(msg)
            }
        } catch (err: any) {
            const msg = err?.message ?? 'Error al configurar el acceso. Reinicia la aplicación.'
            antMessage.error(msg)
        }
    }

    // ─────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────
    const inputStyle = {
        background: '#0d1117',
        borderColor: '#30363d',
        color: '#fff'
    } as const

    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)'
            }}
        >
            <Card
                style={{
                    width: 460,
                    background: '#1c2128',
                    borderColor: '#30363d',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    textAlign: 'center'
                }}
                bordered={false}
            >
                {/* Ícono */}
                <div style={{ marginBottom: 20 }}>
                    {expired
                        ? <LockOutlined style={{ fontSize: 48, color: '#f85149' }} />
                        : <SafetyCertificateOutlined style={{ fontSize: 48, color: '#58a6ff' }} />
                    }
                </div>

                {/* Título */}
                <Title level={3} style={{ color: '#fff', marginTop: 0, marginBottom: 6 }}>
                    {expired ? 'Periodo de Demo Expirado' : 'Activación de Software'}
                </Title>

                {/* Subtítulo */}
                <Text style={{ color: '#8b949e', display: 'block', marginBottom: 24, fontSize: '0.95rem' }}>
                    {expired
                        ? 'Tu tiempo de prueba ha terminado. Por favor, contrata tu plan para seguir utilizando Speeddansys ERP.'
                        : 'Ingresa el código de activación que tu proveedor te proporcionó.'
                    }
                </Text>

                {/* Clave de licencia */}
                {!expired && (
                    <>
                        <Input
                            size="large"
                            placeholder="SPEED-XXXX-XXXX-XXXX"
                            prefix={<KeyOutlined style={{ color: '#58a6ff' }} />}
                            value={licenseKey}
                            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                            onPressEnter={handleActivate}
                            style={{
                                ...inputStyle,
                                marginBottom: 16,
                                textAlign: 'center',
                                letterSpacing: 2,
                                fontWeight: 'bold'
                            }}
                        />

                        <Button
                            type="primary"
                            size="large"
                            block
                            loading={loading}
                            onClick={handleActivate}
                            style={{ background: '#2ea043', borderColor: '#2ea043', fontWeight: 600 }}
                        >
                            Activar y Entrar al Sistema
                        </Button>

                        <Text style={{ color: '#555', fontSize: '0.78rem', display: 'block', marginTop: 16 }}>
                            HWID: {hwid}
                        </Text>
                    </>
                )}
            </Card>
        </div>
    )
}
