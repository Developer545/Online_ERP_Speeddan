import { createContext, useContext, useState, ReactNode } from 'react'
import { useTheme } from './ThemeContext'

interface AuthContextValue {
  user: UserSession | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: UserSession | null }) {
  const [user, setUser] = useState<UserSession | null>(initialUser ?? null)
  const [loading, setLoading] = useState(false)
  const { loadUserTheme } = useTheme()

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const result = await window.seguridad.login(username, password)
      if (result.ok && result.user) {
        setUser(result.user)
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

  const logout = () => setUser(null)

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
