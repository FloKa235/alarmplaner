/**
 * ExTrassChecklistView — 18 Vorbereitungs-Checklisten (ExTrass/Johanniter/BBK)
 *
 * Landkreis-weite Vorbereitung, NICHT szenario-spezifisch.
 * 4-Status: Erfüllt | Teilweise erfüllt | Nicht erfüllt | Kein Bedarf
 * Optimistic Updates, Item-Edit/Delete/Add.
 */
import { useState, useMemo, useEffect } from 'react'
import {
  ClipboardCheck, ChevronDown, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, XCircle, MinusCircle,
  Sparkles, Trash2, Plus, Pencil, Check, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { DbChecklist, ChecklistItem } from '@/types/database'
import { PREPARATION_CHECKLISTS } from '@/data/preparation-checklists'

// ─── Types ────────────────────────────────────────────
type StatusKey = ChecklistItem['status']

interface ExTrassChecklistViewProps {
  checklists: DbChecklist[]
  scopeId: string
  scopeColumn: 'district_id' | 'organization_id'
  loading?: boolean
  onRefetch: () => void
  hideStats?: boolean
}

// ─── Status-Config ───────────────────────────────────
const STATUS_OPTIONS: {
  key: StatusKey; label: string; shortLabel: string
  icon: typeof CheckCircle2
  activeClasses: string
}[] = [
  { key: 'done',    label: 'Erfüllt',            shortLabel: 'Ja',   icon: CheckCircle2, activeClasses: 'bg-green-600 text-white ring-green-600' },
  { key: 'partial', label: 'Teilweise erfüllt',   shortLabel: 'Teil', icon: AlertCircle,  activeClasses: 'bg-amber-500 text-white ring-amber-500' },
  { key: 'open',    label: 'Nicht erfüllt',        shortLabel: 'Nein', icon: XCircle,      activeClasses: 'bg-red-500 text-white ring-red-500' },
  { key: 'skipped', label: 'Kein Bedarf',          shortLabel: 'K.B.', icon: MinusCircle,  activeClasses: 'bg-gray-400 text-white ring-gray-400' },
]

const STATUS_SUMMARY: Record<StatusKey, { label: string; bg: string; text: string }> = {
  done:    { label: 'Erfüllt',       bg: 'bg-green-50', text: 'text-green-700' },
  partial: { label: 'Teilweise',     bg: 'bg-amber-50', text: 'text-amber-700' },
  open:    { label: 'Nicht erfüllt', bg: 'bg-red-50',   text: 'text-red-700' },
  skipped: { label: 'Kein Bedarf',   bg: 'bg-gray-50',  text: 'text-gray-500' },
}

/** Numerisch sortieren: "2. Foo" < "10. Bar" */
function sortByNummer(a: DbChecklist, b: DbChecklist): number {
  const numA = parseInt(a.title.match(/^(\d+)\./)?.[1] || '0', 10)
  const numB = parseInt(b.title.match(/^(\d+)\./)?.[1] || '0', 10)
  return numA - numB
}

// ─── Component ──────────────────────────────────────
export default function ExTrassChecklistView({
  checklists: checklistsProp,
  scopeId,
  scopeColumn,
  loading,
  onRefetch,
  hideStats,
}: ExTrassChecklistViewProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [addingToChecklist, setAddingToChecklist] = useState<string | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [editingItem, setEditingItem] = useState<{ checklistId: string; itemId: string } | null>(null)
  const [editText, setEditText] = useState('')

  // Lokaler State für Optimistic Updates
  const [localData, setLocalData] = useState<DbChecklist[]>([])
  useEffect(() => { setLocalData(checklistsProp) }, [checklistsProp])

  const checklists = useMemo(() => [...localData].sort(sortByNummer), [localData])

  // ─── Summary Stats ──────────────────────────────────
  const stats = useMemo(() => {
    const allItems = checklists.flatMap(c => c.items)
    return {
      total: allItems.length,
      done: allItems.filter(i => i.status === 'done').length,
      partial: allItems.filter(i => i.status === 'partial').length,
      open: allItems.filter(i => i.status === 'open').length,
      skipped: allItems.filter(i => i.status === 'skipped').length,
    }
  }, [checklists])

  const pct = stats.total > 0 ? Math.round(((stats.done + stats.partial * 0.5) / stats.total) * 100) : 0

  // ─── Erstinitialisierung (Landkreis-weit) ─────────
  const handleCreate = async () => {
    setCreating(true)
    try {
      const rows = PREPARATION_CHECKLISTS.map(cat => ({
        [scopeColumn]: scopeId,
        scenario_id: null, // Landkreis-weit, nicht szenario-spezifisch
        title: `${cat.nummer}. ${cat.title}`,
        description: cat.beschreibung,
        category: 'vorbereitung' as const,
        is_template: false,
        items: cat.items.map(item => ({
          id: item.id,
          text: item.text,
          status: 'open' as const,
          completed_at: null,
          completed_by: null,
        })),
      }))

      const { error } = await supabase.from('checklists').insert(rows)
      if (error) throw error
      onRefetch()
    } catch (err) {
      console.error('Fehler beim Erstellen der Checklisten:', err)
    } finally {
      setCreating(false)
    }
  }

  // ─── Helpers ──────────────────────────────────────
  const updateLocalChecklist = (checklistId: string, updatedItems: ChecklistItem[]) => {
    setLocalData(prev => prev.map(c =>
      c.id === checklistId ? { ...c, items: updatedItems } : c
    ))
  }

  const handleSetStatus = async (checklist: DbChecklist, itemId: string, newStatus: StatusKey) => {
    const updatedItems = checklist.items.map(item =>
      item.id === itemId
        ? {
            ...item,
            status: newStatus,
            completed_at: newStatus === 'done' ? new Date().toISOString() : item.completed_at,
          }
        : item
    )
    updateLocalChecklist(checklist.id, updatedItems)
    try {
      const { error } = await supabase
        .from('checklists')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)
      if (error) throw error
    } catch (err) {
      console.error('Fehler beim Aktualisieren:', err)
      onRefetch()
    }
  }

  const handleDeleteItem = async (checklist: DbChecklist, itemId: string) => {
    const updatedItems = checklist.items.filter(item => item.id !== itemId)
    updateLocalChecklist(checklist.id, updatedItems)
    try {
      const { error } = await supabase
        .from('checklists')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)
      if (error) throw error
    } catch (err) {
      console.error('Fehler beim Löschen:', err)
      onRefetch()
    }
  }

  const handleEditItem = async (checklist: DbChecklist, itemId: string) => {
    if (!editText.trim()) return
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, text: editText.trim() } : item
    )
    updateLocalChecklist(checklist.id, updatedItems)
    setEditingItem(null)
    setEditText('')
    try {
      const { error } = await supabase
        .from('checklists')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)
      if (error) throw error
    } catch (err) {
      console.error('Fehler beim Bearbeiten:', err)
      onRefetch()
    }
  }

  const handleAddItem = async (checklist: DbChecklist) => {
    if (!newItemText.trim()) return
    const prefix = checklist.title.match(/^(\d+)\./)?.[1] || '0'
    const existingNums = checklist.items.map(i => {
      const match = i.id.match(/\.(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1
    const newItem: ChecklistItem = {
      id: `${prefix}.${nextNum}`,
      text: newItemText.trim(),
      status: 'open',
      completed_at: null,
      completed_by: null,
    }
    const updatedItems = [...checklist.items, newItem]
    updateLocalChecklist(checklist.id, updatedItems)
    setNewItemText('')
    setAddingToChecklist(null)
    try {
      const { error } = await supabase
        .from('checklists')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)
      if (error) throw error
    } catch (err) {
      console.error('Fehler beim Hinzufügen:', err)
      onRefetch()
    }
  }

  const toggleExpanded = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ─── Loading ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    )
  }

  // ─── Leerer Zustand → Erstinitialisierung ──────────
  if (checklists.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-text-muted" />
        <h3 className="mb-1 text-base font-semibold text-text-primary">
          Vorbereitungs-Checklisten (ExTrass)
        </h3>
        <p className="mb-4 text-sm text-text-secondary">
          Erstellen Sie die 18 ExTrass-Checklisten (Johanniter/BBK) zur systematischen Vorbereitung Ihres Landkreises auf Krisensituationen.
          Die Checklisten können danach individuell angepasst werden.
        </p>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          ExTrass-Checklisten anlegen
        </button>
        <p className="mt-3 text-xs text-text-muted">
          18 Kategorien mit {PREPARATION_CHECKLISTS.reduce((s, c) => s + c.items.length, 0)} Prüfpunkten — individuell anpassbar
        </p>
      </div>
    )
  }

  // ─── Hauptansicht ───────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Summary Stats (hidden when parent provides own hero stats) */}
      {!hideStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-text-primary">{pct}%</p>
            <p className="text-xs text-text-secondary">Erfüllungsgrad</p>
          </div>
          {(['done', 'partial', 'open', 'skipped'] as const).map(status => {
            const cfg = STATUS_SUMMARY[status]
            const count = stats[status]
            return (
              <div key={status} className={`rounded-xl border border-border p-4 text-center ${cfg.bg}`}>
                <p className={`text-2xl font-bold ${cfg.text}`}>{count}</p>
                <p className="text-xs text-text-secondary">{cfg.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Accordion: 18 Kategorien */}
      {checklists.map(checklist => {
        const isExpanded = expandedKeys.has(checklist.id)
        const items = checklist.items || []
        const catDone = items.filter(i => i.status === 'done').length
        const catPartial = items.filter(i => i.status === 'partial').length
        const catSkipped = items.filter(i => i.status === 'skipped').length
        const catProgress = items.length > 0
          ? Math.round(((catDone + catPartial * 0.5 + catSkipped) / items.length) * 100)
          : 0

        return (
          <div key={checklist.id} className="rounded-xl border border-border bg-white overflow-hidden">
            <button
              onClick={() => toggleExpanded(checklist.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              {isExpanded
                ? <ChevronDown className="h-4 w-4 flex-shrink-0 text-text-muted" />
                : <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-muted" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">{checklist.title}</span>
                  <span className="text-xs text-text-muted">{catDone}/{items.length}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="flex h-full">
                    <div className="bg-green-500 transition-all" style={{ width: `${items.length > 0 ? (catDone / items.length) * 100 : 0}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${items.length > 0 ? (catPartial / items.length) * 100 : 0}%` }} />
                    <div className="bg-gray-300 transition-all" style={{ width: `${items.length > 0 ? (catSkipped / items.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                catProgress >= 80 ? 'bg-green-50 text-green-700' :
                catProgress >= 40 ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              }`}>
                {catProgress}%
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-border">
                {checklist.description && (
                  <p className="px-4 pt-3 pb-1 text-xs text-text-muted italic">{checklist.description}</p>
                )}

                <div className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const isEditing = editingItem?.checklistId === checklist.id && editingItem?.itemId === item.id

                    return (
                      <div key={item.id} className="group flex items-start gap-3 px-4 py-2.5">
                        <span className="mt-0.5 w-6 flex-shrink-0 text-xs font-medium text-text-muted tabular-nums text-right">
                          {idx + 1}.
                        </span>

                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleEditItem(checklist, item.id)
                                  if (e.key === 'Escape') { setEditingItem(null); setEditText('') }
                                }}
                                autoFocus
                                className="flex-1 rounded-md border border-primary-300 bg-white px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-400"
                              />
                              <button
                                onClick={() => handleEditItem(checklist, item.id)}
                                disabled={!editText.trim()}
                                className="rounded-md p-1 text-green-600 hover:bg-green-50 disabled:opacity-40"
                                title="Speichern"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => { setEditingItem(null); setEditText('') }}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100"
                                title="Abbrechen"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <p className={`text-sm leading-snug ${
                              item.status === 'done' ? 'text-text-secondary' :
                              item.status === 'skipped' ? 'text-text-muted' :
                              'text-text-primary'
                            }`}>
                              {item.text}
                            </p>
                          )}
                        </div>

                        {!isEditing && (
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <button
                              onClick={() => { setEditingItem({ checklistId: checklist.id, itemId: item.id }); setEditText(item.text) }}
                              title="Bearbeiten"
                              className="rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(checklist, item.id)}
                              title="Entfernen"
                              className="rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <div className="mx-0.5 h-4 w-px bg-gray-200" />
                            {STATUS_OPTIONS.map(opt => {
                              const isActive = item.status === opt.key
                              return (
                                <button
                                  key={opt.key}
                                  onClick={() => handleSetStatus(checklist, item.id, opt.key)}
                                  title={opt.label}
                                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                                    isActive
                                      ? `${opt.activeClasses} ring-1`
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                  }`}
                                >
                                  {opt.shortLabel}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-gray-100 px-4 py-2.5">
                  {addingToChecklist === checklist.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem(checklist)
                          if (e.key === 'Escape') { setAddingToChecklist(null); setNewItemText('') }
                        }}
                        placeholder="Neuen Prüfpunkt eingeben..."
                        autoFocus
                        className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      />
                      <button
                        onClick={() => handleAddItem(checklist)}
                        disabled={!newItemText.trim()}
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                      >
                        Hinzufügen
                      </button>
                      <button
                        onClick={() => { setAddingToChecklist(null); setNewItemText('') }}
                        className="rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-gray-100"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingToChecklist(checklist.id); setNewItemText('') }}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Punkt hinzufügen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <p className="text-center text-xs text-text-muted">
        Basierend auf dem ExTrass-Leitfaden (Johanniter/BBK) — individuell anpassbar
      </p>
    </div>
  )
}
