/**
 * UebersichtSection — Tab "Übersicht"
 *
 * Operatives Dashboard mit visueller Sofort-Übersicht:
 * - Hero-Bereich: Kreisdiagramm (Vorbereitungsgrad) + Key-Facts
 * - Eskalationsstufen: Kompakte Übersicht (ab wann gilt welche Stufe)
 * - Sofortmaßnahmen
 * - Wichtigste Ansprechpartner (Krisenstab + Organisationen)
 * - Vorbereitungsgrad: Kompakt (Bar + offene Lücken als Chips)
 */
import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  Activity, CheckCircle2, Users, Shield, Landmark,
  ArrowRight, Zap, Circle, ClipboardList,
  BookOpen, Upload, Sparkles, Loader2, X,
  Edit3, UserCircle, AlertTriangle, RotateCcw,
} from 'lucide-react'
import type { DbScenario, DbChecklist, ChecklistItem, ScenarioHandbookV3, EskalationsStufe } from '@/types/database'
import type { ReadinessResult, ReadinessCheck, TabKey } from './helpers/readiness-checks'
import type { StabsRolle } from './helpers/handbook-extract'
import {
  extractRisiko, getSeverityStufe, wkConfig,
  ROLLE_COLORS,
} from './helpers/handbook-extract'
import { ESKALATION_COLORS } from './helpers/eskalation-defaults'

interface UebersichtSectionProps {
  scenario: DbScenario
  handbook: ScenarioHandbookV3 | null
  readiness: ReadinessResult
  eskalationsstufen: EskalationsStufe[]
  krisenstabRollen: StabsRolle[]
  scenarioChecklists: DbChecklist[]
  onNavigateTab: (tab: TabKey) => void
  onOpenMetaModal: () => void
  // CTA props
  enriching: boolean
  onEnrich: () => void
  uploadedFileName: string | null
  uploadingDoc: boolean
  onUploadClick: () => void
  onClearUpload: () => void
  // Re-Generierung
  hasExistingHandbook: boolean
  isHandbookEdited: boolean
}

export default function UebersichtSection({
  scenario, handbook, readiness,
  eskalationsstufen, krisenstabRollen, scenarioChecklists,
  onNavigateTab, onOpenMetaModal,
  enriching, onEnrich, uploadedFileName, uploadingDoc, onUploadClick, onClearUpload,
  hasExistingHandbook, isHandbookEdited,
}: UebersichtSectionProps) {
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const risiko = handbook ? extractRisiko(handbook) : null
  const severityStufe = getSeverityStufe(scenario.severity)

  // Wahrscheinlichkeit config
  const wk = risiko ? wkConfig[risiko.eintrittswahrscheinlichkeit] : null

  // KRITIS sectors from handbook
  const betroffeneSektoren = risiko?.betroffene_sektoren ?? []

  // Beteiligte Organisationen
  const organisationen = scenario.meta?.beteiligte_organisationen ?? []

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Übersicht</h2>
        <button
          onClick={onOpenMetaModal}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <Edit3 className="h-4 w-4" />
          Bearbeiten
        </button>
      </div>

      {/* ─── EmptyHandbookCTA (wenn kein Handbook) ─── */}
      {!scenario.handbook && (
        <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/30 p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary-400" />
          <h3 className="mb-1.5 text-lg font-bold text-text-primary">
            Krisenhandbuch generieren
          </h3>
          <p className="mx-auto mb-5 max-w-md text-sm text-text-secondary">
            Die KI erstellt ein vollständiges Krisenhandbuch mit Handlungsplan,
            Alarmierungskette, Krisenstab-Rollen, Ressourcen und Kommunikationsplan.
          </p>

          {enriching && (
            <div className="mx-auto mb-4 flex max-w-sm items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-left">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-600" />
              <p className="text-sm text-amber-800">
                <strong>Wird generiert…</strong> Dies kann 20–40 Sekunden dauern.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onUploadClick}
              disabled={uploadingDoc || enriching}
              className="relative flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-60"
              title={uploadedFileName ? `Dokument: ${uploadedFileName}` : 'Bestehenden Plan hochladen (optional)'}
            >
              {uploadingDoc ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : uploadedFileName ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="max-w-[140px] truncate text-green-700">{uploadedFileName}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onClearUpload() }}
                    className="ml-1 rounded p-0.5 text-text-muted transition-colors hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Bestehenden Plan hochladen
                </>
              )}
            </button>

            <button
              onClick={onEnrich}
              disabled={enriching}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {enriching ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generiere…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> KI generieren</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Re-Generierung (wenn Handbook schon existiert) ─── */}
      {hasExistingHandbook && !showRegenConfirm && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-sm text-text-secondary">
              Krisenhandbuch mit KI neu generieren
            </span>
          </div>
          <button
            onClick={() => {
              if (isHandbookEdited) {
                setShowRegenConfirm(true)
              } else {
                onEnrich()
              }
            }}
            disabled={enriching}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-60"
          >
            {enriching ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generiere…</>
            ) : (
              <><RotateCcw className="h-4 w-4" /> Neu generieren</>
            )}
          </button>
        </div>
      )}

      {/* ─── Re-Generierung Warnung (editiertes Handbook) ─── */}
      {showRegenConfirm && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="mb-3 flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-text-primary">
                Handbuch wurde manuell bearbeitet
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Durch eine Neugenerierung werden alle manuellen Änderungen an Kapitel-Inhalten
                und Checklisten überschrieben. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowRegenConfirm(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-white"
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                setShowRegenConfirm(false)
                onEnrich()
              }}
              disabled={enriching}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
            >
              {enriching ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generiere…</>
              ) : (
                <><RotateCcw className="h-4 w-4" /> Trotzdem neu generieren</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══ HERO: Kreisdiagramm + Key Facts ═══ */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">

          {/* Donut-Ring: Vorbereitungsgrad */}
          <div className="flex shrink-0 flex-col items-center">
            <DonutChart pct={readiness.pct} size={140} strokeWidth={14} />
            <p className="mt-2 text-xs font-medium text-text-muted">Einsatzbereitschaft</p>
          </div>

          {/* Key Facts Grid */}
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            {/* Schweregrad */}
            <div className="rounded-xl bg-surface-secondary/50 px-4 py-3">
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">Schweregrad</p>
              <p className={`text-xl font-bold ${severityStufe.farbe}`}>
                Stufe {severityStufe.stufe}
              </p>
              <p className="text-xs text-text-muted">{severityStufe.label} · {scenario.severity}/100</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${
                    severityStufe.stufe === 3 ? 'bg-red-500' :
                    severityStufe.stufe === 2 ? 'bg-orange-500' :
                    'bg-amber-500'
                  }`}
                  style={{ width: `${scenario.severity}%` }}
                />
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
              <p className="text-xs text-text-muted">Personen / Haushalte</p>
            </div>

            {/* Wahrscheinlichkeit */}
            <div className="rounded-xl bg-surface-secondary/50 px-4 py-3">
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">Wahrscheinlichkeit</p>
              <div className="flex items-baseline gap-1.5">
                <Activity className="h-4 w-4 shrink-0 text-text-muted" />
                <p className={`text-xl font-bold ${wk?.color || 'text-text-muted'}`}>
                  {wk?.label || 'Nicht bewertet'}
                </p>
              </div>
              {wk && (
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-200">
                  <div className={`h-full rounded-full ${wk.bar}`} style={{ width: `${wk.pct}%` }} />
                </div>
              )}
            </div>

            {/* KRITIS */}
            <div className="rounded-xl bg-surface-secondary/50 px-4 py-3">
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">KRITIS-Sektoren</p>
              {betroffeneSektoren.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {betroffeneSektoren.map(sektor => (
                    <span
                      key={sektor}
                      className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-text-secondary shadow-sm"
                    >
                      {sektor}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-text-muted" />
                  <p className="text-sm text-text-muted">
                    {handbook ? 'Keine Sektoren identifiziert' : 'Handbuch generieren'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Vorbereitungsgrad — Segmentierte Checks ═══ */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-bold text-text-primary">Vorbereitungsgrad</span>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${
            readiness.pct >= 80 ? 'bg-green-50 text-green-700' :
            readiness.pct >= 50 ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'
          }`}>
            {readiness.pct}%
          </span>
        </div>

        {/* Segmentierte Progress-Bar */}
        <div className="mb-3 flex gap-1">
          {readiness.checks.map(check => (
            <div
              key={check.key}
              className={`h-2 flex-1 rounded-full ${
                check.done ? 'bg-green-400' :
                check.severity === 'kritisch' ? 'bg-red-200' :
                'bg-amber-200'
              }`}
              title={`${check.label}: ${check.done ? 'Erledigt' : 'Offen'}`}
            />
          ))}
        </div>

        {/* Checks als kompakte Zeilen */}
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          {readiness.checks
            .sort((a, b) => {
              if (a.done !== b.done) return a.done ? 1 : -1
              if (!a.done && !b.done) {
                if (a.severity !== b.severity) return a.severity === 'kritisch' ? -1 : 1
              }
              return 0
            })
            .map(check => (
              <ReadinessItem key={check.key} check={check} onNavigate={onNavigateTab} />
            ))}
        </div>
      </div>

      {/* ═══ Eskalationsstufen — 3 Cards ═══ */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-text-primary">Eskalationsstufen</h3>
          <p className="text-xs text-text-muted">Ab wann gilt welche Stufe</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {eskalationsstufen.map(stufe => (
            <EskalationsCard
              key={stufe.stufe}
              stufe={stufe}
              onClick={() => onNavigateTab('eskalation')}
            />
          ))}
        </div>
      </div>

      {/* ═══ Sofortmaßnahmen ═══ */}
      {(() => {
        const massnahmen = scenario.meta?.sofortmassnahmen ?? []
        return (
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-text-primary">Sofortmaßnahmen</span>
              <span className="text-xs text-text-muted">Erste Schritte im Krisenfall</span>
            </div>

            {massnahmen.length > 0 ? (
              <ol className="space-y-2">
                {massnahmen.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-3 rounded-lg px-2 py-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-text-primary">{m}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs italic text-text-muted">
                Keine Sofortmaßnahmen definiert — werden durch KI-Generierung ergänzt.
              </p>
            )}
          </div>
        )
      })()}

      {/* ═══ Szenario-Checklisten Summary ═══ */}
      {(() => {
        const allItems = scenarioChecklists.flatMap(c => (c.items as ChecklistItem[]))
        const clTotal = allItems.length
        const clDone = allItems.filter(i => i.status === 'done').length
        const clPct = clTotal > 0 ? Math.round((clDone / clTotal) * 100) : 0

        return (
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-bold text-text-primary">Szenario-Checklisten</span>
            </div>

            {scenarioChecklists.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center gap-4">
                  <span className="text-sm text-text-secondary">
                    <strong className="font-bold text-text-primary">{scenarioChecklists.length}</strong> Checklisten
                  </span>
                  <span className="text-sm text-text-secondary">
                    <strong className="font-bold text-text-primary">{clDone}/{clTotal}</strong> Aufgaben erledigt
                  </span>
                </div>
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className={`h-full rounded-full transition-all ${clPct === 100 ? 'bg-green-500' : clPct > 0 ? 'bg-violet-500' : 'bg-gray-300'}`}
                    style={{ width: `${clPct}%` }}
                  />
                </div>
                <Link
                  to="/pro/vorbereitung"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700"
                >
                  Zur Vorbereitung <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-text-muted">
                  {handbook
                    ? 'Keine szenario-spezifischen Checklisten vorhanden.'
                    : 'Handbuch generieren für automatische Checklisten.'}
                </p>
                <Link
                  to="/pro/vorbereitung"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700"
                >
                  Zur Vorbereitung <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )
      })()}

      {/* ═══ Wichtigste Ansprechpartner ═══ */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-bold text-text-primary">Wichtigste Ansprechpartner</span>
        </div>

        {krisenstabRollen.length > 0 ? (
          <>
            {/* Krisenstab-Rollen Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {krisenstabRollen.map(rolle => (
                <button
                  key={rolle.rolle}
                  onClick={() => onNavigateTab('eskalation')}
                  className="flex items-center gap-2.5 rounded-xl bg-surface-secondary/50 px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary"
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${ROLLE_COLORS[rolle.rolle] || 'bg-gray-500'}`}>
                    {rolle.rolle}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-text-primary">{rolle.funktion}</p>
                    <p className="text-[10px] text-text-muted">
                      {rolle.aufgabenCount} {rolle.aufgabenCount === 1 ? 'Aufgabe' : 'Aufgaben'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Beteiligte Organisationen */}
            {organisationen.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Beteiligte Organisationen
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {organisationen.map(org => (
                    <span
                      key={org}
                      className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary"
                    >
                      {org}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-xs italic text-text-muted">
              {handbook
                ? 'Keine Krisenstab-Rollen im Handbuch gefunden'
                : 'Handbuch generieren für Krisenstab-Zuordnung'}
            </p>

            {/* Organisationen trotzdem zeigen, falls vorhanden */}
            {organisationen.length > 0 && (
              <div className="mt-3 border-t border-border pt-3 text-left">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Beteiligte Organisationen
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {organisationen.map(org => (
                    <span
                      key={org}
                      className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary"
                    >
                      {org}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Donut Chart (SVG) ──────────────────────────────────

function DonutChart({ pct, size = 140, strokeWidth = 14 }: { pct: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  // Farbe basierend auf Prozent
  const strokeColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Einsatzbereitschaft: ${pct}%`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary">{pct}%</span>
        <span className="text-[10px] text-text-muted">bereit</span>
      </div>
    </div>
  )
}

// ─── ReadinessItem (kompakte Check-Zeile) ────────────────

function ReadinessItem({
  check,
  onNavigate,
}: {
  check: ReadinessCheck
  onNavigate: (tab: TabKey) => void
}) {
  const handleClick = () => {
    if (check.externalLink) return
    if (check.targetTab) onNavigate(check.targetTab)
  }

  const inner = (
    <>
      {check.done ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      ) : (
        <Circle className={`h-3.5 w-3.5 shrink-0 ${check.severity === 'kritisch' ? 'text-red-400' : 'text-amber-400'}`} />
      )}
      <span className={`text-xs ${check.done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
        {check.label}
      </span>
    </>
  )

  if (check.externalLink && !check.done) {
    return (
      <Link
        to={check.externalLink}
        className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-secondary"
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors ${
        check.done ? '' : 'hover:bg-surface-secondary'
      }`}
    >
      {inner}
    </button>
  )
}

// ─── EskalationsCard (3 Cards mit Auslöser/Informierte/Sofortmaßnahmen) ──

function EskalationsCard({
  stufe,
  onClick,
}: {
  stufe: EskalationsStufe
  onClick: () => void
}) {
  const colors = ESKALATION_COLORS[stufe.stufe]
  const ausloeser: string[] = Array.isArray(stufe.ausloeser)
    ? stufe.ausloeser
    : stufe.ausloeser
      ? [stufe.ausloeser]
      : [stufe.beschreibung]
  const informierte = stufe.informierte ?? []
  const massnahmen = stufe.sofortmassnahmen ?? []

  return (
    <button
      onClick={onClick}
      className={`flex flex-col rounded-2xl border ${colors.border} bg-white text-left transition-shadow hover:shadow-sm`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2.5 rounded-t-2xl ${colors.headerBg} px-4 py-3`}>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colors.dot} text-xs font-bold text-white`}>
          {stufe.stufe}
        </span>
        <span className="text-sm font-bold text-text-primary">{stufe.name}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-3.5">
        {/* Auslöser */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Auslöser</p>
          <ul className="space-y-0.5">
            {ausloeser.map(trigger => (
              <li key={trigger} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                {trigger}
              </li>
            ))}
          </ul>
        </div>

        {/* Wer wird informiert */}
        {informierte.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Wer wird informiert</p>
            <ul className="space-y-0.5">
              {informierte.map(person => (
                <li key={person} className="flex items-start gap-1.5 text-xs text-text-secondary">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                  {person}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sofortmaßnahmen */}
        {massnahmen.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Sofortmaßnahmen</p>
            <ul className="space-y-0.5">
              {massnahmen.map(m => (
                <li key={m} className="flex items-start gap-1.5 text-xs text-text-secondary">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between border-t ${colors.border} px-4 py-2.5`}>
        <span className="text-[11px] text-text-muted">
          {stufe.checkliste.length} {stufe.checkliste.length === 1 ? 'Schritt' : 'Schritte'} definiert
        </span>
        <span className={`flex items-center gap-1 text-[11px] font-medium ${colors.text}`}>
          Details <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  )
}
