import { useState, useEffect } from 'react'
import {
  Layout, Menu, Typography, Avatar, Dropdown, Space, Badge,
  Modal, Tooltip, Drawer, Grid, Button
} from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import GlobalSearchModal from '../GlobalSearch/GlobalSearchModal'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ThemeSelector from '../ThemeSelector/ThemeSelector'
import {
  DashboardOutlined, TeamOutlined, ShoppingCartOutlined,
  BarChartOutlined, LogoutOutlined, UserOutlined, SafetyOutlined,
  InboxOutlined, AuditOutlined, BgColorsOutlined, BankOutlined,
  SearchOutlined, DollarOutlined, MenuOutlined, BookOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons'
import logoWhite from '../../assets/logo_speeddansys_transparent_white.png'

const { Sider, Header, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

const SIDER_W          = 240
const SIDER_COLLAPSED  = 64

// ── Devuelve el key del grupo al que pertenece la ruta actual ──
function getActiveGroupKey(pathname: string): string {
  const MAP: Record<string, string> = {
    '/dashboard':                          'dashboard',
    '/seguridad/usuarios':                 'seguridad',
    '/seguridad/roles':                    'seguridad',
    '/clientes':                           'crm',
    '/proveedores':                        'crm',
    '/empleados':                          'crm',
    '/productos':                          'inventario',
    '/inventario':                         'inventario',
    '/kardex':                             'inventario',
    '/compras':                            'compras',
    '/gastos':                             'finanzas',
  }
  for (const [path, group] of Object.entries(MAP)) {
    if (pathname === path || pathname.startsWith(path + '/')) return group
  }
  if (pathname.startsWith('/facturacion'))                      return 'facturacion'
  if (pathname.startsWith('/finanzas'))                         return 'finanzas'
  if (pathname.startsWith('/planilla') || pathname === '/reportes/nomina') return 'planilla'
  if (pathname.startsWith('/contabilidad'))                     return 'contabilidad'
  if (pathname.startsWith('/reportes'))                         return 'reportes'
  return 'dashboard'
}

// ── Definición del menú ─────────────────────────────────────
const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  {
    key: 'seguridad', icon: <SafetyOutlined />, label: 'Seguridad',
    children: [
      { key: '/seguridad/usuarios', label: 'Usuarios' },
      { key: '/seguridad/roles',    label: 'Roles'    },
    ]
  },
  {
    key: 'crm', icon: <TeamOutlined />, label: 'CRM',
    children: [
      { key: '/clientes',    label: 'Clientes'    },
      { key: '/proveedores', label: 'Proveedores' },
      { key: '/empleados',   label: 'Empleados'   },
    ]
  },
  {
    key: 'inventario', icon: <InboxOutlined />, label: 'Inventario',
    children: [
      { key: '/productos',  label: 'Productos'  },
      { key: '/inventario', label: 'Inventario' },
      { key: '/kardex',     label: 'Kardex'     },
    ]
  },
  { key: '/compras', icon: <ShoppingCartOutlined />, label: 'Compras' },
  {
    key: 'facturacion', icon: <AuditOutlined />, label: 'Facturación DTE',
    children: [
      { key: '/facturacion/facturas',      label: 'Facturas (01)'      },
      { key: '/facturacion/ccf',           label: 'Créd. Fiscal (03)'  },
      { key: '/facturacion/notas-credito', label: 'Nota Crédito (05)'  },
      { key: '/facturacion/notas-debito',  label: 'Nota Débito (06)'   },
      { key: '/facturacion/anulaciones',   label: 'Anulaciones'        },
      { key: '/facturacion/ajustes',       label: 'Config. DTE'        },
    ]
  },
  {
    key: 'finanzas', icon: <BankOutlined />, label: 'Finanzas',
    children: [
      { key: '/finanzas/cuentas-cobrar', label: 'Cuentas por Cobrar' },
      { key: '/finanzas/cuentas-pagar',  label: 'Cuentas por Pagar'  },
      { key: '/gastos',                  label: 'Gastos Internos'     },
    ]
  },
  {
    key: 'planilla', icon: <DollarOutlined />, label: 'Planilla / Nómina',
    children: [
      { key: '/planilla',               label: 'Generar Planilla' },
      { key: '/reportes/nomina',        label: 'Reporte Nómina'   },
      { key: '/planilla/aguinaldo',     label: 'Aguinaldo'        },
      { key: '/planilla/vacaciones',    label: 'Vacaciones'       },
      { key: '/planilla/quincena25',    label: 'Quincena 25'      },
      { key: '/planilla/configuracion', label: 'Configuración'    },
    ]
  },
  {
    key: 'contabilidad', icon: <BookOutlined />, label: 'Contabilidad',
    children: [
      { key: '/contabilidad/catalogo',             label: 'Catálogo de Cuentas'  },
      { key: '/contabilidad/asientos',             label: 'Asientos Contables'   },
      { key: '/contabilidad/periodos',             label: 'Períodos Contables'   },
      { key: '/contabilidad/libro-diario',         label: 'Libro Diario'         },
      { key: '/contabilidad/libro-mayor',          label: 'Libro Mayor'          },
      { key: '/contabilidad/balance-comprobacion', label: 'Bal. Comprobación'    },
      { key: '/contabilidad/estado-resultados',    label: 'Estado Resultados'    },
      { key: '/contabilidad/balance-general',      label: 'Balance General'      },
    ]
  },
  {
    key: 'reportes', icon: <BarChartOutlined />, label: 'Reportes',
    children: [
      { key: '/reportes/libro-ventas',  label: 'Libro IVA Ventas'  },
      { key: '/reportes/libro-compras', label: 'Libro IVA Compras' },
      { key: '/reportes/resumen-f07',   label: 'Resumen F07 (IVA)' },
      { key: '/reportes/cxc-vencidas',  label: 'CxC Vencidas'      },
      { key: '/reportes/rentabilidad',  label: 'Rentabilidad'      },
    ]
  },
]

// ── Componente ──────────────────────────────────────────────
export default function MainLayout() {
  const [collapsed,      setCollapsed]     = useState(true)   // inicia colapsado (solo iconos)
  const [openKeys,       setOpenKeys]      = useState<string[]>([])
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [searchOpen,     setSearchOpen]    = useState(false)
  const [envMode,        setEnvMode]       = useState<'test' | 'production'>('test')
  const [drawerOpen,     setDrawerOpen]    = useState(false)
  const [empresaNombre,  setEmpresaNombre] = useState<string>('')

  const screens  = useBreakpoint()
  const isMobile = !screens.md
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout }  = useAuth()
  const { currentTheme }  = useTheme()

  // Abrir el grupo activo al cambiar de ruta (solo si está expandido)
  useEffect(() => {
    if (!collapsed) {
      const group = getActiveGroupKey(location.pathname)
      setOpenKeys(prev => prev.includes(group) ? prev : [group])
    }
  }, [location.pathname, collapsed])

  useEffect(() => { window.appControl?.getEnvMode().then(setEnvMode).catch(() => {}) }, [])
  useEffect(() => {
    window.configuracion?.getEmisor()
      .then(e => { if (e?.nombre) setEmpresaNombre(e.nombre) })
      .catch(() => {})
  }, [])

  // Ctrl+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // API 401 / 402
  useEffect(() => {
    let open = false
    const h402 = (e: any) => {
      if (open) return; open = true
      Modal.error({
        title: 'Suscripción Inactiva o Suspendida',
        content: e.detail || 'La suscripción está inactiva o vencida.',
        okText: 'Cerrar Sesión',
        onOk: () => { open = false; logout() }
      })
    }
    const h401 = () => { if (!open) logout() }
    window.addEventListener('api-payment-required', h402)
    window.addEventListener('api-unauthorized',     h401)
    return () => {
      window.removeEventListener('api-payment-required', h402)
      window.removeEventListener('api-unauthorized',     h401)
    }
  }, [logout])

  // ── Al hacer click en un grupo mientras está colapsado → expandir ──
  const handleOpenChange = (keys: string[]) => {
    if (collapsed && keys.length > 0) {
      // Expandir el sidebar y abrir ese sub-menú
      setCollapsed(false)
      setOpenKeys([keys[keys.length - 1]])
    } else {
      // Ya expandido: solo uno abierto a la vez
      setOpenKeys(keys.length ? [keys[keys.length - 1]] : [])
    }
  }

  // ── Menú de usuario ────────────────────────────────────────
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
            <span style={{ fontSize: 10, background: 'var(--theme-primary)', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>
              {currentTheme.emoji} {currentTheme.name}
            </span>
          </Space>
        )
      },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar Sesión', danger: true }
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'tema')   setThemeModalOpen(true)
      if (key === 'logout') Modal.confirm({
        title:         'Cerrar Sesión',
        content:       '¿Desea cerrar la sesión actual?',
        okText:        'Cerrar Sesión',
        okButtonProps: { danger: true },
        cancelText:    'Cancelar',
        onOk:          logout
      })
    }
  }

  // ── Contenido del sider ────────────────────────────────────
  const siderContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo — pequeño cuando colapsado, completo cuando expandido */}
      <div style={{
        height:         64,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        collapsed ? 0 : '0 20px',
        borderBottom:   '1px solid rgba(255,255,255,0.08)',
        overflow:       'hidden',
        transition:     'padding 0.2s',
      }}>
        <img
          src={logoWhite}
          alt="Speeddansys"
          style={{
            width:      collapsed ? 36 : '100%',
            maxHeight:  50,
            objectFit:  'contain',
            transition: 'width 0.2s',
          }}
        />
      </div>

      {/* Botón colapsar/expandir — arriba, debajo del logo */}
      <div
        onClick={() => {
          const next = !collapsed
          setCollapsed(next)
          if (!next) {
            setOpenKeys([getActiveGroupKey(location.pathname)])
          }
        }}
        style={{
          height:         36,
          display:        'flex',
          alignItems:     'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          padding:        collapsed ? 0 : '0 14px',
          cursor:         'pointer',
          borderBottom:   '1px solid rgba(255,255,255,0.08)',
          color:          'rgba(255,255,255,0.4)',
          fontSize:       13,
          transition:     'all 0.2s',
          flexShrink:     0,
        }}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      {/* Menú con scroll vertical */}
      <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0 }}>
        <Menu
          theme={currentTheme.menuTheme}
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          inlineCollapsed={collapsed}
          onClick={({ key }) => {
            navigate(key)
            if (isMobile) setDrawerOpen(false)
          }}
          style={{
            borderRight: 0,
            background:  'var(--theme-menu-item-bg)',
          }}
        />
      </div>
    </div>
  )

  const siderMargin = isMobile ? 0 : (collapsed ? SIDER_COLLAPSED : SIDER_W)

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--theme-body-bg)' }}>

      {/* ── Sidebar desktop ── */}
      {!isMobile && (
        <Sider
          collapsed={collapsed}
          collapsedWidth={SIDER_COLLAPSED}
          width={SIDER_W}
          trigger={null}
          style={{
            position:   'fixed',
            height:     '100vh',
            left:       0,
            top:        0,
            bottom:     0,
            zIndex:     100,
            background: 'var(--theme-sider-bg)',
            boxShadow:  '2px 0 8px rgba(0,0,0,0.2)',
            display:    'flex',
            flexDirection: 'column',
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
          width={SIDER_W}
          styles={{ body: { padding: 0, background: 'var(--theme-sider-bg)', display: 'flex', flexDirection: 'column' }, header: { display: 'none' } }}
          style={{ zIndex: 200 }}
        >
          {siderContent}
        </Drawer>
      )}

      {/* ── Contenido principal ── */}
      <Layout style={{ marginLeft: siderMargin, transition: 'margin-left 0.2s' }}>

        <Header style={{
          background:    'var(--theme-header-bg)',
          padding:       '0 16px',
          display:       'flex',
          alignItems:    'center',
          gap:           10,
          lineHeight:    '64px',
          boxShadow:     'var(--theme-shadow)',
          position:      'sticky',
          top:           0,
          zIndex:        99,
          borderBottom:  '1px solid var(--theme-border)',
        }}>

          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ fontSize: 18, color: 'var(--theme-menu-color)', flexShrink: 0 }}
            />
          )}

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

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, marginLeft: 'auto', flexShrink: 0 }}>

            {!isMobile && empresaNombre && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                background: 'var(--theme-primary-bg, rgba(22,119,255,0.1))',
                border: '1px solid var(--theme-primary-border, rgba(22,119,255,0.25))',
                maxWidth: 220,
              }}>
                <BankOutlined style={{ color: 'var(--theme-primary)', fontSize: 13, flexShrink: 0 }} />
                <Text style={{ color: 'var(--theme-primary)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
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

            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer', userSelect: 'none' }}>
                <Badge status="success" />
                <Avatar icon={<UserOutlined />} style={{ background: 'var(--theme-primary)', width: 32, height: 32, lineHeight: '32px', fontSize: 14 }} />
                {!isMobile && (
                  <Text style={{ color: currentTheme.isDark ? 'var(--theme-menu-selected-color)' : 'var(--theme-menu-color)', fontSize: 13 }}>
                    {user?.nombre?.split(' ')[0] || 'Usuario'}
                  </Text>
                )}
              </Space>
            </Dropdown>

          </div>
        </Header>

        <Content style={{ margin: isMobile ? '12px' : '24px', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>

      <ThemeSelector open={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Layout>
  )
}
