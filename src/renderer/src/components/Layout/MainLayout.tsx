import { useState, useEffect } from 'react'
import { Layout, Typography, Avatar, Dropdown, Space, Badge, Modal, Tooltip, Drawer, Grid, Button } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import GlobalSearchModal from '../GlobalSearch/GlobalSearchModal'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ThemeSelector from '../ThemeSelector/ThemeSelector'
import {
  DashboardOutlined,
  TeamOutlined,
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

const { Header, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

// ── Dimensiones del sidebar ─────────────────────────────────
const RAIL_W  = 64   // franja de iconos
const PANEL_W = 178  // panel de sub-ítems
const TOTAL_W = RAIL_W + PANEL_W  // 242 px total

// ── Definición de grupos de navegación ─────────────────────
interface NavItem  { key: string; label: string }
interface NavGroup {
  key:       string
  icon:      React.ReactNode
  label:     string
  shortLabel?: string
  path?:     string        // navegación directa sin sub-ítems
  children?: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/dashboard'
  },
  {
    key: 'seguridad', icon: <SafetyOutlined />, label: 'Seguridad',
    children: [
      { key: '/seguridad/usuarios', label: 'Usuarios' },
      { key: '/seguridad/roles',    label: 'Roles'    }
    ]
  },
  {
    key: 'crm', icon: <TeamOutlined />, label: 'CRM',
    children: [
      { key: '/clientes',    label: 'Clientes'    },
      { key: '/proveedores', label: 'Proveedores' },
      { key: '/empleados',   label: 'Empleados'   }
    ]
  },
  {
    key: 'inventario', icon: <InboxOutlined />, label: 'Inventario', shortLabel: 'Inv.',
    children: [
      { key: '/productos',  label: 'Productos'  },
      { key: '/inventario', label: 'Inventario' },
      { key: '/kardex',     label: 'Kardex'     }
    ]
  },
  {
    key: 'compras', icon: <ShoppingCartOutlined />, label: 'Compras', path: '/compras'
  },
  {
    key: 'facturacion', icon: <AuditOutlined />, label: 'Facturación', shortLabel: 'DTE',
    children: [
      { key: '/facturacion/facturas',      label: 'Facturas (01)'       },
      { key: '/facturacion/ccf',           label: 'Créd. Fiscal (03)'   },
      { key: '/facturacion/notas-credito', label: 'Nota Crédito (05)'   },
      { key: '/facturacion/notas-debito',  label: 'Nota Débito (06)'    },
      { key: '/facturacion/anulaciones',   label: 'Anulaciones'         },
      { key: '/facturacion/ajustes',       label: 'Config. DTE'         }
    ]
  },
  {
    key: 'finanzas', icon: <BankOutlined />, label: 'Finanzas',
    children: [
      { key: '/finanzas/cuentas-cobrar', label: 'Cuentas por Cobrar' },
      { key: '/finanzas/cuentas-pagar',  label: 'Cuentas por Pagar'  },
      { key: '/gastos',                  label: 'Gastos Internos'     }
    ]
  },
  {
    key: 'planilla', icon: <DollarOutlined />, label: 'Planilla',
    children: [
      { key: '/planilla',               label: 'Generar Planilla' },
      { key: '/reportes/nomina',        label: 'Reporte Nómina'  },
      { key: '/planilla/aguinaldo',     label: 'Aguinaldo'       },
      { key: '/planilla/vacaciones',    label: 'Vacaciones'      },
      { key: '/planilla/quincena25',    label: 'Quincena 25'     },
      { key: '/planilla/configuracion', label: 'Configuración'   }
    ]
  },
  {
    key: 'contabilidad', icon: <BookOutlined />, label: 'Contabilidad', shortLabel: 'Contab.',
    children: [
      { key: '/contabilidad/catalogo',             label: 'Catálogo de Cuentas'  },
      { key: '/contabilidad/asientos',             label: 'Asientos Contables'   },
      { key: '/contabilidad/periodos',             label: 'Períodos Contables'   },
      { key: '/contabilidad/libro-diario',         label: 'Libro Diario'         },
      { key: '/contabilidad/libro-mayor',          label: 'Libro Mayor'          },
      { key: '/contabilidad/balance-comprobacion', label: 'Bal. Comprobación'    },
      { key: '/contabilidad/estado-resultados',    label: 'Estado Resultados'    },
      { key: '/contabilidad/balance-general',      label: 'Balance General'      }
    ]
  },
  {
    key: 'reportes', icon: <BarChartOutlined />, label: 'Reportes',
    children: [
      { key: '/reportes/libro-ventas',   label: 'Libro IVA Ventas'  },
      { key: '/reportes/libro-compras',  label: 'Libro IVA Compras' },
      { key: '/reportes/resumen-f07',    label: 'Resumen F07 (IVA)' },
      { key: '/reportes/cxc-vencidas',   label: 'CxC Vencidas'      },
      { key: '/reportes/rentabilidad',   label: 'Rentabilidad'      }
    ]
  }
]

// Devuelve el key del grupo al que pertenece una ruta
function getGroupForPath(pathname: string): string {
  for (const g of NAV_GROUPS) {
    if (g.path && g.path === pathname) return g.key
    if (g.children?.some(c => pathname === c.key || pathname.startsWith(c.key + '/'))) return g.key
  }
  return 'dashboard'
}

// ── Componente ──────────────────────────────────────────────
export default function MainLayout() {
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [searchOpen,     setSearchOpen]     = useState(false)
  const [envMode,        setEnvMode]        = useState<'test' | 'production'>('test')
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [empresaNombre,  setEmpresaNombre]  = useState<string>('')

  const screens  = useBreakpoint()
  const isMobile = !screens.md

  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout }      = useAuth()
  const { currentTheme }      = useTheme()

  const [activeGroup, setActiveGroup] = useState(() => getGroupForPath(location.pathname))

  // Sincronizar grupo activo con la ruta
  useEffect(() => {
    setActiveGroup(getGroupForPath(location.pathname))
  }, [location.pathname])

  // Datos externos
  useEffect(() => {
    window.appControl?.getEnvMode().then(setEnvMode).catch(() => {})
  }, [])
  useEffect(() => {
    window.configuracion?.getEmisor()
      .then(e => { if (e?.nombre) setEmpresaNombre(e.nombre) })
      .catch(() => {})
  }, [])

  // Ctrl+K → búsqueda global
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // Listeners de errores de API (401 / 402)
  useEffect(() => {
    let open = false
    const h402 = (e: any) => {
      if (open) return
      open = true
      Modal.error({
        title:   'Suscripción Inactiva o Suspendida',
        content: e.detail || 'La suscripción está inactiva o vencida. Contacte a soporte.',
        okText:  'Cerrar Sesión',
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
        title:          'Cerrar Sesión',
        content:        '¿Desea cerrar la sesión actual?',
        okText:         'Cerrar Sesión',
        okButtonProps:  { danger: true },
        cancelText:     'Cancelar',
        onOk:           logout
      })
    }
  }

  // ── Handlers de navegación ─────────────────────────────────
  const handleRailClick = (group: NavGroup) => {
    if (group.path) {
      navigate(group.path)
      setActiveGroup(group.key)
      if (isMobile) setDrawerOpen(false)
    } else {
      // Toggle panel: si ya está activo, desactivar
      setActiveGroup(prev => prev === group.key ? '' : group.key)
    }
  }

  const handleItemClick = (key: string) => {
    navigate(key)
    if (isMobile) setDrawerOpen(false)
  }

  // Sub-ítems del grupo activo
  const panelGroup = NAV_GROUPS.find(g => g.key === activeGroup && g.children)

  // ── Rail (franja de iconos) ────────────────────────────────
  const railEl = (
    <div style={{
      width:          RAIL_W,
      height:         '100vh',
      background:     'var(--theme-sider-bg)',
      display:        'flex',
      flexDirection:  'column',
      borderRight:    '1px solid rgba(255,255,255,0.06)',
      flexShrink:     0,
    }}>
      {/* Logo */}
      <div style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        borderBottom:    '1px solid rgba(255,255,255,0.08)',
        flexShrink:      0,
      }}>
        <img src={logoWhite} alt="Speeddansys" style={{ width: 38, height: 38, objectFit: 'contain' }} />
      </div>

      {/* Grupos */}
      <div style={{ flex: 1, padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_GROUPS.map(group => {
          const isActive = activeGroup === group.key
          return (
            <Tooltip key={group.key} title={group.label} placement="right" mouseEnterDelay={0.6}>
              <div
                onClick={() => handleRailClick(group)}
                style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  padding:        '7px 2px',
                  cursor:         'pointer',
                  borderRadius:   8,
                  background:     isActive ? 'var(--theme-primary)' : 'transparent',
                  color:          isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize:       17,
                  gap:            3,
                  transition:     'background 0.15s, color 0.15s',
                  userSelect:     'none',
                }}
              >
                {group.icon}
                <span style={{
                  fontSize:      9,
                  fontWeight:    500,
                  lineHeight:    1.2,
                  textAlign:     'center',
                  whiteSpace:    'nowrap',
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                  maxWidth:      52,
                }}>
                  {group.shortLabel || group.label}
                </span>
              </div>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )

  // ── Panel de sub-ítems ─────────────────────────────────────
  const panelEl = (
    <div style={{
      width:         PANEL_W,
      height:        '100vh',
      background:    'var(--theme-sider-bg)',
      display:       'flex',
      flexDirection: 'column',
      borderRight:   '1px solid rgba(255,255,255,0.06)',
      flexShrink:    0,
      opacity:       panelGroup ? 1 : 0,
      pointerEvents: panelGroup ? 'auto' : 'none',
      transition:    'opacity 0.15s',
    }}>
      {/* Encabezado del panel */}
      <div style={{
        height:        56,
        display:       'flex',
        alignItems:    'center',
        padding:       '0 14px',
        borderBottom:  '1px solid rgba(255,255,255,0.08)',
        gap:           8,
        flexShrink:    0,
        color:         'var(--theme-primary)',
        fontWeight:    700,
        fontSize:      13,
        letterSpacing: 0.3,
      }}>
        {panelGroup?.icon}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {panelGroup?.label}
        </span>
      </div>

      {/* Lista de sub-ítems */}
      <div style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {panelGroup?.children?.map(item => {
          const isActive = location.pathname === item.key || location.pathname.startsWith(item.key + '/')
          return (
            <div
              key={item.key}
              onClick={() => handleItemClick(item.key)}
              style={{
                padding:       '8px 12px',
                cursor:        'pointer',
                fontSize:      12.5,
                borderRadius:  6,
                marginBottom:  2,
                background:    isActive ? 'var(--theme-primary)' : 'transparent',
                color:         isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight:    isActive ? 600 : 400,
                transition:    'background 0.12s, color 0.12s',
                userSelect:    'none',
                whiteSpace:    'nowrap',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                borderLeft:    isActive ? 'none' : '2px solid transparent',
              }}
            >
              {item.label}
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── Sidebar completo (rail + panel) ────────────────────────
  const sidebarEl = (
    <div style={{ display: 'flex', height: '100vh' }}>
      {railEl}
      {panelEl}
    </div>
  )

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--theme-body-bg)' }}>

      {/* ── Sidebar desktop ── */}
      {!isMobile && (
        <div style={{
          position:  'fixed',
          left:      0,
          top:       0,
          bottom:    0,
          zIndex:    100,
          boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
        }}>
          {sidebarEl}
        </div>
      )}

      {/* ── Drawer móvil ── */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={TOTAL_W}
          styles={{ body: { padding: 0, display: 'flex', overflow: 'hidden' }, header: { display: 'none' } }}
          style={{ zIndex: 200 }}
        >
          {sidebarEl}
        </Drawer>
      )}

      {/* ── Contenido principal ── */}
      <Layout style={{ marginLeft: isMobile ? 0 : TOTAL_W, transition: 'margin-left 0.2s' }}>

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
          borderBottom:  '1px solid var(--theme-border)'
        }}>

          {/* Hamburger (solo móvil) */}
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

          {/* Derecha: empresa + badge + usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, marginLeft: 'auto', flexShrink: 0 }}>

            {!isMobile && empresaNombre && (
              <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        6,
                padding:    '4px 10px',
                borderRadius: 6,
                background: 'var(--theme-primary-bg, rgba(22,119,255,0.1))',
                border:     '1px solid var(--theme-primary-border, rgba(22,119,255,0.25))',
                maxWidth:   220,
              }}>
                <BankOutlined style={{ color: 'var(--theme-primary)', fontSize: 13, flexShrink: 0 }} />
                <Text style={{
                  color:         'var(--theme-primary)',
                  fontSize:      12,
                  fontWeight:    600,
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                  whiteSpace:    'nowrap',
                  maxWidth:      180
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

            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer', userSelect: 'none' }}>
                <Badge status="success" />
                <Avatar
                  icon={<UserOutlined />}
                  style={{ background: 'var(--theme-primary)', width: 32, height: 32, lineHeight: '32px', fontSize: 14 }}
                />
                {!isMobile && (
                  <Text style={{
                    color:    currentTheme.isDark ? 'var(--theme-menu-selected-color)' : 'var(--theme-menu-color)',
                    fontSize: 13
                  }}>
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

      {/* Modales */}
      <ThemeSelector open={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Layout>
  )
}
