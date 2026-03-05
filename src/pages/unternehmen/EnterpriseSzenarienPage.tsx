import {
  Flame, Plus, Search, Loader2, LayoutGrid, List,
  Wifi, Server, FileWarning, Link2, Users, Zap, Bug,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useOrganization } from '@/hooks/useOrganization'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbScenario } from '@/types/database'

// Enterprise-spezifische Szenario-Typen
const scenarioTypes = [
  'Ransomware',
  'DDoS-Attacke',
  'Datenleck',
  'IT-Systemausfall',
  'Rechenzentrum-Ausfall',
  'Personalausfall',
  'Lieferkettenausfall',
  'DSGVO-Verstoss',
  'Stromausfall',
  'Reputationskrise',
  'Cyberangriff',
  'Cloud-Ausfall',
]

const typeIcons: Record<string, LucideIcon> = {
  'Ransomware': Bug,
  'DDoS-Attacke': Wifi,
  'Datenleck': FileWarning,
  'IT-Systemausfall': Server,
  'Rechenzentrum-Ausfall': Server,
  'Personalausfall': Users,
  'Lieferkettenausfall': Link2,
  'Stromausfall': Zap,
  'Cyberangriff': Wifi,
  'Cloud-Ausfall': Server,
}

function getSeverityVariant(s: number) {
  if (s >= 70) return 'danger' as const
  if (s >= 40) return 'warning' as const
  return 'info' as const
}

const emptyForm = {
  title: '',
  type: 'Ransomware',
  severity: 50,
  description: '',
}

export default function EnterpriseSzenarienPage() {
  const { organizationId, loading: orgLoading } = useOrganization()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<DbScenario | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: scenarios, loading, refetch } = useSupabaseQuery<DbScenario>(
    (sb) =>
      sb
        .from('scenarios')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('severity', { ascending: false }),
    [organizationId]
  )

  const filtered = useMemo(() => {
    if (!scenarios) return []
    if (!searchQuery) return scenarios
    const q = searchQuery.toLowerCase()
    return scenarios.filter(
      s => s.title.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)
    )
  }, [scenarios, searchQuery])

  const handleAdd = () => {
    setForm(emptyForm)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!organizationId || !form.title.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase.from('scenarios').insert({
        organization_id: organizationId,
        title: form.title.trim(),
        type: form.type,
        severity: form.severity,
        description: form.description || null,
        is_ai_generated: false,
        is_edited: false,
        is_default: false,
      })
      if (error) throw error
      setShowModal(false)
      refetch()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await supabase.from('scenarios').delete().eq('id', deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } finally {
      setDeleting(false)
    }
  }

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Business-Krisenszenarios"
        description={`${scenarios?.length || 0} Szenarios fuer Ihr Unternehmen`}
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Szenario erstellen
          </button>
        }
      />

      {/* Toolbar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szenarios durchsuchen..."
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
        <div className="flex rounded-xl border border-border bg-white">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-l-xl px-3 py-2.5 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-text-muted'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-r-xl px-3 py-2.5 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-text-muted'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scenarios Grid/List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <Flame className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <p className="mb-1 text-lg font-semibold text-text-primary">Keine Szenarios</p>
          <p className="mb-4 text-sm text-text-secondary">Erstellen Sie Ihr erstes Business-Krisenszenario.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((scenario) => {
            const Icon = typeIcons[scenario.type] || Flame
            return (
              <div
                key={scenario.id}
                className="group cursor-pointer rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary-200 hover:shadow-sm"
                onClick={() => navigate(`/unternehmen/szenarien/${scenario.id}`)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge variant={getSeverityVariant(scenario.severity)}>
                      {scenario.severity}%
                    </Badge>
                    <RowActions
                      onEdit={() => navigate(`/unternehmen/szenarien/${scenario.id}`)}
                      onDelete={() => setDeleteTarget(scenario)}
                    />
                  </div>
                </div>
                <p className="mb-1 font-semibold text-text-primary">{scenario.title}</p>
                <p className="text-xs text-text-muted">{scenario.type}</p>
                {scenario.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{scenario.description}</p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((scenario) => {
            const Icon = typeIcons[scenario.type] || Flame
            return (
              <div
                key={scenario.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-white p-4 transition-colors hover:border-primary-200"
                onClick={() => navigate(`/unternehmen/szenarien/${scenario.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{scenario.title}</p>
                    <p className="text-xs text-text-muted">{scenario.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={getSeverityVariant(scenario.severity)}>
                    {scenario.severity}%
                  </Badge>
                  <RowActions
                    onEdit={() => navigate(`/unternehmen/szenarien/${scenario.id}`)}
                    onDelete={() => setDeleteTarget(scenario)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showModal} title="Neues Szenario" onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <FormField label="Titel" required>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="z.B. Ransomware-Angriff auf ERP-System"
            />
          </FormField>
          <FormField label="Typ">
            <select
              className={selectClass}
              value={form.type}
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {scenarioTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label={`Schweregrad: ${form.severity}%`}>
            <input
              type="range"
              min="0"
              max="100"
              value={form.severity}
              onChange={(e) => setForm(f => ({ ...f, severity: parseInt(e.target.value) }))}
              className="w-full"
            />
          </FormField>
          <FormField label="Beschreibung">
            <textarea
              className={textareaClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Beschreiben Sie das Szenario..."
            />
          </FormField>
        </div>
        <ModalFooter
          onCancel={() => setShowModal(false)}
          onSubmit={handleSave}
          submitLabel="Erstellen"
          loading={saving}
          disabled={!form.title.trim()}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Szenario loeschen"
        message={`Moechten Sie "${deleteTarget?.title || ''}" wirklich loeschen?`}
        loading={deleting}
      />
    </div>
  )
}
