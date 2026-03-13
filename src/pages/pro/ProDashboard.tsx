import { useState, useEffect } from 'react'
import {
  Users, MapPin, Building2, AlertTriangle, Flame, Package, Bell, Landmark,
  ClipboardList, ChevronRight, ChevronDown, Loader2, TrendingUp, ShieldAlert,
  CheckCircle2, CircleAlert, CircleDot, ArrowRight, RefreshCw, CloudSun, ExternalLink,
  Zap, Radio, X, Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCrisis } from '@/contexts/CrisisContext'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import MapView, { type MapMarker } from '@/components/ui/MapView'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useWarnings } from '@/hooks/useWarnings'
import { SECTOR_CONFIG, getSector } from '@/data/sector-config'
import type { DbMunicipality, DbScenario, DbInventoryItem, DbChecklist, DbAlertContact, DbKritisSite } from '@/types/database'
import { matchWarningsToScenarios, type WarningScenarioMatch } from '@/utils/warning-scenario-mapping'
import { BBK_BENCHMARKS, getBenchmarkStatus, getStateAverage, NATIONAL_AVERAGE } from '@/data/bbk-benchmarks'

// ─── Helpers ─────────────────────────────────────────

function riskColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#f59e0b'
  return '#22c55e'
}

function riskBg(score: number): string {
  if (score >= 70) return 'bg-red-50 text-red-700'
  if (score >= 40) return 'bg-amber-50 text-amber-700'
  return 'bg-green-50 text-green-700'
}

function riskLevelLabel(level: string | null): string {
  if (!level) return ''
  const map: Record<string, string> = { niedrig: 'Niedrig', mittel: 'Mittel', erhöht: 'Erhöht', hoch: 'Hoch', extrem: 'Extrem' }
  return map[level] || level
}

// ─── Main Component ──────────────────────────────────

export default function ProDashboard() {
  const { district, districtId, loading: districtLoading } = useDistrict()
  const { isActive: crisisActive, scenarioTitle: crisisScenarioTitle } = useCrisis()
  const [showAllGemeinden, setShowAllGemeinden] = useState(false)

  // ─── Welcome-Card (nächste Schritte) ────────────────
  const [showWelcome, setShowWelcome] = useState(false)
  useEffect(() => {
    if (!district) return
    const dismissed = localStorage.getItem(`welcome-dismissed-${districtId}`)
    if (dismissed) return
    // Zeige nur wenn District in den letzten 7 Tagen erstellt wurde
    const created = new Date(district.created_at || 0)
    const daysSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation <= 7) setShowWelcome(true)
  }, [district, districtId])

  const dismissWelcome = () => {
    setShowWelcome(false)
    localStorage.setItem(`welcome-dismissed-${districtId}`, '1')
  }

  // ─── Queries ─────────────────────────────────────

  const { data: municipalities, loading: munLoading } = useSupabaseQuery<DbMunicipality>(
    (sb) =>
      sb
        .from('municipalities')
        .select('*')
        .eq('district_id', districtId!)
        .order('name'),
    [districtId]
  )

  const { data: scenarios, loading: scenLoading } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('district_id', districtId!),
    [districtId]
  )

  const { data: inventory, loading: invLoading } = useSupabaseQuery<DbInventoryItem>(
    (sb) =>
      sb
        .from('inventory_items')
        .select('*')
        .eq('district_id', districtId!),
    [districtId]
  )

  const { data: extrassChecklists, loading: checkLoading } = useSupabaseQuery<DbChecklist>(
    (sb) =>
      sb
        .from('checklists')
        .select('id, items, title')
        .eq('district_id', districtId!)
        .eq('category', 'vorbereitung')
        .is('scenario_id', null),
    [districtId]
  )

  const { data: contacts, loading: contactsLoading } = useSupabaseQuery<DbAlertContact>(
    (sb) =>
      sb
        .from('alert_contacts')
        .select('id, groups')
        .eq('district_id', districtId!)
        .eq('is_active', true),
    [districtId]
  )

  const { data: kritisSites, loading: kritisLoading } = useSupabaseQuery<DbKritisSite>(
    (sb) =>
      sb
        .from('kritis_sites')
        .select('id, municipality_id, category, sector, risk_exposure')
        .eq('district_id', districtId!),
    [districtId]
  )

  const { warnings } = useWarnings(districtId)

  // ─── Warnung → Szenario-Empfehlung (mit Gemeinde-Zuordnung) ──
  const warningMatches: WarningScenarioMatch[] = warnings.length > 0 && scenarios.length > 0
    ? matchWarningsToScenarios(warnings, scenarios, municipalities).slice(0, 3)
    : []

  // ─── Loading State ───────────────────────────────

  if (districtLoading || munLoading || scenLoading || invLoading || checkLoading || contactsLoading || kritisLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // ─── Computed Values ─────────────────────────────

  // Inventar
  const totalTarget = inventory.reduce((sum, i) => sum + i.target_quantity, 0)
  const totalCurrent = inventory.reduce((sum, i) => sum + i.current_quantity, 0)
  const inventoryCoverage = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0

  // Vorbereitung
  const scenariosWithHandbook = scenarios.filter((s) => s.is_handbook_generated).length

  // ExTrass-Fortschritt: done=100%, partial=50%, rest=0%
  const extrassItems = extrassChecklists.flatMap(c => c.items || [])
  const extrassDone = extrassItems.filter(i => i.status === 'done').length
  const extrassPartial = extrassItems.filter(i => i.status === 'partial').length
  const extrassPct = extrassItems.length > 0
    ? Math.round(((extrassDone + extrassPartial * 0.5) / extrassItems.length) * 100)
    : 0

  // Kontakte / Alarmierung
  const contactGroups = new Set<string>()
  contacts.forEach((c) => (c.groups || []).forEach((g: string) => contactGroups.add(g)))
  const hasContacts = contacts.length > 0
  const hasContactGroups = contactGroups.size > 0

  // ─── Gesamtstatus-Score (0–100) ────────────────
  const handbookPct = scenarios.length > 0 ? (scenariosWithHandbook / scenarios.length) * 100 : 0
  const contactPct = hasContacts && hasContactGroups ? 100 : hasContacts ? 50 : 0
  const prepScore = Math.round(
    handbookPct * 0.3 + extrassPct * 0.25 + Math.min(inventoryCoverage, 100) * 0.25 + contactPct * 0.2
  )
  const prepLabel = prepScore >= 75 ? 'Gut vorbereitet' : prepScore >= 50 ? 'Teilweise vorbereitet' : 'Handlungsbedarf'
  const prepColor = prepScore >= 75 ? 'green' : prepScore >= 50 ? 'amber' : 'red'

  // ─── Handlungsbedarf (dynamisch) ───────────────
  const todos: { text: string; href: string; priority: 'high' | 'medium' | 'low' }[] = []

  const scenariosWithout = scenarios.length - scenariosWithHandbook
  if (scenariosWithout > 0) {
    todos.push({
      text: `KI-Handbuch generieren für ${scenariosWithout} Szenario${scenariosWithout > 1 ? 'en' : ''} (~2 Min.)`,
      href: '/pro/szenarien',
      priority: scenariosWithout > 3 ? 'high' : 'medium',
    })
  }
  if (extrassChecklists.length === 0) {
    todos.push({ text: 'ExTrass-Checklisten erstellen (18 Kategorien, ~5 Min.)', href: '/pro/vorbereitung', priority: 'high' })
  } else if (extrassPct < 50) {
    todos.push({ text: `ExTrass weiter ausfüllen — aktuell ${extrassPct}%`, href: '/pro/vorbereitung', priority: 'high' })
  } else if (extrassPct < 80) {
    todos.push({ text: `ExTrass weiter ausfüllen — aktuell ${extrassPct}%`, href: '/pro/vorbereitung', priority: 'medium' })
  }
  if (inventoryCoverage < 50) {
    todos.push({ text: `Inventar auffüllen — ${inventoryCoverage}% Abdeckung`, href: '/pro/inventar', priority: 'high' })
  } else if (inventoryCoverage < 80) {
    todos.push({ text: `Inventar auffüllen — ${inventoryCoverage}% Abdeckung`, href: '/pro/inventar', priority: 'medium' })
  }
  if (!hasContacts) {
    todos.push({ text: 'Alarmkontakte anlegen für Krisenstab', href: '/pro/alarmierung', priority: 'high' })
  } else if (!hasContactGroups) {
    todos.push({ text: 'Kontaktgruppen einrichten für Alarmierung', href: '/pro/alarmierung', priority: 'medium' })
  }
  if (warnings.length > 0 && warningMatches.length === 0) {
    todos.push({
      text: `${warnings.length} aktive Warnung${warnings.length > 1 ? 'en' : ''} prüfen`,
      href: '/pro/risikoanalyse',
      priority: warnings.length >= 3 ? 'high' : 'low',
    })
  }
  const prioOrder = { high: 0, medium: 1, low: 2 }
  todos.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority])

  // ─── Auto-Refresh Timestamp ──────────────────
  const lastRefresh = district?.last_auto_refresh
    ? new Date(district.last_auto_refresh).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  // ─── KRITIS per Gemeinde ───────────────────────
  const munKritis = new Map<string, { total: number; sectors: string[]; highRisk: number }>()
  for (const site of kritisSites) {
    if (!site.municipality_id) continue
    let entry = munKritis.get(site.municipality_id)
    if (!entry) {
      entry = { total: 0, sectors: [], highRisk: 0 }
      munKritis.set(site.municipality_id, entry)
    }
    entry.total++
    const sec = getSector(site)
    if (!entry.sectors.includes(sec)) entry.sectors.push(sec)
    if (site.risk_exposure === 'hoch' || site.risk_exposure === 'extrem') entry.highRisk++
  }

  // Gemeinden-Statistiken
  const avgRisk = municipalities.length > 0
    ? Math.round(municipalities.reduce((sum, m) => sum + m.risk_score, 0) / municipalities.length)
    : 0
  const highRiskCount = municipalities.filter((m) => m.risk_score >= 60).length
  const midRiskCount = municipalities.filter((m) => m.risk_score >= 35 && m.risk_score < 60).length
  const lowRiskCount = municipalities.filter((m) => m.risk_score < 35).length

  // Alle Gemeinden sortiert nach Risiko
  const sortedGemeinden = [...municipalities].sort((a, b) => b.risk_score - a.risk_score)
  const INITIAL_SHOW = 15
  const visibleGemeinden = showAllGemeinden ? sortedGemeinden : sortedGemeinden.slice(0, INITIAL_SHOW)

  // Map Markers
  const gemeindenMarkers: MapMarker[] = municipalities
    .filter((m) => m.latitude && m.longitude)
    .map((m) => ({
      id: m.id,
      lng: m.longitude,
      lat: m.latitude,
      label: m.name,
      color: riskColor(m.risk_score),
      popup: `<div style="font-family:'Plus Jakarta Sans',sans-serif">
        <strong style="font-size:14px">${m.name}</strong>
        <div style="margin:6px 0;display:flex;gap:12px;font-size:12px;color:#64748b">
          <span>${m.population.toLocaleString('de-DE')} Einw.</span>
          <span>Risiko: ${m.risk_score}/100</span>
        </div>
        <a href="/pro/gemeinden/${m.id}" style="font-size:12px;color:#2563eb;text-decoration:none;font-weight:600">Details anzeigen &rarr;</a>
      </div>`,
    }))

  // ─── Render ──────────────────────────────────────

  return (
    <div>
      {/* Krisenbanner wenn aktiv */}
      {crisisActive && (
        <Link
          to="/pro/lagezentrum"
          className="mb-6 flex items-center justify-between rounded-2xl border-2 border-red-600 bg-red-900/90 p-4 transition-colors hover:bg-red-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-100">KRISENFALL AKTIV</p>
              <p className="text-xs text-red-300">{crisisScenarioTitle || 'Unbekanntes Szenario'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-red-200">
            <Radio className="h-4 w-4" />
            Zum Lagezentrum →
          </div>
        </Link>
      )}

      <PageHeader
        title={`Landkreis ${district?.name || ''}`}
        description="Geografische Übersicht, Gemeinden und Vorbereitungsstatus."
        badge={district?.state || 'Landkreis'}
      />

      {/* ── Welcome-Card: Empfohlene nächste Schritte ── */}
      {showWelcome && (
        <div className="mb-6 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-50/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h3 className="font-bold text-text-primary">Willkommen! Empfohlene nächste Schritte</h3>
            </div>
            <button
              onClick={dismissWelcome}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white hover:text-text-primary"
              title="Ausblenden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              to="/pro/risikoanalyse"
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition-all hover:border-primary-200 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">1</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Risikoanalyse prüfen</p>
                <p className="text-xs text-text-muted">KI hat Risiken für Ihren Landkreis analysiert.</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
            </Link>
            <Link
              to="/pro/szenarien"
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition-all hover:border-primary-200 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">2</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Krisenszenarien anpassen</p>
                <p className="text-xs text-text-muted">KI-Handbücher prüfen und an Gegebenheiten anpassen.</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
            </Link>
            <Link
              to="/pro/alarmierung/kontakte"
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition-all hover:border-primary-200 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">3</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Kontaktverzeichnis aufbauen</p>
                <p className="text-xs text-text-muted">Einsatzleiter, Behörden und Hilfsorganisationen eintragen.</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
            </Link>
            <Link
              to="/pro/inventar"
              className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition-all hover:border-primary-200 hover:shadow-sm"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">4</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">Inventar aktualisieren</p>
                <p className="text-xs text-text-muted">Tatsächliche Bestände mit KI-Empfehlungen abgleichen.</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Krisenvorsorge-Strip (4 Cards) ──────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Card 1: Gesamtstatus */}
        <div className={`rounded-2xl border p-6 ${
          prepColor === 'green' ? 'border-green-200 bg-green-50'
            : prepColor === 'amber' ? 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className={`h-5 w-5 ${
              prepColor === 'green' ? 'text-green-600' : prepColor === 'amber' ? 'text-amber-600' : 'text-red-600'
            }`} />
            <h3 className={`font-bold ${
              prepColor === 'green' ? 'text-green-900' : prepColor === 'amber' ? 'text-amber-900' : 'text-red-900'
            }`}>Krisenvorsorge</h3>
          </div>

          <div className="mb-4 flex items-center gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <path
                  d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={prepColor === 'green' ? 'text-green-200' : prepColor === 'amber' ? 'text-amber-200' : 'text-red-200'}
                />
                <path
                  d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${prepScore}, 100`}
                  strokeLinecap="round"
                  className={prepColor === 'green' ? 'text-green-500' : prepColor === 'amber' ? 'text-amber-500' : 'text-red-500'}
                />
              </svg>
              <span className={`absolute text-xl font-bold ${
                prepColor === 'green' ? 'text-green-700' : prepColor === 'amber' ? 'text-amber-700' : 'text-red-700'
              }`}>{prepScore}</span>
            </div>
            <div>
              <p className={`text-lg font-bold ${
                prepColor === 'green' ? 'text-green-900' : prepColor === 'amber' ? 'text-amber-900' : 'text-red-900'
              }`}>{prepLabel}</p>
              <p className={`text-xs ${
                prepColor === 'green' ? 'text-green-700' : prepColor === 'amber' ? 'text-amber-700' : 'text-red-700'
              }`}>Gesamtbewertung der Krisenvorsorge</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Krisenhandbücher', pct: Math.round(handbookPct) },
              { label: 'Vorbereitung (ExTrass)', pct: extrassPct },
              { label: 'Inventar', pct: Math.min(inventoryCoverage, 100) },
              { label: 'Alarmierung', pct: Math.round(contactPct) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-28 text-xs font-medium ${
                  prepColor === 'green' ? 'text-green-800' : prepColor === 'amber' ? 'text-amber-800' : 'text-red-800'
                }`}>{item.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/60">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.pct >= 75 ? 'bg-green-500' : item.pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className={`w-8 text-right text-xs font-bold ${
                  prepColor === 'green' ? 'text-green-700' : prepColor === 'amber' ? 'text-amber-700' : 'text-red-700'
                }`}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Handlungsbedarf */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-text-primary">Handlungsbedarf</h3>
          </div>

          {/* Warnung → Szenario-Empfehlungen (mit betroffenen Gemeinden) */}
          {warningMatches.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {warningMatches.map((match, i) => {
                const muns = match.affectedMunicipalities
                const showMuns = muns.slice(0, 3)
                const moreMuns = muns.length > 3 ? muns.length - 3 : 0
                return (
                  <Link
                    key={i}
                    to={`/pro/szenarien/${match.matchedScenarios[0]?.id}`}
                    className="block rounded-xl bg-amber-50 px-3 py-2.5 transition-colors hover:bg-amber-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span className="flex-1 text-sm text-amber-900">
                        <span className="font-medium">{match.warning.title || 'Warnung'}</span>
                        {' → Szenario '}
                        <span className="font-semibold">„{match.matchedScenarios[0]?.title}"</span>
                        {' prüfen'}
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        match.confidence === 'hoch' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{match.confidence}</span>
                    </div>
                    {showMuns.length > 0 && (
                      <p className="mt-1 ml-6.5 text-xs text-amber-700">
                        Betroffene Gemeinden: {showMuns.join(', ')}
                        {moreMuns > 0 && <span className="text-amber-500"> +{moreMuns} weitere</span>}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {todos.length === 0 && warningMatches.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Alles erledigt</p>
                <p className="text-xs text-green-700">Keine offenen Maßnahmen.</p>
              </div>
            </div>
          ) : todos.length > 0 ? (
            <div className="space-y-2">
              {todos.slice(0, 6).map((todo, i) => (
                <Link
                  key={i}
                  to={todo.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-secondary"
                >
                  <CircleDot className={`h-4 w-4 shrink-0 ${
                    todo.priority === 'high' ? 'text-red-500' : todo.priority === 'medium' ? 'text-amber-500' : 'text-blue-400'
                  }`} />
                  <span className="flex-1 text-sm text-text-secondary">{todo.text}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Card 3: Bereiche kompakt */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-text-primary">Bereiche</h3>
          </div>

          <div className="space-y-4">
            <Link to="/pro/szenarien" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Flame className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary group-hover:text-primary-600">Szenarien</span>
                  <span className="text-sm font-bold text-text-primary">{scenariosWithHandbook}/{scenarios.length}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${scenarios.length > 0 ? (scenariosWithHandbook / scenarios.length) * 100 : 0}%` }} />
                </div>
              </div>
            </Link>

            <Link to="/pro/checklisten" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary group-hover:text-primary-600">Vorbereitung (ExTrass)</span>
                  <span className="text-sm font-bold text-text-primary">{extrassPct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${extrassPct}%` }} />
                </div>
              </div>
            </Link>

            <Link to="/pro/inventar" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary group-hover:text-primary-600">Inventar</span>
                  <span className="text-sm font-bold text-text-primary">{inventoryCoverage}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div className={`h-full rounded-full transition-all ${inventoryCoverage >= 80 ? 'bg-green-500' : inventoryCoverage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(inventoryCoverage, 100)}%` }} />
                </div>
              </div>
            </Link>

            <Link to="/pro/alarmierung" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary group-hover:text-primary-600">Alarmierung</span>
                  <span className="text-sm font-bold text-text-primary">{contacts.length} Kontakte</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                  <div className={`h-full rounded-full transition-all ${hasContacts && hasContactGroups ? 'bg-green-500' : hasContacts ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${contactPct}%` }} />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Card 4: Wetter & Warnlage */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-text-primary">Wetter & Warnlage</h3>
          </div>

          {/* Aktuelle Warnungen Summary */}
          <div className={`mb-4 rounded-xl p-3 ${
            warnings.length >= 3 ? 'bg-red-50' : warnings.length > 0 ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                warnings.length >= 3 ? 'text-red-600' : warnings.length > 0 ? 'text-amber-600' : 'text-green-600'
              }`} />
              <span className={`text-sm font-bold ${
                warnings.length >= 3 ? 'text-red-900' : warnings.length > 0 ? 'text-amber-900' : 'text-green-900'
              }`}>
                {warnings.length === 0 ? 'Keine Warnungen' : `${warnings.length} aktive Warnung${warnings.length > 1 ? 'en' : ''}`}
              </span>
            </div>
          </div>

          {/* Wetterdienst-Links */}
          <div className="space-y-2">
            <a
              href="https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CloudSun className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 font-medium">DWD Warnungen</span>
              <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
            </a>
            <a
              href="https://warnung.bund.de/meldungen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 font-medium">NINA Warnungen</span>
              <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
            </a>
            <a
              href="https://www.hochwasserzentralen.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 15c6.667-6 13.333 0 20-6" /><path d="M2 21c6.667-6 13.333 0 20-6" />
                </svg>
              </div>
              <span className="flex-1 font-medium">Hochwasserlage</span>
              <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
            </a>
          </div>
        </div>
      </div>

      {/* ── BBK-Richtwerte + Kommunaler Benchmark ──────── */}
      {(() => {
        const stateAvg = getStateAverage(district?.state || '')
        const natAvg = NATIONAL_AVERAGE
        const benchmarkValues: Record<string, number> = {
          szenarien: scenarios.length,
          handbuecher: scenariosWithHandbook,
          inventarAbdeckung: inventoryCoverage,
          alarmkontakte: contacts.length,
          checklistenFortschritt: extrassPct,
        }
        const stateValues: Record<string, number> = {
          szenarien: stateAvg.szenarien,
          handbuecher: stateAvg.handbuecher,
          inventarAbdeckung: stateAvg.inventarAbdeckung,
          alarmkontakte: stateAvg.alarmkontakte,
          checklistenFortschritt: stateAvg.extrassPct,
        }
        const natValues: Record<string, number> = {
          szenarien: natAvg.szenarien,
          handbuecher: natAvg.handbuecher,
          inventarAbdeckung: natAvg.inventarAbdeckung,
          alarmkontakte: natAvg.alarmkontakte,
          checklistenFortschritt: natAvg.extrassPct,
        }
        const stateName = district?.state || 'Bundesland'
        const ownBetter = prepScore > stateAvg.prepScore

        return (
          <div className="mb-6 rounded-2xl border border-border bg-white p-5">
            {/* Header mit Gesamtvergleich */}
            <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-bold text-text-primary">Kommunaler Benchmark</h3>
              </div>
              {/* Vergleichs-Werte */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-bold ${
                    prepColor === 'green' ? 'text-green-600' : prepColor === 'amber' ? 'text-amber-600' : 'text-red-600'
                  }`}>{prepScore}%</span>
                  <span className="text-xs text-text-muted">Ihr Landkreis</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-text-secondary">{stateAvg.prepScore}%</span>
                  <span className="text-xs text-text-muted">Ø {stateName}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-text-secondary">{natAvg.prepScore}%</span>
                  <span className="text-xs text-text-muted">Ø Deutschland</span>
                </div>
              </div>
              {ownBetter && (
                <span className="rounded-lg bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                  +{prepScore - stateAvg.prepScore} über Landesdurchschnitt
                </span>
              )}
            </div>

            {/* Benchmark-Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {BBK_BENCHMARKS.map((bm) => {
                const value = benchmarkValues[bm.key] ?? 0
                const stateVal = stateValues[bm.key] ?? 0
                const natVal = natValues[bm.key] ?? 0
                const status = getBenchmarkStatus(value, bm)
                const pct = Math.min(Math.round((value / bm.empfohlen) * 100), 120)
                const minPct = Math.round((bm.minimum / bm.empfohlen) * 100)
                const statePct = Math.min(Math.round((stateVal / bm.empfohlen) * 100), 100)
                const natPct = Math.min(Math.round((natVal / bm.empfohlen) * 100), 100)
                return (
                  <div key={bm.key} className="rounded-xl bg-surface-secondary p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-text-secondary">{bm.label}</span>
                      <span className={`text-xs font-bold ${
                        status === 'erfuellt' ? 'text-green-600'
                          : status === 'ausbaufaehig' ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                        {value}{bm.unit || ''}
                      </span>
                    </div>
                    {/* Balken mit Markierungen */}
                    <div className="relative h-2 overflow-visible rounded-full bg-white">
                      <div
                        className={`h-full rounded-full transition-all ${
                          status === 'erfuellt' ? 'bg-green-500'
                            : status === 'ausbaufaehig' ? 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                      {/* Minimum-Markierung */}
                      <div
                        className="absolute top-[-2px] h-[calc(100%+4px)] w-[2px] bg-red-300"
                        style={{ left: `${minPct}%` }}
                        title={`Minimum: ${bm.minimum}${bm.unit || ''}`}
                      />
                      {/* Landes-Ø Markierung */}
                      <div
                        className="absolute top-[-3px] h-[calc(100%+6px)] w-[2px] bg-blue-400"
                        style={{ left: `${statePct}%` }}
                        title={`Ø ${stateName}: ${stateVal}${bm.unit || ''}`}
                      />
                      {/* Bundes-Ø Markierung */}
                      <div
                        className="absolute top-[-3px] h-[calc(100%+6px)] w-[2px] bg-slate-400"
                        style={{ left: `${natPct}%` }}
                        title={`Ø Deutschland: ${natVal}${bm.unit || ''}`}
                      />
                      {/* Empfohlen-Markierung */}
                      <div
                        className="absolute top-[-2px] h-[calc(100%+4px)] w-[2px] bg-green-400"
                        style={{ left: '100%' }}
                        title={`Empfohlen: ${bm.empfohlen}${bm.unit || ''}`}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-text-muted">
                      <span>{bm.minimum}{bm.unit || ''} Min.</span>
                      <span>{bm.empfohlen}{bm.unit || ''} Empf.</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Legende */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-300" />Minimum</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-400" />Empfohlen</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-400" />Ø {stateName}</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-slate-400" />Ø Deutschland</span>
            </div>
          </div>
        )
      })()}

      {/* ── Kompakte Eckdaten-Leiste ───────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border border-border bg-white px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">Einwohner</span>
          <span className="font-bold text-text-primary">{district?.population?.toLocaleString('de-DE') || '–'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">Fläche</span>
          <span className="font-bold text-text-primary">{Math.round(district?.area_km2 || 0)} km²</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">Gemeinden</span>
          <span className="font-bold text-text-primary">{municipalities.length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Landmark className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">KRITIS-Objekte</span>
          <span className="font-bold text-text-primary">{kritisSites.length}</span>
        </div>
        {warnings.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-amber-700">{warnings.length} aktive Warnung{warnings.length > 1 ? 'en' : ''}</span>
          </div>
        )}
        {lastRefresh && (
          <div className="flex items-center gap-2 text-sm ml-auto">
            <RefreshCw className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-text-muted">Aktualisiert: {lastRefresh}</span>
          </div>
        )}
      </div>

      {/* ── Gemeinden-Karte ────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary">Gemeinden-Karte</h2>
            <Badge variant="info">{municipalities.length} Gemeinden</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />Niedrig
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />Mittel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />Hoch
            </span>
          </div>
        </div>
        <MapView
          height="500px"
          markers={gemeindenMarkers}
          center={district?.longitude && district?.latitude ? [district.longitude, district.latitude] : undefined}
          zoom={10}
          fallbackTitle="Karte wird geladen..."
          fallbackDescription="Interaktive Karte aller Gemeinden im Landkreis."
          showControls
        />
      </div>

      {/* ── Gemeinden-Übersicht ────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white">

        {/* Kompakter Risiko-Header */}
        <div className="flex flex-wrap items-center gap-4 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-bold text-text-primary">Gemeinden-Übersicht</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-secondary px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">Ø {avgRisk}/100</span>
          </div>
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-3 min-w-[120px] flex-1 overflow-hidden rounded-full bg-surface-secondary">
              {municipalities.length > 0 && (
                <>
                  {lowRiskCount > 0 && <div className="bg-green-500" style={{ width: `${(lowRiskCount / municipalities.length) * 100}%` }} />}
                  {midRiskCount > 0 && <div className="bg-amber-500" style={{ width: `${(midRiskCount / municipalities.length) * 100}%` }} />}
                  {highRiskCount > 0 && <div className="bg-red-500" style={{ width: `${(highRiskCount / municipalities.length) * 100}%` }} />}
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>{lowRiskCount} Niedrig</span>
              <span>{midRiskCount} Mittel</span>
              <span>{highRiskCount} Hoch</span>
            </div>
          </div>
        </div>

        {/* Tabellen-Header */}
        <div className="hidden items-center gap-4 border-b border-border px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-text-muted md:flex">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Gemeinde</span>
          <span className="w-24 text-right">Einwohner</span>
          <span className="w-20 text-right">KRITIS</span>
          <span className="hidden w-44 lg:block">Sektoren</span>
          <span className="w-16 text-right">Risiko</span>
          <span className="w-6" />
        </div>

        {/* Gemeinden-Zeilen */}
        <div className="divide-y divide-border">
          {visibleGemeinden.map((g, i) => {
            const kritis = munKritis.get(g.id)
            const borderClass = g.risk_score >= 70
              ? 'border-l-[3px] border-l-red-500'
              : g.risk_score >= 50 && (kritis?.highRisk ?? 0) >= 3
                ? 'border-l-[3px] border-l-amber-500'
                : 'border-l-[3px] border-l-transparent'

            return (
              <Link
                key={g.id}
                to={`/pro/gemeinden/${g.id}`}
                className={`flex items-center gap-4 px-6 py-3 transition-colors hover:bg-surface-secondary ${borderClass}`}
              >
                {/* Rang */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-xs font-bold text-text-muted md:h-7 md:w-7">
                  {i + 1}
                </span>

                {/* Name + Risikostufe */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{g.name}</p>
                  {g.risk_level && (
                    <p className="text-xs text-text-muted">{riskLevelLabel(g.risk_level)}</p>
                  )}
                </div>

                {/* Einwohner */}
                <span className="hidden w-24 text-right text-sm tabular-nums text-text-secondary md:block">
                  {g.population.toLocaleString('de-DE')}
                </span>

                {/* KRITIS */}
                <div className="hidden w-20 text-right md:block">
                  {kritis && kritis.total > 0 ? (
                    <div>
                      <span className="text-sm font-bold text-text-primary">{kritis.total}</span>
                      {kritis.highRisk > 0 && (
                        <span className="ml-1 text-xs font-medium text-red-600">({kritis.highRisk} krit.)</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">Keine</span>
                  )}
                </div>

                {/* Sektoren Icons */}
                <div className="hidden w-44 lg:flex lg:items-center lg:gap-1">
                  {kritis && kritis.sectors.length > 0 ? (
                    <>
                      {kritis.sectors.slice(0, 5).map((secKey) => {
                        const sec = SECTOR_CONFIG.find((s) => s.key === secKey)
                        if (!sec) return null
                        const Icon = sec.icon
                        return (
                          <div
                            key={secKey}
                            title={sec.label}
                            className={`flex h-6 w-6 items-center justify-center rounded-md ${sec.bg} ${sec.color}`}
                          >
                            <Icon className="h-3 w-3" />
                          </div>
                        )
                      })}
                      {kritis.sectors.length > 5 && (
                        <span className="text-xs text-text-muted">+{kritis.sectors.length - 5}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </div>

                {/* Risiko-Badge */}
                <span className={`w-16 rounded-lg px-2 py-0.5 text-center text-xs font-bold ${riskBg(g.risk_score)}`}>
                  {g.risk_score}
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
              </Link>
            )
          })}
        </div>

        {/* Footer: Expand / Link */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          {sortedGemeinden.length > INITIAL_SHOW && !showAllGemeinden ? (
            <button
              onClick={() => setShowAllGemeinden(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <ChevronDown className="h-4 w-4" />
              Alle {sortedGemeinden.length} Gemeinden anzeigen
            </button>
          ) : (
            <span />
          )}
          <Link
            to="/pro/gemeinden"
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Zur Gemeinden-Verwaltung <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
