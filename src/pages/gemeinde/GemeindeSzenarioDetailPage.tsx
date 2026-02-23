/**
 * GemeindeSzenarioDetailPage — Szenario-Detail für Bürgermeister
 *
 * Volle 7-Tab-Struktur wie SzenarioDetailPage (Pro),
 * aber scoped auf die Gemeinde. Eigene Szenarien sind editierbar,
 * Landkreis-Szenarien werden read-only angezeigt.
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Flame, Sparkles, Save, ArrowLeft,
  Loader2, FileText, Eye, ClipboardCheck, Package, Lock,
} from 'lucide-react'
import ErrorBanner from '@/components/ui/ErrorBanner'
import { useSupabaseSingle, useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { useMembership } from '@/hooks/useMembership'
import { useHandbookEnrichment } from '@/hooks/useAI'
import { supabase } from '@/lib/supabase'
import { exportScenarioPDF } from '@/utils/pdf-export'
import { isHandbookV2, isHandbookV3 } from '@/types/database'
import type {
  DbScenario, DbScenarioPhase, DbInventoryItem, DbAlertContact,
  DbChecklist, DbInventoryScenarioLink,
  ScenarioHandbook, ScenarioHandbookV3, SzenarioMeta,
  EskalationsStufe, AlarmkettenSchritt,
} from '@/types/database'
import { migrateV1toV2, migrateV2toV3 } from '@/utils/handbook-migration'

// Helpers (reuse from Pro)
import { extractKrisenstabRollen } from '../pro/szenario-detail/helpers/handbook-extract'
import { calculateReadiness, type TabKey } from '../pro/szenario-detail/helpers/readiness-checks'
import { migrateToEskalationsstufen, createDefaultEskalationsstufen, ESKALATION_COLORS } from '../pro/szenario-detail/helpers/eskalation-defaults'

// Components (reuse from Pro)
import UebersichtSection from '../pro/szenario-detail/UebersichtSection'
import StufeHeaderSection from '../pro/szenario-detail/StufeHeaderSection'
import HandlungsplanSection from '../pro/szenario-detail/HandlungsplanSection'
import AlarmierungSection from '../pro/szenario-detail/AlarmierungSection'
import KommunikationSection from '../pro/szenario-detail/KommunikationSection'
import RessourcenSection from '../pro/szenario-detail/RessourcenSection'
import HandbuchDokumenteSection from '../pro/szenario-detail/HandbuchDokumenteSection'
import ChecklistenSection from '../pro/szenario-detail/ChecklistenSection'
import InventarSection from '../pro/szenario-detail/InventarSection'

// Modals (reuse from Pro)
import MetadatenModal from '../pro/szenario-detail/modals/MetadatenModal'
import AlarmketteEditModal from '../pro/szenario-detail/modals/AlarmketteEditModal'

// ─── Tab-Config ─────────────────────────────────────
const TABS: { key: TabKey; label: string; icon?: typeof Flame; stufeNr?: 1 | 2 | 3 }[] = [
  { key: 'uebersicht', label: 'Übersicht', icon: Eye },
  { key: 'stufe1', label: 'Vorwarnung', stufeNr: 1 },
  { key: 'stufe2', label: 'Akuter Vorfall', stufeNr: 2 },
  { key: 'stufe3', label: 'Katastrophe', stufeNr: 3 },
  { key: 'checklisten', label: 'Checklisten', icon: ClipboardCheck },
  { key: 'inventar', label: 'Inventar', icon: Package },
  { key: 'handbuch', label: 'Handbuch & Dokumente', icon: FileText },
]

export default function GemeindeSzenarioDetailPage() {
  const { id } = useParams()
  const { districtId, municipalityId, municipality } = useMembership()
  const [activeTab, setActiveTab] = useState<TabKey>('uebersicht')

  // ─── Data Fetching ──────────────────────────────────
  const { data: scenario, loading: scenarioLoading, refetch: refetchScenario } = useSupabaseSingle<DbScenario>(
    (sb) => sb.from('scenarios').select('*').eq('id', id!).single(),
    [id]
  )

  // Bestimme ob eigenes Gemeinde-Szenario (editierbar) oder Landkreis-Szenario (read-only)
  const isOwnScenario = useMemo(() => {
    if (!scenario || !municipalityId) return false
    return scenario.municipality_id === municipalityId
  }, [scenario, municipalityId])

  const isReadOnly = !isOwnScenario

  const { data: phases } = useSupabaseQuery<DbScenarioPhase>(
    (sb) => sb.from('scenario_phases').select('*').eq('scenario_id', id!).order('sort_order'),
    [id]
  )

  const { data: inventoryItems } = useSupabaseQuery<DbInventoryItem>(
    (sb) => sb.from('inventory_items').select('*').eq('district_id', districtId || ''),
    [districtId]
  )

  const { data: alertContacts } = useSupabaseQuery<DbAlertContact>(
    (sb) => sb.from('alert_contacts').select('*').eq('district_id', districtId || '').eq('is_active', true),
    [districtId]
  )

  const { data: vorbereitungChecklisten } = useSupabaseQuery<DbChecklist>(
    (sb) => sb.from('checklists').select('*')
      .eq('scenario_id', id!).eq('category', 'vorbereitung'),
    [id]
  )

  const { data: szenarioInventoryLinks } = useSupabaseQuery<DbInventoryScenarioLink>(
    (sb) => sb.from('inventory_scenario_links').select('*').eq('scenario_id', id!),
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

  // ─── Krisenstab-Rollen ────────────────────────────────
  const krisenstabRollen = useMemo(
    () => handbookV3 ? extractKrisenstabRollen(handbookV3) : [],
    [handbookV3]
  )

  // ─── Eskalationsstufen State ──────────────────────────
  const [eskalationsstufen, setEskalationsstufen] = useState<EskalationsStufe[]>([])
  const [eskalationDirty, setEskalationDirty] = useState(false)
  const [eskalationSaving, setEskalationSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Initialisierung: Aus meta laden oder migrieren
  useEffect(() => {
    if (!scenario) return
    const meta = scenario.meta as SzenarioMeta | null

    if (meta?.eskalationsstufen && meta.eskalationsstufen.length > 0) {
      setEskalationsstufen(meta.eskalationsstufen)
    } else if (phases.length > 0 || meta?.sofortmassnahmen?.length || meta?.massnahmenplan?.alarmkette?.length) {
      setEskalationsstufen(migrateToEskalationsstufen({ meta, phases, scenarioType: scenario.type }))
    } else {
      setEskalationsstufen(createDefaultEskalationsstufen(scenario.type))
    }
    setEskalationDirty(false)
  }, [scenario?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEskalationChange = useCallback((stufen: EskalationsStufe[]) => {
    if (isReadOnly) return
    setEskalationsstufen(stufen)
    setEskalationDirty(true)
  }, [isReadOnly])

  const handleStufeFieldUpdate = useCallback((stufeIdx: number, update: Partial<EskalationsStufe>) => {
    if (isReadOnly) return
    setEskalationsstufen(prev => prev.map((s, i) => i === stufeIdx ? { ...s, ...update } : s))
    setEskalationDirty(true)
  }, [isReadOnly])

  const saveEskalationsstufen = async () => {
    if (!scenario || isReadOnly) return
    setEskalationSaving(true)
    setErrorMessage(null)
    try {
      const currentMeta = (scenario.meta as unknown as Record<string, unknown>) || {}
      const updatedMeta = {
        ...currentMeta,
        eskalationsstufen,
      }
      const { error } = await supabase
        .from('scenarios')
        .update({ meta: updatedMeta, is_edited: true })
        .eq('id', scenario.id)
      if (error) throw error
      setEskalationDirty(false)
      refetchScenario()
    } catch (err) {
      console.error('Fehler beim Speichern der Eskalationsstufen:', err)
      setErrorMessage('Fehler beim Speichern der Eskalationsstufen. Bitte erneut versuchen.')
    } finally {
      setEskalationSaving(false)
    }
  }

  // ─── Alarmkette Modal (pro Stufe) ─────────────────────
  const [alarmketteModalStufeIdx, setAlarmketteModalStufeIdx] = useState<number | null>(null)

  const handleAlarmketteSave = async (updatedKette: AlarmkettenSchritt[]) => {
    if (alarmketteModalStufeIdx === null || isReadOnly) return
    const updated = eskalationsstufen.map((s, i) =>
      i === alarmketteModalStufeIdx ? { ...s, alarmkette: updatedKette } : s
    )
    setEskalationsstufen(updated)
    setEskalationDirty(true)
  }

  // ─── Readiness ────────────────────────────────────────
  const szenarioInventoryItems = useMemo(() => {
    if (!szenarioInventoryLinks.length) return []
    return inventoryItems.filter(i => szenarioInventoryLinks.some(l => l.inventory_item_id === i.id))
  }, [inventoryItems, szenarioInventoryLinks])

  const readiness = useMemo(() => calculateReadiness({
    eskalationsstufen,
    krisenstabRollen,
    alertContacts,
    inventoryItems,
    vorbereitungChecklisten,
    szenarioInventoryItems,
  }), [eskalationsstufen, krisenstabRollen, alertContacts, inventoryItems, vorbereitungChecklisten, szenarioInventoryItems])

  // ─── KI-Handbook Enrichment ───────────────────────────
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const docFileInputRef = useRef<HTMLInputElement>(null)

  const { execute: enrichHandbook, loading: enriching } = useHandbookEnrichment(id || null, uploadedDocId)

  const handleEnrich = async () => {
    if (isReadOnly) return
    const result = await enrichHandbook()
    if (result) {
      refetchScenario()
      setUploadedDocId(null)
      setUploadedFileName(null)
    }
  }

  const handleDocUpload = async (file: File) => {
    if (!districtId || isReadOnly) return
    setUploadingDoc(true)
    try {
      const storagePath = `${districtId}/${crypto.randomUUID()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type, upsert: false })
      if (uploadError) throw uploadError

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
      const { data: docRecord, error: insertError } = await supabase
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
        .select()
        .single()
      if (insertError) throw insertError

      setUploadedDocId(docRecord.id)
      setUploadedFileName(file.name)
    } catch (err) {
      console.error('Dokument-Upload fehlgeschlagen:', err)
      setErrorMessage('Dokument-Upload fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setUploadingDoc(false)
    }
  }

  // ─── Handbook Update ──────────────────────────────────
  const handleUpdateHandbook = async (updatedHandbook: ScenarioHandbookV3) => {
    if (!scenario || isReadOnly) return
    setErrorMessage(null)
    try {
      const { error } = await supabase
        .from('scenarios')
        .update({ handbook: updatedHandbook, is_edited: true })
        .eq('id', scenario.id)
      if (error) throw error
      refetchScenario()
    } catch (err) {
      console.error('Fehler beim Speichern des Handbuchs:', err)
      setErrorMessage('Fehler beim Speichern des Handbuchs. Bitte erneut versuchen.')
    }
  }

  // ─── PDF Export ───────────────────────────────────────
  const handlePDFExport = () => {
    if (!scenario) return
    exportScenarioPDF(scenario, phases, municipality?.name)
  }

  // ─── Modal States ─────────────────────────────────────
  const [showMetaModal, setShowMetaModal] = useState(false)

  // Hidden file input helpers
  const triggerDocUpload = () => { if (!isReadOnly) docFileInputRef.current?.click() }
  const clearDocUpload = () => { setUploadedDocId(null); setUploadedFileName(null) }

  // ─── Loading / Not Found ──────────────────────────────
  if (scenarioLoading) {
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
        <Link to="/gemeinde/szenarien" className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700">
          Zurück zu Szenarien
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* ═══ Zurück-Navigation ═══ */}
      <Link
        to="/gemeinde/szenarien"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zu Szenarien
      </Link>

      {/* Read-only Banner für Landkreis-Szenarien */}
      {isReadOnly && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Lock className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-700">
            <span className="font-medium">Landkreis-Szenario</span> — Dieses Szenario wird vom Landkreis-Admin verwaltet. Sie haben nur Lesezugriff.
          </p>
        </div>
      )}

      {/* ═══ Error Banner ═══ */}
      {errorMessage && (
        <div className="mb-4">
          <ErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        </div>
      )}

      {/* ═══ HEADER: Titel + Meta-Chips + Actions ═══ */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <Lock className="h-3 w-3" /> Landkreis
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Speichern-Button für Eskalationsstufen (nur eigene Szenarien) */}
          {eskalationDirty && !isReadOnly && (
            <button
              onClick={saveEskalationsstufen}
              disabled={eskalationSaving}
              className={`flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 ${
                !eskalationSaving ? 'animate-pulse' : ''
              }`}
            >
              {eskalationSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Speichern
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input for document upload */}
      {!isReadOnly && (
        <input
          ref={docFileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0])}
        />
      )}

      {/* ═══ 7-TAB-LEISTE ═══ */}
      <div className="mb-4 overflow-x-auto border-b border-border">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Szenario-Bereiche">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            const stufeColors = tab.stufeNr ? ESKALATION_COLORS[tab.stufeNr] : null
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                id={`tab-${tab.key}`}
                aria-controls={`tabpanel-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? stufeColors ? `${stufeColors.borderB} ${stufeColors.text}` : 'border-primary-600 text-primary-600'
                    : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                }`}
              >
                {stufeColors ? (
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${stufeColors.dot} text-[10px] font-bold text-white`}>
                    {tab.stufeNr}
                  </span>
                ) : Icon ? (
                  <Icon className="h-4 w-4" />
                ) : null}
                {tab.label}
                {eskalationDirty && tab.stufeNr && !isReadOnly && (
                  <span className="ml-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'uebersicht' && (
          <UebersichtSection
            scenario={scenario}
            handbook={handbookV3}
            readiness={readiness}
            eskalationsstufen={eskalationsstufen}
            krisenstabRollen={krisenstabRollen}
            onNavigateTab={setActiveTab}
            onOpenMetaModal={isReadOnly ? () => {} : () => setShowMetaModal(true)}
            enriching={enriching}
            onEnrich={isReadOnly ? () => {} : handleEnrich}
            uploadedFileName={uploadedFileName}
            uploadingDoc={uploadingDoc}
            onUploadClick={isReadOnly ? () => {} : triggerDocUpload}
            onClearUpload={isReadOnly ? () => {} : clearDocUpload}
            hasExistingHandbook={!!handbookV3}
            isHandbookEdited={!!scenario.is_edited}
          />
        )}

        {/* ═══ Stufen-Tabs (1–3) ═══ */}
        {(activeTab === 'stufe1' || activeTab === 'stufe2' || activeTab === 'stufe3') && (() => {
          const stufeIdx = activeTab === 'stufe1' ? 0 : activeTab === 'stufe2' ? 1 : 2
          const currentStufe = eskalationsstufen[stufeIdx]
          if (!currentStufe) return null
          return (
            <div className="space-y-6">
              <StufeHeaderSection
                stufe={currentStufe}
                stufeIdx={stufeIdx}
                onChange={isReadOnly ? (() => {}) : handleStufeFieldUpdate}
              />

              <HandlungsplanSection
                eskalationsstufen={eskalationsstufen}
                handbook={handbookV3}
                onChange={isReadOnly ? (() => {}) : handleEskalationChange}
                filterStufeIdx={stufeIdx}
              />

              {districtId && (
                <AlarmierungSection
                  eskalationsstufen={eskalationsstufen}
                  krisenstabRollen={krisenstabRollen}
                  alertContacts={alertContacts}
                  onOpenAlarmketteModal={isReadOnly ? () => {} : (idx) => setAlarmketteModalStufeIdx(idx)}
                  filterStufeIdx={stufeIdx}
                />
              )}

              <KommunikationSection
                stufe={currentStufe}
                stufeIdx={stufeIdx}
                onChange={isReadOnly ? (() => {}) : handleStufeFieldUpdate}
              />

              <RessourcenSection
                stufe={currentStufe}
                stufeIdx={stufeIdx}
                onChange={isReadOnly ? (() => {}) : handleStufeFieldUpdate}
              />
            </div>
          )
        })()}

        {activeTab === 'checklisten' && districtId && (
          <ChecklistenSection
            scenarioId={id!}
            districtId={districtId}
          />
        )}

        {activeTab === 'inventar' && districtId && (
          <InventarSection
            scenarioId={id!}
            districtId={districtId}
            scenarioTitle={scenario.title}
          />
        )}

        {activeTab === 'handbuch' && districtId && (
          <HandbuchDokumenteSection
            scenario={scenario}
            handbook={handbookV3}
            districtId={districtId}
            onPDFExport={handlePDFExport}
            onUpdateHandbook={isReadOnly ? (async () => {}) : handleUpdateHandbook}
          />
        )}
      </div>

      {/* ═══ MODALS (nur für eigene Szenarien) ═══ */}
      {!isReadOnly && (
        <>
          <MetadatenModal
            open={showMetaModal}
            onClose={() => setShowMetaModal(false)}
            scenario={scenario}
            onSaved={refetchScenario}
          />

          <AlarmketteEditModal
            open={alarmketteModalStufeIdx !== null}
            onClose={() => setAlarmketteModalStufeIdx(null)}
            alarmkette={alarmketteModalStufeIdx !== null ? eskalationsstufen[alarmketteModalStufeIdx]?.alarmkette || [] : []}
            alertContacts={alertContacts}
            onSave={handleAlarmketteSave}
          />
        </>
      )}
    </div>
  )
}
