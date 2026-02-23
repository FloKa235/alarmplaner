/**
 * HandlungsplanSection — Tab "Handlungsplan"
 *
 * Operativer Ablaufplan, gegliedert nach 3 Eskalationsstufen.
 * Alle Stufen immer sichtbar (kein Accordion), Schritte direkt lesbar.
 * Jeder Schritt: nummerierter Titel + Beschreibung, editierbar.
 */
import { useState } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  Sparkles,
} from 'lucide-react'
import type {
  EskalationsStufe, EskalationsChecklistItem,
  ScenarioHandbookV3,
} from '@/types/database'
import { ESKALATION_COLORS } from './helpers/eskalation-defaults'
import { findKapitelByKey } from './helpers/handbook-extract'

// ─── Types ────────────────────────────────────────────
interface HandlungsplanSectionProps {
  eskalationsstufen: EskalationsStufe[]
  handbook: ScenarioHandbookV3 | null
  onChange: (stufen: EskalationsStufe[]) => void
  /** Wenn gesetzt, wird nur diese eine Stufe (0/1/2) angezeigt */
  filterStufeIdx?: number
}

// ─── KI-Aufgaben aus Handbook Kap.4 extrahieren ──────
function extractAktivierungsAufgaben(handbook: ScenarioHandbookV3): string[] {
  const kap = findKapitelByKey(handbook, 'aktivierung', 4)
  if (!kap) return []

  const text = kap.inhalt.replace(/<[^>]+>/g, '\n')
  const aufgaben: string[] = []

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if ((trimmed.startsWith('-') || trimmed.startsWith('\u2022')) && trimmed.length > 5) {
      aufgaben.push(trimmed.replace(/^[-\u2022]\s*/, ''))
    }
  }

  return aufgaben
}

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════
export default function HandlungsplanSection({
  eskalationsstufen, handbook, onChange, filterStufeIdx,
}: HandlungsplanSectionProps) {
  const [addingToStufe, setAddingToStufe] = useState<number | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')

  // KI-Aufgaben aus Handbook
  const kiAufgaben = handbook ? extractAktivierungsAufgaben(handbook) : []

  // ─── Mutations ───────────────────────────────
  const updateStufe = (stufeIdx: number, update: Partial<EskalationsStufe>) => {
    const copy = eskalationsstufen.map((s, i) => i === stufeIdx ? { ...s, ...update } : s)
    onChange(copy)
  }

  const addStep = (stufeIdx: number) => {
    const title = newStepTitle.trim()
    if (!title) return
    const stufe = eskalationsstufen[stufeIdx]
    const newItem: EskalationsChecklistItem = {
      id: crypto.randomUUID(),
      text: title,
      beschreibung: '',
      status: 'open',
      completed_at: null,
    }
    updateStufe(stufeIdx, { checkliste: [...stufe.checkliste, newItem] })
    setNewStepTitle('')
    setAddingToStufe(null)
  }

  const removeStep = (stufeIdx: number, itemId: string) => {
    const stufe = eskalationsstufen[stufeIdx]
    updateStufe(stufeIdx, {
      checkliste: stufe.checkliste.filter(i => i.id !== itemId),
    })
  }

  const updateStepTitle = (stufeIdx: number, itemId: string, newText: string) => {
    const stufe = eskalationsstufen[stufeIdx]
    updateStufe(stufeIdx, {
      checkliste: stufe.checkliste.map(i =>
        i.id === itemId ? { ...i, text: newText } : i
      ),
    })
  }

  const updateStepBeschreibung = (stufeIdx: number, itemId: string, beschreibung: string) => {
    const stufe = eskalationsstufen[stufeIdx]
    updateStufe(stufeIdx, {
      checkliste: stufe.checkliste.map(i =>
        i.id === itemId ? { ...i, beschreibung } : i
      ),
    })
  }

  const moveStep = (stufeIdx: number, itemIdx: number, direction: 'up' | 'down') => {
    const stufe = eskalationsstufen[stufeIdx]
    const items = [...stufe.checkliste]
    const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1
    if (targetIdx < 0 || targetIdx >= items.length) return
    ;[items[itemIdx], items[targetIdx]] = [items[targetIdx], items[itemIdx]]
    updateStufe(stufeIdx, { checkliste: items })
  }

  // KI-Aufgaben in eine Stufe importieren
  const importKIAufgaben = (stufeIdx: number) => {
    const stufe = eskalationsstufen[stufeIdx]
    const existingTexts = new Set(stufe.checkliste.map(c => c.text.toLowerCase()))
    const newItems: EskalationsChecklistItem[] = kiAufgaben
      .filter(a => !existingTexts.has(a.toLowerCase()))
      .map(text => ({
        id: crypto.randomUUID(),
        text,
        beschreibung: '',
        status: 'open' as const,
        completed_at: null,
      }))
    if (newItems.length > 0) {
      updateStufe(stufeIdx, { checkliste: [...stufe.checkliste, ...newItems] })
    }
  }

  // Gefilterte oder alle Stufen
  const displayStufen = filterStufeIdx !== undefined
    ? eskalationsstufen.slice(filterStufeIdx, filterStufeIdx + 1).map((s, _) => ({ stufe: s, originalIdx: filterStufeIdx }))
    : eskalationsstufen.map((s, i) => ({ stufe: s, originalIdx: i }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Handlungsplan</h2>
        <p className="text-xs text-text-muted">Schritt-für-Schritt-Abarbeitung im Krisenfall</p>
      </div>

      {displayStufen.map(({ stufe, originalIdx: stufeIdx }) => {
        const colors = ESKALATION_COLORS[stufe.stufe]

        return (
          <div key={stufe.stufe} className="space-y-3">
            {/* ─── Stufen-Header ─── */}
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.dot} text-sm font-bold text-white`}>
                {stufe.stufe}
              </span>
              <div>
                <h3 className="text-sm font-bold text-text-primary">{stufe.name}</h3>
                <p className="text-xs text-text-muted">{stufe.beschreibung}</p>
              </div>
            </div>

            {/* ─── Schritte ─── */}
            {stufe.checkliste.length > 0 ? (
              <div className="ml-4 border-l-2 border-border pl-5 space-y-2">
                {stufe.checkliste.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-border bg-white p-4 transition-colors hover:border-primary-200"
                  >
                    <div className="flex items-start gap-3">
                      {/* Nummer-Badge */}
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${colors.bg} mt-0.5`}>
                        <span className={`text-[11px] font-bold ${colors.text}`}>{itemIdx + 1}</span>
                      </div>

                      {/* Inhalt */}
                      <div className="flex-1 min-w-0">
                        <input
                          className="w-full bg-transparent text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted"
                          value={item.text}
                          onChange={(e) => updateStepTitle(stufeIdx, item.id, e.target.value)}
                          placeholder="Schritt-Titel..."
                        />
                        <textarea
                          className="mt-1 w-full resize-none bg-transparent text-xs leading-relaxed text-text-secondary outline-none placeholder:text-text-muted/60 focus:rounded-lg focus:border focus:border-border focus:bg-surface-secondary/30 focus:px-2.5 focus:py-1.5"
                          rows={item.beschreibung ? Math.min(Math.max(item.beschreibung.split('\n').length, 1), 4) : 1}
                          value={item.beschreibung || ''}
                          onChange={(e) => updateStepBeschreibung(stufeIdx, item.id, e.target.value)}
                          placeholder="Beschreibung hinzufügen..."
                        />
                      </div>

                      {/* Actions (sichtbar auf Touch, voll sichtbar auf Hover) */}
                      <div className="flex shrink-0 items-center gap-0.5 opacity-40 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          onClick={() => moveStep(stufeIdx, itemIdx, 'up')}
                          disabled={itemIdx === 0}
                          className="rounded p-1 text-gray-400 hover:bg-surface-secondary hover:text-text-primary disabled:opacity-30"
                          title="Nach oben"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveStep(stufeIdx, itemIdx, 'down')}
                          disabled={itemIdx === stufe.checkliste.length - 1}
                          className="rounded p-1 text-gray-400 hover:bg-surface-secondary hover:text-text-primary disabled:opacity-30"
                          title="Nach unten"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeStep(stufeIdx, item.id)}
                          className="rounded p-1 text-gray-400 hover:text-red-500"
                          title="Entfernen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Schritt hinzufügen (inline) */}
                {addingToStufe === stufeIdx ? (
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary-200 bg-primary-50/20 p-3">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${colors.bg}`}>
                      <span className={`text-[11px] font-bold ${colors.text}`}>{stufe.checkliste.length + 1}</span>
                    </div>
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                      placeholder="Neuer Schritt..."
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addStep(stufeIdx) }
                        if (e.key === 'Escape') { setAddingToStufe(null); setNewStepTitle('') }
                      }}
                    />
                    <button
                      onClick={() => addStep(stufeIdx)}
                      disabled={!newStepTitle.trim()}
                      className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      Hinzufügen
                    </button>
                    <button
                      onClick={() => { setAddingToStufe(null); setNewStepTitle('') }}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingToStufe(stufeIdx); setNewStepTitle('') }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-text-muted transition-colors hover:border-primary-300 hover:text-primary-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Schritt hinzufügen
                  </button>
                )}
              </div>
            ) : (
              <div className="ml-4 border-l-2 border-border pl-5 space-y-2">
                <p className="rounded-xl bg-surface-secondary/30 px-4 py-4 text-center text-xs italic text-text-muted">
                  Noch keine Schritte definiert
                </p>

                {/* Schritt hinzufügen */}
                {addingToStufe === stufeIdx ? (
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary-200 bg-primary-50/20 p-3">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${colors.bg}`}>
                      <span className={`text-[11px] font-bold ${colors.text}`}>1</span>
                    </div>
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                      placeholder="Erster Schritt..."
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addStep(stufeIdx) }
                        if (e.key === 'Escape') { setAddingToStufe(null); setNewStepTitle('') }
                      }}
                    />
                    <button
                      onClick={() => addStep(stufeIdx)}
                      disabled={!newStepTitle.trim()}
                      className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      Hinzufügen
                    </button>
                    <button
                      onClick={() => { setAddingToStufe(null); setNewStepTitle('') }}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingToStufe(stufeIdx); setNewStepTitle('') }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-text-muted transition-colors hover:border-primary-300 hover:text-primary-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Schritt hinzufügen
                  </button>
                )}

                {/* KI-Aufgaben übernehmen */}
                {kiAufgaben.length > 0 && (
                  <button
                    onClick={() => importKIAufgaben(stufeIdx)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 py-2.5 text-xs font-medium text-violet-600 hover:border-violet-300 hover:bg-violet-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    KI-Schritte übernehmen ({kiAufgaben.length} Maßnahmen)
                  </button>
                )}
              </div>
            )}

            {/* Trennlinie zwischen Stufen (außer nach letzter) */}
            {stufeIdx < eskalationsstufen.length - 1 && (
              <div className="border-b border-border" />
            )}
          </div>
        )
      })}
    </div>
  )
}
