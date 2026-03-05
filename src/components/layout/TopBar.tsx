import { Bell, Search, User, LogOut } from 'lucide-react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useCrisis, formatElapsed, stufeLabelMap, stufeColorMap } from '@/contexts/CrisisContext'
import clsx from 'clsx'

const breadcrumbMap: Record<string, string> = {
  '/pro': 'Dashboard',
  '/pro/risikoanalyse': 'Risikoanalyse',
  '/pro/szenarien': 'Szenarien',
  '/pro/inventar': 'Inventar',
  '/pro/alarmierung': 'Alarmierung',
  '/pro/alarmierung/kontakte': 'Kontakte',
  '/pro/alarmierung/krisenstab': 'Krisenstab',
  '/pro/gemeinden': 'Gemeinden',
  '/pro/kritis': 'KRITIS – Infrastruktur',
  '/pro/kritis/compliance': 'KRITIS – Compliance',
  '/pro/dokumente': 'Dokumente',
  '/pro/einstellungen': 'Einstellungen',
  '/pro/vorbereitung': 'Vorbereitung',
  '/pro/handbuch': 'Krisenhandbuch',
  '/pro/lagezentrum': 'Lagezentrum',
  '/pro/timeline': 'Ereignis-Timeline',
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { displayName, email, signOut } = useAuth()
  const { isActive, scenarioTitle, elapsedSeconds, stufe } = useCrisis()

  // Handle dynamic routes like /pro/szenarien/:id or /pro/gemeinden/:id
  const currentLabel = breadcrumbMap[location.pathname] || 'Seite'

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div>
      {/* Crisis Banner - nur wenn Krise aktiv */}
      {isActive && (
        <div className="flex items-center justify-between bg-red-900/90 px-6 py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-red-500 crisis-dot-pulse" />
            <span className="font-semibold text-red-100">KRISENFALL AKTIV</span>
            {scenarioTitle && (
              <span className="text-red-300">— {scenarioTitle}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {stufe && (
              <span className={clsx(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                stufeColorMap[stufe]
              )}>
                {stufeLabelMap[stufe]}
              </span>
            )}
            <span className="font-mono text-sm text-red-200">
              {formatElapsed(elapsedSeconds)}
            </span>
            <Link
              to="/pro/lagezentrum"
              className="rounded-lg bg-red-800/50 px-3 py-1 text-xs font-medium text-red-100 transition-colors hover:bg-red-800"
            >
              Lagezentrum →
            </Link>
          </div>
        </div>
      )}

      {/* Main TopBar */}
      <header
        className={clsx(
          'sticky top-0 z-30 flex h-16 items-center justify-between px-6 backdrop-blur-lg',
          isActive
            ? 'border-b border-red-900/50 bg-[#1a0a0a]/95'
            : 'border-b border-border bg-white/95'
        )}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/pro"
            className={clsx(
              'transition-colors',
              isActive ? 'text-red-400/60 hover:text-red-300' : 'text-text-muted hover:text-text-primary'
            )}
          >
            Alarmplaner
          </Link>
          <span className={isActive ? 'text-red-400/40' : 'text-text-muted'}>/</span>
          <span className={clsx(
            'font-medium',
            isActive ? 'text-red-100' : 'text-text-primary'
          )}>
            {currentLabel}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            className={clsx(
              'flex h-9 items-center gap-2 rounded-xl border px-3 text-sm transition-colors',
              isActive
                ? 'border-red-900/50 bg-red-900/20 text-red-400/60 hover:bg-red-900/30'
                : 'border-border bg-surface-secondary text-text-muted hover:bg-white'
            )}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Suchen...</span>
            <kbd
              className={clsx(
                'ml-4 hidden rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline',
                isActive
                  ? 'border-red-900/50 bg-red-900/20 text-red-400/60'
                  : 'border-border bg-white text-text-muted'
              )}
            >
              /
            </kbd>
          </button>

          {/* Notifications */}
          <button
            className={clsx(
              'relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
              isActive
                ? 'border-red-900/50 text-red-400/60 hover:bg-red-900/20'
                : 'border-border text-text-secondary hover:bg-surface-secondary'
            )}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* User Menu */}
          <div
            className={clsx(
              'ml-1 flex items-center gap-2 rounded-xl border px-3 py-1.5',
              isActive ? 'border-red-900/50' : 'border-border'
            )}
          >
            <div
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded-lg',
                isActive ? 'bg-red-900/30 text-red-400' : 'bg-primary-50 text-primary-600'
              )}
            >
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className={clsx(
                'text-xs font-medium',
                isActive ? 'text-red-100' : 'text-text-primary'
              )}>
                {displayName || 'Benutzer'}
              </p>
              <p className={clsx(
                'text-[10px]',
                isActive ? 'text-red-400/60' : 'text-text-muted'
              )}>
                {email || ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className={clsx(
                'ml-1 transition-colors',
                isActive ? 'text-red-400/60 hover:text-red-300' : 'text-text-muted hover:text-text-primary'
              )}
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}
