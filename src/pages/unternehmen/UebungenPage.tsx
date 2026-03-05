import { useState } from 'react'
import {
  CalendarCheck, Plus, Users, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react'
import { useExercises } from '@/hooks/useExercises'
import type { DbExercise, DbExerciseInsert, ExerciseType, ExerciseStatus } from '@/types/database'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'

const TYPE_LABELS: Record<ExerciseType, { label: string; desc: string; color: string; bg: string }> = {
  tabletop: { label: 'Tabletop', desc: 'Diskussionsbasierte Uebung am Tisch', color: 'text-blue-600', bg: 'bg-blue-50' },
  funktionsuebung: { label: 'Funktionsuebung', desc: 'Test einzelner Funktionen/Prozesse', color: 'text-purple-600', bg: 'bg-purple-50' },
  vollstaendig: { label: 'Vollstaendige Uebung', desc: 'Realitaetsnahe Gesamtuebung', color: 'text-red-600', bg: 'bg-red-50' },
  walkthrough: { label: 'Walkthrough', desc: 'Strukturierter Durchgang der Plaene', color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

const STATUS_CONFIG: Record<ExerciseStatus, { label: string; color: string; bg: string }> = {
  geplant: { label: 'Geplant', color: 'text-blue-600', bg: 'bg-blue-50' },
  durchgefuehrt: { label: 'Durchgefuehrt', color: 'text-amber-600', bg: 'bg-amber-50' },
  ausgewertet: { label: 'Ausgewertet', color: 'text-purple-600', bg: 'bg-purple-50' },
  abgeschlossen: { label: 'Abgeschlossen', color: 'text-green-600', bg: 'bg-green-50' },
}

export default function UebungenPage() {
  const { exercises, loading, stats, addExercise, updateExercise, deleteExercise } = useExercises()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DbExercise | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleEdit = (item: DbExercise) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const handleSave = async (data: Omit<DbExerciseInsert, 'district_id'>) => {
    setSaving(true)
    try {
      if (editingItem) {
        await updateExercise(editingItem.id, data)
      } else {
        await addExercise(data)
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
      await deleteExercise(deletingId)
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
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Uebungen & Tests</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Krisentraining planen, durchfuehren und auswerten. Gesetzlich vorgeschrieben nach NIS2 und KRITIS-DachG.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Uebung planen
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard icon={CalendarCheck} label="Geplant" value={stats.geplant} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={CheckCircle2} label="Durchgefuehrt" value={stats.durchgefuehrt} color="text-green-600" bg="bg-green-50" />
        <KpiCard icon={AlertTriangle} label="Erkenntnisse" value={stats.findings} color="text-amber-600" bg="bg-amber-50" />
        <KpiCard icon={Users} label="Teilnehmer gesamt" value={stats.participants} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Uebungstypen Info */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <h3 className="mb-3 text-sm font-bold text-text-primary">Uebungstypen</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(TYPE_LABELS) as [ExerciseType, typeof TYPE_LABELS[ExerciseType]][]).map(([key, cfg]) => (
            <div key={key} className={`rounded-xl border border-border p-3 ${cfg.bg}`}>
              <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
              <p className="mt-0.5 text-xs text-text-muted">{cfg.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-2">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
          <CalendarCheck className="h-4 w-4 text-text-muted" />
          Uebungskalender
          <span className="text-xs text-text-muted">({exercises.length})</span>
        </h2>

        {exercises.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-secondary p-8 text-center">
            <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm font-medium text-text-secondary">Noch keine Uebungen geplant</p>
            <p className="mt-1 text-xs text-text-muted">Planen Sie regelmaessige Krisentrainings gemaess NIS2 und KRITIS-DachG.</p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Erste Uebung planen
            </button>
          </div>
        ) : (
          exercises.map(ex => {
            const typeCfg = TYPE_LABELS[ex.type]
            const statusCfg = STATUS_CONFIG[ex.status]
            const isExpanded = expandedId === ex.id
            return (
              <div key={ex.id} className="rounded-xl border border-border bg-white">
                <div className="flex items-center">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                    className="flex flex-1 items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary">{ex.title}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                        <span>{ex.date_planned ? new Date(ex.date_planned).toLocaleDateString('de-DE') : '—'}</span>
                        {ex.duration_hours && <><span>&middot;</span><span>{ex.duration_hours}h</span></>}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeCfg.bg} ${typeCfg.color}`}>
                      {typeCfg.label}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-text-muted" /> : <ChevronRight className="h-4 w-4 text-text-muted" />}
                  </button>
                  <div className="pr-2">
                    <RowActions onEdit={() => handleEdit(ex)} onDelete={() => setDeletingId(ex.id)} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    {ex.objectives && ex.objectives.length > 0 && (
                      <p className="mb-3 text-sm text-text-secondary">{ex.objectives.join(', ')}</p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Teilnehmer</p>
                        <p className="text-sm text-text-secondary">{((ex.participants as unknown[]) || []).length} Personen</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Durchgefuehrt am</p>
                        <p className="text-sm text-text-secondary">
                          {ex.date_executed ? new Date(ex.date_executed).toLocaleDateString('de-DE') : 'Ausstehend'}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Erkenntnisse</p>
                        <p className="text-sm text-text-secondary">
                          {((ex.findings as unknown[]) || []).length > 0
                            ? `${((ex.findings as unknown[]) || []).length} dokumentiert`
                            : 'Keine'}
                        </p>
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
        <ExerciseModal
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
        title="Uebung loeschen?"
        message="Diese Uebung wird unwiderruflich geloescht."
        loading={saving}
      />
    </div>
  )
}

// ─── Exercise Modal ──────────────────────────────────

interface ExerciseModalProps {
  item: DbExercise | null
  saving: boolean
  onSave: (data: Omit<DbExerciseInsert, 'district_id'>) => void
  onClose: () => void
}

function ExerciseModal({ item, saving, onSave, onClose }: ExerciseModalProps) {
  const [title, setTitle] = useState(item?.title || '')
  const [type, setType] = useState<ExerciseType>(item?.type || 'tabletop')
  const [status, setStatus] = useState<ExerciseStatus>(item?.status || 'geplant')
  const [datePlanned, setDatePlanned] = useState(item?.date_planned || '')
  const [dateExecuted, setDateExecuted] = useState(item?.date_executed || '')
  const [durationHours, setDurationHours] = useState(item?.duration_hours?.toString() || '')
  const [objectives, setObjectives] = useState((item?.objectives || []).join(', '))

  const handleSubmit = () => {
    if (!title.trim() || !datePlanned) return
    onSave({
      title: title.trim(),
      type,
      status,
      date_planned: datePlanned,
      date_executed: dateExecuted || null,
      duration_hours: durationHours ? parseFloat(durationHours) : null,
      objectives: objectives.split(',').map(s => s.trim()).filter(Boolean),
      scenario_id: item?.scenario_id || null,
      participants: item?.participants || [],
      findings: item?.findings || [],
      actions: item?.actions || [],
    })
  }

  return (
    <Modal open onClose={onClose} title={item ? 'Uebung bearbeiten' : 'Neue Uebung planen'} size="lg">
      <FormField label="Titel" required>
        <input className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Ransomware-Szenario Tabletop" />
      </FormField>

      <div className="grid gap-0 sm:grid-cols-2 sm:gap-4">
        <FormField label="Uebungstyp" required>
          <select className={selectClass} value={type} onChange={e => setType(e.target.value as ExerciseType)}>
            <option value="tabletop">Tabletop</option>
            <option value="funktionsuebung">Funktionsuebung</option>
            <option value="vollstaendig">Vollstaendige Uebung</option>
            <option value="walkthrough">Walkthrough</option>
          </select>
        </FormField>
        <FormField label="Status">
          <select className={selectClass} value={status} onChange={e => setStatus(e.target.value as ExerciseStatus)}>
            <option value="geplant">Geplant</option>
            <option value="durchgefuehrt">Durchgefuehrt</option>
            <option value="ausgewertet">Ausgewertet</option>
            <option value="abgeschlossen">Abgeschlossen</option>
          </select>
        </FormField>
      </div>

      <div className="grid gap-0 sm:grid-cols-3 sm:gap-4">
        <FormField label="Geplant am" required>
          <input className={inputClass} type="date" value={datePlanned} onChange={e => setDatePlanned(e.target.value)} />
        </FormField>
        <FormField label="Durchgefuehrt am">
          <input className={inputClass} type="date" value={dateExecuted} onChange={e => setDateExecuted(e.target.value)} />
        </FormField>
        <FormField label="Dauer (Stunden)">
          <input className={inputClass} type="number" min="0" step="0.5" value={durationHours} onChange={e => setDurationHours(e.target.value)} placeholder="z.B. 3" />
        </FormField>
      </div>

      <FormField label="Ziele / Beschreibung">
        <textarea className={textareaClass} rows={3} value={objectives} onChange={e => setObjectives(e.target.value)} placeholder="Was soll mit dieser Uebung erreicht werden?" />
      </FormField>

      <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel={item ? 'Speichern' : 'Hinzufuegen'} loading={saving} disabled={!title.trim() || !datePlanned} />
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
