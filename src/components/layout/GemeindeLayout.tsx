import { Outlet, Navigate, useLocation, Link, useNavigate } from 'react-router-dom'
import { useState, createElement } from 'react'
import { User, LogOut, Loader2, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import GemeindeSidebar from './GemeindeSidebar'
import { MembershipProvider, MembershipContext, useMembership, type MembershipState } from '@/hooks/useMembership'
import { DistrictProvider } from '@/hooks/useDistrict'
import { useAuth } from '@/contexts/AuthContext'

const breadcrumbMap: Record<string, string> = {
  '/gemeinde': 'Dashboard',
  '/gemeinde/inventar': 'Inventar',
  '/gemeinde/kritis': 'Kritische Infrastruktur',
  '/gemeinde/checklisten': 'Checklisten',
  '/gemeinde/szenarien': 'Szenarien',
  '/gemeinde/notfall': 'Alarmierung',
  '/gemeinde/einstellungen': 'Einstellungen',
}

// Dynamische Breadcrumb-Erkennung für Szenario-Detail
function getBreadcrumbLabel(pathname: string): string {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname]
  if (pathname.startsWith('/gemeinde/szenarien/')) return 'Szenario-Detail'
  return 'Seite'
}

function GemeindeTopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { displayName, email, signOut } = useAuth()
  const { municipality, isOwner } = useMembership()

  const currentLabel = getBreadcrumbLabel(location.pathname)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/95 px-6 backdrop-blur-lg">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/gemeinde" className="text-text-muted transition-colors hover:text-text-primary">
          {municipality?.name || 'Gemeinde'}
        </Link>
        <span className="text-text-muted">/</span>
        <span className="font-medium text-text-primary">{currentLabel}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Admin-Preview: Zurück zum Pro-Dashboard */}
        {isOwner && (
          <Link
            to="/pro"
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zum Admin
          </Link>
        )}

        <div className="ml-1 flex items-center gap-2 rounded-xl border border-border px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-text-primary">
              {displayName || 'Bürgermeister'}
            </p>
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

/**
 * Override-Provider: Für Admins mit Bürgermeister-Record werden die
 * Membership-Werte mit den Bürgermeister-Daten überschrieben,
 * damit die Kind-Seiten (Dashboard, Inventar, etc.) korrekt funktionieren.
 */
function BuergermeisterOverrideProvider({ children }: { children: React.ReactNode }) {
  const parentState = useMembership()

  // Wenn Admin mit Bürgermeister-Record → Werte für Kind-Komponenten überschreiben
  if (parentState.isOwner && parentState.hasBuergermeisterRecord && parentState.buergermeisterMembership) {
    const overriddenState: MembershipState = {
      ...parentState,
      // Diese Werte werden von den Gemeinde-Seiten genutzt:
      role: 'buergermeister',
      municipalityId: parentState.buergermeisterMembership.municipality_id,
      municipality: parentState.buergermeisterMunicipality,
      membership: parentState.buergermeisterMembership,
      // isOwner bleibt true → für "Zurück zum Admin" Button
    }

    return createElement(
      MembershipContext.Provider,
      { value: overriddenState },
      children
    )
  }

  // Normaler Bürgermeister → keine Änderung
  return <>{children}</>
}

function GemeindeLayoutInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { role, loading, hasBuergermeisterRecord } = useMembership()

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-text-secondary">Gemeinde-Portal wird geladen...</p>
        </div>
      </div>
    )
  }

  // Kein Zugriff → zurück zum Login
  if (!role) {
    return <Navigate to="/login" replace />
  }

  // Ist Admin OHNE Bürgermeister-Record → zum Pro-Dashboard
  // Admin MIT Bürgermeister-Record darf das Portal als Preview nutzen
  if (role === 'admin' && !hasBuergermeisterRecord) {
    return <Navigate to="/pro" replace />
  }

  return (
    <BuergermeisterOverrideProvider>
      <div className="min-h-screen bg-surface-secondary">
        <GemeindeSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <div
          className={clsx(
            'transition-all duration-300',
            sidebarCollapsed ? 'ml-[72px]' : 'ml-64'
          )}
        >
          <GemeindeTopBar />
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </BuergermeisterOverrideProvider>
  )
}

export default function GemeindeLayout() {
  return (
    <DistrictProvider>
      <MembershipProvider>
        <GemeindeLayoutInner />
      </MembershipProvider>
    </DistrictProvider>
  )
}
