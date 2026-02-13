import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Flame, Sparkles, Edit3, Download, Users, MapPin, Clock,
  Loader2, Lock, Upload, CheckCircle2, X,
  ShieldAlert, Shield, MessageCircle, GitBranch, UserCheck, ClipboardList, Package,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, ModalFooter, inputClass, selectClass, textareaClass } from '@/components/ui/Modal'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useDistrict } from '@/hooks/useDistrict'
import { useHandbookEnrichment } from '@/hooks/useAI'
import { supabase } from '@/lib/supabase'
import { exportScenarioPDF } from '@/utils/pdf-export'
import type { DbScenario, DbScenarioPhase, DbAlertContact } from '@/types/database'

// Tab-Komponenten
import HandlungsplanTab from './szenario-detail/HandlungsplanTab'
import type { PhaseForm } from './szenario-detail/HandlungsplanTab'
import RisikobewertungTab from './szenario-detail/RisikobewertungTab'
import PraeventionTab from './szenario-detail/PraeventionTab'
import KommunikationsplanTab from './szenario-detail/KommunikationsplanTab'
import WennDannTab from './szenario-detail/WennDannTab'
import VerantwortlichkeitenTab from './szenario-detail/VerantwortlichkeitenTab'
import InventarTab from './szenario-detail/InventarTab'
import ChecklistenTab from './szenario-detail/ChecklistenTab'

// ─── Tab-Config ──────────────────────────────────────
type TabKey = 'handlungsplan' | 'risiko' | 'praevention' | 'kommunikation' | 'wenn-dann' | 'verantwortlichkeiten' | 'inventar' | 'checklisten'

const TABS: { key: TabKey; label: string; icon: typeof Flame; needsHandbook: boolean }[] = [
  { key: 'handlungsplan', label: 'Handlungsplan', icon: ClipboardList, needsHandbook: false },
  { key: 'risiko', label: 'Risiko', icon: ShieldAlert, needsHandbook: true },
  { key: 'praevention', label: 'Prävention', icon: Shield, needsHandbook: true },
  { key: 'kommunikation', label: 'Kommunikation', icon: MessageCircle, needsHandbook: true },
  { key: 'wenn-dann', label: 'Wenn-Dann', icon: GitBranch, needsHandbook: true },
  { key: 'verantwortlichkeiten', label: 'Verantwortlichkeiten', icon: UserCheck, needsHandbook: true },
  { key: 'inventar', label: 'Inventar', icon: Package, needsHandbook: true },
  { key: 'checklisten', label: 'Checklisten', icon: ClipboardList, needsHandbook: false },
]

// ─── Scenario Types ──────────────────────────────────
const scenarioTypes = [
  'Hochwasser', 'Sturm', 'Waldbrand', 'Erdbeben', 'Stromausfall',
  'Cyberangriff', 'Pandemie', 'Industrieunfall', 'CBRN-Lage',
  'Sabotage', 'Krieg', 'Terroranschlag',
]

export default function SzenarioDetailPage() {
  const { id } = useParams()
  const { district } = useDistrict()
  const [activeTab, setActiveTab] = useState<TabKey>('handlungsplan')
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

  const { data: contacts } = useSupabaseQuery<DbAlertContact>(
    (sb) =>
      sb
        .from('alert_contacts')
        .select('*')
        .eq('district_id', district?.id || '')
        .eq('is_active', true)
        .order('name'),
    [district?.id]
  )

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
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const storagePath = `${district.id}/${crypto.randomUUID()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError

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

  // ─── Handbook Section Update ──────────────────────────
  const [handbookSaving, setHandbookSaving] = useState(false)

  const onUpdateHandbook = async (section: string, data: unknown) => {
    if (!scenario || !handbook) return
    setHandbookSaving(true)
    try {
      const updated = { ...handbook, [section]: data }
      const { error } = await supabase
        .from('scenarios')
        .update({ handbook: updated })
        .eq('id', scenario.id)
      if (error) throw error
      refetchScenario()
    } catch (err) {
      console.error('Handbuch-Abschnitt speichern fehlgeschlagen:', err)
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
    exportScenarioPDF(scenario, phases, district?.name, contacts)
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

  const handbook = scenario.handbook

  // Tabs die editierbar sind (nicht Risiko, nicht Checklisten)
  const isEditableTab = activeTab !== 'risiko' && activeTab !== 'checklisten'
  // Bearbeiten nur wenn Handbook existiert (für alle Tabs inkl. Handlungsplan)
  const canEdit = isEditableTab && !!handbook

  return (
    <div>
      <Link
        to="/pro/szenarien"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Szenarien
      </Link>

      <PageHeader
        title={scenario.title}
        description={scenario.is_default ? 'Pflicht-Krisenszenario mit editierbarem Handlungsplan.' : 'KI-generiertes Krisenszenario mit editierbarem Handlungsplan.'}
        badge={scenario.is_default ? 'Pflicht-Szenario' : 'Szenario'}
        actions={
          <div className="flex gap-2">
            {/* PDF Export */}
            <button
              onClick={handlePDFExport}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>

            {/* Upload-Button (nur wenn Handbook noch nicht generiert) */}
            {!handbook && (
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

            {/* KI-Generieren Button (nur wenn Handbook noch nicht generiert) */}
            {!handbook && (
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

            {/* Bearbeiten-Button: sichtbar wenn editierbarer Tab + Handbook existiert + nicht bereits im Edit-Modus */}
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
        }
      />

      {/* Meta info */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Flame className="h-5 w-5" />} label="Schweregrad" value={`${scenario.severity}/100`} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Betroffene" value={scenario.affected_population ? `~${scenario.affected_population.toLocaleString('de-DE')}` : 'k.A.'} />
        <StatCard icon={<MapPin className="h-5 w-5" />} label="Typ" value={scenario.type} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Erstellt am" value={new Date(scenario.created_at).toLocaleDateString('de-DE')} />
      </div>

      {/* Description */}
      {scenario.description && (
        <div className="mb-6 rounded-2xl border border-border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary">Beschreibung</h2>
            {!scenario.is_default && (
              <button
                onClick={openMetaModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-primary-600"
                title="Szenario-Details bearbeiten"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
            {scenario.is_default && (
              <Badge variant="warning">
                <Lock className="mr-1 h-3 w-3" />
                Pflicht
              </Badge>
            )}
            {scenario.is_ai_generated && (
              <Badge variant="info">
                <Sparkles className="mr-1 h-3 w-3" />
                KI-generiert
              </Badge>
            )}
          </div>
          <p className="leading-relaxed text-text-secondary">{scenario.description}</p>
        </div>
      )}

      {/* Enriching-Banner (während Generierung) */}
      {enriching && !handbook && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Krisenhandbuch wird generiert…</strong> Die KI erstellt Handlungsplan, Risikobewertung, Kommunikationsplan, Verantwortlichkeiten und mehr. Dies kann 20–40 Sekunden dauern.
          </p>
        </div>
      )}

      {/* Tab-Leiste */}
      <div className="mb-6 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            const isDisabled = tab.needsHandbook && !handbook

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

      {/* Tab-Content */}
      <div>
        {activeTab === 'handlungsplan' && (
          handbook ? (
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

        {activeTab === 'risiko' && handbook && (
          <RisikobewertungTab handbook={handbook} />
        )}

        {activeTab === 'praevention' && handbook && (
          <PraeventionTab handbook={handbook} onUpdateHandbook={onUpdateHandbook} saving={handbookSaving} isEditing={editingTab === 'praevention'} onStopEditing={() => setEditingTab(null)} />
        )}

        {activeTab === 'kommunikation' && handbook && (
          <KommunikationsplanTab handbook={handbook} onUpdateHandbook={onUpdateHandbook} saving={handbookSaving} isEditing={editingTab === 'kommunikation'} onStopEditing={() => setEditingTab(null)} />
        )}

        {activeTab === 'wenn-dann' && handbook && (
          <WennDannTab handbook={handbook} onUpdateHandbook={onUpdateHandbook} saving={handbookSaving} isEditing={editingTab === 'wenn-dann'} onStopEditing={() => setEditingTab(null)} />
        )}

        {activeTab === 'verantwortlichkeiten' && handbook && (
          <VerantwortlichkeitenTab handbook={handbook} contacts={contacts} onUpdateHandbook={onUpdateHandbook} saving={handbookSaving} isEditing={editingTab === 'verantwortlichkeiten'} onStopEditing={() => setEditingTab(null)} />
        )}

        {activeTab === 'inventar' && handbook && district && (
          <InventarTab handbook={handbook} districtId={district.id} onUpdateHandbook={onUpdateHandbook} saving={handbookSaving} isEditing={editingTab === 'inventar'} onStopEditing={() => setEditingTab(null)} />
        )}

        {activeTab === 'checklisten' && scenario && district && (
          <ChecklistenTab scenarioId={scenario.id} districtId={district.id} />
        )}

        {/* Empty State für Handbook-Tabs wenn nicht generiert */}
        {activeTab !== 'handlungsplan' && activeTab !== 'checklisten' && !handbook && (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Noch keine Daten vorhanden. Klicken Sie oben auf „KI generieren", um das vollständige Krisenhandbuch zu erstellen.
            </p>
          </div>
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
