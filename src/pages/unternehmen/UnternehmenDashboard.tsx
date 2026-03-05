import { Link } from 'react-router-dom'
import {
  Building2, ShieldAlert, Scale, BarChart3, Flame, Users,
  CalendarCheck, Clock, AlertTriangle,
  ArrowRight, Link2, MapPin, Shield, Package,
} from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { useOrganizationSites } from '@/hooks/useOrganizationSites'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useCompliance } from '@/hooks/useCompliance'
import { useBusinessProcesses } from '@/hooks/useBusinessProcesses'
import { useExercises } from '@/hooks/useExercises'
import { useSupplyDependencies } from '@/hooks/useSupplyDependencies'
import { DEFAULT_FRAMEWORK_TEMPLATES } from '@/data/compliance-defaults'
import type { DbScenario, DbAlertContact } from '@/types/database'

export default function UnternehmenDashboard() {
  const { organization, organizationId } = useOrganization()
  const { sites } = useOrganizationSites()

  const { data: scenarios } = useSupabaseQuery<DbScenario>(
    (sb) => sb.from('scenarios').select('*').eq('organization_id', organizationId || ''),
    [organizationId]
  )
  const { data: contacts } = useSupabaseQuery<DbAlertContact>(
    (sb) => sb.from('alert_contacts').select('*').eq('organization_id', organizationId || '').eq('is_active', true),
    [organizationId]
  )

  // Enterprise hooks
  const { frameworks } = useCompliance()
  const { stats: biaStats } = useBusinessProcesses()
  const { stats: exerciseStats } = useExercises()
  const { stats: supplyStats } = useSupplyDependencies()

  const stats = [
    {
      label: 'Krisenszenarios',
      value: scenarios?.length ?? 0,
      icon: Flame,
      href: '/unternehmen/szenarien',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Notfallkontakte',
      value: contacts?.length ?? 0,
      icon: Users,
      href: '/unternehmen/alarmierung/kontakte',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Standorte',
      value: sites.length,
      icon: MapPin,
      href: '/unternehmen/standorte',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'IT-Assets',
      value: '—',
      icon: Package,
      href: '/unternehmen/inventar',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  // Build compliance rows from real framework data
  const complianceRows = DEFAULT_FRAMEWORK_TEMPLATES.slice(0, 3).map(template => {
    const fw = frameworks.find(f => f.framework_type === template.framework_type)
    return { label: template.shortLabel, pct: fw?.progress_pct ?? 0 }
  })

  return (
    <div className="space-y-6">
      {/* Header with NIS2/KRITIS badges */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {organization?.name || 'Unternehmen'}
          </h1>
          {organization?.nis2_relevant && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              organization.nis2_category === 'wesentlich'
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              <Shield className="h-3 w-3" />
              NIS2: {organization.nis2_category === 'wesentlich' ? 'Wesentlich' : 'Wichtig'}
            </span>
          )}
          {organization?.kritis_relevant && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              <Building2 className="h-3 w-3" />
              KRITIS
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          Business Continuity Management &mdash; Uebersicht
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            to={stat.href}
            className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary-200 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-3 text-2xl font-extrabold text-text-primary">{stat.value}</p>
            <p className="text-sm text-text-secondary">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Enterprise KPI Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/unternehmen/bia"
          className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary-200 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
              <BarChart3 className="h-5 w-5 text-violet-600" />
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-text-primary">{biaStats.total}</p>
          <p className="text-sm text-text-secondary">Geschaeftsprozesse</p>
          {biaStats.kritisch > 0 && (
            <p className="mt-0.5 text-xs text-red-600">{biaStats.kritisch} kritisch</p>
          )}
        </Link>
        <Link
          to="/unternehmen/lieferketten"
          className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary-200 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
              <Link2 className="h-5 w-5 text-cyan-600" />
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-text-primary">{supplyStats.total}</p>
          <p className="text-sm text-text-secondary">Lieferabhaengigkeiten</p>
          {supplyStats.kritisch > 0 && (
            <p className="mt-0.5 text-xs text-red-600">{supplyStats.kritisch} kritisch</p>
          )}
        </Link>
        <Link
          to="/unternehmen/uebungen"
          className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary-200 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <CalendarCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-text-primary">{exerciseStats.total}</p>
          <p className="text-sm text-text-secondary">Uebungen</p>
          {exerciseStats.geplant > 0 && (
            <p className="mt-0.5 text-xs text-blue-600">{exerciseStats.geplant} geplant</p>
          )}
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Compliance Status */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-bold text-text-primary">Compliance-Status</h3>
          </div>
          <div className="space-y-3">
            {complianceRows.map(row => (
              <ComplianceRow key={row.label} label={row.label} pct={row.pct} />
            ))}
          </div>
          <Link
            to="/unternehmen/compliance"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            Compliance verwalten <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Naechste Schritte */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-text-primary">Naechste Schritte</h3>
          </div>
          <ul className="space-y-2.5">
            <NextStep
              label="Standorte erfassen"
              href="/unternehmen/standorte"
              icon={MapPin}
            />
            <NextStep
              label="Business Impact Analysis erstellen"
              href="/unternehmen/bia"
              icon={BarChart3}
            />
            <NextStep
              label="Krisenszenarios definieren"
              href="/unternehmen/szenarien"
              icon={Flame}
            />
            <NextStep
              label="Notfallkontakte hinterlegen"
              href="/unternehmen/alarmierung/kontakte"
              icon={Users}
            />
          </ul>
        </div>

        {/* Regulatorische Fristen */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold text-text-primary">Regulatorische Fristen</h3>
          </div>
          <div className="space-y-3">
            <FristItem
              label="NIS2-Registrierung"
              date="Abgelaufen (06.03.2026)"
              urgent
            />
            <FristItem
              label="KRITIS-DachG Registrierung"
              date="Juli 2026"
              urgent
            />
            <FristItem
              label="Resilienzplan Umsetzung"
              date="April 2027"
            />
            <FristItem
              label="BSI-KritisV Versorgungsgrad"
              date="31.03. jaehrlich"
            />
          </div>
        </div>
      </div>

      {/* Module-Uebersicht */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-text-primary">Module</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ModuleCard
            icon={BarChart3}
            label="Business Impact"
            desc="Kritische Prozesse & Ausfallzeiten"
            href="/unternehmen/bia"
            color="text-violet-600"
            bg="bg-violet-50"
          />
          <ModuleCard
            icon={Link2}
            label="Lieferketten"
            desc="Abhaengigkeiten & Alternativen"
            href="/unternehmen/lieferketten"
            color="text-cyan-600"
            bg="bg-cyan-50"
          />
          <ModuleCard
            icon={CalendarCheck}
            label="Uebungen"
            desc="Krisentraining planen & auswerten"
            href="/unternehmen/uebungen"
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <ModuleCard
            icon={ShieldAlert}
            label="Risikoanalyse"
            desc="Business-Risikobewertung"
            href="/unternehmen/risikoanalyse"
            color="text-orange-600"
            bg="bg-orange-50"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Sub-Components ──────────────────────────────────

function ComplianceRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-text-secondary">{label}</span>
        <span className="font-bold text-text-primary">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'
          }`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  )
}

function NextStep({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) {
  return (
    <li>
      <Link
        to={href}
        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
      >
        <Icon className="h-4 w-4 shrink-0 text-text-muted" />
        {label}
      </Link>
    </li>
  )
}

function FristItem({ label, date, urgent }: { label: string; date: string; urgent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-xs font-semibold ${urgent ? 'text-red-600' : 'text-text-muted'}`}>
        {date}
      </span>
    </div>
  )
}

function ModuleCard({ icon: Icon, label, desc, href, color, bg }: {
  icon: React.ElementType; label: string; desc: string; href: string; color: string; bg: string
}) {
  return (
    <Link
      to={href}
      className="group flex items-start gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary-200 hover:shadow-sm"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{desc}</p>
      </div>
    </Link>
  )
}
