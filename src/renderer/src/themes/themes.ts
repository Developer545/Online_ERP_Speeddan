import { theme as antTheme } from 'antd'
import type { ThemeConfig } from 'antd'

const { darkAlgorithm, defaultAlgorithm } = antTheme

export interface AppTheme {
  id: string
  name: string
  emoji: string
  description: string
  isDark: boolean
  menuTheme: 'dark' | 'light'

  // Colores primarios
  colorPrimary: string
  colorSuccess: string
  colorWarning: string
  colorError: string
  colorInfo: string

  // Layout
  siderBg: string
  headerBg: string
  contentBg: string
  bodyBg: string

  // Menú
  menuItemBg: string
  menuSubItemBg: string
  menuItemSelectedBg: string
  menuItemHoverBg: string
  menuItemColor: string
  menuItemSelectedColor: string

  // Border & Shadows
  borderColor: string
  boxShadow: string

  // Preview: [sidebar, primary, content]
  preview: [string, string, string]
}

export const THEMES: AppTheme[] = [
  // ──────────────────────────────────────────────────────
  // 1. Speeddansys Orange (NUEVO PREDETERMINADO)
  // ──────────────────────────────────────────────────────
  {
    id: 'speeddansys-orange',
    name: 'Speeddansys Orange (Dark)',
    emoji: '🔥',
    description: 'Naranja tecnológico oscuro',
    isDark: true,
    menuTheme: 'dark',

    colorPrimary: '#f47920',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#f47920',

    siderBg: '#0f0f0f',
    headerBg: '#1a1a1a',
    contentBg: '#212121',
    bodyBg: '#1f1f1f',

    menuItemBg: '#0f0f0f',
    menuSubItemBg: '#0a0a0a',
    menuItemSelectedBg: 'rgba(244,121,32,0.15)',
    menuItemHoverBg: 'rgba(244,121,32,0.08)',
    menuItemColor: 'rgba(255,255,255,0.65)',
    menuItemSelectedColor: '#f47920',

    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',

    preview: ['#0f0f0f', '#f47920', '#212121']
  },

  // ──────────────────────────────────────────────────────
  // 1b. Speeddansys Orange Light (NUEVO)
  // ──────────────────────────────────────────────────────
  {
    id: 'speeddansys-orange-light',
    name: 'Speeddansys Orange (Light)',
    emoji: '☀️',
    description: 'Naranja con fondo blanco puro',
    isDark: false,
    menuTheme: 'dark', // O light si prefieres la barra lateral blanca, pero dark hace resaltar más el naranja

    colorPrimary: '#f47920',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#f47920',

    siderBg: '#111111', // Barra lateral oscura para contraste
    headerBg: '#ffffff', // Fondo de tarjetas blanco
    contentBg: '#f0f2f5', // Fondo general gris clarito
    bodyBg: '#f0f2f5', // Fondo del body gris clarito

    menuItemBg: '#111111',
    menuSubItemBg: '#050505',
    menuItemSelectedBg: 'rgba(244,121,32,0.2)',
    menuItemHoverBg: 'rgba(244,121,32,0.1)',
    menuItemColor: 'rgba(255,255,255,0.65)',
    menuItemSelectedColor: '#f47920',

    borderColor: '#e8e8e8',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',

    preview: ['#111111', '#f47920', '#ffffff']
  },

  // ──────────────────────────────────────────────────────
  // 2. Ocean Blue — azul profesional CLARO
  // ──────────────────────────────────────────────────────
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    emoji: '🌊',
    description: 'Azul profesional — predeterminado',
    isDark: false,
    menuTheme: 'dark',

    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',

    siderBg: '#001529',
    headerBg: '#ffffff',
    contentBg: '#f0f2f5',
    bodyBg: '#f0f2f5',

    menuItemBg: '#001529',
    menuSubItemBg: '#000c17',
    menuItemSelectedBg: '#1677ff',
    menuItemHoverBg: 'rgba(22,119,255,0.12)',
    menuItemColor: 'rgba(255,255,255,0.65)',
    menuItemSelectedColor: '#ffffff',

    borderColor: '#e8e8e8',
    boxShadow: '0 1px 4px rgba(0,21,41,0.08)',

    preview: ['#001529', '#1677ff', '#f0f2f5']
  },

  // ──────────────────────────────────────────────────────
  // 2. Midnight Gold — negro con dorado OSCURO
  // ──────────────────────────────────────────────────────
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    emoji: '🌑',
    description: 'Oscuro con toques dorados',
    isDark: true,
    menuTheme: 'dark',

    colorPrimary: '#c9a227',
    colorSuccess: '#49aa19',
    colorWarning: '#d89614',
    colorError: '#a61d24',
    colorInfo: '#177ddc',

    siderBg: '#0d0d0d',
    headerBg: '#141414',
    contentBg: '#1a1a1a',
    bodyBg: '#141414',

    menuItemBg: '#0d0d0d',
    menuSubItemBg: '#080808',
    menuItemSelectedBg: 'rgba(201,162,39,0.15)',
    menuItemHoverBg: 'rgba(201,162,39,0.08)',
    menuItemColor: 'rgba(255,255,255,0.55)',
    menuItemSelectedColor: '#c9a227',

    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.05)',

    preview: ['#0d0d0d', '#c9a227', '#1a1a1a']
  },

  // ──────────────────────────────────────────────────────
  // 3. Emerald Forest — verde fresco CLARO
  // ──────────────────────────────────────────────────────
  {
    id: 'emerald',
    name: 'Emerald Forest',
    emoji: '🌿',
    description: 'Verde natural y profesional',
    isDark: false,
    menuTheme: 'dark',

    colorPrimary: '#059669',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#0284c7',

    siderBg: '#022c22',
    headerBg: '#ffffff',
    contentBg: '#f0fdf4',
    bodyBg: '#f0fdf4',

    menuItemBg: '#022c22',
    menuSubItemBg: '#021a15',
    menuItemSelectedBg: 'rgba(5,150,105,0.2)',
    menuItemHoverBg: 'rgba(5,150,105,0.1)',
    menuItemColor: 'rgba(255,255,255,0.6)',
    menuItemSelectedColor: '#34d399',

    borderColor: '#d1fae5',
    boxShadow: '0 1px 4px rgba(5,150,105,0.08)',

    preview: ['#022c22', '#059669', '#f0fdf4']
  },

  // ──────────────────────────────────────────────────────
  // 4. Slate Executive — gris elegante OSCURO
  // ──────────────────────────────────────────────────────
  {
    id: 'slate',
    name: 'Slate Executive',
    emoji: '🪨',
    description: 'Gris elegante minimalista',
    isDark: true,
    menuTheme: 'dark',

    colorPrimary: '#6366f1',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#6366f1',

    siderBg: '#0f172a',
    headerBg: '#1e293b',
    contentBg: '#1e293b',
    bodyBg: '#0f172a',

    menuItemBg: '#0f172a',
    menuSubItemBg: '#080d1a',
    menuItemSelectedBg: 'rgba(99,102,241,0.15)',
    menuItemHoverBg: 'rgba(99,102,241,0.08)',
    menuItemColor: 'rgba(148,163,184,0.85)',
    menuItemSelectedColor: '#818cf8',

    borderColor: 'rgba(99,102,241,0.15)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04)',

    preview: ['#0f172a', '#6366f1', '#1e293b']
  },

  // ──────────────────────────────────────────────────────
  // 5. Crimson Dark — rojo corporativo OSCURO
  // ──────────────────────────────────────────────────────
  {
    id: 'crimson',
    name: 'Crimson Dark',
    emoji: '🔥',
    description: 'Rojo corporativo oscuro',
    isDark: true,
    menuTheme: 'dark',

    colorPrimary: '#ef4444',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',

    siderBg: '#1a0000',
    headerBg: '#200000',
    contentBg: '#1f0f0f',
    bodyBg: '#160000',

    menuItemBg: '#1a0000',
    menuSubItemBg: '#110000',
    menuItemSelectedBg: 'rgba(239,68,68,0.15)',
    menuItemHoverBg: 'rgba(239,68,68,0.08)',
    menuItemColor: 'rgba(255,255,255,0.55)',
    menuItemSelectedColor: '#fca5a5',

    borderColor: 'rgba(239,68,68,0.15)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04)',

    preview: ['#1a0000', '#ef4444', '#1f0f0f']
  },

  // ──────────────────────────────────────────────────────
  // 6. Aurora Purple — violeta moderno OSCURO
  // ──────────────────────────────────────────────────────
  {
    id: 'aurora',
    name: 'Aurora Purple',
    emoji: '🔮',
    description: 'Violeta oscuro con estilo premium',
    isDark: true,
    menuTheme: 'dark',

    colorPrimary: '#7c3aed',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#7c3aed',

    siderBg: '#0d0520',
    headerBg: '#120b2e',
    contentBg: '#160d35',
    bodyBg: '#0d0520',

    menuItemBg: '#0d0520',
    menuSubItemBg: '#080314',
    menuItemSelectedBg: 'rgba(124,58,237,0.2)',
    menuItemHoverBg: 'rgba(124,58,237,0.1)',
    menuItemColor: 'rgba(196,181,253,0.7)',
    menuItemSelectedColor: '#c4b5fd',

    borderColor: 'rgba(124,58,237,0.2)',
    boxShadow: '0 1px 0 rgba(124,58,237,0.1)',

    preview: ['#0d0520', '#7c3aed', '#160d35']
  },

  // ──────────────────────────────────────────────────────
  // 7. Rose Gold — rosa dorado elegante CLARO
  // ──────────────────────────────────────────────────────
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    emoji: '🌸',
    description: 'Rosa dorado elegante y suave',
    isDark: false,
    menuTheme: 'dark',

    colorPrimary: '#db2777',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#0284c7',

    siderBg: '#4a0828',
    headerBg: '#ffffff',
    contentBg: '#fff1f2',
    bodyBg: '#fff1f2',

    menuItemBg: '#4a0828',
    menuSubItemBg: '#3b0620',
    menuItemSelectedBg: 'rgba(219,39,119,0.2)',
    menuItemHoverBg: 'rgba(219,39,119,0.1)',
    menuItemColor: 'rgba(255,255,255,0.6)',
    menuItemSelectedColor: '#fbcfe8',

    borderColor: '#fce7f3',
    boxShadow: '0 1px 4px rgba(219,39,119,0.08)',

    preview: ['#4a0828', '#db2777', '#fff1f2']
  }
]

export const DEFAULT_THEME_ID = 'speeddansys-orange-light'

export function getThemeById(id: string): AppTheme {
  return THEMES.find(t => t.id === id) ?? THEMES.find(t => t.id === DEFAULT_THEME_ID)!
}

/**
 * Aplica las variables CSS del tema al elemento :root del documento.
 * Esto permite que cualquier CSS en la app use var(--theme-*) para
 * acceder a los colores del tema activo sin hardcodear nada.
 */
export function applyThemeCSSVars(appTheme: AppTheme, customColor?: string): void {
  const primary = (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor))
    ? customColor
    : appTheme.colorPrimary

  const root = document.documentElement
  root.style.setProperty('--theme-primary', primary)
  root.style.setProperty('--theme-primary-rgb', hexToRgb(primary))
  root.style.setProperty('--theme-success', appTheme.colorSuccess)
  root.style.setProperty('--theme-warning', appTheme.colorWarning)
  root.style.setProperty('--theme-error', appTheme.colorError)
  root.style.setProperty('--theme-info', appTheme.colorInfo)
  root.style.setProperty('--theme-sider-bg', appTheme.siderBg)
  root.style.setProperty('--theme-header-bg', appTheme.headerBg)
  root.style.setProperty('--theme-content-bg', appTheme.contentBg)
  root.style.setProperty('--theme-body-bg', appTheme.bodyBg)
  root.style.setProperty('--theme-menu-item-bg', appTheme.menuItemBg)
  root.style.setProperty('--theme-menu-sub-bg', appTheme.menuSubItemBg)
  root.style.setProperty('--theme-menu-selected-bg', appTheme.menuItemSelectedBg)
  root.style.setProperty('--theme-menu-hover-bg', appTheme.menuItemHoverBg)
  root.style.setProperty('--theme-menu-color', appTheme.menuItemColor)
  root.style.setProperty('--theme-menu-selected-color', appTheme.menuItemSelectedColor)
  root.style.setProperty('--theme-border', appTheme.borderColor)
  root.style.setProperty('--theme-shadow', appTheme.boxShadow)

  // Scrollbar y body
  root.style.setProperty('--scrollbar-thumb', appTheme.isDark
    ? 'rgba(255,255,255,0.15)'
    : 'rgba(0,0,0,0.18)')
  root.style.setProperty('--scrollbar-track', appTheme.isDark
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(0,0,0,0.04)')

  // Atributo data para activar reglas CSS por modo
  root.setAttribute('data-theme-mode', appTheme.isDark ? 'dark' : 'light')
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function buildAntThemeConfig(appTheme: AppTheme, customColor?: string): ThemeConfig {
  const primary = (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor))
    ? customColor
    : appTheme.colorPrimary

  return {
    algorithm: appTheme.isDark ? darkAlgorithm : defaultAlgorithm,
    token: {
      colorPrimary: primary,
      colorSuccess: appTheme.colorSuccess,
      colorWarning: appTheme.colorWarning,
      colorError: appTheme.colorError,
      colorInfo: appTheme.colorInfo,
      colorBgLayout: appTheme.contentBg,
      colorBgContainer: appTheme.isDark ? appTheme.headerBg : '#ffffff',
      borderRadius: 6,
      fontFamily: '"Segoe UI", system-ui, sans-serif'
    },
    components: {
      Layout: {
        siderBg: appTheme.siderBg,
        headerBg: appTheme.headerBg,
        bodyBg: appTheme.bodyBg,
        triggerBg: appTheme.menuSubItemBg
      },
      Menu: {
        // Aplica para menú oscuro (theme="dark")
        darkItemBg: appTheme.menuItemBg,
        darkSubMenuItemBg: appTheme.menuSubItemBg,
        darkItemSelectedBg: appTheme.menuItemSelectedBg,
        darkItemColor: appTheme.menuItemColor,
        darkItemSelectedColor: appTheme.menuItemSelectedColor,
        // Aplica para menú claro (theme="light") — cuando se use
        itemBg: appTheme.menuItemBg,
        subMenuItemBg: appTheme.menuSubItemBg,
        itemSelectedBg: appTheme.menuItemSelectedBg,
        itemHoverBg: appTheme.menuItemHoverBg,
        itemColor: appTheme.menuItemColor,
        itemSelectedColor: appTheme.menuItemSelectedColor
      }
    }
  }
}
