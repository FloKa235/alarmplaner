import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  Map,
  ShieldAlert,
  Flame,
  Package,
  Bell,
  Building2,
  Landmark,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
  Radio,
  Clock,
  Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { useCrisis, stufeLabelMap } from '@/contexts/CrisisContext'
import KrisenaktivierungsModal from '@/components/crisis/KrisenaktivierungsModal'
import KrisenbeendenModal from '@/components/crisis/KrisenbeendenModal'

const mainNav = [
  { label: 'Landkreis', href: '/pro', icon: Map, end: true },
  { label: 'Risikoanalyse', href: '/pro/risikoanalyse', icon: ShieldAlert },
  { label: 'Szenarien', href: '/pro/szenarien', icon: Flame },
  { label: 'Inventar', href: '/pro/inventar', icon: Package },
  { label: 'Alarmierung', href: '/pro/alarmierung', icon: Bell },
]

const adminNav = [
  { label: 'Checklisten', href: '/pro/checklisten', icon: ClipboardList },
  { label: 'Gemeinden', href: '/pro/gemeinden', icon: Building2 },
  { label: 'KRITIS', href: '/pro/kritis', icon: Landmark },
  { label: 'Dokumente', href: '/pro/dokumente', icon: FileText },
  { label: 'Einstellungen', href: '/pro/einstellungen', icon: Settings },
]

const crisisNav = [
  { label: 'Lagezentrum', href: '/pro/lagezentrum', icon: Radio },
  { label: 'Timeline', href: '/pro/timeline', icon: Clock },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isActive, stufe } = useCrisis()
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const navLinkClass = ({ isActive: isLinkActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      collapsed && 'justify-center',
      isLinkActive
        ? isActive
          ? 'bg-red-900/30 text-red-400'
          : 'bg-primary-50 text-primary-600'
        : isActive
          ? 'text-red-300/70 hover:bg-red-900/20 hover:text-red-300'
          : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
    )

  return (
    <>
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-64',
          isActive
            ? 'border-red-900/50 bg-[#0a0303]'
            : 'border-border bg-white'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex h-16 items-center gap-2.5 border-b px-4',
          isActive ? 'border-red-900/50' : 'border-border'
        )}>
          <div className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            isActive ? 'bg-red-600' : 'bg-primary-600'
          )}>
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={clsx(
                'text-lg font-bold',
                isActive ? 'text-red-50' : 'text-text-primary'
              )}>
                Alarmplaner
              </span>
              {isActive ? (
                <span className="flex items-center gap-1 rounded-full bg-red-900/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 crisis-dot-pulse" />
                  Krise
                </span>
              ) : (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                  Pro
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Main section */}
          {!collapsed && (
            <p className={clsx(
              'mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider',
              isActive ? 'text-red-400/60' : 'text-text-muted'
            )}>
              KI-Säulen
            </p>
          )}
          <div className="space-y-1">
            {mainNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end}
                className={navLinkClass}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>

          {/* Crisis section - nur sichtbar wenn Krise aktiv */}
          {isActive && (
            <div className="mt-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-red-400">
                  🔴 Krisenmodus
                </p>
              )}
              <div className="space-y-1">
                {crisisNav.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={navLinkClass}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Admin section */}
          <div className="mt-6">
            {!collapsed && (
              <p className={clsx(
                'mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider',
                isActive ? 'text-red-400/60' : 'text-text-muted'
              )}>
                Verwaltung
              </p>
            )}
            <div className="space-y-1">
              {adminNav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={navLinkClass}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom: Crisis toggle + Collapse */}
        <div className={clsx(
          'border-t p-3 space-y-2',
          isActive ? 'border-red-900/50' : 'border-border'
        )}>
          {/* Crisis activation/deactivation button */}
          {!collapsed && (
            isActive ? (
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-800/50 bg-red-900/30 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/50"
              >
                <Zap className="h-4 w-4" />
                Krise beenden
                {stufe && (
                  <span className="ml-auto text-[10px] opacity-60">{stufeLabelMap[stufe]}</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowActivateModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <Zap className="h-4 w-4" />
                Krise aktivieren
              </button>
            )
          )}

          {/* Collapsed: icon-only button */}
          {collapsed && (
            <button
              onClick={() => isActive ? setShowDeactivateModal(true) : setShowActivateModal(true)}
              className={clsx(
                'flex w-full items-center justify-center rounded-xl px-3 py-2 transition-colors',
                isActive
                  ? 'text-red-400 hover:bg-red-900/30'
                  : 'text-red-600 hover:bg-red-50'
              )}
              title={isActive ? 'Krise beenden' : 'Krise aktivieren'}
            >
              <Zap className="h-5 w-5" />
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={onToggle}
            className={clsx(
              'flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
              isActive
                ? 'text-red-400/60 hover:bg-red-900/20'
                : 'text-text-secondary hover:bg-surface-secondary'
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Einklappen</span>}
          </button>
        </div>
      </aside>

      {/* Modals */}
      {showActivateModal && (
        <KrisenaktivierungsModal onClose={() => setShowActivateModal(false)} />
      )}
      {showDeactivateModal && (
        <KrisenbeendenModal onClose={() => setShowDeactivateModal(false)} />
      )}
    </>
  )
}
