import { NavLink } from 'react-router-dom'
import {
  Map,
  Package,
  Landmark,
  ClipboardList,
  Flame,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import clsx from 'clsx'
import { useMembership } from '@/hooks/useMembership'

const gemeindeNav = [
  { label: 'Dashboard', href: '/gemeinde', icon: Map, end: true },
  { label: 'Inventar', href: '/gemeinde/inventar', icon: Package },
  { label: 'KRITIS', href: '/gemeinde/kritis', icon: Landmark },
  { label: 'Checklisten', href: '/gemeinde/checklisten', icon: ClipboardList },
  { label: 'Szenarien', href: '/gemeinde/szenarien', icon: Flame },
  { label: 'Alarmierung', href: '/gemeinde/notfall', icon: Bell },
  { label: 'Einstellungen', href: '/gemeinde/einstellungen', icon: Settings },
]

interface GemeindeSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function GemeindeSidebar({ collapsed, onToggle }: GemeindeSidebarProps) {
  const { municipality } = useMembership()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
      collapsed && 'justify-center',
      isActive
        ? 'bg-primary-50 text-primary-600'
        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
    )

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
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-700">
              Gemeinde
            </span>
          </div>
        )}
      </div>

      {/* Gemeinde-Name */}
      {!collapsed && municipality && (
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs text-text-muted">Ihre Gemeinde</p>
          <p className="text-sm font-semibold text-text-primary truncate">{municipality.name}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {gemeindeNav.map((item) => (
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
      </nav>

      {/* Bottom: Collapse */}
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
