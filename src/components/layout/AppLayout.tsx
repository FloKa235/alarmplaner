import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { Package, BookOpen, FileText, Settings, LogOut, Menu, X, Shield, AlertTriangle, Users } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { useCitizenHousehold } from '@/hooks/useCitizenHousehold'
import { useVorsorgeScore } from '@/hooks/useVorsorgeScore'
import CircularProgress from '@/components/app/CircularProgress'
import BuergerOnboarding from '@/components/app/BuergerOnboarding'
import ChatWidget from '@/components/app/ChatWidget'

const navItems = [
  { label: 'Notfallplan', href: '/app/notfallplan', icon: FileText },
  { label: 'Notfallvorsorge', href: '/app/vorsorge', icon: Package },
  { label: 'Wissen', href: '/app/wissen', icon: BookOpen },
  { label: 'Nachbarn', href: '/app/nachbarn', icon: Users },
]

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { displayName, signOut } = useAuth()
  const { hasCompletedOnboarding, loading: onboardingLoading } = useCitizenHousehold()
  const { total: vorsorgeScore, color: scoreColor } = useVorsorgeScore()
  const navigate = useNavigate()

  const scoreColorMap: Record<string, string> = {
    red: 'var(--color-red-500)',
    amber: 'var(--color-amber-500)',
    blue: 'var(--color-primary-600)',
    green: 'var(--color-green-500)',
    purple: 'var(--color-purple-500)',
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Onboarding Overlay – erscheint beim ersten Login wenn Onboarding nicht abgeschlossen */}
      {!onboardingLoading && !hasCompletedOnboarding && <BuergerOnboarding />}

      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo → Dashboard */}
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
            {vorsorgeScore > 0 && (
              <Link to="/app" className="hidden items-center gap-1.5 sm:flex" title={`Vorsorge-Score: ${vorsorgeScore}/100`}>
                <CircularProgress
                  value={vorsorgeScore}
                  size={28}
                  strokeWidth={3}
                  color={scoreColorMap[scoreColor] || scoreColorMap.red}
                >
                  <span className="text-[9px] font-bold text-text-primary">{vorsorgeScore}</span>
                </CircularProgress>
              </Link>
            )}
            {displayName && (
              <span className="hidden text-sm font-medium text-text-primary sm:inline">
                {displayName}
              </span>
            )}
            {/* Einstellungen – nur Icon */}
            <NavLink
              to="/app/einstellungen"
              className={({ isActive }) =>
                clsx(
                  'hidden h-9 w-9 items-center justify-center rounded-xl border transition-colors sm:flex',
                  isActive
                    ? 'border-primary-200 bg-primary-50 text-primary-600'
                    : 'border-border text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                )
              }
              title="Einstellungen"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
            <button
              onClick={handleLogout}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-surface-secondary sm:flex"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
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
            <NavLink
              to="/app/einstellungen"
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
              <Settings className="h-4 w-4" />
              Einstellungen
            </NavLink>
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

      {/* Floating Chat Widget */}
      <ChatWidget />
    </div>
  )
}
