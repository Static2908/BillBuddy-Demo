
import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Menu,
  X,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: 'All Bills',
    path: '/bills',
    icon: ReceiptText,
    end: false,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    end: true,
  },
]

function getInitialTheme() {
  try {
    return localStorage.getItem('billbuddy-theme') === 'dark'
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState(getInitialTheme)

  // Apply and persist the selected theme.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')

    try {
      localStorage.setItem('billbuddy-theme', theme)
    } catch {
      // Theme remains active for this session if storage is unavailable.
    }
  }, [theme])

  // Synchronize the theme when it is changed from SettingsPage.
  useEffect(() => {
    const handleThemeChange = (event) => {
      const nextTheme = event.detail?.theme

      if (nextTheme === 'light' || nextTheme === 'dark') {
        setTheme(nextTheme)
      }
    }

    window.addEventListener(
      'billbuddy-theme-change',
      handleThemeChange
    )

    return () => {
      window.removeEventListener(
        'billbuddy-theme-change',
        handleThemeChange
      )
    }
  }, [])

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isDark = theme === 'dark'

  const toggleTheme = () => {
    setTheme((previous) =>
      previous === 'dark' ? 'light' : 'dark'
    )
  }

  const currentPage = location.pathname.startsWith('/bills/')
    ? 'Bill Details'
    : navigationItems.find((item) =>
        item.end
          ? location.pathname === item.path
          : location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`)
      )?.name || 'Dashboard'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const sidebarWidth = sidebarCollapsed
    ? 'md:w-[88px]'
    : 'md:w-[260px]'

  const renderNavigation = (isMobile = false) => (
    <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
      <p
        className={`mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 ${
          sidebarCollapsed && !isMobile ? 'md:hidden' : ''
        }`}
      >
        Workspace
      </p>

      {navigationItems.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={isMobile ? closeMobileMenu : undefined}
            title={
              sidebarCollapsed && !isMobile
                ? item.name
                : undefined
            }
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50 dark:bg-indigo-500 dark:shadow-indigo-950/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              } ${
                sidebarCollapsed && !isMobile
                  ? 'md:justify-center md:px-2'
                  : ''
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-[19px] w-[19px] shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-300'
                  }`}
                />

                <span
                  className={
                    sidebarCollapsed && !isMobile
                      ? 'md:hidden'
                      : ''
                  }
                >
                  {item.name}
                </span>

                {isActive && !(sidebarCollapsed && !isMobile) && (
                  <ChevronRight className="ml-auto h-4 w-4 opacity-80" />
                )}
              </>
            )}
          </NavLink>
        )
      })}

      <div
        className={`mt-5 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-3 dark:border-indigo-900/60 dark:from-indigo-950/50 dark:to-violet-950/30 ${
          sidebarCollapsed && !isMobile ? 'md:hidden' : ''
        }`}
      >
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
          <Wallet className="h-4 w-4" />
        </div>

        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
          Stay on top of your bills
        </p>

        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
          Track your spending and review unusual bill changes.
        </p>

        <button
          type="button"
          onClick={() => {
            navigate('/bills')
            if (isMobile) closeMobileMenu()
          }}
          className="mt-3 text-xs font-bold text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          View your bills →
        </button>
      </div>
    </nav>
  )

  const renderSidebarFooter = (isMobile = false) => {
    const displayName =
      user?.fullName || user?.name || 'BillBuddy User'

    const initial =
      displayName.trim().charAt(0).toUpperCase() || 'U'

    return (
      <div className="shrink-0 border-t border-slate-200/80 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {initial}
          </div>

          <div
            className={`min-w-0 flex-1 ${
              sidebarCollapsed && !isMobile ? 'md:hidden' : ''
            }`}
          >
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              BillBuddy account
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 ${
              sidebarCollapsed && !isMobile ? 'md:hidden' : ''
            }`}
          >
            <LogOut className="h-[17px] w-[17px]" />
          </button>
        </div>
      </div>
    )
  }

  const renderBrand = (isMobile = false) => (
    <div
      className={`flex h-[76px] shrink-0 items-center border-b border-slate-200/80 px-5 dark:border-slate-800 ${
        !isMobile && sidebarCollapsed
          ? 'md:justify-center md:px-2'
          : 'gap-3'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200/60 dark:bg-indigo-500 dark:shadow-none">
        <ReceiptText className="h-5 w-5" />
      </div>

      <div
        className={
          !isMobile && sidebarCollapsed
            ? 'md:hidden'
            : 'min-w-0'
        }
      >
        <h1 className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          Bill<span className="text-indigo-600 dark:text-indigo-400">Buddy</span>
        </h1>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.13em] text-slate-400">
          Smart bill management
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-200 dark:bg-[#0b1120] dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200/80 bg-white transition-[width,background-color] duration-200 dark:border-slate-800 dark:bg-[#111a2b] md:flex ${sidebarWidth}`}
      >
        {renderBrand()}
        {renderNavigation()}
        {renderSidebarFooter()}

        <button
          type="button"
          onClick={() =>
            setSidebarCollapsed((previous) => !previous)
          }
          aria-label={
            sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
          }
          title={
            sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
          }
          className="absolute -right-3 top-[88px] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-300"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 dark:border-slate-800 dark:bg-[#111a2b] md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between">
          {renderBrand(true)}

          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close menu"
            className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {renderNavigation(true)}
        {renderSidebarFooter(true)}
      </aside>

      {/* Main workspace */}
      <div
        className={`min-h-screen transition-[margin] duration-200 ${
          sidebarCollapsed ? 'md:ml-[88px]' : 'md:ml-[260px]'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-[#111a2b]/95">
          <div className="flex h-[76px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <span>Workspace</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                    {currentPage}
                  </span>
                </div>

                <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {currentPage}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={
                  isDark ? 'Switch to light theme' : 'Switch to dark theme'
                }
                aria-label={
                  isDark ? 'Switch to light theme' : 'Switch to dark theme'
                }
                aria-pressed={isDark}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:border-indigo-700 dark:hover:bg-slate-700"
              >
                {isDark ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                )}
              </button>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {user?.fullName || user?.name || 'Welcome'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Your personal workspace
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
                {(user?.fullName || user?.name || 'U')
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              >
                <LogOut className="h-[17px] w-[17px]" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto min-h-[calc(100vh-120px)] w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>

        <footer className="px-4 pb-6 text-center text-xs text-slate-400 dark:text-slate-600 sm:px-6 lg:px-8">
          BillBuddy · Smarter utility bill tracking
        </footer>
      </div>
    </div>
  )
}

export default AppLayout
