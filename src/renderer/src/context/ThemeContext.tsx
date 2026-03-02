import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import type { ThemeConfig } from 'antd'
import {
  getThemeById,
  buildAntThemeConfig,
  applyThemeCSSVars,
  DEFAULT_THEME_ID
} from '../themes/themes'
import type { AppTheme } from '../themes/themes'

const STORAGE_KEY = 'speeddansys_theme'
const CUSTOM_COLOR_KEY = 'speeddansys_color'

interface ThemeContextValue {
  themeId: string
  currentTheme: AppTheme
  customColor: string
  antThemeConfig: ThemeConfig
  setTheme: (id: string, userId?: number) => void
  setCustomColor: (color: string, userId?: number) => void
  loadUserTheme: (tema: string, colorCustom?: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID
  )
  const [customColor, setCustomColorState] = useState<string>(
    () => localStorage.getItem(CUSTOM_COLOR_KEY) || ''
  )

  const currentTheme = useMemo(() => getThemeById(themeId), [themeId])
  const antThemeConfig = useMemo(
    () => buildAntThemeConfig(currentTheme, customColor || undefined),
    [currentTheme, customColor]
  )

  // Aplica variables CSS al :root cada vez que cambia el tema o el color personalizado
  useEffect(() => {
    applyThemeCSSVars(currentTheme, customColor || undefined)
  }, [currentTheme, customColor])

  const setTheme = (id: string, userId?: number) => {
    setThemeId(id)
    localStorage.setItem(STORAGE_KEY, id)
    if (userId) {
      window.seguridad.guardarTema(userId, id, customColor || undefined).catch(() => { })
    }
  }

  const setCustomColor = (color: string, userId?: number) => {
    setCustomColorState(color)
    if (color) {
      localStorage.setItem(CUSTOM_COLOR_KEY, color)
    } else {
      localStorage.removeItem(CUSTOM_COLOR_KEY)
    }
    if (userId) {
      window.seguridad.guardarTema(userId, themeId, color || undefined).catch(() => { })
    }
  }

  // Sincroniza el tema guardado en BD al hacer login
  const loadUserTheme = (tema: string, colorCustom?: string) => {
    if (tema && tema !== themeId) {
      setThemeId(tema)
      localStorage.setItem(STORAGE_KEY, tema)
    }
    if (colorCustom !== undefined) {
      setCustomColorState(colorCustom || '')
      if (colorCustom) {
        localStorage.setItem(CUSTOM_COLOR_KEY, colorCustom)
      } else {
        localStorage.removeItem(CUSTOM_COLOR_KEY)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{
      themeId, currentTheme, customColor, antThemeConfig,
      setTheme, setCustomColor, loadUserTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
