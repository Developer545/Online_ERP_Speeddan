import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Avatar, Dropdown, Space, Badge, Modal, Tooltip, Drawer, Grid, Button } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import GlobalSearchModal from '../GlobalSearch/GlobalSearchModal'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ThemeSelector from '../ThemeSelector/ThemeSelector'
import {
  DashboardOutlined,
  TeamOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  SafetyOutlined,
  InboxOutlined,
  AuditOutlined,
  BgColorsOutlined,
  BankOutlined,
  SearchOutlined,
  DollarOutlined,
  MenuOutlined,
  BookOutlined
} from '@ant-design/icons'
import logoWhite from '../../assets/logo_speeddansys_transparent_white.png'

const { Sider, Header, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [envMode, setEnvMode] = useState<'test' | 'production'>('test')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [empresaNombre, setEmpresaNombre] = useState<string>('')
  const screens = useBreakpoint()
  const isMobile = !screens.md  // xs/sm = < 768px

  useEffect(() => {
    window.appControl?.getEnvMode().then(setEnvMode).catch(() => { })
  }, [])

  useEffect(() => {
    window.configuracion?.getEmisor()
      .then(e => { if (e?.nombre) setEmpresaNombre(e.nombre) })
      .catch(() => { })
  }, [])

  // Ctrl+K abre búsqueda global
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { currentTheme } = useTheme()

  // Listeners globales para errores de API (401, 402)
  useEffect(() => {
    let modalOpen = false
    const handler402 = (e: any) => {
      if (modalOpen) return
      modalOpen = true
      Modal.error({
        title: 'Suscripción Inactiva o Suspendida',
        content: e.detail || 'La suscripción de su empresa está inactiva o vencida. Por favor, contacte al administrador o a soporte para revisar su estado de cuenta.',
        okText: 'Cerrar Sesión',
        onOk: () => { modalOpen = false; logout() }
      })
    }
    const handler401 = () => {
      if (modalOpen) return
      logout()
    }
    window.addEventListener('api-payment-required', handler402)
    window.addEventListener('api-unauthorized', handler401)
    return () => {
      window.removeEventListener('api-payment-required', handler402)
      window.removeEventListener('api-unauthorized', handler401)
    }
  }, [logout])

  const handleMenuUser = ({ key }: { key: string }) => {
    if (key === 'tema') {
      setThemeModalOpen(true)
    } else if (key === 'logout') {
      Modal.confirm({
        title: 'Cerrar Sesión',
        content: '¿Desea cerrar la sesión actual?',
        okText: 'Cerrar Sesión',
        okButtonProps: { danger: true },
        cancelText: 'Cancelar',
        onOk: logout
      })
    }
  }

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: 'seguridad',
      icon: <SafetyOutlined />,
      label: 'Seguridad',
      children: [
        { key: '/seguridad/usuarios', label: 'Usuarios' },
        { key: '/seguridad/roles', label: 'Roles' }
      ]
    },
    { key: '/clientes', icon: <TeamOutlined />, label: 'Clientes' },
    { key: '/proveedores', icon: <ShopOutlined />, label: 'Proveedores' },
    { key: '/empleados', icon: <UserOutlined />, label: 'Empleados' },
    {
      key: 'inventario',
      icon: <InboxOutlined />,
      label: 'Inventario',
      children: [
        { key: '/productos', label: 'Productos' },
        { key: '/inventario', label: 'Inventario' },
        { key: '/kardex', label: 'Kardex' }
      ]
    },
    { key: '/compras', icon: <ShoppingCartOutlined />, label: 'Compras' },
    {
      key: 'facturacion',
      icon: <AuditOutlined />,
      label: 'Facturación DTE',
      children: [
        { key: '/facturacion/facturas', label: 'Facturas (01)' },
        { key: '/facturacion/ccf', label: 'Créd. Fiscal (03)' },
        { key: '/facturacion/notas-credito', label: 'Nota de Crédito (05)' },
        { key: '/facturacion/notas-debito', label: 'Nota de Débito (06)' },
        { key: '/facturacion/anulaciones', label: 'Anulaciones' },
        { key: '/facturacion/ajustes', label: 'Configuración DTE' }
      ]
    },
    {
      key: 'finanzas',
      icon: <BankOutlined />,
      label: 'Finanzas',
      children: [
        { key: '/finanzas/cuentas-cobrar', label: 'Cuentas por Cobrar' },
        { key: '/finanzas/cuentas-pagar', label: 'Cuentas por Pagar' },
        { key: '/gastos', label: 'Gastos Internos' }
      ]
    },
    {
      key: 'planilla',
      icon: <DollarOutlined />,
      label: 'Planilla / Nómina',
      children: [
        { key: '/planilla', label: 'Generar Planilla' },
        { key: '/reportes/nomina', label: 'Reporte Nómina' },
        { key: '/planilla/aguinaldo', label: 'Aguinaldo' },
        { key: '/planilla/vacaciones', label: 'Vacaciones' },
        { key: '/planilla/quincena25', label: 'Quincena 25' },
        { key: '/planilla/configuracion', label: 'Configuración' }
      ]
    },
    {
      key: 'contabilidad',
      icon: <BookOutlined />,
      label: 'Contabilidad',
      children: [
        { key: '/contabilidad/catalogo', label: 'Catálogo de Cuentas' },
        { key: '/contabilidad/asientos', label: 'Asientos Contables' },
        { key: '/contabilidad/periodos', label: 'Períodos Contables' },
        { key: '/contabilidad/libro-diario', label: 'Libro Diario' },
        { key: '/contabilidad/libro-mayor', label: 'Libro Mayor' },
        { key: '/contabilidad/balance-comprobacion', label: 'Balance de Comprobación' },
        { key: '/contabilidad/estado-resultados', label: 'Estado de Resultados' },
        { key: '/contabilidad/balance-general', label: 'Balance General' }
      ]
    },
    {
      key: 'reportes',
      icon: <BarChartOutlined />,
      label: 'Reportes',
      children: [
        { key: '/reportes/libro-ventas', label: 'Libro IVA Ventas' },
        { key: '/reportes/libro-compras', label: 'Libro IVA Compras' },
        { key: '/reportes/resumen-f07', label: 'Resumen F07 (IVA)' },
        { key: '/reportes/cxc-vencidas', label: 'CxC Vencidas' },
        { key: '/reportes/rentabilidad', label: 'Rentabilidad' }
      ]
    }
  ]

  const userMenu = {
    items: [
      {
        key: 'info',
        label: (
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontWeight: 600 }}>{user?.nombre || 'Usuario'}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{user?.role?.nombre || 'Sin rol'}</div>
          </div>
        ),
        disabled: true
      },
      { type: 'divider' as const },
      {
        key: 'tema',
        icon: <BgColorsOutlined style={{ color: 'var(--theme-primary)' }} />,
        label: (
          <Space>
            <span>Apariencia</span>
            <span style={{
              fontSize: 10,
              background: 'var(--theme-primary)',
              color: '#fff',
              borderRadius: 4,
              padding: '1px 5px'
            }}>
              {currentTheme.emoji} {currentTheme.name}
            </span>
          </Space>
        )
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Cerrar Sesión',
        danger: true
      }
    ],
    onClick: handleMenuUser
  }

  const selectedKeys = [location.pathname]
  const openKeys = menuItems
    .filter(item => item.children?.some(c => c.key === location.pathname))
    .map(item => item.key)

  // ── Contenido del sider (reutilizado en Sider y Drawer) ──
  const siderContent = (
    <>
      <div style={{
        height: 'auto',
        minHeight: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px',
        background: 'var(--theme-sider-bg)'
      }}>
        <img
          src={logoWhite}
          alt="Speeddansys"
          style={{
            width: (!isMobile && collapsed) ? 44 : '100%',
            maxHeight: 80,
            transition: 'width 0.2s ease',
            objectFit: 'contain'
          }}
        />
      </div>
      <Menu
        theme={currentTheme.menuTheme}
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={openKeys}
        items={menuItems}
        onClick={({ key }) => { navigate(key); if (isMobile) setDrawerOpen(false) }}
        style={{
          borderRight: 0,
          overflowY: 'auto',
          height: 'calc(100vh - 100px)',
          background: 'var(--theme-menu-item-bg)'
        }}
      />
    </>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--theme-body-bg)' }}>

      {/* ── Sidebar desktop/tablet ── */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
          style={{
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            background: 'var(--theme-sider-bg)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* ── Drawer móvil ── */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          styles={{ body: { padding: 0, background: 'var(--theme-sider-bg)' }, header: { display: 'none' } }}
          style={{ zIndex: 200 }}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 240), transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: 'var(--theme-header-bg)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          lineHeight: '64px',
          boxShadow: 'var(--theme-shadow)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          borderBottom: '1px solid var(--theme-border)'
        }}>

          {/* Hamburger (solo mobile) */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ fontSize: 18, color: 'var(--theme-menu-color)', flexShrink: 0 }}
            />
          )}

          {/* Buscador */}
          <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 480 }}>
            <div
              className={`header-search-trigger ${currentTheme.isDark ? 'dark' : ''}`}
              onClick={() => setSearchOpen(true)}
            >
              <SearchOutlined className="header-search-icon" />
              <span className="header-search-placeholder">Buscar en el sistema...</span>
              {!isMobile && <span className="header-search-kbd">Ctrl K</span>}
            </div>
          </div>

          {/* Derecha: nombre empresa + badge + usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, marginLeft: 'auto', flexShrink: 0 }}>

            {!isMobile && empresaNombre && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'var(--theme-primary-bg, rgba(22,119,255,0.1))',
                border: '1px solid var(--theme-primary-border, rgba(22,119,255,0.25))',
                maxWidth: 220,
              }}>
                <BankOutlined style={{ color: 'var(--theme-primary)', fontSize: 13, flexShrink: 0 }} />
                <Text style={{
                  color: 'var(--theme-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 180
                }}>
                  {empresaNombre}
                </Text>
              </div>
            )}

            {!isMobile && (
              <Tooltip title={envMode === 'production'
                ? 'Conectado a la base de datos de PRODUCCIÓN — datos reales del cliente'
                : 'Conectado a la base de datos de PRUEBAS — datos no reales'
              }>
                <div className={`header-env-badge ${envMode === 'production' ? 'env-prod' : 'env-test'}`}>
                  <span className="header-env-dot" />
                  {envMode === 'production' ? 'PRODUCTIVO' : 'PRUEBAS'}
                </div>
              </Tooltip>
            )}

            {/* Usuario */}
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer', userSelect: 'none' }}>
                <Badge status="success" />
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: 'var(--theme-primary)',
                    width: 32,
                    height: 32,
                    lineHeight: '32px',
                    fontSize: 14
                  }}
                />
                {!isMobile && (
                  <Text style={{
                    color: currentTheme.isDark ? 'var(--theme-menu-selected-color)' : 'var(--theme-menu-color)',
                    fontSize: 13
                  }}>
                    {user?.nombre?.split(' ')[0] || 'Usuario'}
                  </Text>
                )}
              </Space>
            </Dropdown>

          </div>
        </Header>

        <Content style={{
          margin: isMobile ? '12px' : '24px',
          minHeight: 280
        }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Modal selector de temas */}
      <ThemeSelector
        open={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      {/* Modal búsqueda global */}
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </Layout>
  )
}
