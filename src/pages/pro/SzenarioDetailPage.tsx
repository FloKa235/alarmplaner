import { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Flame, Sparkles, Edit3, Download,
  Loader2, Upload, CheckCircle2, X, FileText,
  ClipboardList, LayoutDashboard, BookOpen,
} from 'lucide-react'
import Modal, { FormField, ModalFooter, inputClass, selectClass, textareaClass } from '@/components/ui/Modal'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useDistrict } from '@/hooks/useDistrict'
import { useHandbookEnrichment } from '@/hooks/useAI'
import { supabase } from '@/lib/supabase'
import { exportScenarioPDF } from '@/utils/pdf-export'
import { isHandbookV2 } from '@/types/database'
import type { DbScenario, DbScenarioPhase, ScenarioHandbook, ScenarioHandbookV2 } from '@/types/database'
import { migrateV1toV2 } from '@/utils/handbook-migration'

// Tab-Komponenten
import HandlungsplanTab from './szenario-detail/HandlungsplanTab'
import type { PhaseForm } from './szenario-detail/HandlungsplanTab'
import UebersichtTab from './szenario-detail/UebersichtTab'
import KrisenhandbuchTab from './szenario-detail/KrisenhandbuchTab'
import ChecklistenTab from './szenario-detail/ChecklistenTab'
import DokumenteTab from './szenario-detail/DokumenteTab'

// ─── Tab-Config (5 Tabs) ───────────────────────────────
type TabKey = 'uebersicht' | 'krisenhandbuch' | 'handlungsplan' | 'checklisten' | 'dokumente'

const TABS: { key: TabKey; label: string; icon: typeof Flame; needsHandbook: boolean }[] = [
  { key: 'uebersicht', label: 'Übersicht', icon: LayoutDashboard, needsHandbook: false },
  { key: 'krisenhandbuch', label: 'Krisenhandbuch', icon: BookOpen, needsHandbook: false },
  { key: 'handlungsplan', label: 'Handlungsplan', icon: ClipboardList, needsHandbook: false },
  { key: 'checklisten', label: 'Fortschritt', icon: CheckCircle2, needsHandbook: false },
  { key: 'dokumente', label: 'Dokumente', icon: FileText, needsHandbook: false },
]

// ─── Scenario Types ──────────────────────────────────
const scenarioTypes = [
  'Starkregen', 'Sturm', 'Hitzewelle', 'Kältewelle', 'Waldbrand',
  'Amoklauf', 'CBRN', 'Cyberangriff', 'Krieg', 'Pandemie',
  'Sabotage', 'Stromausfall', 'Terroranschlag',
]

export default function SzenarioDetailPage() {
  const { id } = useParams()
  const { district } = useDistrict()
  const [activeTab, setActiveTab] = useState<TabKey>('uebersicht')
  const [editingTab, setEditingTab] = useState<TabKey | null>(null)

  // ─── Data Fetching ─────────────────────────────────
  const { data: scenario, loading: scenarioLoading, refetch: refetchScenario } = useSupabaseSingle<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('id', id!)
        .single(),
    [id]
  )

  const { data: phases, loading: phasesLoading, refetch: refetchPhases } = useSupabaseQuery<DbScenarioPhase>(
    (sb) =>
      sb
        .from('scenario_phases')
        .select('*')
        .eq('scenario_id', id!)
        .order('sort_order'),
    [id]
  )

  // ─── V1 → V2 Auto-Migration ────────────────────────
  const handbookV2 = useMemo<ScenarioHandbookV2 | null>(() => {
    if (!scenario?.handbook) return null
    if (isHandbookV2(scenario.handbook)) return scenario.handbook
    // Auto-migrate V1 → V2
    return migrateV1toV2(scenario.handbook as ScenarioHandbook, phases)
  }, [scenario?.handbook, phases])

  // ─── KI-Handbook Enrichment ──────────────────────────
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docFileInputRef = useRef<HTMLInputElement>(null)

  const { execute: enrichHandbook, loading: enriching } = useHandbookEnrichment(id || null, uploadedDocId)

  const handleEnrich = async () => {
    const result = await enrichHandbook()
    if (result) {
      refetchScenario()
      setUploadedDocId(null)
      setUploadedFileName(null)
    }
  }

  const handleDocUpload = async (file: File) => {
    if (!district?.id) return
    setUploadingDoc(true)
    try {
      const storagePath = `${district.id}/${crypto.randomUUID()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const { data: docRecord, error: insertError } = await supabase
        .from('documents')
        .insert({
          district_id: district.id,
          name: file.name,
          file_type: fileExt,
          size_bytes: file.size,
          category: 'Handbuch',
          storage_path: storagePath,
          is_processed: false,
        })
        .select()
        .single()
      if (insertError) throw insertError

      setUploadedDocId(docRecord.id)
      setUploadedFileName(file.name)
    } catch (err) {
      console.error('Dokument-Upload fehlgeschlagen:', err)
    } finally {
      setUploadingDoc(false)
    }
  }

  // ─── Handbook V2 Update (ganzes Handbuch) ──────────────
  const [handbookSaving, setHandbookSaving] = useState(false)

  const onUpdateHandbook = async (updated: ScenarioHandbookV2) => {
    if (!scenario) return
    setHandbookSaving(true)
    try {
      const { error } = await supabase
        .from('scenarios')
        .update({ handbook: updated as unknown as Record<string, unknown> })
        .eq('id', scenario.id)
      if (error) throw error
      refetchScenario()
    } catch (err) {
      console.error('Krisenhandbuch speichern fehlgeschlagen:', err)
    } finally {
      setHandbookSaving(false)
    }
  }

  // ─── Phase Save Callback (for HandlungsplanTab) ──────
  const [phaseSaving, setPhaseSaving] = useState(false)

  const onSavePhases = async (phaseForms: PhaseForm[]) => {
    if (!scenario) return
    setPhaseSaving(true)
    try {
      // 1) Delete all existing phases
      const { error: deleteError } = await supabase
        .from('scenario_phases')
        .delete()
        .eq('scenario_id', scenario.id)
      if (deleteError) throw deleteError

      // 2) Insert new phases with correct sort_order
      const phaseInserts = phaseForms
        .filter(p => p.name.trim())
        .map((p, i) => ({
          scenario_id: scenario.id,
          name: p.name.trim(),
          duration: p.duration.trim() || 'Nicht definiert',
          sort_order: i,
          tasks: p.tasks.filter(t => t.trim()),
        }))

      if (phaseInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('scenario_phases')
          .insert(phaseInserts)
        if (insertError) throw insertError
      }

      refetchPhases()
    } catch (err) {
      console.error('Fehler beim Speichern der Phasen:', err)
      alert('Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setPhaseSaving(false)
    }
  }

  // ─── Metadata Edit Modal ──────────────────────────
  const [showMetaModal, setShowMetaModal] = useState(false)
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaForm, setMetaForm] = useState({
    title: '',
    type: '',
    severity: 50,
    description: '',
    affected_population: '',
  })

  const openMetaModal = () => {
    if (!scenario) return
    setMetaForm({
      title: scenario.title,
      type: scenario.type,
      severity: scenario.severity,
      description: scenario.description || '',
      affected_population: scenario.affected_population?.toString() || '',
    })
    setShowMetaModal(true)
  }

  const saveMetadata = async () => {
    if (!scenario) return
    setMetaSaving(true)
    try {
      const { error } = await supabase
        .from('scenarios')
        .update({
          title: metaForm.title.trim(),
          type: metaForm.type,
          severity: metaForm.severity,
          description: metaForm.description.trim() || null,
          affected_population: metaForm.affected_population ? parseInt(metaForm.affected_population, 10) : null,
          is_edited: true,
        })
        .eq('id', scenario.id)
      if (error) throw error
      refetchScenario()
      setShowMetaModal(false)
    } catch (err) {
      console.error('Fehler beim Speichern der Metadaten:', err)
      alert('Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setMetaSaving(false)
    }
  }

  // ─── PDF Export ────────────────────────────────────
  const handlePDFExport = () => {
    if (!scenario) return
    exportScenarioPDF(scenario, phases, district?.name)
  }

  // ─── Loading / Not Found ───────────────────────────
  if (scenarioLoading || phasesLoading) {
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

  // Tabs die editierbar sind: Krisenhandbuch + Handlungsplan
  const isEditableTab = activeTab === 'krisenhandbuch' || activeTab === 'handlungsplan'
  const canEdit = isEditableTab && (activeTab === 'handlungsplan' ? !!handbookV2 : !!handbookV2)

  return (
    <div>
      {/* Header: Titel + Meta-Chips + Actions in einer Zeile */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{scenario.title}</h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              <Flame className="h-3 w-3" />
              {scenario.severity}/100
            </span>
            {scenario.affected_population && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                ~{scenario.affected_population.toLocaleString('de-DE')} Betroffene
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
              {new Date(scenario.created_at).toLocaleDateString('de-DE')}
            </span>
            {scenario.is_ai_generated && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                <Sparkles className="h-3 w-3" /> KI
              </span>
            )}
            <button
              onClick={openMetaModal}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
              title="Szenario-Details bearbeiten"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePDFExport}
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
          {!scenario.handbook && (
            <>
              <input
                ref={docFileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0])}
              />
              <button
                onClick={() => docFileInputRef.current?.click()}
                disabled={uploadingDoc || enriching}
                className="relative flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-60"
                title={uploadedFileName ? `Dokument: ${uploadedFileName}` : 'Bestehenden Plan hochladen (optional)'}
              >
                {uploadingDoc ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : uploadedFileName ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="max-w-[120px] truncate text-green-700">{uploadedFileName}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadedDocId(null); setUploadedFileName(null) }}
                      className="ml-1 rounded p-0.5 text-text-muted transition-colors hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </button>
            </>
          )}
          {!scenario.handbook && (
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
            >
              {enriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generiere…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  KI generieren
                </>
              )}
            </button>
          )}
          {canEdit && editingTab !== activeTab && (
            <button
              onClick={() => setEditingTab(activeTab)}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Edit3 className="h-4 w-4" />
              Bearbeiten
            </button>
          )}
        </div>
      </div>

      {/* Enriching-Banner (während Generierung) */}
      {enriching && !scenario.handbook && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Krisenhandbuch wird generiert…</strong> Die KI erstellt Handlungsplan, Risikobewertung, Kommunikationsplan, Verantwortlichkeiten und mehr. Dies kann 20–40 Sekunden dauern.
          </p>
        </div>
      )}

      {/* Tab-Leiste */}
      <div className="mb-3 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            const isDisabled = tab.needsHandbook && !handbookV2

            return (
              <button
                key={tab.key}
                onClick={() => { if (!isDisabled) { setActiveTab(tab.key); setEditingTab(null) } }}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : isDisabled
                    ? 'cursor-not-allowed border-transparent text-text-muted opacity-50'
                    : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab-spezifische KPI-Leiste */}
      <TabKPIs activeTab={activeTab} handbook={handbookV2} phases={phases} />

      {/* Tab-Content */}
      <div>
        {activeTab === 'uebersicht' && (
          <UebersichtTab scenario={scenario} handbook={handbookV2} phases={phases} />
        )}

        {activeTab === 'krisenhandbuch' && (
          handbookV2 ? (
            <KrisenhandbuchTab
              handbook={handbookV2}
              scenarioId={scenario.id}
              districtId={district?.id || ''}
              onUpdateHandbook={onUpdateHandbook}
              saving={handbookSaving}
              isEditing={editingTab === 'krisenhandbuch'}
              onStopEditing={() => setEditingTab(null)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-text-muted" />
              <p className="text-sm text-text-secondary">
                Noch kein Krisenhandbuch vorhanden. Klicken Sie oben auf „KI generieren", um das vollständige Krisenhandbuch zu erstellen.
              </p>
            </div>
          )
        )}

        {activeTab === 'handlungsplan' && (
          handbookV2 ? (
            <HandlungsplanTab
              phases={phases}
              onSavePhases={onSavePhases}
              saving={phaseSaving}
              isEditing={editingTab === 'handlungsplan'}
              onStopEditing={() => setEditingTab(null)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-text-muted" />
              <p className="text-sm text-text-secondary">
                Noch kein Handlungsplan vorhanden. Klicken Sie oben auf „KI generieren", um das vollständige Krisenhandbuch zu erstellen.
              </p>
            </div>
          )
        )}

        {activeTab === 'checklisten' && handbookV2 && (
          <ChecklistenTab handbook={handbookV2} />
        )}
        {activeTab === 'checklisten' && !handbookV2 && (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Noch keine Checklisten vorhanden. Generieren Sie zuerst das Krisenhandbuch.
            </p>
          </div>
        )}

        {activeTab === 'dokumente' && scenario && district && (
          <DokumenteTab scenarioId={scenario.id} districtId={district.id} />
        )}
      </div>

      {/* ─── Metadaten-Edit Modal (klein, nur Szenario-Infos) ─── */}
      <Modal
        open={showMetaModal}
        onClose={() => !metaSaving && setShowMetaModal(false)}
        title="Szenario-Details bearbeiten"
        size="md"
      >
        <FormField label="Titel" required>
          <input
            className={inputClass}
            value={metaForm.title}
            onChange={(e) => setMetaForm({ ...metaForm, title: e.target.value })}
            placeholder="z.B. Großflächiger Stromausfall"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Typ" required>
            <select
              className={selectClass}
              value={metaForm.type}
              onChange={(e) => setMetaForm({ ...metaForm, type: e.target.value })}
            >
              {scenarioTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>

          <FormField label={`Schweregrad: ${metaForm.severity}/100`}>
            <input
              type="range"
              min="1"
              max="100"
              value={metaForm.severity}
              onChange={(e) => setMetaForm({ ...metaForm, severity: parseInt(e.target.value, 10) })}
              className="mt-2 w-full accent-primary-600"
            />
          </FormField>
        </div>

        <FormField label="Beschreibung">
          <textarea
            className={textareaClass}
            rows={3}
            value={metaForm.description}
            onChange={(e) => setMetaForm({ ...metaForm, description: e.target.value })}
            placeholder="Kurze Beschreibung des Krisenszenarios..."
          />
        </FormField>

        <FormField label="Betroffene Bevölkerung">
          <input
            type="number"
            className={inputClass}
            value={metaForm.affected_population}
            onChange={(e) => setMetaForm({ ...metaForm, affected_population: e.target.value })}
            placeholder="z.B. 25000"
          />
        </FormField>

        <ModalFooter
          onCancel={() => setShowMetaModal(false)}
          onSubmit={saveMetadata}
          submitLabel="Speichern"
          loading={metaSaving}
          disabled={!metaForm.title.trim() || !metaForm.type}
        />
      </Modal>
    </div>
  )
}

// ─── Tab-spezifische KPI-Leiste ─────────────────────
interface KPI { label: string; value: string | number; color: 'primary' | 'green' | 'amber' | 'red' | 'gray' }

const kpiColorClasses: Record<KPI['color'], string> = {
  primary: 'bg-primary-50 text-primary-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
}

function getTabKPIs(
  activeTab: TabKey,
  handbook: ScenarioHandbookV2 | null,
  phases: DbScenarioPhase[],
): KPI[] {
  switch (activeTab) {
    case 'uebersicht':
      return [] // Mini-Stats sind direkt im Tab
    case 'krisenhandbuch': {
      if (!handbook) return []
      const kapitelCount = handbook.kapitel.length
      const totalItems = handbook.kapitel.reduce((sum, k) => sum + k.checkliste.length, 0)
      const doneItems = handbook.kapitel.reduce(
        (sum, k) => sum + k.checkliste.filter(i => i.status === 'done' || i.status === 'skipped').length, 0
      )
      const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0
      return [
        { label: 'Kapitel', value: kapitelCount, color: 'primary' },
        { label: 'Checklisten-Punkte', value: totalItems, color: 'primary' },
        { label: 'Fortschritt', value: `${percent}%`, color: percent >= 80 ? 'green' : percent >= 40 ? 'amber' : 'gray' },
      ]
    }
    case 'handlungsplan': {
      const totalTasks = phases.reduce((acc, p) => acc + (p.tasks?.length || 0), 0)
      return [
        { label: 'Phasen', value: phases.length, color: 'primary' },
        { label: 'Aufgaben', value: totalTasks, color: 'primary' },
      ]
    }
    case 'checklisten': {
      if (!handbook) return [{ label: 'Aufgaben', value: 0, color: 'gray' }]
      const allItems = handbook.kapitel.flatMap(k => k.checkliste)
      const doneCount = allItems.filter(i => i.status === 'done' || i.status === 'skipped').length
      const percent = allItems.length > 0 ? Math.round((doneCount / allItems.length) * 100) : 0
      return [
        { label: 'Aufgaben', value: allItems.length, color: 'primary' },
        { label: 'Erledigt', value: doneCount, color: doneCount === allItems.length && allItems.length > 0 ? 'green' : 'primary' },
        { label: 'Fortschritt', value: `${percent}%`, color: percent >= 80 ? 'green' : percent >= 40 ? 'amber' : 'gray' },
      ]
    }
    case 'dokumente':
      return []
    default:
      return []
  }
}

function TabKPIs({ activeTab, handbook, phases }: {
  activeTab: TabKey
  handbook: ScenarioHandbookV2 | null
  phases: DbScenarioPhase[]
}) {
  const kpis = getTabKPIs(activeTab, handbook, phases)
  if (kpis.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {kpis.map((kpi) => (
        <span
          key={kpi.label}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${kpiColorClasses[kpi.color]}`}
        >
          {kpi.label}: {kpi.value}
        </span>
      ))}
    </div>
  )
}
