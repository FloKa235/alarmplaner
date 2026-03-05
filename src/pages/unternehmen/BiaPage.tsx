import { useState } from 'react'
import {
  BarChart3, Plus, AlertTriangle, Clock, Database,
  ChevronDown, ChevronRight, Zap, Shield, Loader2,
} from 'lucide-react'
import { useBusinessProcesses } from '@/hooks/useBusinessProcesses'
import type { DbBusinessProcess, DbBusinessProcessInsert, BpCriticality } from '@/types/database'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'

const CRITICALITY_CONFIG: Record<BpCriticality, { label: string; color: string; bg: string }> = {
  kritisch: { label: 'Kritisch', color: 'text-red-600', bg: 'bg-red-50' },
  hoch: { label: 'Hoch', color: 'text-amber-600', bg: 'bg-amber-50' },
  mittel: { label: 'Mittel', color: 'text-blue-600', bg: 'bg-blue-50' },
  niedrig: { label: 'Niedrig', color: 'text-gray-600', bg: 'bg-gray-50' },
}

export default function BiaPage() {
  const { processes, loading, stats, addProcess, updateProcess, deleteProcess } = useBusinessProcesses()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DbBusinessProcess | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleEdit = (item: DbBusinessProcess) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const handleSave = async (data: Omit<DbBusinessProcessInsert, 'district_id'>) => {
    setSaving(true)
    try {
      if (editingItem) {
        await updateProcess(editingItem.id, data)
      } else {
        await addProcess(data)
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
      await deleteProcess(deletingId)
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Business Impact Analysis</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Identifizieren Sie kritische Geschaeftsprozesse und definieren Sie Wiederherstellungsziele.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Prozess hinzufuegen
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard icon={Database} label="Geschaeftsprozesse" value={stats.total} color="text-primary-600" bg="bg-primary-50" />
        <KpiCard icon={AlertTriangle} label="Kritisch" value={stats.kritisch} color="text-red-600" bg="bg-red-50" />
        <KpiCard icon={Clock} label="Ohne RTO" value={stats.ohneRto} color="text-amber-600" bg="bg-amber-50" />
        <KpiCard icon={Zap} label="Min. RTO" value={stats.minRto !== null ? `${stats.minRto}h` : '—'} color="text-green-600" bg="bg-green-50" />
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Was ist eine Business Impact Analysis?</p>
            <p className="mt-1 text-xs text-blue-700">
              Die BIA identifiziert kritische Geschaeftsprozesse und bestimmt, wie lange diese maximal ausfallen duerfen (RTO),
              wie viel Datenverlust akzeptabel ist (RPO) und ab wann das Unternehmen existenziell bedroht ist (MTPD).
              Diese Analyse ist Pflicht nach NIS2 §30(2) und ISO 22301 §8.2.
            </p>
          </div>
        </div>
      </div>

      {/* Process List */}
      <div className="space-y-2">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-bold text-text-primary">Geschaeftsprozesse</h2>
          <span className="text-xs text-text-muted">({processes.length})</span>
        </div>

        {processes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-secondary p-8 text-center">
            <Database className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm font-medium text-text-secondary">Noch keine Geschaeftsprozesse erfasst</p>
            <p className="mt-1 text-xs text-text-muted">Erfassen Sie Ihre kritischen Prozesse mit RTO/RPO/MTPD-Zielen.</p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Ersten Prozess erfassen
            </button>
          </div>
        ) : (
          processes.map(proc => {
            const cfg = CRITICALITY_CONFIG[proc.criticality]
            const isExpanded = expandedId === proc.id
            return (
              <div key={proc.id} className="rounded-xl border border-border bg-white">
                <div className="flex items-center">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : proc.id)}
                    className="flex flex-1 items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary">{proc.name}</p>
                      <p className="text-xs text-text-muted">{proc.department}</p>
                    </div>
                    <div className="hidden gap-4 text-xs sm:flex">
                      <span className="text-text-muted">RTO: <span className="font-bold text-text-primary">{proc.rto_hours ?? '—'}h</span></span>
                      <span className="text-text-muted">RPO: <span className="font-bold text-text-primary">{proc.rpo_hours ?? '—'}h</span></span>
                      <span className="text-text-muted">MTPD: <span className="font-bold text-text-primary">{proc.mtpd_hours ?? '—'}h</span></span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
                  </button>
                  <div className="pr-2">
                    <RowActions onEdit={() => handleEdit(proc)} onDelete={() => setDeletingId(proc.id)} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    {proc.description && (
                      <p className="mb-3 text-sm text-text-secondary">{proc.description}</p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Abhaengigkeiten</p>
                        <div className="flex flex-wrap gap-1.5">
                          {((proc.dependencies as string[]) || []).length > 0 ? (
                            (proc.dependencies as string[]).map(d => (
                              <span key={d} className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs text-text-secondary">{d}</span>
                            ))
                          ) : (
                            <span className="text-xs text-text-muted">Keine</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">IT-Systeme</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(proc.it_systems || []).length > 0 ? (
                            proc.it_systems.map(s => (
                              <span key={s} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs text-primary-700">{s}</span>
                            ))
                          ) : (
                            <span className="text-xs text-text-muted">Keine</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <ProcessModal
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
        title="Prozess loeschen?"
        message="Dieser Geschaeftsprozess wird unwiderruflich geloescht."
        loading={saving}
      />
    </div>
  )
}

// ─── Process Modal ──────────────────────────────────

interface ProcessModalProps {
  item: DbBusinessProcess | null
  saving: boolean
  onSave: (data: Omit<DbBusinessProcessInsert, 'district_id'>) => void
  onClose: () => void
}

function ProcessModal({ item, saving, onSave, onClose }: ProcessModalProps) {
  const [name, setName] = useState(item?.name || '')
  const [department, setDepartment] = useState(item?.department || '')
  const [criticality, setCriticality] = useState<BpCriticality>(item?.criticality || 'mittel')
  const [rtoHours, setRtoHours] = useState(item?.rto_hours?.toString() || '')
  const [rpoHours, setRpoHours] = useState(item?.rpo_hours?.toString() || '')
  const [mtpdHours, setMtpdHours] = useState(item?.mtpd_hours?.toString() || '')
  const [depsText, setDepsText] = useState(((item?.dependencies as string[]) || []).join(', '))
  const [itText, setItText] = useState((item?.it_systems || []).join(', '))
  const [description, setDescription] = useState(item?.description || '')

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      department: department.trim(),
      criticality,
      rto_hours: rtoHours ? parseInt(rtoHours) : null,
      rpo_hours: rpoHours ? parseInt(rpoHours) : null,
      mtpd_hours: mtpdHours ? parseInt(mtpdHours) : null,
      dependencies: depsText.split(',').map(s => s.trim()).filter(Boolean),
      it_systems: itText.split(',').map(s => s.trim()).filter(Boolean),
      description: description.trim() || null,
    })
  }

  return (
    <Modal open onClose={onClose} title={item ? 'Prozess bearbeiten' : 'Neuer Geschaeftsprozess'} size="lg">
      <div className="grid gap-0 sm:grid-cols-2 sm:gap-4">
        <FormField label="Prozessname" required>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="z.B. IT-Kernsysteme" />
        </FormField>
        <FormField label="Abteilung">
          <input className={inputClass} value={department} onChange={e => setDepartment(e.target.value)} placeholder="z.B. IT" />
        </FormField>
      </div>

      <FormField label="Kritikalitaet" required>
        <select className={selectClass} value={criticality} onChange={e => setCriticality(e.target.value as BpCriticality)}>
          <option value="kritisch">Kritisch</option>
          <option value="hoch">Hoch</option>
          <option value="mittel">Mittel</option>
          <option value="niedrig">Niedrig</option>
        </select>
      </FormField>

      <div className="grid gap-0 sm:grid-cols-3 sm:gap-4">
        <FormField label="RTO (Stunden)">
          <input className={inputClass} type="number" min="0" value={rtoHours} onChange={e => setRtoHours(e.target.value)} placeholder="z.B. 4" />
        </FormField>
        <FormField label="RPO (Stunden)">
          <input className={inputClass} type="number" min="0" value={rpoHours} onChange={e => setRpoHours(e.target.value)} placeholder="z.B. 1" />
        </FormField>
        <FormField label="MTPD (Stunden)">
          <input className={inputClass} type="number" min="0" value={mtpdHours} onChange={e => setMtpdHours(e.target.value)} placeholder="z.B. 24" />
        </FormField>
      </div>

      <FormField label="Abhaengigkeiten (kommagetrennt)">
        <input className={inputClass} value={depsText} onChange={e => setDepsText(e.target.value)} placeholder="z.B. Strom, Internet, Rechenzentrum" />
      </FormField>

      <FormField label="IT-Systeme (kommagetrennt)">
        <input className={inputClass} value={itText} onChange={e => setItText(e.target.value)} placeholder="z.B. ERP-System, E-Mail-Server, VPN" />
      </FormField>

      <FormField label="Beschreibung">
        <textarea className={textareaClass} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optionale Beschreibung des Prozesses..." />
      </FormField>

      <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel={item ? 'Speichern' : 'Hinzufuegen'} loading={saving} disabled={!name.trim()} />
    </Modal>
  )
}

// ─── KPI Card ──────────────────────────────────

function KpiCard({ icon: Icon, label, value, color, bg }: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-xl font-extrabold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}
