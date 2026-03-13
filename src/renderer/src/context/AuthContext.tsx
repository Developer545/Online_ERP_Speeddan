import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useTheme } from './ThemeContext'

interface AuthContextValue {
  user: UserSession | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AUTH_TOKEN_KEY = 'speeddansys_token'
const AUTH_USER_KEY  = 'speeddansys_user'

// Decodifica el payload de un JWT sin verificar la firma (solo frontend)
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  // exp está en segundos, Date.now() en ms
  return payload.exp * 1000 > Date.now()
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: UserSession | null }) {
  const [user, setUser] = useState<UserSession | null>(initialUser ?? null)
  // loading=true hasta que verifiquemos si hay sesión guardada
  const [loading, setLoading] = useState(!initialUser)
  const { loadUserTheme } = useTheme()

  // Al montar: intentar restaurar sesión desde localStorage
  useEffect(() => {
    // Si ya tenemos initialUser (modo Electron), no hacer nada
    if (initialUser) {
      setLoading(false)
      return
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const userRaw = localStorage.getItem(AUTH_USER_KEY)

    if (token && userRaw && isTokenValid(token)) {
      try {
        const savedUser: UserSession = JSON.parse(userRaw)
        setUser(savedUser)
        // Restaurar tema del usuario
        if (savedUser.tema) {
          loadUserTheme(savedUser.tema, savedUser.colorCustom ?? undefined)
        }
      } catch {
        // Si el JSON está corrupto, limpiar y mostrar login
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      }
    } else {
      // Token expirado o no existe → limpiar
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
    }

    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const result = await window.seguridad.login(username, password)
      if (result.ok && result.user) {
        setUser(result.user)
        // Persistir sesión en localStorage para sobrevivir refresco
        if (result.token) {
          localStorage.setItem(AUTH_TOKEN_KEY, result.token)
        }
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user))
        // Sincronizar tema guardado del usuario en BD
        if (result.user.tema) {
          loadUserTheme(result.user.tema, result.user.colorCustom ?? undefined)
        }
        return { ok: true }
      }
      return { ok: false, error: result.error || 'Error de autenticación' }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Login] Error real:', msg)
      return { ok: false, error: `Error de conexión con la base de datos: ${msg}` }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
