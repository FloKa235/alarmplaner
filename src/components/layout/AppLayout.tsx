import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, ClipboardList, FileText, Settings, LogOut, Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Warnungen', href: '/app/warnungen', icon: AlertTriangle },
  { label: 'Checklisten', href: '/app/checklisten', icon: ClipboardList },
  { label: 'Notfallplan', href: '/app/notfallplan', icon: FileText },
  { label: 'Einstellungen', href: '/app/einstellungen', icon: Settings },
]

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { displayName, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/app" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary">Alarmplaner</span>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Privat</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/app'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              to="/pro"
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">PRO-Dashboard</span>
              <span className="sm:hidden">PRO</span>
            </Link>
            {displayName && (
              <span className="hidden text-sm font-medium text-text-primary sm:inline">
                {displayName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="hidden items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary sm:flex"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-secondary md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-white px-4 pb-4 pt-2 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/app'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:bg-surface-secondary'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/pro"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex w-full items-center gap-3 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-100"
            >
              <Shield className="h-4 w-4" />
              PRO-Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
