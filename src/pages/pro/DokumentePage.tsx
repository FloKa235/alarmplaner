import { useRef, useState } from 'react'
import {
  FileText, Upload, Search, Download, File, FileImage, FileSpreadsheet,
  Loader2, Sparkles, Trash2, Eye, AlertCircle, CheckCircle2
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

const CATEGORIES = ['Einsatzplan', 'Verordnung', 'Handbuch', 'Sonstiges']

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

// ─── Component ───────────────────────────────────────
export default function DokumentePage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── State ──
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null) // document_id being processed
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('Sonstiges')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryDoc, setSummaryDoc] = useState<DbDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<DbDocument | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  // ── Upload Handler ──
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    // Validate file size
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_FILE_SIZE) {
        alert(`Datei "${files[i].name}" ist zu groß (max. 20 MB).`)
        return
      }
    }
    setSelectedFiles(files)
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

        // 1) Upload to Supabase Storage
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

        // 2) Insert into documents table
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
          // Cleanup: delete uploaded file
          await supabase.storage.from('documents').remove([storagePath])
          alert(`Fehler beim Speichern von "${file.name}": ${insertError.message}`)
        }
      }

      refetch()
      setShowUploadModal(false)
      setSelectedFiles(null)
      setUploadCategory('Sonstiges')
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

      // Create blob URL and trigger download
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
      // 1) Delete from storage
      if (deleteDoc.storage_path) {
        await supabase.storage.from('documents').remove([deleteDoc.storage_path])
      }

      // 2) Delete from DB
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

  // ── Loading ──
  if (districtLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const filtered = searchQuery
    ? documents.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents

  return (
    <div>
      <PageHeader
        title="Dokumente"
        description="Laden Sie Dokumente hoch für KI-Analyse und Krisenhandbuch-Generierung."
        actions={
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Upload className="h-4 w-4" />
            Hochladen
          </button>
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

      {/* Drop zone */}
      <div
        className="mb-8 cursor-pointer rounded-2xl border-2 border-dashed border-border bg-surface-secondary/50 p-8 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleFileSelect(e.dataTransfer.files)
        }}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm font-medium text-text-primary">Dateien hier ablegen oder klicken zum Hochladen</p>
        <p className="mt-1 text-xs text-text-muted">PDF, DOCX, XLSX, CSV, Bilder (max. 20 MB)</p>
      </div>

      {/* Search */}
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

      {/* Stats */}
      {documents.length > 0 && (
        <div className="mb-4 flex gap-4 text-xs text-text-muted">
          <span>{documents.length} Dokument{documents.length !== 1 ? 'e' : ''}</span>
          <span>•</span>
          <span>{documents.filter((d) => d.is_processed).length} verarbeitet</span>
          <span>•</span>
          <span>{formatFileSize(documents.reduce((sum, d) => sum + (d.size_bytes || 0), 0))} gesamt</span>
        </div>
      )}

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            {searchQuery ? 'Keine Dokumente gefunden.' : 'Noch keine Dokumente hochgeladen.'}
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
                  <th className="px-5 py-3">Kategorie</th>
                  <th className="px-5 py-3">Größe</th>
                  <th className="px-5 py-3">KI-Status</th>
                  <th className="px-5 py-3">Datum</th>
                  <th className="px-5 py-3 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((doc) => {
                  const Icon = typeIcons[doc.file_type] || File
                  const isProcessing = processing === doc.id
                  return (
                    <tr key={doc.id} className="transition-colors hover:bg-surface-secondary/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 shrink-0 text-text-muted" />
                          <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge>{doc.category || '–'}</Badge>
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

      {/* ─── Upload Category Modal ──────────────────── */}
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

        <FormField label="Kategorie" required>
          <select
            className={selectClass}
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
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
