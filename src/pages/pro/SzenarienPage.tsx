import { Flame, Plus, Sparkles, Search, Loader2, ChevronDown, Lock, LayoutGrid, List, Calendar, ClipboardList } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbScenario, DbScenarioPhase } from '@/types/database'

const scenarioTypes = [
  'Hochwasser',
  'Sturm',
  'Waldbrand',
  'Stromausfall',
  'Extremhitze',
  'Pandemie',
  'CBRN',
  'Cyberangriff',
  'Sabotage',
  'Krieg',
  'Terroranschlag',
]

// Naturkatastrophen vs Bedrohungen
const NATURE_TYPES = ['Hochwasser', 'Sturm', 'Waldbrand', 'Extremhitze']
function isNatureType(type: string): boolean {
  return NATURE_TYPES.some(t => type.toLowerCase().includes(t.toLowerCase()))
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

export default function SzenarienPage() {
  const navigate = useNavigate()
  const { districtId, loading: districtLoading } = useDistrict()
  const [searchQuery, setSearchQuery] = useState('')
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [generatingType, setGeneratingType] = useState<string | undefined>()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // View toggle: list or grid
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const emptyForm = { title: '', type: 'Hochwasser', severity: 50, description: '', affected_population: '' }
  const [form, setForm] = useState(emptyForm)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DbScenario | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: scenarios, loading, refetch } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('district_id', districtId!)
        .order('created_at', { ascending: false }),
    [districtId]
  )

  // Phasen für alle Szenarien laden (für Count-Anzeige)
  const { data: allPhases } = useSupabaseQuery<DbScenarioPhase>(
    (sb) => {
      const ids = scenarios.map(s => s.id)
      if (ids.length === 0) return sb.from('scenario_phases').select('*').eq('scenario_id', '00000000-0000-0000-0000-000000000000')
      return sb.from('scenario_phases').select('*').in('scenario_id', ids)
    },
    [scenarios.map(s => s.id).join(',')]
  )

  // Phasen + Tasks pro Szenario aggregieren
  const phaseStats = useMemo(() => {
    const map: Record<string, { phases: number; tasks: number }> = {}
    allPhases.forEach(p => {
      if (!map[p.scenario_id]) map[p.scenario_id] = { phases: 0, tasks: 0 }
      map[p.scenario_id].phases++
      map[p.scenario_id].tasks += (p.tasks?.length || 0)
    })
    return map
  }, [allPhases])

  // Statistiken berechnen
  const stats = useMemo(() => {
    const total = scenarios.length
    const nature = scenarios.filter(s => isNatureType(s.type)).length
    const threats = total - nature
    const criticalHigh = scenarios.filter(s => s.severity >= 40).length
    return { total, nature, threats, criticalHigh }
  }, [scenarios])

  // Filter + Suche anwenden
  const filtered = useMemo(() => {
    let result = scenarios

    // Suche
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      )
    }

    // Severity Filter
    if (filterSeverity === 'kritisch') result = result.filter(s => s.severity >= 70)
    else if (filterSeverity === 'mittel') result = result.filter(s => s.severity >= 40 && s.severity < 70)
    else if (filterSeverity === 'gering') result = result.filter(s => s.severity < 40)

    // Type Filter
    if (filterType === 'natur') result = result.filter(s => isNatureType(s.type))
    else if (filterType === 'bedrohung') result = result.filter(s => !isNatureType(s.type))
    else if (filterType !== 'all') result = result.filter(s => s.type === filterType)

    return result
  }, [scenarios, searchQuery, filterSeverity, filterType])

  // Dropdown schließen bei Klick außerhalb
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTypeSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGenerate = async (type?: string) => {
    setShowTypeSelector(false)
    setGeneratingType(type)
    setAiLoading(true)
    setAiError(null)

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'ai-generate-scenario',
        { body: { districtId, scenarioType: type } }
      )

      if (fnError) {
        throw new Error(fnError.message || 'Edge Function Fehler')
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Unbekannter Fehler bei der Szenario-Generierung.')
      }

      refetch()
      navigate(`/pro/szenarien/${result.scenario.id}`)
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.'
      )
    } finally {
      setAiLoading(false)
    }
  }

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
    if (!form.title.trim() || !districtId) return
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
        const { error } = await supabase.from('scenarios').update({ ...payload, is_edited: true }).eq('id', editId).eq('district_id', districtId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('scenarios').insert({ ...payload, district_id: districtId, is_ai_generated: false, is_edited: false })
        if (error) throw error
      }

      refetch()
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
      const { error } = await supabase.from('scenarios').delete().eq('id', deleteTarget.id).eq('district_id', districtId)
      if (error) throw error
      refetch()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Szenario löschen fehlgeschlagen:', err)
    } finally {
      setDeleting(false)
    }
  }

  if (districtLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="KI-Krisenszenarien"
        description="Automatisch generierte Szenarien mit Handlungsplänen. Editierbar und erweiterbar."
        badge="Säule 2"
        actions={
          <div className="flex gap-2">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              <Plus className="h-4 w-4" />
              Manuell erstellen
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowTypeSelector(!showTypeSelector)}
                disabled={aiLoading}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    KI-Generierung
                    <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>

              {showTypeSelector && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-white p-2 shadow-lg">
                  <button
                    onClick={() => handleGenerate(undefined)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-surface-secondary"
                  >
                    <Sparkles className="h-4 w-4 text-primary-600" />
                    Automatisch (höchstes Risiko)
                  </button>
                  <div className="my-1 h-px bg-border" />
                  {scenarioTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleGenerate(type)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* KI Loading Banner */}
      {aiLoading && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            <Sparkles className="absolute h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-primary-900">
              KI generiert {generatingType ? `${generatingType}-Szenario` : 'Krisenszenario'}...
            </p>
            <p className="text-sm text-primary-700">
              Die KI erstellt ein detailliertes Szenario mit Handlungsplan und Phasen. Dies kann 15–30 Sekunden dauern.
            </p>
          </div>
        </div>
      )}

      {/* KI Error Banner */}
      {aiError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">Fehler bei der Szenario-Generierung</p>
          <p className="text-sm text-red-700">{aiError}</p>
        </div>
      )}

      {/* ─── Statistik-Leiste ────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span>Gesamt: <strong className="text-text-primary">{stats.total}</strong></span>
        <span className="text-border">|</span>
        <span>Naturkatastrophen: <strong className="text-green-600">{stats.nature}</strong></span>
        <span className="text-border">|</span>
        <span>Bedrohungen: <strong className="text-orange-600">{stats.threats}</strong></span>
        <span className="text-border">|</span>
        <span>Kritisch/Hoch: <strong className="text-red-600">{stats.criticalHigh}</strong></span>
      </div>

      {/* ─── Filter-Leiste + Suche + View-Toggle ─────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Suche */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szenarien durchsuchen..."
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>

        {/* Risikostufe Filter */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-secondary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        >
          <option value="all">Alle Risikostufen</option>
          <option value="kritisch">Kritisch (≥70)</option>
          <option value="mittel">Mittel (40–69)</option>
          <option value="gering">Gering (&lt;40)</option>
        </select>

        {/* Typ Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text-secondary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        >
          <option value="all">Alle Typen</option>
          <option value="natur">Naturkatastrophen</option>
          <option value="bedrohung">Bedrohungen</option>
          <optgroup label="Einzelne Typen">
            {scenarioTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </optgroup>
        </select>

        {/* View Toggle */}
        <div className="flex rounded-xl border border-border bg-white">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 rounded-l-xl px-3 py-2.5 text-sm transition-colors ${
              viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 rounded-r-xl px-3 py-2.5 text-sm transition-colors ${
              viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Ergebnis-Info ────────────────────────────────── */}
      {(searchQuery || filterSeverity !== 'all' || filterType !== 'all') && (
        <p className="mb-4 text-xs text-text-muted">
          {filtered.length} von {scenarios.length} Szenarien
          <button
            onClick={() => { setSearchQuery(''); setFilterSeverity('all'); setFilterType('all') }}
            className="ml-2 text-primary-600 hover:underline"
          >
            Filter zurücksetzen
          </button>
        </p>
      )}

      {/* ─── Szenario-Liste / Grid ───────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <Flame className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">
            {scenarios.length === 0 ? 'Keine Szenarien vorhanden.' : 'Keine Szenarien für diese Filter.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* ─── Listen-View (bestehend) ────────────────────── */
        <div className="space-y-3">
          {filtered.map((scenario) => {
            const ps = phaseStats[scenario.id]
            return (
              <div
                key={scenario.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-md"
              >
                <Link to={`/pro/szenarien/${scenario.id}`} className="flex flex-1 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
                    <Flame className="h-6 w-6" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{scenario.title}</h3>
                      {scenario.is_default && (
                        <Badge variant="warning">
                          <Lock className="mr-1 h-3 w-3" />
                          Pflicht
                        </Badge>
                      )}
                      {scenario.is_ai_generated && (
                        <Badge variant="info">
                          <Sparkles className="mr-1 h-3 w-3" />
                          KI
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                      <span>Typ: {scenario.type}</span>
                      {ps && <span>{ps.phases} Phasen · {ps.tasks} Aufgaben</span>}
                      <span>Erstellt: {new Date(scenario.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="text-right">
                      <p className="text-lg font-bold text-text-primary">{scenario.severity}</p>
                      <p className="text-xs text-text-muted">Schwere</p>
                    </div>
                    <Badge variant={getSeverityVariant(scenario.severity)}>
                      {getSeverityLabel(scenario.severity)}
                    </Badge>
                  </div>
                </Link>
                <RowActions
                  onEdit={() => openEdit(scenario)}
                  onDelete={scenario.is_default ? undefined : () => setDeleteTarget(scenario)}
                />
              </div>
            )
          })}
        </div>
      ) : (
        /* ─── Grid-View (Card-Ansicht) ───────────────────── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((scenario) => {
            const ps = phaseStats[scenario.id]
            return (
              <div
                key={scenario.id}
                className="group relative rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
              >
                {/* RowActions oben rechts */}
                <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <RowActions
                    onEdit={() => openEdit(scenario)}
                    onDelete={scenario.is_default ? undefined : () => setDeleteTarget(scenario)}
                  />
                </div>

                <Link to={`/pro/szenarien/${scenario.id}`} className="block">
                  {/* Icon + Titel */}
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
                      <Flame className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary leading-snug line-clamp-1">{scenario.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={getSeverityVariant(scenario.severity)}>
                          {getSeverityLabel(scenario.severity)}
                        </Badge>
                        {scenario.is_default && (
                          <Badge variant="warning">
                            <Lock className="mr-0.5 h-2.5 w-2.5" />
                            Pflicht
                          </Badge>
                        )}
                        {scenario.is_ai_generated && (
                          <Badge variant="info">
                            <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                            KI
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
                      {ps && (
                        <>
                          <span className="flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" />
                            {ps.tasks}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {ps.phases}
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
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Szenario bearbeiten' : 'Szenario manuell erstellen'}>
        <FormField label="Titel" required>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="z.B. Hochwasser Saale – Stufe 2"
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
            placeholder="z.B. 15000"
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
        message={`Möchten Sie das Szenario "${deleteTarget?.title}" wirklich löschen? Alle zugehörigen Phasen werden ebenfalls gelöscht.`}
        loading={deleting}
      />
    </div>
  )
}
