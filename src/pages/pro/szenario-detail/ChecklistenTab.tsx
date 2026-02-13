import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ChevronDown, ChevronRight, CheckCircle2, Circle, MinusCircle, Plus, Clock } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbChecklist, ChecklistItem } from '@/types/database'

interface ChecklistenTabProps {
  scenarioId: string
  districtId: string
}

function progressPercent(items: ChecklistItem[]): number {
  if (!items || items.length === 0) return 0
  const done = items.filter(i => i.status === 'done' || i.status === 'skipped').length
  return Math.round((done / items.length) * 100)
}

export default function ChecklistenTab({ scenarioId, districtId }: ChecklistenTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: checklists, loading, refetch } = useSupabaseQuery<DbChecklist>(
    (sb) =>
      sb
        .from('checklists')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false }),
    [scenarioId]
  )

  // Toggle item status: open → done → skipped → open
  const toggleItem = async (checklist: DbChecklist, itemId: string) => {
    const updatedItems = (checklist.items as ChecklistItem[]).map((item) => {
      if (item.id !== itemId) return item
      if (item.status === 'open') {
        return { ...item, status: 'done' as const, completed_at: new Date().toISOString(), completed_by: null }
      } else if (item.status === 'done') {
        return { ...item, status: 'skipped' as const, completed_at: null, completed_by: null }
      } else {
        return { ...item, status: 'open' as const, completed_at: null, completed_by: null }
      }
    })

    try {
      const { error } = await supabase
        .from('checklists')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', checklist.id)
        .eq('district_id', districtId)
      if (error) throw error
      refetch()
    } catch (err) {
      console.error('Item-Status aktualisieren fehlgeschlagen:', err)
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-text-muted">Lade Checklisten...</p>
  }

  return (
    <div className="space-y-4">
      {/* Hint + Link zu Checklisten-Seite */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
            <ClipboardList className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-text-primary">{checklists.length} Checkliste{checklists.length !== 1 ? 'n' : ''} zugeordnet</p>
            <p className="text-sm text-text-secondary">Klicken Sie auf Aufgaben um den Status zu ändern</p>
          </div>
        </div>
        <Link
          to="/pro/checklisten"
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Neue Checkliste
        </Link>
      </div>

      {/* Checklisten-Accordion */}
      {checklists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Noch keine Checklisten für dieses Szenario.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Erstellen Sie eine neue Checkliste auf der{' '}
            <Link to="/pro/checklisten" className="text-primary-600 hover:text-primary-700 underline">
              Checklisten-Seite
            </Link>.
          </p>
        </div>
      ) : (
        checklists.map(cl => {
          const isExpanded = expandedId === cl.id
          const items = cl.items as ChecklistItem[]
          const progress = progressPercent(items)
          const doneCount = items.filter(i => i.status === 'done').length

          return (
            <div key={cl.id} className="rounded-2xl border border-border bg-white">
              {/* Header (klickbar) */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : cl.id)}
                className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-surface-secondary/50"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-text-muted" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-text-primary">{cl.title}</h4>
                  {cl.description && (
                    <p className="mt-0.5 text-sm text-text-secondary">{cl.description}</p>
                  )}
                </div>
                {/* Progress */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-muted">
                    {doneCount}/{items.length}
                  </span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-primary-600' : 'bg-gray-300'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">{progress}%</span>
                </div>
              </button>

              {/* Items (expandiert) — klickbar für Status-Toggle */}
              {isExpanded && (
                <div className="border-t border-border px-5 pb-5 pt-3">
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(cl, item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          item.status === 'done'
                            ? 'bg-green-50'
                            : item.status === 'skipped'
                            ? 'bg-gray-50'
                            : 'hover:bg-surface-secondary'
                        }`}
                      >
                        {item.status === 'done' ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                        ) : item.status === 'skipped' ? (
                          <MinusCircle className="h-5 w-5 shrink-0 text-gray-400" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-text-muted" />
                        )}
                        <span
                          className={`flex-1 text-sm ${
                            item.status === 'done'
                              ? 'text-green-700 line-through'
                              : item.status === 'skipped'
                              ? 'text-gray-400 line-through'
                              : 'text-text-primary'
                          }`}
                        >
                          {item.text}
                        </span>
                        {item.completed_at && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="h-3 w-3" />
                            {new Date(item.completed_at).toLocaleString('de-DE', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-text-muted">
                    Klick: Offen → Erledigt → Übersprungen → Offen
                  </p>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
