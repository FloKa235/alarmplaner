/**
 * HandbuchDokumenteSection — Tab "Krisenhandbuch & Dokumente"
 *
 * Sub-Tab-Pills: "Krisenhandbuch" | "Dokumente"
 * - Krisenhandbuch: 12-Kapitel-Accordion (aus SzenarioHandbuchPage portiert)
 * - Dokumente: Upload + KI-Analyse (aus DokumenteSection portiert)
 * - PDF-Export Button
 */
import { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, FileText, Download, ChevronDown, ChevronRight,
  CheckCircle2, Circle, MinusCircle, Sparkles,
  Upload, Loader2, File, ExternalLink, ArrowRight,
  PenLine, Save, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type {
  DbScenario, ScenarioHandbookV3,
  KrisenhandbuchKapitelV3, KapitelChecklistItem,
} from '@/types/database'
import { KAPITEL_CONFIG } from '@/data/kapitel-config'
import TiptapEditor from '@/components/ui/TiptapEditor'

// ─── Types ───────────────────────────────────────────
interface DbDocument {
  id: string
  district_id: string
  name: string
  file_type: string
  size_bytes: number
  category: string
  storage_path: string
  is_processed: boolean
  summary: string | null
  created_at: string
}

interface HandbuchDokumenteSectionProps {
  scenario: DbScenario
  handbook: ScenarioHandbookV3 | null
  districtId: string
  onPDFExport: () => void
  onUpdateHandbook: (updated: ScenarioHandbookV3) => Promise<void>
}

type SubTab = 'handbuch' | 'dokumente'

// ─── Helpers ────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const FILE_ICONS: Record<string, string> = {
  pdf: '\ud83d\udcc4', docx: '\ud83d\udcdd', doc: '\ud83d\udcdd',
  xlsx: '\ud83d\udcca', xls: '\ud83d\udcca', csv: '\ud83d\udcca',
  txt: '\ud83d\udcc3', jpg: '\ud83d\uddbc\ufe0f', jpeg: '\ud83d\uddbc\ufe0f', png: '\ud83d\uddbc\ufe0f',
}

// ═══════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════
export default function HandbuchDokumenteSection({
  scenario, handbook, districtId, onPDFExport, onUpdateHandbook,
}: HandbuchDokumenteSectionProps) {
  const [subTab, setSubTab] = useState<SubTab>('handbuch')
  const [checklistSaving, setChecklistSaving] = useState(false)

  // ─── Checklisten-Toggle ────────────────────────────
  const handleToggleCheckItem = async (kapitelKey: string, checkItemId: string) => {
    if (!handbook || checklistSaving) return

    const nextStatus = (current: string) => {
      if (current === 'open') return 'done' as const
      if (current === 'done') return 'skipped' as const
      return 'open' as const
    }

    const updatedKapitel = handbook.kapitel.map(kap => {
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

    const updated: ScenarioHandbookV3 = { ...handbook, kapitel: updatedKapitel as KrisenhandbuchKapitelV3[] }
    setChecklistSaving(true)
    try {
      await onUpdateHandbook(updated)
    } finally {
      setChecklistSaving(false)
    }
  }

  // ─── Kapitel-Inhalt speichern ────────────────────────
  const handleSaveKapitel = async (kapitelKey: string, newInhalt: string) => {
    if (!handbook) return

    const updatedKapitel = handbook.kapitel.map(kap => {
      if (kap.key !== kapitelKey) return kap
      return { ...kap, inhalt: newInhalt }
    })

    const updated: ScenarioHandbookV3 = { ...handbook, kapitel: updatedKapitel as KrisenhandbuchKapitelV3[] }
    await onUpdateHandbook(updated)
  }

  return (
    <div className="space-y-4">
      {/* Header + Sub-Tab-Pills */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-text-primary">Handbuch & Dokumente</h2>
          <div className="flex rounded-lg border border-border bg-surface-secondary/50 p-0.5">
            <button
              onClick={() => setSubTab('handbuch')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                subTab === 'handbuch'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <BookOpen className="mr-1 inline h-3.5 w-3.5" />
              Krisenhandbuch
            </button>
            <button
              onClick={() => setSubTab('dokumente')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                subTab === 'dokumente'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText className="mr-1 inline h-3.5 w-3.5" />
              Dokumente
            </button>
          </div>
        </div>

        {subTab === 'handbuch' && handbook && (
          <button
            onClick={onPDFExport}
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            <Download className="h-4 w-4" />
            PDF Export
          </button>
        )}
      </div>

      {/* Sub-Tab Content */}
      {subTab === 'handbuch' ? (
        <HandbuchContent
          handbook={handbook}
          onToggleCheckItem={handleToggleCheckItem}
          onSaveKapitel={handleSaveKapitel}
          saving={checklistSaving}
        />
      ) : (
        <DokumenteContent
          scenarioTitle={scenario.title}
          districtId={districtId}
        />
      )}
    </div>
  )
}

// ─── Handbuch: 12-Kapitel Accordion ──────────────────
function HandbuchContent({
  handbook,
  onToggleCheckItem,
  onSaveKapitel,
  saving,
}: {
  handbook: ScenarioHandbookV3 | null
  onToggleCheckItem: (kapitelKey: string, checkItemId: string) => void
  onSaveKapitel: (kapitelKey: string, newInhalt: string) => Promise<void>
  saving: boolean
}) {
  const [expandedKapitel, setExpandedKapitel] = useState<number | null>(null)
  const [editingKapitelKey, setEditingKapitelKey] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const kapitel = useMemo<KrisenhandbuchKapitelV3[]>(() => {
    if (!handbook) return []
    return handbook.kapitel as KrisenhandbuchKapitelV3[]
  }, [handbook])

  const startEditing = (key: string, currentInhalt: string) => {
    setEditingKapitelKey(key)
    setEditContent(currentInhalt || '')
  }

  const cancelEditing = () => {
    setEditingKapitelKey(null)
    setEditContent('')
  }

  const handleSave = async () => {
    if (!editingKapitelKey) return
    setEditSaving(true)
    try {
      await onSaveKapitel(editingKapitelKey, editContent)
      setEditingKapitelKey(null)
      setEditContent('')
    } finally {
      setEditSaving(false)
    }
  }

  if (!handbook) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-white p-12 text-center">
        <BookOpen className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="mb-2 font-bold text-text-primary">Noch kein Krisenhandbuch vorhanden</p>
        <p className="mx-auto max-w-md text-sm text-text-secondary">
          Generieren Sie zuerst ein Krisenhandbuch über die KI-Funktion auf der Übersichtsseite.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
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
                {hasContent && !isEditing && (
                  <div className="mb-3 flex justify-end">
                    <button
                      onClick={() => startEditing(cfg.key, kap!.inhalt)}
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
                        onClick={handleSave}
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
                  <p className="text-sm italic text-text-muted">
                    Dieses Kapitel wurde noch nicht generiert.
                  </p>
                )}

                {checkItems.length > 0 && (
                  <div className="mt-4 rounded-xl border border-border bg-surface-secondary/20 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
                      Checkliste ({doneCount}/{checkItems.length})
                    </p>
                    <ul className="space-y-1">
                      {checkItems.map((item: KapitelChecklistItem) => (
                        <li
                          key={item.id}
                          onClick={() => !saving && onToggleCheckItem(cfg.key, item.id)}
                          className={`flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-surface-secondary/50 ${
                            saving ? 'pointer-events-none opacity-60' : ''
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
  )
}

// ─── Dokumente: Upload + KI-Analyse ─────────────────
function DokumenteContent({
  scenarioTitle, districtId,
}: {
  scenarioTitle: string
  districtId: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [docError, setDocError] = useState<string | null>(null)

  const { data: documents, refetch } = useSupabaseQuery<DbDocument>(
    (sb) => sb
      .from('documents')
      .select('*')
      .eq('district_id', districtId)
      .order('created_at', { ascending: false }),
    [districtId],
  )

  const relevantDocs = useMemo(() =>
    documents.filter(d => d.category === 'Handbuch' || d.name.toLowerCase().includes(scenarioTitle.toLowerCase().split(' ')[0]))
  , [documents, scenarioTitle])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setDocError(null)
    try {
      const storagePath = `${districtId}/${crypto.randomUUID()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          district_id: districtId,
          name: file.name,
          file_type: fileExt,
          size_bytes: file.size,
          category: 'Handbuch',
          storage_path: storagePath,
          is_processed: false,
        })
      if (insertError) throw insertError
      refetch()
    } catch (err) {
      console.error('Dokument-Upload fehlgeschlagen:', err)
      setDocError('Dokument-Upload fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async (docId: string) => {
    setAnalyzing(docId)
    setDocError(null)
    try {
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId: docId },
      })
      if (error) throw error
      if (data?.summary) {
        await supabase
          .from('documents')
          .update({ summary: data.summary, is_processed: true })
          .eq('id', docId)
        refetch()
      }
    } catch (err) {
      console.error('KI-Analyse fehlgeschlagen:', err)
      setDocError('KI-Analyse fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setAnalyzing(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {docError && (
        <ErrorBanner message={docError} onDismiss={() => setDocError(null)} />
      )}

      {/* Upload Card */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-text-primary">Szenario-Dokumente</h3>
            {relevantDocs.length > 0 && (
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-700">
                {relevantDocs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.xlsx,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Dokument hochladen
            </button>
            <Link
              to="/pro/dokumente"
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              Alle Dokumente <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {relevantDocs.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
            <File className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Noch keine Dokumente für dieses Szenario vorhanden.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Laden Sie bestehende Krisenpläne, Handbücher oder andere relevante Dokumente hoch.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border">
            {relevantDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-secondary/30">
                <span className="text-xl">{FILE_ICONS[doc.file_type] || '\ud83d\udcc4'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>{formatFileSize(doc.size_bytes)}</span>
                    <span>·</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('de-DE')}</span>
                    <span>·</span>
                    <span className="uppercase">{doc.file_type}</span>
                    {doc.is_processed && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 text-violet-600">
                          <Sparkles className="h-2.5 w-2.5" /> Analysiert
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!doc.is_processed && (
                    <button
                      onClick={() => handleAnalyze(doc.id)}
                      disabled={analyzing === doc.id}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50 disabled:opacity-60"
                    >
                      {analyzing === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Analysieren
                    </button>
                  )}
                  <a
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault()
                      const { data } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 3600)
                      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                    }}
                    className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-secondary hover:text-primary-600"
                    title="Öffnen"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KI-Zusammenfassungen */}
      {relevantDocs.filter(d => d.summary).length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h3 className="font-bold text-text-primary">KI-Zusammenfassungen</h3>
          </div>
          <div className="space-y-3">
            {relevantDocs.filter(d => d.summary).map(doc => (
              <div key={doc.id} className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
                <p className="mb-1 text-xs font-semibold text-violet-700">{doc.name}</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{doc.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
