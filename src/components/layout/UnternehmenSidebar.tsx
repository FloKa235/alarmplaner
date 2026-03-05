import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  Building2,
  MapPin,
  ShieldAlert,
  BarChart3,
  Link2,
  Flame,
  BookOpen,
  ShieldCheck,
  Scale,
  FileCheck,
  Bell,
  Users,
  Shield,
  Package,
  FileText,
  CalendarCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Radio,
  Clock,
} from 'lucide-react'
import clsx from 'clsx'
import { useEnterpriseCrisis, stufeLabelMap } from '@/contexts/EnterpriseCrisisContext'
import KrisenaktivierungsModal from '@/components/crisis/KrisenaktivierungsModal'
import KrisenbeendenModal from '@/components/crisis/KrisenbeendenModal'

// ─── Navigation Groups ──────────────────────────────
const navSections = [
  {
    label: 'Organisation',
    items: [
      { label: 'Dashboard', href: '/unternehmen', icon: Building2, end: true },
      { label: 'Standorte', href: '/unternehmen/standorte', icon: MapPin },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { label: 'Risikoanalyse', href: '/unternehmen/risikoanalyse', icon: ShieldAlert },
      { label: 'Business Impact', href: '/unternehmen/bia', icon: BarChart3 },
      { label: 'Lieferketten', href: '/unternehmen/lieferketten', icon: Link2 },
    ],
  },
  {
    label: 'Vorbereitung',
    items: [
      { label: 'Krisenszenarios', href: '/unternehmen/szenarien', icon: Flame },
      { label: 'BCM-Handbuch', href: '/unternehmen/handbuch', icon: BookOpen },
      { label: 'Aufgaben', href: '/unternehmen/vorbereitung', icon: ShieldCheck },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Frameworks', href: '/unternehmen/compliance', icon: Scale },
      { label: 'Audit-Export', href: '/unternehmen/compliance/audit', icon: FileCheck },
    ],
  },
  {
    label: 'Alarmierung',
    items: [
      { label: 'Alarmierung', href: '/unternehmen/alarmierung', icon: Bell },
      { label: 'Kontakte', href: '/unternehmen/alarmierung/kontakte', icon: Users },
      { label: 'Krisenstab', href: '/unternehmen/alarmierung/krisenstab', icon: Shield },
    ],
  },
  {
    label: 'Ressourcen',
    items: [
      { label: 'IT-Assets', href: '/unternehmen/inventar', icon: Package },
      { label: 'Dokumente', href: '/unternehmen/dokumente', icon: FileText },
      { label: 'Uebungen', href: '/unternehmen/uebungen', icon: CalendarCheck },
    ],
  },
]

const crisisNav = [
  { label: 'Lagezentrum', href: '/unternehmen/lagezentrum', icon: Radio },
  { label: 'Timeline', href: '/unternehmen/timeline', icon: Clock },
]

interface UnternehmenSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function UnternehmenSidebar({ collapsed, onToggle }: UnternehmenSidebarProps) {
  const { isActive, stufe } = useEnterpriseCrisis()
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
            <Building2 className="h-5 w-5 text-white" />
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
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  Business
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, idx) => (
            <div key={section.label} className={idx > 0 ? 'mt-5' : ''}>
              {!collapsed && (
                <p className={clsx(
                  'mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider',
                  isActive ? 'text-red-400/60' : 'text-text-muted'
                )}>
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
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
            </div>
          ))}

          {/* Crisis section */}
          {isActive && (
            <div className="mt-5">
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-red-400">
                  Krisenmodus
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

          {/* Einstellungen */}
          <div className="mt-5">
            {collapsed && (
              <div className={clsx(
                'mx-auto my-2 h-px w-8',
                isActive ? 'bg-red-900/50' : 'bg-border'
              )} />
            )}
            <NavLink
              to="/unternehmen/einstellungen"
              className={navLinkClass}
              title={collapsed ? 'Einstellungen' : undefined}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Einstellungen</span>}
            </NavLink>
          </div>
        </nav>

        {/* Bottom: Crisis toggle + Collapse */}
        <div className={clsx(
          'border-t p-3 space-y-2',
          isActive ? 'border-red-900/50' : 'border-border'
        )}>
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

      {showActivateModal && (
        <KrisenaktivierungsModal onClose={() => setShowActivateModal(false)} />
      )}
      {showDeactivateModal && (
        <KrisenbeendenModal onClose={() => setShowDeactivateModal(false)} />
      )}
    </>
  )
}
