/**
 * SzenarioHandbuchPage — Eigene Route: /pro/szenarien/:id/handbuch
 *
 * 12 BBK-Kapitel als Accordion mit TiptapEditor (read-only).
 * Checklisten-Status pro Kapitel (klickbar). Link zurück zu SzenarioDetailPage.
 */
import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Flame, ChevronDown, ChevronRight,
  CheckCircle2, Circle, MinusCircle, Sparkles, PenLine,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { isHandbookV2, isHandbookV3 } from '@/types/database'
import type {
  DbScenario, DbScenarioPhase,
  ScenarioHandbook, ScenarioHandbookV3,
  KrisenhandbuchKapitelV3, KapitelChecklistItem,
} from '@/types/database'
import { migrateV1toV2, migrateV2toV3 } from '@/utils/handbook-migration'
import { KAPITEL_CONFIG } from '@/data/kapitel-config'
import TiptapEditor from '@/components/ui/TiptapEditor'

export default function SzenarioHandbuchPage() {
  const { id } = useParams()
  const [expandedKapitel, setExpandedKapitel] = useState<number | null>(null)
  const [checklistSaving, setChecklistSaving] = useState(false)

  // ─── Data Fetching ──────────────────────────────────
  const { data: scenario, loading, refetch: refetchScenario } = useSupabaseSingle<DbScenario>(
    (sb) => sb.from('scenarios').select('*').eq('id', id!).single(),
    [id]
  )

  const { data: phases } = useSupabaseQuery<DbScenarioPhase>(
    (sb) => sb.from('scenario_phases').select('*').eq('scenario_id', id!).order('sort_order'),
    [id]
  )

  // ─── V1 → V2 → V3 Auto-Migration ───────────────────
  const handbookV3 = useMemo<ScenarioHandbookV3 | null>(() => {
    if (!scenario?.handbook) return null
    if (isHandbookV3(scenario.handbook)) return scenario.handbook
    if (isHandbookV2(scenario.handbook)) return migrateV2toV3(scenario.handbook)
    const v2 = migrateV1toV2(scenario.handbook as ScenarioHandbook, phases)
    return migrateV2toV3(v2)
  }, [scenario?.handbook, phases])

  const kapitel = useMemo<KrisenhandbuchKapitelV3[]>(() => {
    if (!handbookV3) return []
    return handbookV3.kapitel as KrisenhandbuchKapitelV3[]
  }, [handbookV3])

  const toggleKapitel = (nummer: number) => {
    setExpandedKapitel(expandedKapitel === nummer ? null : nummer)
  }

  // ─── Checklisten-Toggle (direkte DB-Persistierung) ──
  const handleToggleCheckItem = async (kapitelKey: string, checkItemId: string) => {
    if (!handbookV3 || !scenario || checklistSaving) return

    const nextStatus = (current: string) => {
      if (current === 'open') return 'done' as const
      if (current === 'done') return 'skipped' as const
      return 'open' as const
    }

    const updatedKapitel = handbookV3.kapitel.map(kap => {
      if (kap.key !== kapitelKey) return kap
      return {
        ...kap,
        checkliste: kap.checkliste.map(item => {
          if (item.id !== checkItemId) return item
          const newStatus = nextStatus(item.status)
          return {
            ...item,
            status: newStatus,
            completed_at: newStatus === 'done' ? new Date().toISOString() : null,
          }
        }),
      }
    })

    const updated: ScenarioHandbookV3 = { ...handbookV3, kapitel: updatedKapitel as KrisenhandbuchKapitelV3[] }
    setChecklistSaving(true)
    try {
      const { error } = await supabase
        .from('scenarios')
        .update({ handbook: updated, is_edited: true })
        .eq('id', scenario.id)
      if (error) throw error
      refetchScenario()
    } catch (err) {
      console.error('Fehler beim Speichern der Checkliste:', err)
    } finally {
      setChecklistSaving(false)
    }
  }

  // ─── Loading / Not Found ────────────────────────────
  if (loading) {
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

  return (
    <div>
      {/* ─── Header ─── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/pro/szenarien/${scenario.id}`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Krisenhandbuch</h1>
            <p className="text-sm text-text-muted">{scenario.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {scenario.is_ai_generated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              <Sparkles className="h-3.5 w-3.5" /> KI-generiert
            </span>
          )}
          {handbookV3 && (
            <Link
              to={`/pro/szenarien/${scenario.id}`}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <PenLine className="h-4 w-4" />
              Kapitel bearbeiten
            </Link>
          )}
        </div>
      </div>

      {/* ─── Kein Handbook ─── */}
      {!handbookV3 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white p-12 text-center">
          <Flame className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="mb-2 font-bold text-text-primary">Noch kein Krisenhandbuch vorhanden</p>
          <p className="mx-auto max-w-md text-sm text-text-secondary">
            Generieren Sie zuerst ein Krisenhandbuch über die KI-Funktion auf der Szenario-Seite.
          </p>
          <Link
            to={`/pro/szenarien/${scenario.id}`}
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Zur Szenario-Seite
          </Link>
        </div>
      ) : (
        /* ─── 12-Kapitel Accordion ─── */
        <div className="space-y-2">
          {KAPITEL_CONFIG.map(cfg => {
            const kap = kapitel.find(k => k.key === cfg.key || k.nummer === cfg.nummer)
            const isExpanded = expandedKapitel === cfg.nummer
            const checkItems = kap?.checkliste || []
            const doneCount = checkItems.filter(i => i.status === 'done' || i.status === 'skipped').length
            const hasContent = !!kap?.inhalt?.trim()

            return (
              <div
                key={cfg.nummer}
                className={`rounded-2xl border transition-colors ${
                  isExpanded ? 'border-border bg-white' : 'border-border bg-white hover:bg-surface-secondary/30'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleKapitel(cfg.nummer)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  {/* Number Badge */}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.accent} text-xs font-bold text-white`}>
                    {cfg.nummer}
                  </span>

                  {/* Icon + Title */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <cfg.icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                    <span className="truncate font-semibold text-text-primary">{cfg.titel}</span>
                  </div>

                  {/* Checklist Progress */}
                  {checkItems.length > 0 && (
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      doneCount === checkItems.length
                        ? 'bg-green-50 text-green-700'
                        : doneCount > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-text-muted'
                    }`}>
                      {doneCount}/{checkItems.length}
                    </span>
                  )}

                  {/* Content indicator */}
                  {!hasContent && (
                    <span className="shrink-0 text-xs text-text-muted">Leer</span>
                  )}

                  {/* Chevron */}
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  }
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-border px-5 pb-5 pt-4">
                    {hasContent ? (
                      <div className="prose prose-sm max-w-none">
                        <TiptapEditor
                          content={kap!.inhalt}
                          onChange={() => {}} // Read-only
                          editable={false}
                          className="border-none"
                        />
                      </div>
                    ) : (
                      <p className="text-sm italic text-text-muted">
                        Dieses Kapitel wurde noch nicht generiert.
                      </p>
                    )}

                    {/* Checkliste */}
                    {checkItems.length > 0 && (
                      <div className="mt-4 rounded-xl border border-border bg-surface-secondary/20 p-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                          Checkliste ({doneCount}/{checkItems.length})
                        </p>
                        <ul className="space-y-1">
                          {checkItems.map((item: KapitelChecklistItem) => (
                            <li
                              key={item.id}
                              onClick={() => !checklistSaving && handleToggleCheckItem(cfg.key, item.id)}
                              className={`flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-surface-secondary/50 ${
                                checklistSaving ? 'pointer-events-none opacity-60' : ''
                              }`}
                            >
                              {item.status === 'done' ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                              ) : item.status === 'skipped' ? (
                                <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                              ) : (
                                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className={item.status === 'done' ? 'text-text-muted line-through' : 'text-text-secondary'}>
                                  {item.text}
                                </span>
                                {item.status === 'done' && item.completed_at && (
                                  <span className="ml-2 text-[10px] text-text-muted">
                                    {new Date(item.completed_at).toLocaleDateString('de-DE')}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
