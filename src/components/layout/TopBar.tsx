import { Bell, Search, User, LogOut } from 'lucide-react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const breadcrumbMap: Record<string, string> = {
  '/pro': 'Dashboard',
  '/pro/risikoanalyse': 'Risikoanalyse',
  '/pro/szenarien': 'Szenarien',
  '/pro/inventar': 'Inventar',
  '/pro/alarmierung': 'Alarmierung',
  '/pro/alarmierung/kontakte': 'Kontakte',
  '/pro/gemeinden': 'Gemeinden',
  '/pro/kritis': 'Kritische Infrastruktur',
  '/pro/dokumente': 'Dokumente',
  '/pro/einstellungen': 'Einstellungen',
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { displayName, email, signOut } = useAuth()
  const currentLabel = breadcrumbMap[location.pathname] || 'Seite'

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-6 backdrop-blur-lg">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/pro" className="text-text-muted transition-colors hover:text-text-primary">
          Alarmplaner
        </Link>
        <span className="text-text-muted">/</span>
        <span className="font-medium text-text-primary">{currentLabel}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex h-9 items-center gap-2 rounded-xl border border-border bg-surface-secondary px-3 text-sm text-text-muted transition-colors hover:bg-white">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Suchen...</span>
          <kbd className="ml-4 hidden rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline">
            /
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-surface-secondary">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* User Menu */}
        <div className="ml-1 flex items-center gap-2 rounded-xl border border-border px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-text-primary">{displayName || 'Benutzer'}</p>
            <p className="text-[10px] text-text-muted">{email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 text-text-muted transition-colors hover:text-text-primary"
            title="Abmelden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
