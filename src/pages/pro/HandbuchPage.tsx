/**
 * HandbuchPage — Standalone Krisenhandbuch (Landkreis-Ebene)
 *
 * 12 BSI/BBK-konforme Kapitel, unabhaengig von Szenarien.
 * Pro Landkreis gibt es ein Handbuch (district_handbooks Tabelle).
 *
 * Features:
 * - Inhaltsverzeichnis (sticky sidebar)
 * - Kapitel mit TipTap-Editor (inline edit)
 * - Checklisten pro Kapitel
 * - Metadata (Status, Version, Ersteller, Freigabe)
 * - Fortschrittsanzeige (radial ring)
 */
import { useState, useMemo, useRef } from 'react'
import {
  BookOpen, ChevronDown, ChevronRight,
  CheckCircle2, Circle, MinusCircle,
  PenLine, Save, X, Loader2,
  Settings, Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import type {
  DbDistrictHandbook, HandbuchStatus,
  KrisenhandbuchKapitelV3, KapitelChecklistItem,
} from '@/types/database'
import { KAPITEL_CONFIG } from '@/data/kapitel-config'
import { createEmptyHandbuchKapitel } from '@/utils/handbook-init'
import TiptapEditor from '@/components/ui/TiptapEditor'
import Modal, { FormField, inputClass, selectClass, ModalFooter } from '@/components/ui/Modal'

// ─── Status Config ──────────────────────────────────
const STATUS_CONFIG: Record<HandbuchStatus, { label: string; bg: string; text: string }> = {
  entwurf:      { label: 'Entwurf',      bg: 'bg-gray-100',   text: 'text-gray-700' },
  in_pruefung:  { label: 'In Pruefung',  bg: 'bg-amber-50',   text: 'text-amber-700' },
  freigegeben:  { label: 'Freigegeben',  bg: 'bg-green-50',   text: 'text-green-700' },
  archiviert:   { label: 'Archiviert',   bg: 'bg-slate-100',  text: 'text-slate-600' },
}

// ─── Component ──────────────────────────────────────
export default function HandbuchPage() {
  const { districtId } = useDistrict()

  const { data: handbooks, loading, error: queryError, refetch } = useSupabaseQuery<DbDistrictHandbook>(
    (sb) => {
      if (!districtId) return sb.from('district_handbooks').select('*').limit(0)
      return sb.from('district_handbooks').select('*').eq('district_id', districtId).limit(1)
    },
    [districtId],
  )

  const handbook = handbooks?.[0] || null
  const [creating, setCreating] = useState(false)
  const [showMetaModal, setShowMetaModal] = useState(false)
  const [expandedKapitel, setExpandedKapitel] = useState<number | null>(null)
  const [editingKapitelKey, setEditingKapitelKey] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [checklistSaving, setChecklistSaving] = useState(false)

  // Refs fuer Scroll-to-Kapitel
  const kapitelRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // ─── Kapitel-Daten ───────────────────────────────────
  const kapitel = useMemo<KrisenhandbuchKapitelV3[]>(() => {
    if (!handbook?.kapitel) return []
    return handbook.kapitel as KrisenhandbuchKapitelV3[]
  }, [handbook])

  // ─── Progress Stats ──────────────────────────────────
  const { filledCount, totalChecks, doneChecks, progressPct } = useMemo(() => {
    const filled = kapitel.filter(k => !!k.inhalt?.trim()).length
    const allChecks = kapitel.flatMap(k => k.checkliste || [])
    const done = allChecks.filter(c => c.status === 'done' || c.status === 'skipped').length
    const total = allChecks.length
    const pct = kapitel.length > 0
      ? Math.round((filled / 12) * 100)
      : 0
    return { filledCount: filled, totalChecks: total, doneChecks: done, progressPct: pct }
  }, [kapitel])

  const scoreColor = progressPct >= 75 ? 'text-green-600' : progressPct >= 40 ? 'text-amber-600' : 'text-red-600'
  const ringColor = progressPct >= 75 ? 'stroke-green-500' : progressPct >= 40 ? 'stroke-amber-500' : 'stroke-red-500'

  // ─── Handbuch erstellen ──────────────────────────────
  const handleCreate = async () => {
    if (!districtId) {
      console.warn('handleCreate: districtId ist null — kein Landkreis vorhanden')
      alert('Kein Landkreis gefunden. Bitte stellen Sie sicher, dass Sie angemeldet sind und ein Landkreis existiert.')
      return
    }
    setCreating(true)
    try {
      const { error } = await supabase.from('district_handbooks').insert({
        district_id: districtId,
        titel: 'Krisenhandbuch',
        status: 'entwurf',
        version: '1.0',
        kapitel: createEmptyHandbuchKapitel(),
      })
      if (error) throw error
      refetch()
    } catch (err) {
      console.error('Fehler beim Erstellen des Handbuchs:', err)
      const msg = err instanceof Error ? err.message : String(err)
      alert('Fehler beim Erstellen: ' + msg)
    } finally {
      setCreating(false)
    }
  }

  // ─── Kapitel bearbeiten ──────────────────────────────
  const startEditing = (key: string, currentInhalt: string) => {
    setEditingKapitelKey(key)
    setEditContent(currentInhalt || '')
  }

  const cancelEditing = () => {
    setEditingKapitelKey(null)
    setEditContent('')
  }

  const handleSaveKapitel = async () => {
    if (!editingKapitelKey || !handbook) return
    setEditSaving(true)
    try {
      const updatedKapitel = kapitel.map(kap => {
        if (kap.key !== editingKapitelKey) return kap
        return { ...kap, inhalt: editContent }
      })
      const { error } = await supabase
        .from('district_handbooks')
        .update({
          kapitel: updatedKapitel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', handbook.id)
      if (error) throw error
      setEditingKapitelKey(null)
      setEditContent('')
      refetch()
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
    } finally {
      setEditSaving(false)
    }
  }

  // ─── Checklisten-Toggle ──────────────────────────────
  const handleToggleCheckItem = async (kapitelKey: string, checkItemId: string) => {
    if (!handbook || checklistSaving) return

    const nextStatus = (current: string) => {
      if (current === 'open') return 'done' as const
      if (current === 'done') return 'skipped' as const
      return 'open' as const
    }

    const updatedKapitel = kapitel.map(kap => {
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

    setChecklistSaving(true)
    try {
      const { error } = await supabase
        .from('district_handbooks')
        .update({
          kapitel: updatedKapitel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', handbook.id)
      if (error) throw error
      refetch()
    } catch (err) {
      console.error('Fehler beim Toggle:', err)
    } finally {
      setChecklistSaving(false)
    }
  }

  // ─── Scroll to Kapitel ───────────────────────────────
  const scrollToKapitel = (nummer: number) => {
    setExpandedKapitel(nummer)
    setTimeout(() => {
      kapitelRefs.current[nummer]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // ─── Loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // ─── Empty State ─────────────────────────────────────
  if (!handbook) {
    return (
      <div className="space-y-6">
        <PageHeaderSection />
        {queryError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Fehler:</strong> {queryError}
          </div>
        )}
        <div className="rounded-2xl border-2 border-dashed border-border bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-text-muted" />
          <h3 className="mb-2 text-lg font-bold text-text-primary">
            Krisenhandbuch anlegen
          </h3>
          <p className="mx-auto mb-6 max-w-lg text-sm text-text-secondary">
            Erstellen Sie das digitale Krisenhandbuch fuer Ihren Landkreis.
            Es basiert auf dem BSI/BBK-Standard mit 12 Kapiteln und kann
            schrittweise ausgefuellt und gepflegt werden.
          </p>
          {!districtId ? (
            <p className="text-sm text-amber-600 font-medium">
              Kein Landkreis gefunden. Bitte melden Sie sich an und stellen Sie sicher, dass ein Landkreis existiert.
            </p>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Krisenhandbuch erstellen
            </button>
          )}
          <p className="mt-4 text-xs text-text-muted">
            12 Kapitel nach BSI/BBK-Standard — individuell befuellbar
          </p>
        </div>
      </div>
    )
  }

  // ─── Hauptansicht ────────────────────────────────────
  const statusCfg = STATUS_CONFIG[handbook.status]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeaderSection
        status={handbook.status}
        onMetaClick={() => setShowMetaModal(true)}
      />

      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-5 py-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.label}
        </span>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-xs text-text-secondary">
          Version <strong className="text-text-primary">{handbook.version}</strong>
        </span>
        {handbook.ersteller && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-text-secondary">
              Ersteller: <strong className="text-text-primary">{handbook.ersteller}</strong>
            </span>
          </>
        )}
        {handbook.gueltig_bis && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-text-secondary">
              Gueltig bis: <strong className="text-text-primary">{new Date(handbook.gueltig_bis).toLocaleDateString('de-DE')}</strong>
            </span>
          </>
        )}
        {handbook.freigabe_durch && (
          <>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-xs text-text-secondary">
              Freigabe: <strong className="text-text-primary">{handbook.freigabe_durch}</strong>
              {handbook.freigabe_am && ` (${new Date(handbook.freigabe_am).toLocaleDateString('de-DE')})`}
            </span>
          </>
        )}
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-xs text-text-muted">
          Letzte Aenderung: {new Date(handbook.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Progress + TOC + Kapitel Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* ─── Sidebar: TOC + Progress ─── */}
        <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
          {/* Progress Ring */}
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-gray-100" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                    strokeLinecap="round"
                    className={ringColor}
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPct / 100)}`}
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${scoreColor}`}>
                  {progressPct}%
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Fortschritt</p>
                <p className="text-xs text-text-secondary">
                  {filledCount}/12 Kapitel befuellt
                </p>
                {totalChecks > 0 && (
                  <p className="mt-0.5 text-xs text-text-muted">
                    {doneChecks}/{totalChecks} Checkpunkte
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">Inhaltsverzeichnis</p>
            <nav className="space-y-0.5">
              {KAPITEL_CONFIG.map(cfg => {
                const kap = kapitel.find(k => k.key === cfg.key)
                const hasContent = !!kap?.inhalt?.trim()
                const isActive = expandedKapitel === cfg.nummer
                return (
                  <button
                    key={cfg.nummer}
                    onClick={() => scrollToKapitel(cfg.nummer)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${cfg.accent}`}>
                      {cfg.nummer}
                    </span>
                    <span className="min-w-0 truncate">{cfg.titel}</span>
                    {hasContent ? (
                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-300" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Overall Progress Bar */}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="flex h-full">
                {KAPITEL_CONFIG.map(cfg => {
                  const kap = kapitel.find(k => k.key === cfg.key)
                  const hasContent = !!kap?.inhalt?.trim()
                  return (
                    <div
                      key={cfg.nummer}
                      className={`transition-all ${hasContent ? cfg.accent : 'bg-gray-200'}`}
                      style={{ width: `${100 / 12}%` }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main: Kapitel Content ─── */}
        <div className="space-y-3">
          {KAPITEL_CONFIG.map(cfg => {
            const kap = kapitel.find(k => k.key === cfg.key || k.nummer === cfg.nummer)
            const isExpanded = expandedKapitel === cfg.nummer
            const isEditing = editingKapitelKey === cfg.key
            const checkItems = kap?.checkliste || []
            const doneCount = checkItems.filter(i => i.status === 'done' || i.status === 'skipped').length
            const hasContent = !!kap?.inhalt?.trim()

            return (
              <div
                key={cfg.nummer}
                ref={el => { kapitelRefs.current[cfg.nummer] = el }}
                className={`rounded-2xl border transition-colors ${
                  isExpanded ? 'border-border bg-white' : 'border-border bg-white hover:bg-surface-secondary/30'
                }`}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedKapitel(isExpanded ? null : cfg.nummer)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.accent} text-xs font-bold text-white`}>
                    {cfg.nummer}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <cfg.icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                    <span className="truncate font-semibold text-text-primary">{cfg.titel}</span>
                  </div>
                  {checkItems.length > 0 && (
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      doneCount === checkItems.length ? 'bg-green-50 text-green-700'
                        : doneCount > 0 ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-text-muted'
                    }`}>
                      {doneCount}/{checkItems.length}
                    </span>
                  )}
                  {!hasContent && <span className="shrink-0 text-xs text-text-muted">Leer</span>}
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
                  }
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-border px-5 pb-5 pt-4">
                    {/* Edit Toolbar */}
                    {!isEditing && (
                      <div className="mb-3 flex justify-end">
                        <button
                          onClick={() => startEditing(cfg.key, kap?.inhalt || '')}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                          Bearbeiten
                        </button>
                      </div>
                    )}

                    {/* Save/Cancel Toolbar */}
                    {isEditing && (
                      <div className="mb-3 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50/50 px-3 py-2">
                        <span className="text-xs font-medium text-primary-700">Kapitel bearbeiten</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={cancelEditing}
                            disabled={editSaving}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-white disabled:opacity-60"
                          >
                            <X className="h-3.5 w-3.5" />
                            Abbrechen
                          </button>
                          <button
                            onClick={handleSaveKapitel}
                            disabled={editSaving}
                            className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                          >
                            {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Speichern
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    {isEditing ? (
                      <div className="prose prose-sm max-w-none">
                        <TiptapEditor
                          content={editContent}
                          onChange={setEditContent}
                          editable={true}
                        />
                      </div>
                    ) : hasContent ? (
                      <div className="prose prose-sm max-w-none">
                        <TiptapEditor
                          content={kap!.inhalt}
                          onChange={() => {}}
                          editable={false}
                          className="border-none"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-surface-secondary/30 p-6 text-center">
                        <p className="text-sm text-text-muted">
                          Dieses Kapitel ist noch leer.
                        </p>
                        <button
                          onClick={() => startEditing(cfg.key, '')}
                          className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                          Inhalt verfassen
                        </button>
                      </div>
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
                              <span className={item.status === 'done' ? 'text-text-muted line-through' : 'text-text-secondary'}>
                                {item.text}
                              </span>
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
      </div>

      {/* Metadata Modal */}
      {showMetaModal && handbook && (
        <MetadataModal
          handbook={handbook}
          onClose={() => setShowMetaModal(false)}
          onSave={refetch}
        />
      )}
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────
function PageHeaderSection({
  status,
  onMetaClick,
}: {
  status?: HandbuchStatus
  onMetaClick?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
          <BookOpen className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Krisenhandbuch</h1>
          <p className="text-sm text-text-secondary">
            BSI/BBK-konformes Krisenhandbuch fuer Ihren Landkreis
          </p>
        </div>
      </div>
      {status && (
        <div className="flex items-center gap-2">
          <button
            onClick={onMetaClick}
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            <Settings className="h-4 w-4" />
            Metadaten
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Metadata Modal ──────────────────────────────────
function MetadataModal({
  handbook,
  onClose,
  onSave,
}: {
  handbook: DbDistrictHandbook
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    titel: handbook.titel || 'Krisenhandbuch',
    ersteller: handbook.ersteller || '',
    version: handbook.version || '1.0',
    status: handbook.status,
    gueltig_bis: handbook.gueltig_bis || '',
    naechste_ueberpruefung: handbook.naechste_ueberpruefung || '',
    freigabe_durch: handbook.freigabe_durch || '',
    freigabe_am: handbook.freigabe_am || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('district_handbooks')
        .update({
          titel: form.titel,
          ersteller: form.ersteller || null,
          version: form.version,
          status: form.status,
          gueltig_bis: form.gueltig_bis || null,
          naechste_ueberpruefung: form.naechste_ueberpruefung || null,
          freigabe_durch: form.freigabe_durch || null,
          freigabe_am: form.freigabe_am || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', handbook.id)
      if (error) throw error
      onSave()
      onClose()
    } catch (err) {
      console.error('Fehler beim Speichern der Metadaten:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Handbuch-Metadaten" onClose={onClose} size="lg">
      <div className="space-y-4">
        <FormField label="Titel">
          <input
            className={inputClass}
            value={form.titel}
            onChange={e => setForm(f => ({ ...f, titel: e.target.value }))}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ersteller">
            <input
              className={inputClass}
              value={form.ersteller}
              onChange={e => setForm(f => ({ ...f, ersteller: e.target.value }))}
              placeholder="Name des Erstellers"
            />
          </FormField>
          <FormField label="Version">
            <input
              className={inputClass}
              value={form.version}
              onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
              placeholder="z.B. 1.0"
            />
          </FormField>
        </div>

        <FormField label="Status">
          <select
            className={selectClass}
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as HandbuchStatus }))}
          >
            <option value="entwurf">Entwurf</option>
            <option value="in_pruefung">In Pruefung</option>
            <option value="freigegeben">Freigegeben</option>
            <option value="archiviert">Archiviert</option>
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Gueltig bis">
            <input
              type="date"
              className={inputClass}
              value={form.gueltig_bis}
              onChange={e => setForm(f => ({ ...f, gueltig_bis: e.target.value }))}
            />
          </FormField>
          <FormField label="Naechste Ueberpruefung">
            <input
              type="date"
              className={inputClass}
              value={form.naechste_ueberpruefung}
              onChange={e => setForm(f => ({ ...f, naechste_ueberpruefung: e.target.value }))}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Freigabe durch">
            <input
              className={inputClass}
              value={form.freigabe_durch}
              onChange={e => setForm(f => ({ ...f, freigabe_durch: e.target.value }))}
              placeholder="Name / Position"
            />
          </FormField>
          <FormField label="Freigabe am">
            <input
              type="date"
              className={inputClass}
              value={form.freigabe_am}
              onChange={e => setForm(f => ({ ...f, freigabe_am: e.target.value }))}
            />
          </FormField>
        </div>
      </div>

      <ModalFooter onCancel={onClose} onSubmit={handleSubmit} loading={saving} />
    </Modal>
  )
}
