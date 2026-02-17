import { NavLink } from 'react-router-dom'
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
} from 'lucide-react'
import clsx from 'clsx'

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

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-white transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-lg font-bold text-text-primary">Alarmplaner</span>
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-600">
              Pro
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main section */}
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            KI-Säulen
          </p>
        )}
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Admin section */}
        <div className="mt-6">
          {!collapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Verwaltung
            </p>
          )}
          <div className="space-y-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    collapsed && 'justify-center',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Einklappen</span>}
        </button>
      </div>
    </aside>
  )
}
