import { useState, useEffect } from 'react'
import {
  BookOpen, ChevronDown, ChevronUp, CheckCircle2, Circle, MinusCircle,
  Plus, Trash2, Loader2, Edit3, MessageSquare, Clock,
} from 'lucide-react'
import type { ScenarioHandbookV2, KrisenhandbuchKapitel, KapitelChecklistItem } from '@/types/database'

// ─── Props ───────────────────────────────────────────
interface KrisenhandbuchTabProps {
  handbook: ScenarioHandbookV2
  scenarioId: string
  districtId: string
  onUpdateHandbook: (updated: ScenarioHandbookV2) => Promise<void>
  saving: boolean
  isEditing: boolean
  onStopEditing: () => void
}

// ─── Kapitel-Farben ──────────────────────────────────
const KAPITEL_FARBEN: Record<number, { color: string; bg: string; accent: string }> = {
  1: { color: 'text-red-600', bg: 'bg-red-50', accent: 'bg-red-600' },
  2: { color: 'text-blue-600', bg: 'bg-blue-50', accent: 'bg-blue-600' },
  3: { color: 'text-green-600', bg: 'bg-green-50', accent: 'bg-green-600' },
  4: { color: 'text-amber-600', bg: 'bg-amber-50', accent: 'bg-amber-600' },
  5: { color: 'text-orange-600', bg: 'bg-orange-50', accent: 'bg-orange-600' },
  6: { color: 'text-purple-600', bg: 'bg-purple-50', accent: 'bg-purple-600' },
  7: { color: 'text-teal-600', bg: 'bg-teal-50', accent: 'bg-teal-600' },
}

function getKapitelFarbe(nummer: number) {
  return KAPITEL_FARBEN[nummer] || { color: 'text-gray-600', bg: 'bg-gray-50', accent: 'bg-gray-600' }
}

// ─── Checklisten-Fortschritt ─────────────────────────
function checklistProgress(items: KapitelChecklistItem[]): { done: number; total: number; percent: number } {
  const total = items.length
  const done = items.filter(i => i.status === 'done' || i.status === 'skipped').length
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
}

// ─── Main Component ─────────────────────────────────
export default function KrisenhandbuchTab({
  handbook, scenarioId: _scenarioId, districtId: _districtId, onUpdateHandbook, saving, isEditing, onStopEditing,
}: KrisenhandbuchTabProps) {
  // scenarioId + districtId für zukünftige Features (z.B. Live-Inventar-Abgleich pro Kapitel)
  void _scenarioId; void _districtId
  const kapitel = handbook.kapitel || []
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(kapitel.map(k => k.id)))
  const [editData, setEditData] = useState<KrisenhandbuchKapitel[] | null>(null)
  const [expandedNotiz, setExpandedNotiz] = useState<string | null>(null)

  // ─── Edit-Modus Lifecycle ──────────────────────────
  useEffect(() => {
    if (isEditing && !editData) {
      setEditData(JSON.parse(JSON.stringify(kapitel)))
    }
    if (!isEditing) {
      setEditData(null)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  const cancelEditing = () => {
    setEditData(null)
    onStopEditing()
  }

  const saveEditing = async () => {
    if (!editData) return
    const cleanedKapitel = editData.map(k => ({
      ...k,
      inhalt: k.inhalt.trim(),
      checkliste: k.checkliste.filter(item => item.text.trim()),
    }))
    await onUpdateHandbook({
      ...handbook,
      kapitel: cleanedKapitel,
    })
    onStopEditing()
  }

  // ─── Checklisten-Toggle (auch OHNE Edit-Modus) ────
  const toggleChecklistItem = async (kapitelId: string, itemId: string) => {
    // Direkt im Handbook speichern (kein Edit-Modus nötig)
    const updatedKapitel = kapitel.map(k => {
      if (k.id !== kapitelId) return k
      return {
        ...k,
        checkliste: k.checkliste.map(item => {
          if (item.id !== itemId) return item
          if (item.status === 'open') return { ...item, status: 'done' as const, completed_at: new Date().toISOString() }
          if (item.status === 'done') return { ...item, status: 'skipped' as const, completed_at: null }
          return { ...item, status: 'open' as const, completed_at: null }
        }),
      }
    })
    await onUpdateHandbook({ ...handbook, kapitel: updatedKapitel })
  }

  // ─── Notiz speichern (ohne Edit-Modus) ─────────────
  const saveNotiz = async (kapitelId: string, itemId: string, notiz: string) => {
    const updatedKapitel = kapitel.map(k => {
      if (k.id !== kapitelId) return k
      return {
        ...k,
        checkliste: k.checkliste.map(item =>
          item.id === itemId ? { ...item, notiz } : item
        ),
      }
    })
    await onUpdateHandbook({ ...handbook, kapitel: updatedKapitel })
  }

  // ─── Edit Helpers ──────────────────────────────────
  const updateKapitelInhalt = (kapitelIdx: number, inhalt: string) => {
    setEditData(prev => prev ? prev.map((k, i) => i === kapitelIdx ? { ...k, inhalt } : k) : prev)
  }

  const updateKapitelTitel = (kapitelIdx: number, titel: string) => {
    setEditData(prev => prev ? prev.map((k, i) => i === kapitelIdx ? { ...k, titel } : k) : prev)
  }

  const updateChecklistText = (kapitelIdx: number, itemIdx: number, text: string) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((k, i) => i === kapitelIdx ? {
        ...k,
        checkliste: k.checkliste.map((item, j) => j === itemIdx ? { ...item, text } : item),
      } : k)
    })
  }

  const addChecklistItem = (kapitelIdx: number) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((k, i) => i === kapitelIdx ? {
        ...k,
        checkliste: [...k.checkliste, {
          id: crypto.randomUUID(),
          text: '',
          status: 'open' as const,
          notiz: '',
          completed_at: null,
        }],
      } : k)
    })
  }

  const removeChecklistItem = (kapitelIdx: number, itemIdx: number) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((k, i) => i === kapitelIdx ? {
        ...k,
        checkliste: k.checkliste.filter((_, j) => j !== itemIdx),
      } : k)
    })
  }

  // ─── Accordion ─────────────────────────────────────
  const toggleKapitel = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setExpandedIds(new Set(kapitel.map(k => k.id)))
  const collapseAll = () => setExpandedIds(new Set())

  // ─── Data ──────────────────────────────────────────
  const kapitelData = isEditing && editData ? editData : kapitel

  if (kapitelData.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm text-text-secondary">
          Noch kein Krisenhandbuch vorhanden. Klicken Sie oben auf „KI generieren", um das vollständige Krisenhandbuch zu erstellen.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-text-primary">Krisenhandbuch</h2>
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-700">
            {kapitelData.length} Kapitel
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs font-medium text-primary-600 hover:text-primary-700">
            Alle öffnen
          </button>
          <span className="text-xs text-text-muted">·</span>
          <button onClick={collapseAll} className="text-xs font-medium text-primary-600 hover:text-primary-700">
            Alle schließen
          </button>
        </div>
      </div>

      {/* Kapitel */}
      {kapitelData.map((k, kapitelIdx) => {
        const isOpen = expandedIds.has(k.id)
        const farbe = getKapitelFarbe(k.nummer)
        const progress = checklistProgress(k.checkliste)

        return (
          <div key={k.id} className="rounded-2xl border border-border bg-white">
            {/* Kapitel-Header */}
            <button
              onClick={() => toggleKapitel(k.id)}
              className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-surface-secondary/50"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${farbe.accent} text-sm font-bold text-white`}>
                {k.nummer}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-text-primary">{k.titel}</h3>
                {k.checkliste.length > 0 && !isOpen && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${progress.percent === 100 ? 'bg-green-500' : progress.percent > 0 ? 'bg-primary-500' : 'bg-gray-300'}`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-muted">{progress.done}/{progress.total}</span>
                  </div>
                )}
              </div>
              {isOpen
                ? <ChevronUp className="h-4 w-4 shrink-0 text-text-muted" />
                : <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
              }
            </button>

            {/* Kapitel-Inhalt */}
            {isOpen && (
              <div className="border-t border-border">
                {/* Fließtext */}
                <div className="px-6 py-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text-muted">Kapiteltitel</label>
                        <input
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                          value={k.titel}
                          onChange={(e) => updateKapitelTitel(kapitelIdx, e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-text-muted">Inhalt</label>
                        <textarea
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm leading-relaxed text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                          rows={Math.max(8, k.inhalt.split('\n').length + 2)}
                          value={k.inhalt}
                          onChange={(e) => updateKapitelInhalt(kapitelIdx, e.target.value)}
                          placeholder="Kapitelinhalt eingeben..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-text-secondary">
                      <FormattedText text={k.inhalt} />
                    </div>
                  )}
                </div>

                {/* Checkliste */}
                {(k.checkliste.length > 0 || isEditing) && (
                  <div className="border-t border-dashed border-border px-6 pb-5 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${farbe.color}`} />
                        <span className="text-sm font-bold text-text-primary">Checkliste</span>
                      </div>
                      {k.checkliste.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all ${progress.percent === 100 ? 'bg-green-500' : progress.percent > 0 ? 'bg-primary-500' : 'bg-gray-300'}`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${progress.percent === 100 ? 'text-green-600' : 'text-text-primary'}`}>
                            {progress.done}/{progress.total}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {k.checkliste.map((item, itemIdx) => (
                        <div key={item.id}>
                          {isEditing ? (
                            // Edit-Modus: Text editierbar
                            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                              <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                              <input
                                className="flex-1 rounded border border-border bg-white px-2 py-1 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20"
                                value={item.text}
                                onChange={(e) => updateChecklistText(kapitelIdx, itemIdx, e.target.value)}
                                placeholder="Aufgabe..."
                              />
                              <button
                                onClick={() => removeChecklistItem(kapitelIdx, itemIdx)}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            // Read-Modus: Abhaken + Notiz
                            <div>
                              <button
                                onClick={() => toggleChecklistItem(k.id, item.id)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                                  item.status === 'done' ? 'bg-green-50' :
                                  item.status === 'skipped' ? 'bg-gray-50' :
                                  'hover:bg-surface-secondary'
                                }`}
                              >
                                {item.status === 'done' ? (
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                                ) : item.status === 'skipped' ? (
                                  <MinusCircle className="h-5 w-5 shrink-0 text-gray-400" />
                                ) : (
                                  <Circle className="h-5 w-5 shrink-0 text-text-muted" />
                                )}
                                <span className={`flex-1 text-sm ${
                                  item.status === 'done' ? 'text-green-700 line-through' :
                                  item.status === 'skipped' ? 'text-gray-400 line-through' :
                                  'text-text-primary'
                                }`}>
                                  {item.text}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {item.notiz && (
                                    <MessageSquare className="h-3.5 w-3.5 text-primary-400" />
                                  )}
                                  {item.completed_at && (
                                    <span className="flex items-center gap-1 text-xs text-text-muted">
                                      <Clock className="h-3 w-3" />
                                      {new Date(item.completed_at).toLocaleString('de-DE', {
                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedNotiz(expandedNotiz === item.id ? null : item.id)
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-primary-50 hover:text-primary-600"
                                    title="Notiz hinzufügen/bearbeiten"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                </div>
                              </button>

                              {/* Notiz-Feld (aufklappbar) */}
                              {expandedNotiz === item.id && (
                                <NotizEditor
                                  value={item.notiz}
                                  onSave={(notiz) => {
                                    saveNotiz(k.id, item.id, notiz)
                                    setExpandedNotiz(null)
                                  }}
                                  onCancel={() => setExpandedNotiz(null)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <button
                          onClick={() => addChecklistItem(kapitelIdx)}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                        >
                          <Plus className="h-3 w-3" /> Aufgabe hinzufügen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Speichern/Abbrechen Toolbar */}
      {isEditing && (
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={cancelEditing}
            disabled={saving}
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            Abbrechen
          </button>
          <button
            onClick={saveEditing}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Speichern...</> : 'Speichern'}
          </button>
        </div>
      )}

      {/* Footer-Hinweis */}
      {!isEditing && kapitel.some(k => k.checkliste.length > 0) && (
        <p className="text-center text-xs text-text-muted">
          Klick auf Aufgabe: Offen → Erledigt → Übersprungen → Offen · Stift-Icon für Notizen
        </p>
      )}
    </div>
  )
}

// ─── Notiz-Editor (inline, aufklappbar) ──────────────
function NotizEditor({ value, onSave, onCancel }: {
  value: string
  onSave: (notiz: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(value)

  return (
    <div className="ml-8 mt-1 mb-1 rounded-xl border border-primary-200 bg-primary-50/30 p-3">
      <textarea
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600/20"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Notiz zu diesem Punkt..."
        autoFocus
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-white"
        >
          Abbrechen
        </button>
        <button
          onClick={() => onSave(text)}
          className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Speichern
        </button>
      </div>
    </div>
  )
}

// ─── Formatierter Text (einfaches Markdown-Rendering) ─
function FormattedText({ text }: { text: string }) {
  if (!text) return <p className="text-text-muted italic">Noch kein Inhalt.</p>

  const lines = text.split('\n')

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />

        // H3: ### Überschrift
        if (trimmed.startsWith('### ')) {
          return <h4 key={i} className="mt-3 mb-1 text-sm font-bold text-text-primary">{trimmed.replace('### ', '')}</h4>
        }

        // Bullet: - Text
        if (trimmed.startsWith('- ')) {
          // Check for **bold** in bullet
          const bulletText = trimmed.substring(2)
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(bulletText) }} />
            </div>
          )
        }

        // Regulärer Text
        return <p key={i} className="text-sm leading-relaxed text-text-secondary" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      })}
    </div>
  )
}

// Inline-Formatierung: **bold**, „Zitate"
function formatInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
    .replace(/„([^"]+)"/g, '<em class="text-text-secondary">&bdquo;$1&ldquo;</em>')
}
