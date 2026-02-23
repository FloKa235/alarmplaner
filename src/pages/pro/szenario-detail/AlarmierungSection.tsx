/**
 * AlarmierungSection — Tab "Alarmierung & Krisenstab"
 *
 * Pro Eskalationsstufe (1-3): Alarmkette-Timeline + Krisenstab-Rollen.
 * 3 feste Panels (keine Accordions — max 3 Stufen passt immer).
 * Warnung wenn 0 Kontakte vorhanden.
 */
import { Link } from 'react-router-dom'
import {
  Phone, Bell, Users, AlertTriangle, ArrowRight,
} from 'lucide-react'
import type {
  EskalationsStufe, AlarmkettenSchritt,
  DbAlertContact,
} from '@/types/database'
import type { StabsRolle } from './helpers/handbook-extract'
import { ROLLE_COLORS } from './helpers/handbook-extract'
import { ESKALATION_COLORS } from './helpers/eskalation-defaults'

// ─── S-Rollen Labels ──────────────────────────────────
const S_ROLLE_LABELS: Record<string, string> = {
  S1: 'Personal',
  S2: 'Lage',
  S3: 'Einsatz',
  S4: 'Versorgung',
  S5: 'Presse/Medien',
  S6: 'IT/Kommunikation',
}

// ─── Types ────────────────────────────────────────────
interface AlarmierungSectionProps {
  eskalationsstufen: EskalationsStufe[]
  krisenstabRollen: StabsRolle[]
  alertContacts: DbAlertContact[]
  onOpenAlarmketteModal: (stufeIdx: number) => void
  /** Wenn gesetzt, wird nur diese eine Stufe (0/1/2) angezeigt */
  filterStufeIdx?: number
}

// ─── Kanäle Labels ────────────────────────────────────
const KANAL_LABELS: Record<string, string> = {
  telefon: '\ud83d\udcde Telefon',
  email: '\u2709\ufe0f E-Mail',
  funk: '\ud83d\udcfb Funk',
  nina: '\ud83d\udd14 NINA',
  sirene: '\ud83d\udea8 Sirene',
  messenger: '\ud83d\udcac Messenger',
}

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════
export default function AlarmierungSection({
  eskalationsstufen, krisenstabRollen, alertContacts,
  onOpenAlarmketteModal, filterStufeIdx,
}: AlarmierungSectionProps) {

  // Gefilterte oder alle Stufen
  const displayStufen = filterStufeIdx !== undefined
    ? eskalationsstufen.slice(filterStufeIdx, filterStufeIdx + 1).map((s) => ({ stufe: s, originalIdx: filterStufeIdx }))
    : eskalationsstufen.map((s, i) => ({ stufe: s, originalIdx: i }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Alarmierung & Krisenstab</h2>
        <Link
          to="/pro/alarmierung"
          className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Kontakte verwalten <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Warnung: Keine Kontakte */}
      {alertContacts.length === 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Keine Alarmierungskontakte vorhanden</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Hinterlegen Sie Kontakte, damit Alarmierungsketten funktionieren.
            </p>
            <Link
              to="/pro/alarmierung"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-800 underline hover:text-amber-900"
            >
              Kontakte anlegen <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Stufen-Panels */}
      {displayStufen.map(({ stufe, originalIdx: stufeIdx }) => {
        const colors = ESKALATION_COLORS[stufe.stufe]

        // Find matching krisenstab roles for this stufe
        const stufeRollen = stufe.krisenstab_rollen
          .map(r => {
            const full = krisenstabRollen.find(kr => kr.rolle === r)
            return full || { rolle: r, funktion: S_ROLLE_LABELS[r] || r, aufgabenCount: 0, aufgaben: [] }
          })

        return (
          <div key={stufe.stufe} className={`rounded-2xl border ${colors.border} overflow-hidden`}>
            {/* Panel Header */}
            <div className={`flex items-center gap-3 px-5 py-3.5 ${colors.headerBg}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${colors.dot} text-sm font-bold text-white`}>
                {stufe.stufe}
              </span>
              <div>
                <span className={`font-bold ${colors.text}`}>{stufe.name}</span>
                <p className="text-xs text-text-muted">{stufe.beschreibung}</p>
              </div>
            </div>

            {/* 2-Col: Alarmkette + Krisenstab */}
            <div className="grid gap-4 border-t border-border bg-white p-5 sm:grid-cols-2">
              {/* Links: Alarmkette */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                    <Bell className="h-4 w-4" />
                    Alarmierungskette
                  </h4>
                  <button
                    onClick={() => onOpenAlarmketteModal(stufeIdx)}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
                  >
                    Bearbeiten
                  </button>
                </div>

                {stufe.alarmkette.length > 0 ? (
                  <AlarmketteTimeline schritte={stufe.alarmkette} />
                ) : (
                  <button
                    onClick={() => onOpenAlarmketteModal(stufeIdx)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-xs text-text-muted transition-colors hover:border-primary-300 hover:text-primary-600"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Alarmierungskette anlegen
                  </button>
                )}
              </div>

              {/* Rechts: Krisenstab-Rollen */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
                  <Users className="h-4 w-4" />
                  Krisenstab-Rollen
                </h4>

                {stufeRollen.length > 0 ? (
                  <div className="space-y-2">
                    {stufeRollen.map(rolle => (
                      <div
                        key={rolle.rolle}
                        className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-secondary/30 px-3 py-2.5"
                      >
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${ROLLE_COLORS[rolle.rolle] || 'bg-gray-500'}`}>
                          {rolle.rolle}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-text-primary">{rolle.funktion}</p>
                          {rolle.aufgaben.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {rolle.aufgaben.slice(0, 3).map((a, i) => (
                                <li key={i} className="text-[11px] text-text-muted">
                                  - {a}
                                </li>
                              ))}
                              {rolle.aufgaben.length > 3 && (
                                <li className="text-[11px] text-text-muted italic">
                                  +{rolle.aufgaben.length - 3} weitere
                                </li>
                              )}
                            </ul>
                          )}
                          {rolle.aufgabenCount > 0 && rolle.aufgaben.length === 0 && (
                            <p className="text-[11px] text-text-muted">
                              {rolle.aufgabenCount} Aufgabe{rolle.aufgabenCount > 1 ? 'n' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-text-muted">
                    Krisenhandbuch generieren für Rollenverteilung
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Alarmkette Timeline (kompakt, read-only) ────────
function AlarmketteTimeline({ schritte }: { schritte: AlarmkettenSchritt[] }) {
  const sorted = [...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge)

  return (
    <div className="relative ml-3 space-y-0">
      {sorted.map((schritt, idx) => (
        <div key={schritt.id} className="relative flex items-start gap-3 pb-3">
          {/* Vertical line */}
          {idx < sorted.length - 1 && (
            <div className="absolute left-[7px] top-5 h-full w-0.5 bg-gray-200" />
          )}

          {/* Dot */}
          <div className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-primary">{schritt.rolle}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {schritt.kanaele.map(k => (
                <span key={k} className="text-[10px] text-text-muted">
                  {KANAL_LABELS[k] || k}
                </span>
              ))}
              {schritt.wartezeit_min > 0 && (
                <span className="text-[10px] text-text-muted">
                  · \u23f1 {schritt.wartezeit_min} Min.
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
