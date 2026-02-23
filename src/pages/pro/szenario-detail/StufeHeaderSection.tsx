/**
 * StufeHeaderSection — Auslöser, Eskalationskriterien & Lage
 *
 * Zeigt oben auf jeder Stufe:
 * - Auslösekriterien (wann wird diese Stufe aktiviert)
 * - Eskalationskriterien (wann wird zur nächsten Stufe eskaliert)
 * - Lage-Zusammenfassung (editierbar)
 */
import { useState } from 'react'
import {
  AlertTriangle, ArrowUpRight, FileText,
  Plus, Trash2, X, Save,
} from 'lucide-react'
import type { EskalationsStufe } from '@/types/database'
import { ESKALATION_COLORS } from './helpers/eskalation-defaults'

interface StufeHeaderSectionProps {
  stufe: EskalationsStufe
  stufeIdx: number
  onChange: (stufeIdx: number, update: Partial<EskalationsStufe>) => void
}

export default function StufeHeaderSection({
  stufe, stufeIdx, onChange,
}: StufeHeaderSectionProps) {
  const colors = ESKALATION_COLORS[stufe.stufe]
  const [editingLage, setEditingLage] = useState(false)
  const [lageText, setLageText] = useState(stufe.lage_zusammenfassung || '')
  const [newAusloeser, setNewAusloeser] = useState('')
  const [newEskalation, setNewEskalation] = useState('')

  // ─── Auslöser ──────────────────
  const addAusloeser = () => {
    const t = newAusloeser.trim()
    if (!t) return
    onChange(stufeIdx, { ausloeser: [...(stufe.ausloeser || []), t] })
    setNewAusloeser('')
  }
  const removeAusloeser = (idx: number) => {
    onChange(stufeIdx, { ausloeser: (stufe.ausloeser || []).filter((_, i) => i !== idx) })
  }

  // ─── Eskalationskriterien ──────
  const addEskalation = () => {
    const t = newEskalation.trim()
    if (!t) return
    onChange(stufeIdx, { eskalations_kriterien: [...(stufe.eskalations_kriterien || []), t] })
    setNewEskalation('')
  }
  const removeEskalation = (idx: number) => {
    onChange(stufeIdx, { eskalations_kriterien: (stufe.eskalations_kriterien || []).filter((_, i) => i !== idx) })
  }

  // ─── Lage ──────────────────────
  const saveLage = () => {
    onChange(stufeIdx, { lage_zusammenfassung: lageText.trim() || undefined })
    setEditingLage(false)
  }

  return (
    <div className={`rounded-2xl border ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-3.5 ${colors.headerBg}`}>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${colors.dot} text-sm font-bold text-white`}>
          {stufe.stufe}
        </span>
        <div className="flex-1">
          <span className={`font-bold ${colors.text}`}>{stufe.name}</span>
          <p className="text-xs text-text-muted">{stufe.beschreibung}</p>
        </div>
      </div>

      {/* Content Grid: 3 Sections */}
      <div className="grid gap-4 border-t border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">

        {/* ─── Auslösekriterien ─── */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Auslösekriterien
          </h4>
          <p className="mb-2 text-[11px] text-text-muted">
            Wann wird Stufe {stufe.stufe} aktiviert?
          </p>

          {(stufe.ausloeser || []).length > 0 ? (
            <ul className="space-y-1.5">
              {(stufe.ausloeser || []).map((a, i) => (
                <li key={i} className="group flex items-start gap-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
                  <span className="flex-1 text-xs text-text-secondary">{a}</span>
                  <button
                    onClick={() => removeAusloeser(i)}
                    className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs italic text-text-muted">Keine Kriterien definiert</p>
          )}

          {/* Inline-Add */}
          <div className="mt-2 flex gap-1.5">
            <input
              className="flex-1 rounded-lg border border-border bg-surface-secondary/30 px-2.5 py-1.5 text-xs outline-none focus:border-primary-300"
              placeholder="Neues Kriterium..."
              value={newAusloeser}
              onChange={(e) => setNewAusloeser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAusloeser()}
            />
            <button
              onClick={addAusloeser}
              disabled={!newAusloeser.trim()}
              className="rounded-lg bg-surface-secondary px-2 py-1.5 text-xs text-text-secondary hover:bg-gray-200 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ─── Eskalationskriterien ─── */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            Eskalation zur nächsten Stufe
          </h4>
          <p className="mb-2 text-[11px] text-text-muted">
            {stufe.stufe < 3
              ? `Wann wird auf Stufe ${stufe.stufe + 1} eskaliert?`
              : 'Höchste Eskalationsstufe erreicht'}
          </p>

          {(stufe.eskalations_kriterien || []).length > 0 ? (
            <ul className="space-y-1.5">
              {(stufe.eskalations_kriterien || []).map((e, i) => (
                <li key={i} className="group flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                  <span className="flex-1 text-xs text-text-secondary">{e}</span>
                  <button
                    onClick={() => removeEskalation(i)}
                    className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs italic text-text-muted">
              {stufe.stufe < 3 ? 'Keine Kriterien definiert' : 'Höchste Stufe'}
            </p>
          )}

          {stufe.stufe < 3 && (
            <div className="mt-2 flex gap-1.5">
              <input
                className="flex-1 rounded-lg border border-border bg-surface-secondary/30 px-2.5 py-1.5 text-xs outline-none focus:border-primary-300"
                placeholder="Eskalationskriterium..."
                value={newEskalation}
                onChange={(e) => setNewEskalation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEskalation()}
              />
              <button
                onClick={addEskalation}
                disabled={!newEskalation.trim()}
                className="rounded-lg bg-surface-secondary px-2 py-1.5 text-xs text-text-secondary hover:bg-gray-200 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ─── Lage-Zusammenfassung ─── */}
        <div className="sm:col-span-2 lg:col-span-1">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
            <FileText className="h-4 w-4 text-blue-500" />
            Lagezusammenfassung
          </h4>
          <p className="mb-2 text-[11px] text-text-muted">
            Situationsbeschreibung auf dieser Eskalationsstufe
          </p>

          {editingLage ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs leading-relaxed text-text-secondary outline-none focus:border-primary-300"
                rows={4}
                value={lageText}
                onChange={(e) => setLageText(e.target.value)}
                placeholder="Beschreiben Sie die Lage bei Aktivierung dieser Stufe..."
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setEditingLage(false); setLageText(stufe.lage_zusammenfassung || '') }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-text-muted hover:bg-surface-secondary"
                >
                  <X className="h-3 w-3" /> Abbrechen
                </button>
                <button
                  onClick={saveLage}
                  className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  <Save className="h-3 w-3" /> Speichern
                </button>
              </div>
            </div>
          ) : stufe.lage_zusammenfassung ? (
            <div
              className="cursor-pointer rounded-lg bg-surface-secondary/30 px-3 py-2.5 text-xs leading-relaxed text-text-secondary transition-colors hover:bg-surface-secondary/50"
              onClick={() => { setLageText(stufe.lage_zusammenfassung || ''); setEditingLage(true) }}
            >
              {stufe.lage_zusammenfassung}
            </div>
          ) : (
            <button
              onClick={() => setEditingLage(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border py-3 text-xs text-text-muted transition-colors hover:border-primary-300 hover:text-primary-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Lage beschreiben
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
