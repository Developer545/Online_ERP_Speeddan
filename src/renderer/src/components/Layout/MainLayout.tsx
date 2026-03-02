import { useState, useEffect } from 'react'
import { Layout, Menu, Typography, Avatar, Dropdown, Space, Badge, Modal, Tooltip } from 'antd'
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
  DollarOutlined
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout
const { Text } = Typography

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [envMode, setEnvMode] = useState<'test' | 'production'>('test')

  useEffect(() => {
    window.appControl?.getEnvMode().then(setEnvMode).catch(() => { })
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

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--theme-body-bg)' }}>
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
        {/* Logo */}
        <div style={{
          height: 'auto',
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--theme-border)',
          padding: '16px',
          background: 'var(--theme-sider-bg)'
        }}>
          <img
            src="/src/assets/logo_speeddansys_transparent_white.png"
            alt="Speeddansys"
            style={{
              width: collapsed ? 50 : '100%',
              maxHeight: 180,
              marginRight: collapsed ? 0 : 8,
              transition: 'width 0.2s ease, margin 0.2s ease',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Menú — theme dinámico según el tema activo */}
        <Menu
          theme={currentTheme.menuTheme}
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 0,
            overflowY: 'auto',
            height: 'calc(100vh - 120px)',
            background: 'var(--theme-menu-item-bg)'
          }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: 'var(--theme-header-bg)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          lineHeight: '64px',
          boxShadow: 'var(--theme-shadow)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          borderBottom: '1px solid var(--theme-border)'
        }}>

          {/* Buscador */}
          <div style={{ flex: 1, maxWidth: 480 }}>
            <div
              className={`header-search-trigger ${currentTheme.isDark ? 'dark' : ''}`}
              onClick={() => setSearchOpen(true)}
            >
              <SearchOutlined className="header-search-icon" />
              <span className="header-search-placeholder">Buscar en el sistema...</span>
              <span className="header-search-kbd">Ctrl K</span>
            </div>
          </div>

          {/* Derecha: badge + usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>

            <Tooltip title={envMode === 'production'
              ? 'Conectado a la base de datos de PRODUCCIÓN — datos reales del cliente'
              : 'Conectado a la base de datos de PRUEBAS — datos no reales'
            }>
              <div className={`header-env-badge ${envMode === 'production' ? 'env-prod' : 'env-test'}`}>
                <span className="header-env-dot" />
                {envMode === 'production' ? 'PRODUCTIVO' : 'PRUEBAS'}
              </div>
            </Tooltip>

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
                <Text style={{
                  color: currentTheme.isDark ? 'var(--theme-menu-selected-color)' : 'var(--theme-menu-color)',
                  fontSize: 13
                }}>
                  {user?.nombre?.split(' ')[0] || 'Usuario'}
                </Text>
              </Space>
            </Dropdown>

          </div>
        </Header>

        <Content style={{
          margin: '24px',
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
