/**
 * ChecklistenSection — Szenario-spezifische operative Checklisten
 *
 * Zeigt Checklisten die zu DIESEM Szenario gehören (nicht ExTrass/Vorbereitung).
 * ExTrass gelten landkreisweit → Hinweis-Banner mit Link zu /pro/vorbereitung.
 * Status-Toggle: Offen → Erledigt → Übersprungen → Offen.
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, CheckCircle2, Circle, MinusCircle,
  Clock, ChevronDown, ChevronRight, ArrowUpRight,
  Loader2,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbChecklist, ChecklistItem } from '@/types/database'

interface ChecklistenSectionProps {
  scenarioId: string
  districtId: string
}

const categoryConfig: Record<string, { label: string; bg: string; color: string }> = {
  krisenstab: { label: 'Krisenstab', bg: 'bg-red-50', color: 'text-red-600' },
  sofortmassnahmen: { label: 'Sofortmaßnahmen', bg: 'bg-amber-50', color: 'text-amber-600' },
  kommunikation: { label: 'Kommunikation', bg: 'bg-blue-50', color: 'text-blue-600' },
  nachbereitung: { label: 'Nachbereitung', bg: 'bg-green-50', color: 'text-green-600' },
  custom: { label: 'Benutzerdefiniert', bg: 'bg-gray-50', color: 'text-gray-600' },
}

export default function ChecklistenSection({
  scenarioId, districtId,
}: ChecklistenSectionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Szenario-spezifische Checklisten (NICHT vorbereitung)
  const { data: checklists, loading, refetch } = useSupabaseQuery<DbChecklist>(
    (sb) => sb.from('checklists').select('*')
      .eq('scenario_id', scenarioId)
      .neq('category', 'vorbereitung')
      .order('created_at', { ascending: false }),
    [scenarioId]
  )

  const stats = useMemo(() => {
    let total = 0, done = 0
    for (const cl of checklists) {
      for (const item of cl.items as ChecklistItem[]) {
        total++
        if (item.status === 'done') done++
      }
    }
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
  }, [checklists])

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hinweis-Banner: ExTrass gelten landkreisweit */}
      <Link
        to="/pro/vorbereitung"
        className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 transition-colors hover:bg-violet-100"
      >
        <ClipboardList className="h-5 w-5 flex-shrink-0 text-violet-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-violet-800">
            ExTrass-Vorbereitung gilt landkreisweit
          </p>
          <p className="text-xs text-violet-600">
            Die 18 Vorbereitungs-Checklisten (Johanniter/BBK) finden Sie unter Checklisten in der Sidebar.
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-violet-500" />
      </Link>

      {/* Szenario-spezifische Checklisten */}
      {checklists.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Noch keine szenario-spezifischen Checklisten vorhanden.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Checklisten werden automatisch bei der KI-Generierung des Krisenhandbuchs erstellt.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-white px-5 py-3">
            <span className="text-sm text-text-secondary">
              <strong className="font-bold text-text-primary">{checklists.length}</strong> Checklisten
            </span>
            <span className="text-sm text-text-secondary">
              <strong className="font-bold text-text-primary">{stats.done}/{stats.total}</strong> erledigt
            </span>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${stats.percent}%` }} />
              </div>
            </div>
            <span className="text-sm font-bold text-text-primary">{stats.percent}%</span>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {checklists.map((cl) => {
              const cat = categoryConfig[cl.category] || categoryConfig.custom
              const items = cl.items as ChecklistItem[]
              const doneCount = items.filter(i => i.status === 'done').length
              const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0
              const isExpanded = expanded.has(cl.id)

              return (
                <div key={cl.id} className="rounded-2xl border border-border bg-white transition-shadow hover:shadow-sm">
                  <button
                    onClick={() => toggleExpanded(cl.id)}
                    className="flex w-full items-center gap-4 p-6 text-left"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.color}`}>
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-text-primary">{cl.title}</h3>
                        <Badge>{cat.label}</Badge>
                      </div>
                      {cl.description && (
                        <p className="text-sm text-text-secondary">{cl.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-secondary">
                          <div
                            className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-green-500' : percent > 0 ? 'bg-primary-500' : 'bg-gray-300'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-text-muted">
                          {doneCount}/{items.length} erledigt
                        </span>
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="h-5 w-5 text-text-muted" />
                      : <ChevronRight className="h-5 w-5 text-text-muted" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-6 py-4">
                      <div className="space-y-2">
                        {items.map((item) => (
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
            })}
          </div>
        </>
      )}
    </div>
  )
}
