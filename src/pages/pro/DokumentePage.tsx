import { useRef, useState, useMemo } from 'react'
import {
  FileText, Upload, Search, Download, File, FileImage, FileSpreadsheet,
  Loader2, Sparkles, Trash2, Eye, AlertCircle, CheckCircle2,
  FolderOpen, BookOpen, Scale, ArrowLeft, FolderPlus,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, ModalFooter, selectClass } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbDocument } from '@/types/database'

// ─── Constants ───────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const ACCEPTED_TYPES = '.pdf,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.txt'
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

const DEFAULT_FOLDERS = [
  { name: 'Einsatzplan', label: 'Einsatzpläne', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { name: 'Verordnung', label: 'Verordnungen', icon: Scale, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { name: 'Handbuch', label: 'Handbücher', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { name: 'Sonstiges', label: 'Sonstiges', icon: FolderOpen, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
]

const DEFAULT_FOLDER_NAMES = DEFAULT_FOLDERS.map((f) => f.name)

const typeIcons: Record<string, typeof File> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  image: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '–'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFolderLabel(name: string): string {
  const def = DEFAULT_FOLDERS.find((f) => f.name === name)
  return def ? def.label : name
}

// ─── Component ───────────────────────────────────────
export default function DokumentePage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── State ──
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('Sonstiges')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryDoc, setSummaryDoc] = useState<DbDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<DbDocument | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [customFolders, setCustomFolders] = useState<string[]>([])

  // ── Data ──
  const { data: documents, loading, refetch } = useSupabaseQuery<DbDocument>(
    (sb) =>
      sb
        .from('documents')
        .select('*')
        .eq('district_id', districtId!)
        .order('created_at', { ascending: false }),
    [districtId]
  )

  // ── Folder Computation ──
  const folderStats = useMemo(() => {
    const stats: Record<string, { count: number; size: number }> = {}
    // Init default folders
    for (const f of DEFAULT_FOLDERS) {
      stats[f.name] = { count: 0, size: 0 }
    }
    // Init custom folders from state
    for (const cf of customFolders) {
      if (!stats[cf]) stats[cf] = { count: 0, size: 0 }
    }
    // Count documents per folder
    for (const doc of documents) {
      const cat = doc.category || 'Sonstiges'
      if (!stats[cat]) stats[cat] = { count: 0, size: 0 }
      stats[cat].count++
      stats[cat].size += doc.size_bytes || 0
    }
    return stats
  }, [documents, customFolders])

  // All folder names: defaults + custom (from documents + state)
  const allFolderNames = useMemo(() => {
    const names = new Set<string>(DEFAULT_FOLDER_NAMES)
    for (const cf of customFolders) names.add(cf)
    for (const doc of documents) {
      const cat = doc.category || 'Sonstiges'
      if (!names.has(cat)) names.add(cat)
    }
    return Array.from(names)
  }, [documents, customFolders])

  // Documents in active folder
  const folderDocuments = useMemo(() => {
    if (!activeFolder) return []
    return documents.filter((d) => (d.category || 'Sonstiges') === activeFolder)
  }, [documents, activeFolder])

  const filteredDocs = searchQuery
    ? folderDocuments.filter(
        (d) => d.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : folderDocuments

  // ── Upload Handler ──
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_FILE_SIZE) {
        alert(`Datei "${files[i].name}" ist zu groß (max. 20 MB).`)
        return
      }
    }
    setSelectedFiles(files)
    // If inside a folder, pre-set the category
    if (activeFolder) {
      setUploadCategory(activeFolder)
    }
    setShowUploadModal(true)
  }

  const handleUpload = async () => {
    if (!selectedFiles || !districtId) return
    setUploading(true)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
        const storagePath = `${districtId}/${crypto.randomUUID()}_${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload-Fehler:', uploadError)
          alert(`Fehler beim Upload von "${file.name}": ${uploadError.message}`)
          continue
        }

        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            district_id: districtId,
            name: file.name,
            file_type: fileExt,
            size_bytes: file.size,
            category: uploadCategory,
            storage_path: storagePath,
            is_processed: false,
          })

        if (insertError) {
          console.error('DB-Insert Fehler:', insertError)
          await supabase.storage.from('documents').remove([storagePath])
          alert(`Fehler beim Speichern von "${file.name}": ${insertError.message}`)
        }
      }

      refetch()
      setShowUploadModal(false)
      setSelectedFiles(null)
      if (!activeFolder) setUploadCategory('Sonstiges')
    } catch (err) {
      console.error('Upload-Fehler:', err)
      alert('Unerwarteter Fehler beim Upload.')
    } finally {
      setUploading(false)
    }
  }

  // ── KI-Verarbeitung ──
  const handleProcess = async (doc: DbDocument) => {
    setProcessing(doc.id)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('Nicht angemeldet.')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ document_id: doc.id }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Verarbeitung fehlgeschlagen.')
      }

      refetch()
    } catch (err) {
      console.error('Verarbeitungs-Fehler:', err)
      alert(err instanceof Error ? err.message : 'KI-Verarbeitung fehlgeschlagen.')
    } finally {
      setProcessing(null)
    }
  }

  // ── Download ──
  const handleDownload = async (doc: DbDocument) => {
    if (!doc.storage_path) return

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.storage_path)

      if (error || !data) {
        alert('Datei konnte nicht heruntergeladen werden.')
        return
      }

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download-Fehler:', err)
      alert('Fehler beim Herunterladen.')
    }
  }

  // ── Löschen ──
  const handleDelete = async () => {
    if (!deleteDoc) return
    setDeleting(true)

    try {
      if (deleteDoc.storage_path) {
        await supabase.storage.from('documents').remove([deleteDoc.storage_path])
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', deleteDoc.id)

      if (error) throw error

      refetch()
      setDeleteDoc(null)
    } catch (err) {
      console.error('Lösch-Fehler:', err)
      alert('Fehler beim Löschen.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Summary Modal ──
  const openSummary = (doc: DbDocument) => {
    setSummaryDoc(doc)
    setShowSummaryModal(true)
  }

  // ── New Folder ──
  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    if (allFolderNames.includes(name)) {
      alert('Ein Ordner mit diesem Namen existiert bereits.')
      return
    }
    setCustomFolders((prev) => [...prev, name])
    setShowNewFolderInput(false)
    setNewFolderName('')
    // Navigate into the new folder
    setActiveFolder(name)
  }

  // ── Navigate back ──
  const handleBack = () => {
    setActiveFolder(null)
    setSearchQuery('')
  }

  // ── Loading ──
  if (districtLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // FOLDER GRID VIEW (activeFolder = null)
  // ═══════════════════════════════════════════════════
  if (!activeFolder) {
    return (
      <div>
        <PageHeader
          title="Dokumente"
          description="Laden Sie Dokumente hoch für KI-Analyse und Krisenhandbuch-Generierung."
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                <FolderPlus className="h-4 w-4" />
                Neuer Ordner
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <Upload className="h-4 w-4" />
                Hochladen
              </button>
            </div>
          }
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* New Folder Input */}
        {showNewFolderInput && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50/30 p-4">
            <FolderPlus className="h-5 w-5 shrink-0 text-primary-600" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolderInput(false); setNewFolderName('') } }}
              placeholder="Ordnername eingeben..."
              className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              Erstellen
            </button>
            <button
              onClick={() => { setShowNewFolderInput(false); setNewFolderName('') }}
              className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Abbrechen
            </button>
          </div>
        )}

        {/* Total Stats */}
        {documents.length > 0 && (
          <div className="mb-6 flex gap-4 text-xs text-text-muted">
            <span>{documents.length} Dokument{documents.length !== 1 ? 'e' : ''} gesamt</span>
            <span>•</span>
            <span>{documents.filter((d) => d.is_processed).length} KI-verarbeitet</span>
            <span>•</span>
            <span>{formatFileSize(documents.reduce((sum, d) => sum + (d.size_bytes || 0), 0))}</span>
          </div>
        )}

        {/* Folder Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allFolderNames.map((name) => {
            const def = DEFAULT_FOLDERS.find((f) => f.name === name)
            const Icon = def?.icon || FolderOpen
            const colorClass = def?.color || 'text-primary-600'
            const bgClass = def?.bg || 'bg-primary-50'
            const borderClass = def?.border || 'border-primary-200'
            const stats = folderStats[name] || { count: 0, size: 0 }
            const label = getFolderLabel(name)

            return (
              <button
                key={name}
                onClick={() => setActiveFolder(name)}
                className={`group flex items-start gap-4 rounded-2xl border ${borderClass} bg-white p-5 text-left transition-all hover:shadow-md hover:border-primary-300`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgClass}`}>
                  <Icon className={`h-6 w-6 ${colorClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                    {label}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted">
                    {stats.count} Dokument{stats.count !== 1 ? 'e' : ''}
                  </p>
                  {stats.size > 0 && (
                    <p className="text-xs text-text-muted">{formatFileSize(stats.size)}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Upload Modal (from root — needs folder selection) */}
        <Modal
          open={showUploadModal}
          onClose={() => { if (!uploading) { setShowUploadModal(false); setSelectedFiles(null) } }}
          title="Dokument hochladen"
          size="sm"
        >
          {selectedFiles && (
            <div className="mb-4 rounded-xl border border-border bg-surface-secondary/50 p-3">
              {Array.from(selectedFiles).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-primary">
                  <File className="h-4 w-4 text-text-muted" />
                  <span className="truncate">{f.name}</span>
                  <span className="ml-auto text-xs text-text-muted">{formatFileSize(f.size)}</span>
                </div>
              ))}
            </div>
          )}

          <FormField label="Ordner" required>
            <select
              className={selectClass}
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
            >
              {allFolderNames.map((name) => (
                <option key={name} value={name}>{getFolderLabel(name)}</option>
              ))}
            </select>
          </FormField>

          <ModalFooter
            onCancel={() => { setShowUploadModal(false); setSelectedFiles(null) }}
            onSubmit={handleUpload}
            submitLabel={uploading ? 'Wird hochgeladen...' : 'Hochladen'}
            loading={uploading}
          />
        </Modal>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  // DOCUMENT LIST VIEW (activeFolder set)
  // ═══════════════════════════════════════════════════
  const folderDef = DEFAULT_FOLDERS.find((f) => f.name === activeFolder)
  const FolderIcon = folderDef?.icon || FolderOpen
  const folderColor = folderDef?.color || 'text-primary-600'
  const folderBg = folderDef?.bg || 'bg-primary-50'

  return (
    <div>
      {/* Header with Breadcrumb */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-text-muted transition-colors hover:text-primary-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dokumente
            </button>
            <span className="text-text-muted">/</span>
            <span className="font-medium text-text-primary">{getFolderLabel(activeFolder)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${folderBg}`}>
              <FolderIcon className={`h-5 w-5 ${folderColor}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{getFolderLabel(activeFolder)}</h1>
              <p className="text-sm text-text-secondary">
                {folderDocuments.length} Dokument{folderDocuments.length !== 1 ? 'e' : ''}
                {folderDocuments.length > 0 && (
                  <> · {formatFileSize(folderDocuments.reduce((sum, d) => sum + (d.size_bytes || 0), 0))}</>
                )}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Upload className="h-4 w-4" />
          Hochladen
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Drop zone */}
      <div
        className="mb-6 cursor-pointer rounded-2xl border-2 border-dashed border-border bg-surface-secondary/50 p-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleFileSelect(e.dataTransfer.files)
        }}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-text-muted" />
        <p className="text-sm font-medium text-text-primary">Dateien hier ablegen oder klicken</p>
        <p className="mt-1 text-xs text-text-muted">PDF, DOCX, XLSX, CSV, Bilder (max. 20 MB)</p>
      </div>

      {/* Search */}
      {folderDocuments.length > 3 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dokumente durchsuchen..."
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
      )}

      {/* Document list */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <FolderOpen className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            {searchQuery ? 'Keine Dokumente gefunden.' : 'Noch keine Dokumente in diesem Ordner.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Erstes Dokument hochladen
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Dokument</th>
                  <th className="px-5 py-3">Größe</th>
                  <th className="px-5 py-3">KI-Status</th>
                  <th className="px-5 py-3">Datum</th>
                  <th className="px-5 py-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocs.map((doc) => {
                  const Icon = typeIcons[doc.file_type] || File
                  const isProcessing = processing === doc.id
                  return (
                    <tr key={doc.id} className="transition-colors hover:bg-surface-secondary/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 shrink-0 text-text-muted" />
                          <span className="text-sm font-medium text-text-primary truncate max-w-[250px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{formatFileSize(doc.size_bytes)}</td>
                      <td className="px-5 py-3.5">
                        {doc.is_processed ? (
                          <button
                            onClick={() => openSummary(doc)}
                            className="inline-flex items-center gap-1"
                          >
                            <Badge variant="success">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Verarbeitet
                            </Badge>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleProcess(doc)}
                            disabled={!!processing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Wird analysiert...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                KI analysieren
                              </>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-muted">
                        {new Date(doc.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {doc.is_processed && doc.summary && (
                            <button
                              onClick={() => openSummary(doc)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
                              title="Zusammenfassung"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(doc)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
                            title="Herunterladen"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDoc(doc)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Upload Modal (from folder — category pre-set) ── */}
      <Modal
        open={showUploadModal}
        onClose={() => { if (!uploading) { setShowUploadModal(false); setSelectedFiles(null) } }}
        title={`Hochladen in "${getFolderLabel(activeFolder)}"`}
        size="sm"
      >
        {selectedFiles && (
          <div className="mb-4 rounded-xl border border-border bg-surface-secondary/50 p-3">
            {Array.from(selectedFiles).map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-text-primary">
                <File className="h-4 w-4 text-text-muted" />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto text-xs text-text-muted">{formatFileSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface-secondary/50 px-3 py-2 text-sm text-text-secondary">
          <FolderOpen className="h-4 w-4 text-text-muted" />
          Ordner: <span className="font-medium text-text-primary">{getFolderLabel(activeFolder)}</span>
        </div>

        <ModalFooter
          onCancel={() => { setShowUploadModal(false); setSelectedFiles(null) }}
          onSubmit={handleUpload}
          submitLabel={uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          loading={uploading}
        />
      </Modal>

      {/* ─── Summary Modal ─────────────────────────── */}
      <Modal
        open={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title={`KI-Zusammenfassung: ${summaryDoc?.name || ''}`}
        size="lg"
      >
        {summaryDoc?.summary ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-primary-600">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">KI-Analyse abgeschlossen</span>
            </div>
            <div className="rounded-xl border border-border bg-surface-secondary/30 p-4">
              <div className="prose prose-sm max-w-none text-text-secondary">
                {summaryDoc.summary.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-bold text-text-primary mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
                  }
                  if (line.startsWith('• ')) {
                    return <p key={i} className="ml-3 text-sm">• {line.substring(2)}</p>
                  }
                  if (line.startsWith('**') && line.includes(':**')) {
                    const [label, ...rest] = line.split(':**')
                    return (
                      <p key={i} className="mt-3">
                        <strong className="text-text-primary">{label.replace(/\*\*/g, '')}:</strong>{' '}
                        {rest.join(':**').replace(/\*\*/g, '')}
                      </p>
                    )
                  }
                  if (line.trim()) {
                    return <p key={i}>{line}</p>
                  }
                  return null
                })}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <AlertCircle className="h-3 w-3" />
              KI-Zusammenfassungen dienen als Orientierungshilfe und ersetzen kein fachliches Urteil.
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">Keine Zusammenfassung verfügbar.</p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowSummaryModal(false)}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            Schließen
          </button>
        </div>
      </Modal>

      {/* ─── Delete Confirmation ───────────────────── */}
      <ConfirmDialog
        open={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
        title="Dokument löschen"
        message={`Möchten Sie "${deleteDoc?.name}" wirklich löschen? Die Datei und die KI-Zusammenfassung werden unwiderruflich entfernt.`}
        confirmLabel="Endgültig löschen"
        loading={deleting}
      />
    </div>
  )
}
