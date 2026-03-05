import { useState } from 'react'
import {
  Plus, AlertTriangle, Building2, Wifi, Zap,
  ChevronDown, ChevronRight, Loader2, Link as LinkIcon,
} from 'lucide-react'
import { useSupplyDependencies } from '@/hooks/useSupplyDependencies'
import type { DbSupplyDependency, DbSupplyDependencyInsert, SupplyDependencyType, BpCriticality } from '@/types/database'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'

const TYPE_CONFIG: Record<SupplyDependencyType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  lieferant: { label: 'Lieferant', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  it_system: { label: 'IT-System', icon: Wifi, color: 'text-purple-600', bg: 'bg-purple-50' },
  cloud_service: { label: 'Cloud-Service', icon: Wifi, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  versorger: { label: 'Versorger', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  dienstleister: { label: 'Dienstleister', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

const CRITICALITY_COLOR: Record<BpCriticality, string> = {
  kritisch: 'bg-red-50 text-red-600',
  hoch: 'bg-amber-50 text-amber-600',
  mittel: 'bg-blue-50 text-blue-600',
  niedrig: 'bg-gray-50 text-gray-600',
}

export default function LieferkettenPage() {
  const { dependencies, loading, stats, addDependency, updateDependency, deleteDependency } = useSupplyDependencies()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<SupplyDependencyType | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DbSupplyDependency | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = filterType === 'all' ? dependencies : dependencies.filter(d => d.type === filterType)

  const handleEdit = (item: DbSupplyDependency) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const handleSave = async (data: Omit<DbSupplyDependencyInsert, 'district_id'>) => {
    setSaving(true)
    try {
      if (editingItem) {
        await updateDependency(editingItem.id, data)
      } else {
        await addDependency(data)
      }
      setShowModal(false)
      setEditingItem(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setSaving(true)
    try {
      await deleteDependency(deletingId)
      setDeletingId(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Lieferketten & Abhaengigkeiten</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Externe Abhaengigkeiten erfassen, Alternativen dokumentieren, Risiken minimieren.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Abhaengigkeit hinzufuegen
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xl font-extrabold text-text-primary">{stats.total}</p>
          <p className="text-xs text-text-muted">Abhaengigkeiten gesamt</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xl font-extrabold text-red-600">{stats.kritisch}</p>
          <p className="text-xs text-text-muted">Kritisch</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xl font-extrabold text-amber-600">{stats.ohneAlternative}</p>
          <p className="text-xs text-text-muted">Ohne Alternative</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xl font-extrabold text-text-primary">{stats.typeCount}</p>
          <p className="text-xs text-text-muted">Kategorien</p>
        </div>
      </div>

      {/* Warning */}
      {stats.ohneAlternative > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{stats.ohneAlternative} Abhaengigkeit{stats.ohneAlternative > 1 ? 'en' : ''} ohne Alternative</p>
              <p className="mt-0.5 text-xs text-amber-700">Single Points of Failure gefaehrden Ihre Business Continuity. Dokumentieren Sie Alternativen.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterType === 'all' ? 'bg-primary-50 text-primary-600' : 'bg-white text-text-secondary hover:bg-surface-secondary'}`}
        >
          Alle ({dependencies.length})
        </button>
        {(Object.keys(TYPE_CONFIG) as SupplyDependencyType[]).map(type => {
          const cfg = TYPE_CONFIG[type]
          const count = dependencies.filter(d => d.type === type).length
          if (count === 0) return null
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterType === type ? `${cfg.bg} ${cfg.color}` : 'bg-white text-text-secondary hover:bg-surface-secondary'}`}
            >
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Dependency List */}
      <div className="space-y-2">
        {filtered.length === 0 && dependencies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-secondary p-8 text-center">
            <LinkIcon className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm font-medium text-text-secondary">Noch keine Abhaengigkeiten erfasst</p>
            <p className="mt-1 text-xs text-text-muted">Erfassen Sie Lieferanten, IT-Systeme und Versorger.</p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Erste Abhaengigkeit erfassen
            </button>
          </div>
        ) : (
          filtered.map(dep => {
            const cfg = TYPE_CONFIG[dep.type]
            const isExpanded = expandedId === dep.id
            const alts = (dep.alternatives as string[]) || []
            return (
              <div key={dep.id} className="rounded-xl border border-border bg-white">
                <div className="flex items-center">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : dep.id)}
                    className="flex flex-1 items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary">{dep.name}</p>
                      <p className="text-xs text-text-muted">{dep.description}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CRITICALITY_COLOR[dep.criticality]}`}>
                      {dep.criticality}
                    </span>
                    {alts.length === 0 && (
                      <span title="Keine Alternative"><AlertTriangle className="h-4 w-4 text-amber-500" /></span>
                    )}
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
                  </button>
                  <div className="pr-2">
                    <RowActions onEdit={() => handleEdit(dep)} onDelete={() => setDeletingId(dep.id)} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Kontakt</p>
                        <p className="text-sm text-text-secondary">{dep.contact_name || '—'}</p>
                        {dep.contact_email && <p className="text-xs text-text-muted">{dep.contact_email}</p>}
                        {dep.contact_phone && <p className="text-xs text-text-muted">{dep.contact_phone}</p>}
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">SLA</p>
                        <p className="text-sm text-text-secondary">{dep.sla_hours ? `${dep.sla_hours}h` : '—'}</p>
                        {dep.contract_end_date && (
                          <p className="text-xs text-text-muted">Vertrag bis {new Date(dep.contract_end_date).toLocaleDateString('de-DE')}</p>
                        )}
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Alternativen</p>
                        {alts.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {alts.map(a => (
                              <span key={a} className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700">{a}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-amber-600">Keine Alternative dokumentiert</p>
                        )}
                      </div>
                    </div>
                    {dep.notes && (
                      <div className="mt-3">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Notizen</p>
                        <p className="text-sm text-text-secondary">{dep.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <DependencyModal
          item={editingItem}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingItem(null) }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Abhaengigkeit loeschen?"
        message="Diese Abhaengigkeit wird unwiderruflich geloescht."
        loading={saving}
      />
    </div>
  )
}

// ─── Dependency Modal ──────────────────────────────────

interface DependencyModalProps {
  item: DbSupplyDependency | null
  saving: boolean
  onSave: (data: Omit<DbSupplyDependencyInsert, 'district_id'>) => void
  onClose: () => void
}

function DependencyModal({ item, saving, onSave, onClose }: DependencyModalProps) {
  const [name, setName] = useState(item?.name || '')
  const [type, setType] = useState<SupplyDependencyType>(item?.type || 'lieferant')
  const [criticality, setCriticality] = useState<BpCriticality>(item?.criticality || 'mittel')
  const [description, setDescription] = useState(item?.description || '')
  const [contactName, setContactName] = useState(item?.contact_name || '')
  const [contactEmail, setContactEmail] = useState(item?.contact_email || '')
  const [contactPhone, setContactPhone] = useState(item?.contact_phone || '')
  const [altsText, setAltsText] = useState(((item?.alternatives as string[]) || []).join(', '))
  const [slaHours, setSlaHours] = useState(item?.sla_hours?.toString() || '')
  const [contractEnd, setContractEnd] = useState(item?.contract_end_date || '')
  const [notes, setNotes] = useState(item?.notes || '')

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      type,
      criticality,
      description: description.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      alternatives: altsText.split(',').map(s => s.trim()).filter(Boolean),
      sla_hours: slaHours ? parseInt(slaHours) : null,
      contract_end_date: contractEnd || null,
      notes: notes.trim() || null,
    })
  }

  return (
    <Modal open onClose={onClose} title={item ? 'Abhaengigkeit bearbeiten' : 'Neue Abhaengigkeit'} size="lg">
      <FormField label="Name" required>
        <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Microsoft 365" />
      </FormField>

      <div className="grid gap-0 sm:grid-cols-2 sm:gap-4">
        <FormField label="Typ">
          <select className={selectClass} value={type} onChange={e => setType(e.target.value as SupplyDependencyType)}>
            <option value="lieferant">Lieferant</option>
            <option value="it_system">IT-System</option>
            <option value="cloud_service">Cloud-Service</option>
            <option value="versorger">Versorger</option>
            <option value="dienstleister">Dienstleister</option>
          </select>
        </FormField>
        <FormField label="Kritikalitaet">
          <select className={selectClass} value={criticality} onChange={e => setCriticality(e.target.value as BpCriticality)}>
            <option value="kritisch">Kritisch</option>
            <option value="hoch">Hoch</option>
            <option value="mittel">Mittel</option>
            <option value="niedrig">Niedrig</option>
          </select>
        </FormField>
      </div>

      <FormField label="Beschreibung">
        <input className={inputClass} value={description} onChange={e => setDescription(e.target.value)} placeholder="z.B. E-Mail, Teams, SharePoint" />
      </FormField>

      <div className="grid gap-0 sm:grid-cols-3 sm:gap-4">
        <FormField label="Kontaktperson">
          <input className={inputClass} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Name" />
        </FormField>
        <FormField label="E-Mail">
          <input className={inputClass} type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="E-Mail" />
        </FormField>
        <FormField label="Telefon">
          <input className={inputClass} value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Telefon" />
        </FormField>
      </div>

      <div className="grid gap-0 sm:grid-cols-2 sm:gap-4">
        <FormField label="SLA (Stunden)">
          <input className={inputClass} type="number" min="0" value={slaHours} onChange={e => setSlaHours(e.target.value)} placeholder="z.B. 4" />
        </FormField>
        <FormField label="Vertragsende">
          <input className={inputClass} type="date" value={contractEnd} onChange={e => setContractEnd(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Alternativen (kommagetrennt)">
        <input className={inputClass} value={altsText} onChange={e => setAltsText(e.target.value)} placeholder="z.B. Google Workspace, Backup-Anbieter" />
      </FormField>

      <FormField label="Notizen">
        <textarea className={textareaClass} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>

      <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel={item ? 'Speichern' : 'Hinzufuegen'} loading={saving} disabled={!name.trim()} />
    </Modal>
  )
}
