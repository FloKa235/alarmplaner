import { useState } from 'react'
import {
  ShieldAlert, AlertTriangle, ArrowRight, TrendingUp,
  Shield, Bell, GraduationCap, Package, CheckCircle2,
  Users, MessageCircle, ChevronDown, ChevronUp,
  ShieldCheck, ClipboardList, FileText, BookOpen,
} from 'lucide-react'
import { SECTOR_CONFIG } from '@/data/sector-config'
import type { DbScenario, DbScenarioPhase, ScenarioHandbookV2 } from '@/types/database'

// ─── Props ───────────────────────────────────────────
interface UebersichtTabProps {
  scenario: DbScenario
  handbook: ScenarioHandbookV2 | null
  phases: DbScenarioPhase[]
}

// ─── Vorbereitungsscore berechnen (V2) ───────────────
interface ScoreDetail {
  label: string
  points: number
  maxPoints: number
  icon: typeof Shield
  color: string
}

function computeReadinessScore(
  handbook: ScenarioHandbookV2 | null,
  phases: DbScenarioPhase[],
): { totalPercent: number; details: ScoreDetail[] } {
  const details: ScoreDetail[] = []

  // 1. Handbuch generiert? (20 Punkte)
  const handbuchPoints = handbook ? 20 : 0
  details.push({ label: 'KI-Handbuch', points: handbuchPoints, maxPoints: 20, icon: FileText, color: 'text-primary-600' })

  // 2. Handlungsplan (20 Punkte)
  const aufgaben = phases.reduce((a, p) => a + (p.tasks?.length || 0), 0)
  const planPoints = phases.length >= 3 && aufgaben >= 5 ? 20 : phases.length >= 1 ? 10 : 0
  details.push({ label: 'Handlungsplan', points: planPoints, maxPoints: 20, icon: ClipboardList, color: 'text-blue-600' })

  // 3. Kapitel mit Inhalt (15 Punkte) – wie viele der 7 Kapitel haben Inhalt?
  const kapitelMitInhalt = handbook?.kapitel.filter(k => k.inhalt && k.inhalt.trim().length > 10).length || 0
  const kapitelPoints = kapitelMitInhalt >= 6 ? 15 : kapitelMitInhalt >= 4 ? 10 : kapitelMitInhalt >= 2 ? 5 : 0
  details.push({ label: 'Kapitel', points: kapitelPoints, maxPoints: 15, icon: BookOpen, color: 'text-green-600' })

  // 4. Krisenstab / Verantwortlichkeiten (Kapitel 3) (10 Punkte)
  const krisenstabKapitel = handbook?.kapitel.find(k => k.nummer === 3)
  const krisenstabInhalt = krisenstabKapitel?.inhalt?.trim().length || 0
  const stabPoints = krisenstabInhalt > 100 ? 10 : krisenstabInhalt > 20 ? 5 : 0
  details.push({ label: 'Krisenstab', points: stabPoints, maxPoints: 10, icon: Users, color: 'text-amber-600' })

  // 5. Kommunikation (Kapitel 4) (10 Punkte)
  const kommKapitel = handbook?.kapitel.find(k => k.nummer === 4)
  const kommInhalt = kommKapitel?.inhalt?.trim().length || 0
  const kommPoints = kommInhalt > 100 ? 10 : kommInhalt > 20 ? 5 : 0
  details.push({ label: 'Kommunikation', points: kommPoints, maxPoints: 10, icon: MessageCircle, color: 'text-orange-600' })

  // 6. Prävention (Kapitel 6) (10 Punkte)
  const praevKapitel = handbook?.kapitel.find(k => k.nummer === 6)
  const praevItems = praevKapitel?.checkliste.length || 0
  const praevPoints = praevItems >= 5 ? 10 : praevItems >= 2 ? 5 : 0
  details.push({ label: 'Prävention', points: praevPoints, maxPoints: 10, icon: Shield, color: 'text-purple-600' })

  // 7. Checklisten-Fortschritt (15 Punkte) – über alle Kapitel
  const allItems = handbook?.kapitel.flatMap(k => k.checkliste) || []
  const doneItems = allItems.filter(i => i.status === 'done' || i.status === 'skipped').length
  const clPct = allItems.length > 0 ? doneItems / allItems.length : 0
  const clPoints = allItems.length === 0 ? 0 : Math.round(clPct * 15)
  details.push({ label: 'Checkliste', points: clPoints, maxPoints: 15, icon: CheckCircle2, color: 'text-cyan-600' })

  const totalPoints = details.reduce((s, d) => s + d.points, 0)
  const maxPoints = details.reduce((s, d) => s + d.maxPoints, 0)
  const totalPercent = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

  return { totalPercent, details }
}

function getScoreLabel(pct: number): { label: string; color: string; ringColor: string } {
  if (pct >= 90) return { label: 'Einsatzbereit', color: 'text-green-700', ringColor: '#22c55e' }
  if (pct >= 70) return { label: 'Gut vorbereitet', color: 'text-green-600', ringColor: '#22c55e' }
  if (pct >= 50) return { label: 'Teilweise vorbereitet', color: 'text-amber-600', ringColor: '#f59e0b' }
  if (pct >= 25) return { label: 'In Bearbeitung', color: 'text-orange-600', ringColor: '#f97316' }
  return { label: 'Nicht vorbereitet', color: 'text-red-600', ringColor: '#ef4444' }
}

// ─── V2: Risiko-Daten aus Kapitel 1 extrahieren ──────
function extractRisikoFromV2(handbook: ScenarioHandbookV2) {
  const kap = handbook.kapitel.find(k => k.nummer === 1)
  if (!kap) return null

  const lines = kap.inhalt.split('\n')
  let bedrohungsanalyse = ''
  let eintrittswahrscheinlichkeit = 'mittel'
  let schadensausmass = 'mittel'
  let risikoeinschaetzung = ''
  const betroffene_sektoren: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Eintrittswahrscheinlichkeit:')) {
      const val = trimmed.replace('Eintrittswahrscheinlichkeit:', '').trim().toLowerCase()
      if (val.includes('niedrig')) eintrittswahrscheinlichkeit = 'niedrig'
      else if (val.includes('sehr hoch')) eintrittswahrscheinlichkeit = 'sehr_hoch'
      else if (val.includes('hoch')) eintrittswahrscheinlichkeit = 'hoch'
      else if (val.includes('mittel')) eintrittswahrscheinlichkeit = 'mittel'
    } else if (trimmed.startsWith('Schadensausmaß:')) {
      const val = trimmed.replace('Schadensausmaß:', '').trim().toLowerCase()
      if (val.includes('gering')) schadensausmass = 'gering'
      else if (val.includes('katastrophal')) schadensausmass = 'katastrophal'
      else if (val.includes('erheblich')) schadensausmass = 'erheblich'
      else if (val.includes('mittel')) schadensausmass = 'mittel'
    } else if (trimmed.startsWith('Betroffene KRITIS-Sektoren:')) {
      const sektoren = trimmed.replace('Betroffene KRITIS-Sektoren:', '').trim()
      betroffene_sektoren.push(...sektoren.split(',').map(s => s.trim()).filter(Boolean))
    } else if (!bedrohungsanalyse && trimmed.length > 20 && !trimmed.startsWith('Eintritts') && !trimmed.startsWith('Schadens') && !trimmed.startsWith('Betroffene')) {
      bedrohungsanalyse = trimmed
    }
  }

  // Suche nach einem längeren Text-Block als Risikoeinschätzung
  const textBlocks = kap.inhalt.split('\n\n').filter(b => b.trim().length > 30)
  if (textBlocks.length > 1) {
    risikoeinschaetzung = textBlocks[textBlocks.length - 1].trim()
  } else if (textBlocks.length === 1 && !bedrohungsanalyse) {
    bedrohungsanalyse = textBlocks[0].trim()
  }

  return { bedrohungsanalyse, eintrittswahrscheinlichkeit, schadensausmass, risikoeinschaetzung, betroffene_sektoren }
}

// ─── V2: Wenn-Dann aus Kapitel 5 extrahieren ─────────
function extractWennDannFromV2(handbook: ScenarioHandbookV2): { trigger: string; massnahmen: string[]; eskalation?: string }[] {
  const kap = handbook.kapitel.find(k => k.nummer === 5)
  if (!kap || !kap.inhalt.trim()) return []

  const rules: { trigger: string; massnahmen: string[]; eskalation?: string }[] = []
  const blocks = kap.inhalt.split(/(?=###\s)/)

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim())
    if (lines.length === 0) continue

    const headerMatch = lines[0].match(/###\s*Wenn:\s*(.+)/)
    if (!headerMatch) continue

    const trigger = headerMatch[1].trim()
    const massnahmen: string[] = []
    let eskalation: string | undefined

    for (let i = 1; i < lines.length; i++) {
      const l = lines[i].trim()
      if (l.startsWith('- ')) {
        massnahmen.push(l.replace(/^-\s*/, ''))
      } else if (l.startsWith('Eskalation:')) {
        eskalation = l.replace('Eskalation:', '').trim()
      }
    }

    rules.push({ trigger, massnahmen, eskalation })
  }

  return rules
}

// ─── V2: Prävention aus Kapitel 6 extrahieren ────────
function extractPraeventionFromV2(handbook: ScenarioHandbookV2): Record<string, string[]> {
  const kap = handbook.kapitel.find(k => k.nummer === 6)
  if (!kap || !kap.inhalt.trim()) return {}

  const sections: Record<string, string[]> = {}
  let currentSection = ''

  for (const line of kap.inhalt.split('\n')) {
    const trimmed = line.trim()
    const headerMatch = trimmed.match(/^###\s*(.+)/)
    if (headerMatch) {
      currentSection = headerMatch[1].trim()
      sections[currentSection] = []
    } else if (trimmed.startsWith('- ') && currentSection) {
      sections[currentSection].push(trimmed.replace(/^-\s*/, ''))
    }
  }

  return sections
}

// ─── Component ───────────────────────────────────────
export default function UebersichtTab({ scenario, handbook, phases }: UebersichtTabProps) {
  const { totalPercent, details } = computeReadinessScore(handbook, phases)
  const scoreInfo = getScoreLabel(totalPercent)

  // SVG Ring Berechnung
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const filledLength = (totalPercent / 100) * circumference

  // V2 Daten extrahieren
  const risiko = handbook ? extractRisikoFromV2(handbook) : null
  const wennDann = handbook ? extractWennDannFromV2(handbook) : []
  const praevention = handbook ? extractPraeventionFromV2(handbook) : {}

  return (
    <div className="space-y-6">
      {/* ─── 1. Vorbereitungsscore ─── */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Score-Ring */}
          <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
            <svg className="h-32 w-32" viewBox="0 0 120 120">
              {/* Background Ring */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              {/* Filled Ring */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={scoreInfo.ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${filledLength} ${circumference}`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-text-primary">{totalPercent}%</span>
            </div>
          </div>

          {/* Score-Details */}
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${scoreInfo.color}`} />
              <h3 className="text-lg font-bold text-text-primary">Vorbereitungsgrad</h3>
            </div>
            <p className={`mb-4 text-sm font-semibold ${scoreInfo.color}`}>{scoreInfo.label}</p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
              {details.map(d => {
                const Icon = d.icon
                const pct = d.maxPoints > 0 ? Math.round((d.points / d.maxPoints) * 100) : 0
                return (
                  <div key={d.label} className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${d.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">{d.label}</span>
                        <span className="text-xs font-bold text-text-primary">{pct}%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : pct > 0 ? 'bg-orange-400' : 'bg-gray-300'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Risiko-Cards ─── */}
      {risiko && risiko.bedrohungsanalyse && (
        <RisikoCards risiko={risiko} />
      )}

      {/* ─── 3. Wenn-Dann-Regeln (aufklappbar) ─── */}
      {wennDann.length > 0 && (
        <WennDannCompact szenarien={wennDann} />
      )}

      {/* ─── 4. Prävention (aufklappbar) ─── */}
      {Object.keys(praevention).length > 0 && (
        <PraeventionCards praevention={praevention} />
      )}

      {/* ─── 5. Beschreibung ─── */}
      {scenario.description && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="leading-relaxed text-text-secondary">{scenario.description}</p>
        </div>
      )}

      {/* Empty State */}
      {!handbook && !scenario.description && (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Noch keine Daten vorhanden. Klicken Sie oben auf „KI generieren", um das vollständige Krisenhandbuch zu erstellen.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Risiko-Cards ────────────────────────────────────
const wkConfig: Record<string, { label: string; color: string; bg: string; bar: string; pct: number }> = {
  niedrig:   { label: 'Niedrig',   color: 'text-green-700',  bg: 'bg-green-50',  bar: 'bg-green-500',  pct: 25 },
  mittel:    { label: 'Mittel',    color: 'text-amber-700',  bg: 'bg-amber-50',  bar: 'bg-amber-500',  pct: 50 },
  hoch:      { label: 'Hoch',      color: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500', pct: 75 },
  sehr_hoch: { label: 'Sehr hoch', color: 'text-red-700',    bg: 'bg-red-50',    bar: 'bg-red-500',    pct: 100 },
}

const smConfig: Record<string, { label: string; color: string; bg: string; bar: string; pct: number }> = {
  gering:       { label: 'Gering',       color: 'text-green-700',  bg: 'bg-green-50',  bar: 'bg-green-500',  pct: 25 },
  mittel:       { label: 'Mittel',       color: 'text-amber-700',  bg: 'bg-amber-50',  bar: 'bg-amber-500',  pct: 50 },
  erheblich:    { label: 'Erheblich',    color: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500', pct: 75 },
  katastrophal: { label: 'Katastrophal', color: 'text-red-700',    bg: 'bg-red-50',    bar: 'bg-red-500',    pct: 100 },
}

function RisikoCards({ risiko }: { risiko: { bedrohungsanalyse: string; eintrittswahrscheinlichkeit: string; schadensausmass: string; risikoeinschaetzung: string; betroffene_sektoren: string[] } }) {
  const wk = wkConfig[risiko.eintrittswahrscheinlichkeit] || wkConfig.mittel
  const sm = smConfig[risiko.schadensausmass] || smConfig.mittel

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Eintrittswahrscheinlichkeit */}
      <div className={`rounded-2xl border border-border ${wk.bg} p-6`}>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${wk.color}`} />
          <span className="text-sm font-medium text-text-secondary">Eintrittswahrscheinlichkeit</span>
        </div>
        <p className={`mb-3 text-2xl font-bold ${wk.color}`}>{wk.label}</p>
        <div className="h-2 overflow-hidden rounded-full bg-white/60">
          <div className={`h-full rounded-full ${wk.bar} transition-all`} style={{ width: `${wk.pct}%` }} />
        </div>
      </div>

      {/* Schadensausmaß */}
      <div className={`rounded-2xl border border-border ${sm.bg} p-6`}>
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className={`h-5 w-5 ${sm.color}`} />
          <span className="text-sm font-medium text-text-secondary">Schadensausmaß</span>
        </div>
        <p className={`mb-3 text-2xl font-bold ${sm.color}`}>{sm.label}</p>
        <div className="h-2 overflow-hidden rounded-full bg-white/60">
          <div className={`h-full rounded-full ${sm.bar} transition-all`} style={{ width: `${sm.pct}%` }} />
        </div>
      </div>

      {/* Bedrohungsanalyse */}
      {risiko.bedrohungsanalyse && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <TrendingUp className="h-4 w-4 text-red-600" />
            </div>
            <h4 className="text-sm font-bold text-text-primary">Bedrohungsanalyse</h4>
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary">{risiko.bedrohungsanalyse}</p>
        </div>
      )}

      {/* Risikoeinschätzung */}
      {risiko.risikoeinschaetzung && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </div>
            <h4 className="text-sm font-bold text-text-primary">Risikoeinschätzung</h4>
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary">{risiko.risikoeinschaetzung}</p>
        </div>
      )}

      {/* KRITIS-Sektoren */}
      {risiko.betroffene_sektoren && risiko.betroffene_sektoren.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5 sm:col-span-2">
          <h4 className="mb-3 text-sm font-bold text-text-primary">Betroffene KRITIS-Sektoren</h4>
          <div className="flex flex-wrap gap-2">
            {risiko.betroffene_sektoren.map((sektorKey) => {
              const cfg = SECTOR_CONFIG.find(s => s.key === sektorKey || s.label === sektorKey)
              if (!cfg) {
                return (
                  <span key={sektorKey} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                    {sektorKey}
                  </span>
                )
              }
              const SIcon = cfg.icon
              return (
                <span key={sektorKey} className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-3 py-1.5 text-xs font-medium ${cfg.color}`}>
                  <SIcon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Wenn-Dann (aufklappbare Zeilen) ─────────────────
function WennDannCompact({ szenarien }: { szenarien: { trigger: string; massnahmen: string[]; eskalation?: string }[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  return (
    <div className="rounded-2xl border border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h3 className="font-bold text-text-primary">Wenn-Dann-Regeln</h3>
        <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
          {szenarien.length}
        </span>
      </div>

      <div className="divide-y divide-border">
        {szenarien.map((s, i) => {
          const isOpen = expandedIdx === i
          const massnahmen = s.massnahmen || []

          return (
            <div key={i}>
              <button
                onClick={() => setExpandedIdx(isOpen ? null : i)}
                className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-surface-secondary"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{s.trigger}</p>
                  {!isOpen && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 text-text-muted" />
                      <span className="text-xs font-medium text-primary-600">
                        {massnahmen.length} Maßnahme{massnahmen.length !== 1 ? 'n' : ''}
                      </span>
                      {s.eskalation && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          <TrendingUp className="h-2.5 w-2.5" />
                          Eskalation
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {isOpen
                  ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                  : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                }
              </button>

              {isOpen && (
                <div className="border-t border-dashed border-border bg-surface-secondary/30 px-6 py-4">
                  {massnahmen.length > 0 && (
                    <div className="mb-3 ml-9">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-600">Maßnahmen</p>
                      <ul className="space-y-1.5">
                        {massnahmen.map((m, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {s.eskalation && (
                    <div className="ml-9 flex items-start gap-2 rounded-lg bg-red-50 p-2.5">
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Eskalation</p>
                        <p className="text-sm text-red-700">{s.eskalation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Prävention (V2: generische Sections) ────────────
const PRAEV_ICON_MAP: Record<string, { icon: typeof Shield; color: string; bg: string }> = {
  'Vorbereitung':       { icon: Shield,        color: 'text-blue-600',   bg: 'bg-blue-50' },
  'Frühwarnung':        { icon: Bell,          color: 'text-amber-600',  bg: 'bg-amber-50' },
  'Schulungen':         { icon: GraduationCap, color: 'text-green-600',  bg: 'bg-green-50' },
  'Materialvorhaltung': { icon: Package,       color: 'text-purple-600', bg: 'bg-purple-50' },
}

function PraeventionCards({ praevention }: { praevention: Record<string, string[]> }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const entries = Object.entries(praevention).filter(([, items]) => items.length > 0)
  if (entries.length === 0) return null

  const totalCount = entries.reduce((sum, [, items]) => sum + items.length, 0)

  return (
    <div className="rounded-2xl border border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-text-primary">Prävention & Vorbereitung</h3>
        <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
          {totalCount}
        </span>
      </div>

      <div className="divide-y divide-border">
        {entries.map(([label, items]) => {
          const cfg = PRAEV_ICON_MAP[label] || { icon: Shield, color: 'text-gray-600', bg: 'bg-gray-50' }
          const Icon = cfg.icon
          const isOpen = expandedKey === label

          return (
            <div key={label}>
              <button
                onClick={() => setExpandedKey(isOpen ? null : label)}
                className="flex w-full items-start gap-3 px-6 py-3 text-left transition-colors hover:bg-surface-secondary"
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  {!isOpen && (
                    <p className="mt-0.5 text-xs font-medium text-primary-600">
                      {items.length} Maßnahme{items.length !== 1 ? 'n' : ''}
                    </p>
                  )}
                </div>
                {isOpen
                  ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                  : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                }
              </button>

              {isOpen && (
                <div className="border-t border-dashed border-border bg-surface-secondary/30 px-6 py-4">
                  <ul className="ml-9 space-y-1.5">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
