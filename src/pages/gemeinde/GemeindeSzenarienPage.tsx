import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame, Plus, Search, Loader2, Eye, Trash2, Pencil,
  CloudRain, Wind, Thermometer, Snowflake, TreePine, Crosshair, Biohazard, Wifi, Swords,
  Bug, Wrench, Zap, Bomb, ClipboardList, Calendar, BookOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog } from '@/components/ui/Modal'
import { useMembership } from '@/hooks/useMembership'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbScenario, DbScenarioPhase } from '@/types/database'

// ─── Szenario-Typen + Icons ──────────────────────────────
const scenarioTypes = [
  'Starkregen', 'Sturm', 'Hitzewelle', 'Kältewelle', 'Waldbrand',
  'Amoklauf', 'CBRN', 'Cyberangriff', 'Krieg', 'Pandemie',
  'Sabotage', 'Stromausfall', 'Terroranschlag',
]

const SCENARIO_ICONS: Record<string, LucideIcon> = {
  Starkregen: CloudRain, Sturm: Wind, Hitzewelle: Thermometer, Kältewelle: Snowflake,
  Waldbrand: TreePine, Amoklauf: Crosshair, CBRN: Biohazard, Cyberangriff: Wifi,
  Krieg: Swords, Pandemie: Bug, Sabotage: Wrench, Stromausfall: Zap, Terroranschlag: Bomb,
}

function getScenarioIcon(type: string): LucideIcon {
  return SCENARIO_ICONS[type] || Flame
}

function getSeverityVariant(s: number) {
  if (s >= 70) return 'danger' as const
  if (s >= 40) return 'warning' as const
  return 'success' as const
}

function getSeverityLabel(s: number) {
  if (s >= 70) return 'Kritisch'
  if (s >= 40) return 'Mittel'
  return 'Gering'
}

function getSeverityIconColors(severity: number) {
  if (severity >= 70) return { bg: 'bg-red-100', text: 'text-red-600' }
  if (severity >= 40) return { bg: 'bg-amber-100', text: 'text-amber-600' }
  return { bg: 'bg-green-100', text: 'text-green-600' }
}

// ─── Szenario-Card Komponente ─────────────────────────────
function ScenarioCard({
  scenario,
  phaseStats,
  linkTo,
  onEdit,
  onDelete,
}: {
  scenario: DbScenario
  phaseStats?: { phases: number; tasks: number }
  linkTo: string
  onEdit?: () => void
  onDelete?: () => void
}) {
  const ScenarioIcon = getScenarioIcon(scenario.type)
  const iconColors = getSeverityIconColors(scenario.severity)

  return (
    <div className="group relative rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md">
      {/* Edit/Delete Actions */}
      {(onEdit || onDelete) && (
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit() }}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
              title="Bearbeiten"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete() }}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
              title="Löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <Link to={linkTo} className="block">
        {/* Icon + Titel */}
        <div className="mb-3 flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColors.bg} ${iconColors.text}`}>
            <ScenarioIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary leading-snug line-clamp-1">{scenario.title}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant={getSeverityVariant(scenario.severity)}>
                {getSeverityLabel(scenario.severity)}
              </Badge>
              {scenario.is_handbook_generated && (
                <Badge variant="info">
                  <BookOpen className="mr-0.5 h-2.5 w-2.5" />
                  Handbuch
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Beschreibung */}
        {scenario.description && (
          <p className="mb-3 text-xs text-text-muted line-clamp-2">{scenario.description}</p>
        )}

        {/* Schweregrad-Bar */}
        <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
          <span>Schweregrad</span>
          <span className="font-bold text-text-primary">{scenario.severity}%</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              scenario.severity >= 70 ? 'bg-red-500' : scenario.severity >= 40 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${scenario.severity}%` }}
          />
        </div>

        {/* Footer: Phasen + Datum */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-3">
            {phaseStats && (
              <>
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" />
                  {phaseStats.tasks}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {phaseStats.phases}
                </span>
              </>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(scenario.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </Link>
    </div>
  )
}

// ─── Hauptkomponente ──────────────────────────────────────
export default function GemeindeSzenarienPage() {
  const { districtId, municipalityId, municipality } = useMembership()
  const [searchQuery, setSearchQuery] = useState('')

  // ─── CRUD State ──────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const emptyForm = { title: '', type: 'Starkregen', severity: 50, description: '', affected_population: '' }
  const [form, setForm] = useState(emptyForm)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DbScenario | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Daten laden ─────────────────────────────────────────
  // Eigene Gemeinde-Szenarien
  const { data: eigeneScenarios, loading: eigeneLoading, refetch: refetchEigene } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('district_id', districtId!)
        .eq('municipality_id', municipalityId!)
        .order('severity', { ascending: false }),
    [districtId, municipalityId]
  )

  // Landkreis-Szenarien (municipality_id IS NULL)
  const { data: landkreisScenarios, loading: lkLoading } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('district_id', districtId!)
        .is('municipality_id', null)
        .order('severity', { ascending: false }),
    [districtId]
  )

  // Alle Szenario-IDs für Phasen-Query
  const allScenarioIds = useMemo(() => {
    return [...eigeneScenarios, ...landkreisScenarios].map(s => s.id)
  }, [eigeneScenarios, landkreisScenarios])

  const { data: allPhases } = useSupabaseQuery<DbScenarioPhase>(
    (sb) => {
      if (allScenarioIds.length === 0) return sb.from('scenario_phases').select('*').eq('scenario_id', '00000000-0000-0000-0000-000000000000')
      return sb.from('scenario_phases').select('*').in('scenario_id', allScenarioIds)
    },
    [allScenarioIds.join(',')]
  )

  const phaseStats = useMemo(() => {
    const map: Record<string, { phases: number; tasks: number }> = {}
    allPhases.forEach(p => {
      if (!map[p.scenario_id]) map[p.scenario_id] = { phases: 0, tasks: 0 }
      map[p.scenario_id].phases++
      map[p.scenario_id].tasks += (p.tasks?.length || 0)
    })
    return map
  }, [allPhases])

  // ─── Filter ──────────────────────────────────────────────
  const filteredEigene = useMemo(() => {
    if (!searchQuery) return eigeneScenarios
    const q = searchQuery.toLowerCase()
    return eigeneScenarios.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    )
  }, [eigeneScenarios, searchQuery])

  const filteredLandkreis = useMemo(() => {
    if (!searchQuery) return landkreisScenarios
    const q = searchQuery.toLowerCase()
    return landkreisScenarios.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    )
  }, [landkreisScenarios, searchQuery])

  // ─── CRUD Handlers ───────────────────────────────────────
  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (s: DbScenario) => {
    setEditId(s.id)
    setForm({
      title: s.title,
      type: s.type,
      severity: s.severity,
      description: s.description || '',
      affected_population: s.affected_population ? String(s.affected_population) : '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !districtId || !municipalityId) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        severity: form.severity,
        description: form.description.trim() || null,
        affected_population: form.affected_population ? Number(form.affected_population) : null,
      }

      if (editId) {
        const { error } = await supabase
          .from('scenarios')
          .update({ ...payload, is_edited: true })
          .eq('id', editId)
          .eq('district_id', districtId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('scenarios')
          .insert({
            ...payload,
            district_id: districtId,
            municipality_id: municipalityId,
            is_ai_generated: false,
            is_edited: false,
          })
        if (error) throw error
      }

      refetchEigene()
      setShowModal(false)
      setForm(emptyForm)
      setEditId(null)
    } catch (err) {
      console.error('Szenario speichern fehlgeschlagen:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !districtId) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', deleteTarget.id)
        .eq('district_id', districtId)
      if (error) throw error
      refetchEigene()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Szenario löschen fehlgeschlagen:', err)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Loading ─────────────────────────────────────────────
  if (eigeneLoading || lkLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`Krisenszenarien – ${municipality?.name || 'Gemeinde'}`}
        description="Eigene Handlungspläne erstellen und Landkreis-Szenarien einsehen."
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Szenario erstellen
          </button>
        }
      />

      {/* Suche */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Szenarien durchsuchen..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* ═══ Bereich 1: Eigene Handlungspläne ═══════════════ */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-text-primary">
            Eigene Handlungspläne
          </h2>
          <Badge>{filteredEigene.length}</Badge>
        </div>

        {filteredEigene.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
            <Flame className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="mb-1 text-sm font-medium text-text-secondary">
              {eigeneScenarios.length === 0
                ? 'Noch keine eigenen Handlungspläne erstellt.'
                : 'Keine Szenarien für diese Suche.'}
            </p>
            {eigeneScenarios.length === 0 && (
              <p className="mb-4 text-xs text-text-muted">
                Erstellen Sie Krisenszenarien speziell für Ihre Gemeinde mit eigenen Handlungsplänen.
              </p>
            )}
            {eigeneScenarios.length === 0 && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Erstes Szenario erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEigene.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                phaseStats={phaseStats[scenario.id]}
                linkTo={`/gemeinde/szenarien/${scenario.id}`}
                onEdit={() => openEdit(scenario)}
                onDelete={() => setDeleteTarget(scenario)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══ Bereich 2: Landkreis-Szenarien (read-only) ═════ */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-bold text-text-primary">
            Landkreis-Szenarien
          </h2>
          <Badge variant="default">{filteredLandkreis.length}</Badge>
        </div>

        {/* Info Banner */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            <Eye className="mr-1 inline h-3.5 w-3.5" />
            Diese Szenarien werden vom Landkreis-Admin verwaltet. Sie haben Lesezugriff auf alle Handlungspläne.
          </p>
        </div>

        {filteredLandkreis.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center">
            <Flame className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              {landkreisScenarios.length === 0
                ? 'Noch keine Landkreis-Szenarien vorhanden.'
                : 'Keine Szenarien für diese Suche.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLandkreis.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                phaseStats={phaseStats[scenario.id]}
                linkTo={`/gemeinde/szenarien/${scenario.id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══ Create / Edit Modal ════════════════════════════ */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Szenario bearbeiten' : 'Neues Szenario erstellen'}
      >
        <FormField label="Titel" required>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="z.B. Hochwasser Gemeinde – Stufe 2"
          />
        </FormField>

        <FormField label="Szenario-Typ" required>
          <select
            className={selectClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {scenarioTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FormField>

        <FormField label={`Schweregrad: ${form.severity}/100`}>
          <input
            type="range"
            min={0}
            max={100}
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
            className="w-full accent-primary-600"
          />
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            <span>Gering</span><span>Mittel</span><span>Hoch</span>
          </div>
        </FormField>

        <FormField label="Beschreibung">
          <textarea
            className={textareaClass}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detaillierte Beschreibung des Szenarios..."
          />
        </FormField>

        <FormField label="Betroffene Bevölkerung">
          <input
            type="number"
            className={inputClass}
            value={form.affected_population}
            onChange={(e) => setForm({ ...form, affected_population: e.target.value })}
            placeholder="z.B. 5000"
          />
        </FormField>

        <ModalFooter
          onCancel={() => setShowModal(false)}
          onSubmit={handleSave}
          submitLabel={editId ? 'Änderungen speichern' : 'Szenario erstellen'}
          loading={saving}
          disabled={!form.title.trim()}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Szenario löschen"
        message={`Möchten Sie das Szenario "${deleteTarget?.title}" wirklich löschen? Alle zugehörigen Phasen und das Krisenhandbuch werden ebenfalls gelöscht.`}
        loading={deleting}
      />
    </div>
  )
}
