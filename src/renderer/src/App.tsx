import { ConfigProvider, App as AntApp, Spin } from 'antd'
import esES from 'antd/locale/es_ES'
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from '@components/Layout/MainLayout'
import LoginPage from '@pages/Auth/LoginPage'
import Dashboard from '@pages/Dashboard/Dashboard'

// Setup y Licencia
import SetupWizard from '@components/SetupWizard'
import ActivationScreen from '@components/ActivationScreen'

// Clientes
import ClientesPage from '@pages/Clients/ClientesPage'

// Proveedores
import ProveedoresPage from '@pages/Proveedores/ProveedoresPage'

// Empleados
import EmpleadosPage from '@pages/Empleados/EmpleadosPage'

// Inventario
import ProductosPage from '@pages/Products/ProductosPage'
import InventarioPage from '@pages/Inventory/InventarioPage'
import KardexPage from '@pages/Inventory/KardexPage'

// Compras
import ComprasPage from '@pages/Compras/ComprasPage'

// Facturación
import FacturasPage from '@pages/Billing/Invoices/FacturasPage'
import NuevaFacturaPage from '@pages/Billing/Invoices/NuevaFacturaPage'
import CCFPage from '@pages/Billing/CCF/CCFPage'
import NuevoCCFPage from '@pages/Billing/CCF/NuevoCCFPage'
import AnulacionesPage from '@pages/Billing/Anulaciones/AnulacionesPage'
import NotaCreditoPage from '@pages/Billing/Notas/NotaCreditoPage'
import NotaDebitoPage from '@pages/Billing/Notas/NotaDebitoPage'
import BillingSettingsPage from '@pages/Billing/Settings/BillingSettingsPage'

// Seguridad
import UsuariosPage from '@pages/Seguridad/UsuariosPage'
import RolesPage from '@pages/Seguridad/RolesPage'

// Reportes
import LibroVentasPage from '@pages/Reportes/LibroVentasPage'
import LibroComprasPage from '@pages/Reportes/LibroComprasPage'
import RentabilidadPage from '@pages/Reportes/RentabilidadPage'
import NominaPage from '@pages/Reportes/NominaPage'

// Finanzas
import CxCPage from '@pages/Finanzas/CxCPage'
import CxPPage from '@pages/Finanzas/CxPPage'

// Gastos Internos
import GastosPage from '@pages/Gastos/GastosPage'

// Planilla / Nómina
import PlanillaPage from '@pages/Planilla/PlanillaPage'
import PlanillaSettingsPage from '@pages/Planilla/PlanillaSettingsPage'
import AguinaldoPage from '@pages/Planilla/AguinaldoPage'
import VacacionesPage from '@pages/Planilla/VacacionesPage'
import Quincena25Page from '@pages/Planilla/Quincena25Page'

// Reportes adicionales
import ResumenF07Page from '@pages/Reportes/ResumenF07Page'
import CxCVencidasPage from '@pages/Reportes/CxCVencidasPage'

// Contabilidad
import CatalogoCuentasPage from '@pages/Contabilidad/CatalogoCuentasPage'
import AsientosContablesPage from '@pages/Contabilidad/AsientosContablesPage'
import PeriodosContablesPage from '@pages/Contabilidad/PeriodosContablesPage'
import LibroDiarioPage from '@pages/Contabilidad/LibroDiarioPage'
import LibroMayorPage from '@pages/Contabilidad/LibroMayorPage'
import BalanceComprobacionPage from '@pages/Contabilidad/BalanceComprobacionPage'
import EstadoResultadosPage from '@pages/Contabilidad/EstadoResultadosPage'
import BalanceGeneralPage from '@pages/Contabilidad/BalanceGeneralPage'

// ── Rutas protegidas ─────────────────────────────────────
function ProtectedRoutes() {
  const { user, loading } = useAuth()

  // Disparar notificaciones nativas del SO al iniciar sesión
  useEffect(() => {
    if (user) {
      // Delay de 3s para que la app cargue primero
      const t = setTimeout(() => {
        window.notifications?.checkAndFire().catch(() => { })
      }, 3000)
      return () => clearTimeout(t)
    }
    return undefined
  }, [user])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--theme-body-bg, #0d1117)' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="proveedores" element={<ProveedoresPage />} />
        <Route path="empleados" element={<EmpleadosPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="kardex" element={<KardexPage />} />
        <Route path="compras" element={<ComprasPage />} />
        <Route path="facturacion/facturas" element={<FacturasPage />} />
        <Route path="facturacion/facturas/nueva" element={<NuevaFacturaPage />} />
        <Route path="facturacion/ccf" element={<CCFPage />} />
        <Route path="facturacion/ccf/nuevo" element={<NuevoCCFPage />} />
        <Route path="facturacion/anulaciones" element={<AnulacionesPage />} />
        <Route path="facturacion/notas-credito" element={<NotaCreditoPage />} />
        <Route path="facturacion/notas-debito" element={<NotaDebitoPage />} />
        <Route path="facturacion/ajustes" element={<BillingSettingsPage />} />
        <Route path="seguridad/usuarios" element={<UsuariosPage />} />
        <Route path="seguridad/roles" element={<RolesPage />} />
        <Route path="reportes/libro-ventas" element={<LibroVentasPage />} />
        <Route path="reportes/libro-compras" element={<LibroComprasPage />} />
        <Route path="reportes/rentabilidad" element={<RentabilidadPage />} />
        <Route path="reportes/nomina" element={<NominaPage />} />
        <Route path="reportes/resumen-f07" element={<ResumenF07Page />} />
        <Route path="reportes/cxc-vencidas" element={<CxCVencidasPage />} />
        <Route path="finanzas/cuentas-cobrar" element={<CxCPage />} />
        <Route path="finanzas/cuentas-pagar" element={<CxPPage />} />
        <Route path="gastos" element={<GastosPage />} />
        <Route path="planilla" element={<PlanillaPage />} />
        <Route path="planilla/configuracion" element={<PlanillaSettingsPage />} />
        <Route path="planilla/aguinaldo" element={<AguinaldoPage />} />
        <Route path="planilla/vacaciones" element={<VacacionesPage />} />
        <Route path="planilla/quincena25" element={<Quincena25Page />} />
        <Route path="contabilidad/catalogo" element={<CatalogoCuentasPage />} />
        <Route path="contabilidad/asientos" element={<AsientosContablesPage />} />
        <Route path="contabilidad/periodos" element={<PeriodosContablesPage />} />
        <Route path="contabilidad/libro-diario" element={<LibroDiarioPage />} />
        <Route path="contabilidad/libro-mayor" element={<LibroMayorPage />} />
        <Route path="contabilidad/balance-comprobacion" element={<BalanceComprobacionPage />} />
        <Route path="contabilidad/estado-resultados" element={<EstadoResultadosPage />} />
        <Route path="contabilidad/balance-general" element={<BalanceGeneralPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

// ── App con ConfigProvider dinámico (tema reactivo) ──────
function ThemedApp({ initialUser }: { initialUser?: UserSession | null }) {
  const { antThemeConfig } = useTheme()
  return (
    <ConfigProvider locale={esES} theme={antThemeConfig}>
      <AntApp>
        <AuthProvider initialUser={initialUser}>
          <ProtectedRoutes />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  )
}

export default function App() {
  // setup: 'checking' | 'needs-setup' | 'ready'
  const [setupStatus, setSetupStatus] = useState<'checking' | 'needs-setup' | 'ready'>('checking')
  const [checkingLicense, setCheckingLicense] = useState(false)
  const [licenseValid, setLicenseValid] = useState(false)
  const [initialUser, setInitialUser] = useState<UserSession | null>(null)
  const [hwid, setHwid] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      // En modo web (sin Electron) no hay setup de BD local
      // @ts-ignore
      if (!window.setup) {
        setSetupStatus('ready')
        startLicenseCheck()
        return
      }
      // @ts-ignore
      const status = await window.setup.getStatus()
      if (status.needsSetup) {
        setSetupStatus('needs-setup')
      } else {
        setSetupStatus('ready')
        startLicenseCheck()
      }
    } catch {
      setSetupStatus('ready')
      startLicenseCheck()
    }
  }

  const startLicenseCheck = () => {
    setCheckingLicense(true)
    checkLicense()
  }

  const checkLicense = async () => {
    try {
      // @ts-ignore
      const status = await window.license.getStatus()
      setHwid(status.hwid)
      if (status.active && !status.expired) {
        setLicenseValid(true)
      } else if (status.expired) {
        setExpired(true)
      }
    } catch (error) {
      console.error('Error checking license:', error)
    } finally {
      setCheckingLicense(false)
    }
  }

  // Verificando estado inicial
  if (setupStatus === 'checking' || (setupStatus === 'ready' && checkingLicense)) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0d1117' }}>
        <Spin size="large" />
      </div>
    )
  }

  // Setup de base de datos requerido
  if (setupStatus === 'needs-setup') {
    return (
      <SetupWizard
        onComplete={() => {
          setSetupStatus('ready')
          startLicenseCheck()
        }}
      />
    )
  }

  // Activación de licencia requerida
  if (!licenseValid) {
    return (
      <AntApp>
        <ActivationScreen
          onValidated={(user?) => { setInitialUser(user ?? null); setLicenseValid(true) }}
          hwid={hwid}
          expired={expired}
        />
      </AntApp>
    )
  }

  return (
    <ThemeProvider>
      <ThemedApp initialUser={initialUser} />
    </ThemeProvider>
  )
}
