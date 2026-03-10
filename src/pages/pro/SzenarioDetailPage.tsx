/**
 * SzenarioDetailPage — Redesign
 *
 * Fokus auf 3 Kernfragen:
 * 1. „Wie gut bin ich vorbereitet?" → Readiness-DonutChart + Lücken
 * 2. „Ist es aktuell kritisch?" → Bedrohungslage + Schweregrad
 * 3. „Was passiert wenn es eintritt?" → Sofortmaßnahmen + Zeitphasen
 */
import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Flame, Sparkles, ArrowLeft, Loader2, AlertTriangle,
  CheckCircle2, Users, Clock, Package, ExternalLink,
  Shield, Zap, Circle, Landmark,
} from 'lucide-react'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useScope } from '@/hooks/useScope'
import { createDefaultEskalationsstufen, ESKALATION_COLORS } from './szenario-detail/helpers/eskalation-defaults'
import { calculateReadiness } from './szenario-detail/helpers/readiness-checks'
import {
  extractRisiko, extractKrisenstabRollen, getSeverityStufe, wkConfig, smConfig,
} from './szenario-detail/helpers/handbook-extract'
import type {
  DbScenario, DbInventoryItem, DbInventoryScenarioLink,
  DbAlertContact, DbChecklist,
  SzenarioMeta, EskalationsStufe, EskalationsStufeNummer,
  ScenarioHandbookV2, ScenarioHandbookV3,
} from '@/types/database'
import { isHandbookV2, isHandbookV3 } from '@/types/database'

// ─── Helpers ────────────────────────────────────────

const SCENARIO_TYPE_LABELS: Record<string, string> = {
  hochwasser: 'Hochwasser', starkregen: 'Starkregen', sturm: 'Sturm/Orkan',
  hitzewelle: 'Hitzewelle', kaeltewelle: 'Kältewelle', waldbrand: 'Waldbrand',
  erdbeben: 'Erdbeben', stromausfall: 'Stromausfall', cyberangriff: 'Cyberangriff',
  pandemie: 'Pandemie', cbrn: 'CBRN-Lage', amoklauf: 'Amoklauf',
  terroranschlag: 'Terroranschlag', sabotage: 'Sabotage', krieg: 'Krieg/Verteidigung',
  Starkregen: 'Starkregen', Sturm: 'Sturm/Orkan', Hitzewelle: 'Hitzewelle',
  Waldbrand: 'Waldbrand', Amoklauf: 'Amoklauf', CBRN: 'CBRN-Lage',
  Cyberangriff: 'Cyberangriff', Krieg: 'Krieg/Verteidigung', Pandemie: 'Pandemie',
  Sabotage: 'Sabotage', Stromausfall: 'Stromausfall', Terroranschlag: 'Terroranschlag',
  // Business-Szenarien
  Ransomware: 'Ransomware-Angriff', Lieferkettenausfall: 'Lieferkettenausfall',
  Rechenzentrumsausfall: 'Rechenzentrumsausfall', Datenschutzvorfall: 'Datenschutzvorfall',
  Personalausfall: 'Personalausfall', Betriebsstoerung: 'Betriebsstoerung',
  Reputationskrise: 'Reputationskrise',
}

/** DB-Typ → TRIGGER_DEFAULTS Key */
const TYPE_TO_TRIGGER: Record<string, string> = {
  starkregen: 'Starkregen', hochwasser: 'Starkregen', sturm: 'Sturm',
  hitzewelle: 'Hitzewelle', kaeltewelle: 'Kältewelle', waldbrand: 'Waldbrand',
  amoklauf: 'Amoklauf', cbrn: 'CBRN', cyberangriff: 'Cyberangriff',
  krieg: 'Krieg', pandemie: 'Pandemie', sabotage: 'Sabotage',
  stromausfall: 'Stromausfall', terroranschlag: 'Terroranschlag',
  Starkregen: 'Starkregen', Hochwasser: 'Starkregen', Sturm: 'Sturm',
  Hitzewelle: 'Hitzewelle', 'Kältewelle': 'Kältewelle', Waldbrand: 'Waldbrand',
  Amoklauf: 'Amoklauf', CBRN: 'CBRN', Cyberangriff: 'Cyberangriff',
  Krieg: 'Krieg', Pandemie: 'Pandemie', Sabotage: 'Sabotage',
  Stromausfall: 'Stromausfall', Terroranschlag: 'Terroranschlag',
}

function getBarColor(pct: number) {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function parseHandbook(raw: unknown): ScenarioHandbookV2 | ScenarioHandbookV3 | null {
  if (!raw) return null
  if (isHandbookV3(raw as any)) return raw as ScenarioHandbookV3
  if (isHandbookV2(raw as any)) return raw as ScenarioHandbookV2
  return null
}

function getEskalationColors(stufe: number) {
  const key = Number(stufe) as EskalationsStufeNummer
  return ESKALATION_COLORS[key] ?? { bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-500', text: 'text-gray-700', headerBg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800', borderB: 'border-b-gray-500' }
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function SzenarioDetailPage() {
  const { id } = useParams()
  const { scopeId, scopeColumn } = useScope()

  // ─── Data Fetching (alle Hooks VOR early returns) ───

  const { data: scenario, loading: scenarioLoading } = useSupabaseSingle<DbScenario>(
    (sb) => sb.from('scenarios').select('*').eq('id', id!).single(),
    [id]
  )

  // Inventar
  const { data: allDistrictItems } = useSupabaseQuery<DbInventoryItem>(
    (sb) => sb.from('inventory_items').select('*').eq(scopeColumn, scopeId || ''),
    [scopeId, scopeColumn]
  )
  const allItemIds = useMemo(() => allDistrictItems.map(i => i.id), [allDistrictItems])
  const { data: scenarioLinks } = useSupabaseQuery<DbInventoryScenarioLink>(
    (sb) => {
      if (allItemIds.length === 0 || !id) return sb.from('inventory_scenario_links').select('*').limit(0)
      return sb.from('inventory_scenario_links').select('*').in('inventory_item_id', allItemIds).eq('scenario_id', id)
    },
    [allItemIds.join(','), id]
  )

  // Alert-Kontakte (für Readiness)
  const { data: alertContacts } = useSupabaseQuery<DbAlertContact>(
    (sb) => sb.from('alert_contacts').select('*').eq(scopeColumn, scopeId || '').eq('is_active', true),
    [scopeId, scopeColumn]
  )

  // Szenario-Checklisten (für Readiness)
  const { data: scenarioChecklists } = useSupabaseQuery<DbChecklist>(
    (sb) => {
      if (!id) return sb.from('checklists').select('*').limit(0)
      return sb.from('checklists').select('*').eq('scenario_id', id)
    },
    [id]
  )

  // ─── Computed Data (useMemo, vor early returns) ───

  const linkedItems = useMemo(() => {
    const linkedIds = new Set(scenarioLinks.map(l => l.inventory_item_id))
    return allDistrictItems.filter(i => linkedIds.has(i.id))
  }, [allDistrictItems, scenarioLinks])

  const inventarStats = useMemo(() => {
    const count = linkedItems.length
    const totalTarget = linkedItems.reduce((sum, i) => sum + i.target_quantity, 0)
    const totalCurrent = linkedItems.reduce((sum, i) => sum + i.current_quantity, 0)
    const abdeckung = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
    const kritisch = linkedItems.filter(i => {
      const pct = i.target_quantity > 0 ? Math.round((i.current_quantity / i.target_quantity) * 100) : 100
      return pct < 60
    }).length
    return { count, abdeckung, kritisch }
  }, [linkedItems])

  const meta = (scenario?.meta ?? null) as SzenarioMeta | null

  const eskalationsstufen = useMemo<EskalationsStufe[]>(() => {
    const fromMeta = meta?.eskalationsstufen
    if (fromMeta && fromMeta.length > 0) return fromMeta
    const rawType = scenario?.type ?? ''
    const triggerKey = TYPE_TO_TRIGGER[rawType] || TYPE_TO_TRIGGER[rawType.toLowerCase()]
    return createDefaultEskalationsstufen(triggerKey)
  }, [meta?.eskalationsstufen, scenario?.type])

  const handbook = useMemo(() => parseHandbook(scenario?.handbook), [scenario?.handbook])

  const krisenstabRollen = useMemo(
    () => handbook ? extractKrisenstabRollen(handbook) : [],
    [handbook]
  )

  const risiko = useMemo(
    () => handbook ? extractRisiko(handbook) : null,
    [handbook]
  )

  const readiness = useMemo(() => calculateReadiness({
    eskalationsstufen,
    krisenstabRollen,
    alertContacts,
    inventoryItems: allDistrictItems,
    scenarioChecklists,
    szenarioInventoryItems: linkedItems,
  }), [eskalationsstufen, krisenstabRollen, alertContacts, allDistrictItems, scenarioChecklists, linkedItems])

  const sofortmassnahmen = useMemo(() => {
    if (meta?.sofortmassnahmen && meta.sofortmassnahmen.length > 0) return meta.sofortmassnahmen
    const stufe2 = eskalationsstufen.find(s => s.stufe === 2)
    return stufe2?.sofortmassnahmen ?? []
  }, [meta?.sofortmassnahmen, eskalationsstufen])

  const ausloeseKriterien = useMemo(() => {
    if (meta?.ausloese_kriterien && meta.ausloese_kriterien.length > 0) return meta.ausloese_kriterien
    // Fallback: Stufe-2-Auslöser als Szenario-Kriterien
    const stufe2 = eskalationsstufen.find(s => s.stufe === 2)
    return stufe2?.ausloeser ?? []
  }, [meta?.ausloese_kriterien, eskalationsstufen])

  // ─── Early Returns (nach ALLEN Hooks) ───

  if (scenarioLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="rounded-2xl border border-border bg-white p-12 text-center">
        <Flame className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm text-text-secondary">Szenario nicht gefunden.</p>
        <Link to="/pro/szenarien" className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700">
          Zurück zu Szenarien
        </Link>
      </div>
    )
  }

  const severityStufe = getSeverityStufe(scenario.severity)

  // Wahrscheinlichkeit & Schadensausmaß: Aus Handbook ODER abgeleitet aus Severity
  const derivedWk = scenario.severity >= 80 ? 'sehr_hoch' : scenario.severity >= 60 ? 'hoch' : scenario.severity >= 40 ? 'mittel' : 'niedrig'
  const derivedSm = scenario.severity >= 80 ? 'katastrophal' : scenario.severity >= 60 ? 'erheblich' : scenario.severity >= 40 ? 'mittel' : 'gering'
  const wk = wkConfig[risiko?.eintrittswahrscheinlichkeit ?? derivedWk]
  const sm = smConfig[risiko?.schadensausmass ?? derivedSm]
  const isRisikoGeschaetzt = !risiko
  const betroffeneSektoren = risiko?.betroffene_sektoren ?? []
  const organisationen = meta?.beteiligte_organisationen ?? []
  const zeitphasen = meta?.zeitphasen ?? []

  return (
    <div className="space-y-5">
      {/* ─── Zurück + Header ─── */}
      <Link
        to="/pro/szenarien"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zu Szenarien
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{scenario.title}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full ${severityStufe.bg} px-2.5 py-0.5 text-xs font-semibold ${severityStufe.farbe}`}>
              <Flame className="h-3 w-3" />
              {scenario.severity}/100
            </span>
            <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
              {SCENARIO_TYPE_LABELS[scenario.type] || scenario.type}
            </span>
            {scenario.is_ai_generated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                <Sparkles className="h-3 w-3" /> KI-generiert
              </span>
            )}
          </div>
        </div>
        {scenario.description && (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{scenario.description}</p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
           SEKTION 1: EINSATZBEREITSCHAFT (Hero)
         ═══════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-text-primary">
          <Shield className="h-4 w-4 text-primary-500" />
          Einsatzbereitschaft
        </h2>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Links: DonutChart */}
          <div className="flex flex-col items-center justify-center sm:w-1/3">
            <DonutChart pct={readiness.pct} size={160} strokeWidth={16} />
            <p className="mt-2 text-xs font-medium text-text-muted">Vorbereitungsgrad</p>
            <span className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold ${
              readiness.pct >= 80 ? 'bg-green-100 text-green-700' :
              readiness.pct >= 50 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {readiness.pct >= 80 ? 'Einsatzbereit' : readiness.pct >= 50 ? 'Lücken vorhanden' : 'Kritische Lücken'}
            </span>
          </div>

          {/* Rechts: Lücken-Liste */}
          <div className="flex-1 space-y-3">
            {/* Kritische Lücken */}
            {readiness.kritischeLuecken.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-red-600">
                  {readiness.kritischeLuecken.length} kritische {readiness.kritischeLuecken.length === 1 ? 'Lücke' : 'Lücken'}
                </p>
                <div className="space-y-1.5">
                  {readiness.kritischeLuecken.map(check => (
                    <ReadinessGapItem key={check.key} check={check} />
                  ))}
                </div>
              </div>
            )}

            {/* Warnungen */}
            {readiness.warnLuecken.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                  {readiness.warnLuecken.length} {readiness.warnLuecken.length === 1 ? 'Warnung' : 'Warnungen'}
                </p>
                <div className="space-y-1.5">
                  {readiness.warnLuecken.map(check => (
                    <ReadinessGapItem key={check.key} check={check} />
                  ))}
                </div>
              </div>
            )}

            {/* Alles erledigt */}
            {readiness.kritischeLuecken.length === 0 && readiness.warnLuecken.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 px-4 py-6">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-bold text-green-700">Alle Vorbereitungen abgeschlossen</p>
                  <p className="text-xs text-green-600">Alle {readiness.checks.length} Prüfpunkte erfüllt</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Segmentierte Fortschrittsleiste */}
        <div className="mt-5 flex gap-0.5">
          {readiness.checks.map(check => (
            <div
              key={check.key}
              className={`h-2 flex-1 rounded-full transition-colors ${
                check.done
                  ? 'bg-green-400'
                  : check.severity === 'kritisch'
                    ? 'bg-red-300'
                    : 'bg-amber-300'
              }`}
              title={`${check.label}: ${check.done ? 'Erledigt' : check.handlung}`}
            />
          ))}
        </div>
        <p className="mt-1 text-right text-[10px] text-text-muted">
          {readiness.doneCount}/{readiness.checks.length} Prüfpunkte erfüllt
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
           SEKTION 2: BEDROHUNGSLAGE
         ═══════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-text-primary">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Bedrohungslage
        </h2>

        {/* 4er Fact-Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Schweregrad */}
          <div className={`rounded-xl ${severityStufe.bg} px-4 py-3`}>
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">Schweregrad</p>
            <p className={`text-xl font-bold ${severityStufe.farbe}`}>Stufe {severityStufe.stufe}</p>
            <p className="text-xs text-text-muted">{severityStufe.label}</p>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/60">
              <div className={`h-full rounded-full ${getBarColor(scenario.severity)}`} style={{ width: `${scenario.severity}%` }} />
            </div>
          </div>

          {/* Eintrittswahrscheinlichkeit */}
          <div className={`rounded-xl ${wk.bg} px-4 py-3`}>
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">Wahrscheinlichkeit</p>
            <p className={`text-xl font-bold ${wk.color}`}>{wk.label}</p>
            {isRisikoGeschaetzt && <p className="text-[10px] text-text-muted">Basierend auf Schweregrad</p>}
            <div className="mt-1.5 h-1.5 rounded-full bg-white/60">
              <div className={`h-full rounded-full ${wk.bar}`} style={{ width: `${wk.pct}%` }} />
            </div>
          </div>

          {/* Schadensausmaß */}
          <div className={`rounded-xl ${sm.bg} px-4 py-3`}>
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">Schadensausmaß</p>
            <p className={`text-xl font-bold ${sm.color}`}>{sm.label}</p>
            {isRisikoGeschaetzt && <p className="text-[10px] text-text-muted">Basierend auf Schweregrad</p>}
            <div className="mt-1.5 h-1.5 rounded-full bg-white/60">
              <div className={`h-full rounded-full ${sm.bar}`} style={{ width: `${sm.pct}%` }} />
            </div>
          </div>

          {/* Betroffene */}
          <div className="rounded-xl bg-surface-secondary/50 px-4 py-3">
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">Betroffene</p>
            <div className="flex items-baseline gap-1.5">
              <Users className="h-4 w-4 shrink-0 text-text-muted" />
              <p className="text-xl font-bold text-text-primary">
                {scenario.affected_population
                  ? `~${scenario.affected_population.toLocaleString('de-DE')}`
                  : '—'}
              </p>
            </div>
            <p className="text-xs text-text-muted">Personen</p>
          </div>
        </div>

        {/* KRITIS-Sektoren */}
        {betroffeneSektoren.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Betroffene KRITIS-Sektoren
            </p>
            <div className="flex flex-wrap gap-1.5">
              {betroffeneSektoren.map((s, i) => (
                <span key={i} className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                  <Landmark className="mr-1 inline h-3 w-3" />{s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Auslöse-Kriterien */}
        {ausloeseKriterien.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Wann wird dieses Szenario ausgelöst?
            </p>
            <ul className="space-y-1">
              {ausloeseKriterien.map((k, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {k}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
           SEKTION 3: EINSATZPLAN
         ═══════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <Zap className="h-4 w-4 text-amber-500" />
          Einsatzplan — Was tun im Krisenfall?
        </h2>

        {/* 3a) Sofortmaßnahmen */}
        {sofortmassnahmen.length > 0 && (
          <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-green-700">
              Erste Schritte im Krisenfall
            </p>
            <ol className="space-y-2">
              {sofortmassnahmen.map((m, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-200 text-[11px] font-bold text-green-800">
                    {i + 1}
                  </span>
                  {m}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 3b) Zeitphasen */}
        {zeitphasen.length > 0 && (
          <div className="rounded-2xl border border-border bg-white p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              <Clock className="h-3.5 w-3.5" />
              Zeitlicher Ablauf
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {zeitphasen.map((phase, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface-secondary/30 p-3">
                  <p className="mb-2 text-xs font-bold text-primary-600">{phase.phase}</p>
                  <ul className="space-y-1">
                    {phase.massnahmen.map((m, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-text-secondary">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-300" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3c) Eskalationsstufen Kurzreferenz */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            <Shield className="h-3.5 w-3.5" />
            Eskalationsstufen
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {eskalationsstufen.map(stufe => {
              const colors = getEskalationColors(stufe.stufe)
              const ausloeser = Array.isArray(stufe.ausloeser) ? stufe.ausloeser.slice(0, 2) : []
              return (
                <div key={stufe.stufe} className={`rounded-xl border ${colors.border} p-3`}>
                  <div className="flex items-center gap-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colors.dot} text-[10px] font-bold text-white`}>
                      {stufe.stufe}
                    </span>
                    <span className="text-sm font-bold text-text-primary">{stufe.name}</span>
                  </div>
                  {ausloeser.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {ausloeser.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                          <span className={`mt-1 h-1 w-1 shrink-0 rounded-full ${colors.dot}`} />
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[10px] text-text-muted">
                    {stufe.checkliste?.length || 0} Schritte · {stufe.krisenstab_rollen?.length || 0} Rollen
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           SEKTION 4: RESSOURCEN & INVENTAR
         ═══════════════════════════════════════════════════ */}
      {scopeId && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <Package className="h-4 w-4 text-primary-500" />
              Ressourcen & Inventar
            </h2>
            <Link
              to="/pro/inventar"
              className="flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              Inventar verwalten <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {inventarStats.count === 0 ? (
            <div className="rounded-xl bg-surface-secondary/50 px-6 py-8 text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-text-muted" />
              <p className="text-sm text-text-secondary">Kein Inventar zugeordnet</p>
              <p className="mt-1 text-xs text-text-muted">
                Inventar kann über die Inventar-Verwaltung diesem Szenario zugeordnet werden.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-secondary/50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Artikel</p>
                <p className="mt-1 text-2xl font-extrabold text-text-primary">{inventarStats.count}</p>
                <p className="text-xs text-text-muted">zugeordnet</p>
              </div>
              <div className="rounded-xl bg-surface-secondary/50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Abdeckung</p>
                <p className="mt-1 text-2xl font-extrabold text-text-primary">{inventarStats.abdeckung}%</p>
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-200">
                  <div className={`h-full rounded-full ${getBarColor(inventarStats.abdeckung)}`} style={{ width: `${inventarStats.abdeckung}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-surface-secondary/50 px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Kritisch fehlend</p>
                <p className={`mt-1 text-2xl font-extrabold ${inventarStats.kritisch > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {inventarStats.kritisch}
                </p>
                <p className="text-xs text-text-muted">unter 60% Abdeckung</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
           SEKTION 5: BETEILIGTE ORGANISATIONEN (optional)
         ═══════════════════════════════════════════════════ */}
      {organisationen.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
            <Users className="h-4 w-4 text-primary-500" />
            Beteiligte Organisationen
          </h2>
          <div className="flex flex-wrap gap-2">
            {organisationen.map((org, i) => (
              <span key={i} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                {org}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

/** DonutChart — Kreisdiagramm für Readiness-% */
function DonutChart({ pct, size = 160, strokeWidth = 16 }: { pct: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const strokeColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Einsatzbereitschaft: ${pct}%`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-text-primary">{pct}%</span>
        <span className="text-[10px] text-text-muted">bereit</span>
      </div>
    </div>
  )
}

/** ReadinessGapItem — Einzelne Lücke mit Action-Hint */
function ReadinessGapItem({ check }: { check: { key: string; label: string; handlung: string; externalLink?: string; severity: 'kritisch' | 'warnung' } }) {
  const isKritisch = check.severity === 'kritisch'
  const inner = (
    <div className="flex items-start gap-2">
      <Circle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isKritisch ? 'text-red-400' : 'text-amber-400'}`} />
      <div>
        <p className="text-xs font-medium text-text-primary">{check.label}</p>
        <p className={`text-[11px] ${isKritisch ? 'text-red-500' : 'text-amber-600'}`}>{check.handlung}</p>
      </div>
    </div>
  )

  if (check.externalLink) {
    return (
      <Link to={check.externalLink} className="block rounded-lg px-1.5 py-1 transition-colors hover:bg-white/60">
        {inner}
      </Link>
    )
  }

  return <div className="px-1.5 py-1">{inner}</div>
}
