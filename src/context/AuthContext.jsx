
import {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('billbuddy_token')
      const storedUser = localStorage.getItem('billbuddy_user')

      if (!token || !storedUser) {
        localStorage.removeItem('billbuddy_token')
        localStorage.removeItem('billbuddy_user')
        return null
      }

      return JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('billbuddy_token')
      localStorage.removeItem('billbuddy_user')
      return null
    }
  })

  const login = (authResponse) => {
    localStorage.setItem('billbuddy_token', authResponse.token)
    localStorage.setItem(
      'billbuddy_user',
      JSON.stringify(authResponse.user)
    )
    setUser(authResponse.user)
  }

  const logout = () => {
    localStorage.removeItem('billbuddy_token')
    localStorage.removeItem('billbuddy_user')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated:
        Boolean(user) &&
        Boolean(localStorage.getItem('billbuddy_token')),
    }),
    [user]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
