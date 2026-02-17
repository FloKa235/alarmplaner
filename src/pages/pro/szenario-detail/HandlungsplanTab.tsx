import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import type { DbScenarioPhase } from '@/types/database'

// ─── Phase Form Type (exported for SzenarioDetailPage) ──────
export interface PhaseForm {
  name: string
  duration: string
  tasks: string[]
}

interface HandlungsplanTabProps {
  phases: DbScenarioPhase[]
  onSavePhases?: (phases: PhaseForm[]) => Promise<void>
  saving?: boolean
  isEditing?: boolean
  onStopEditing?: () => void
}

export default function HandlungsplanTab({ phases, onSavePhases, saving, isEditing = false, onStopEditing }: HandlungsplanTabProps) {
  const [editData, setEditData] = useState<PhaseForm[] | null>(null)

  useEffect(() => {
    if (isEditing && !editData) {
      setEditData(
        phases.map(p => ({
          name: p.name,
          duration: p.duration,
          tasks: [...(p.tasks || [])],
        }))
      )
    }
    if (!isEditing) {
      setEditData(null)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  const cancelEditing = () => {
    setEditData(null)
    onStopEditing?.()
  }

  const saveEditing = async () => {
    if (!editData || !onSavePhases) return
    await onSavePhases(editData)
    onStopEditing?.()
  }

  // ─── Phase Manipulation ────────────────────────────
  const addPhase = () => {
    setEditData(prev => prev ? [...prev, { name: '', duration: '', tasks: [''] }] : prev)
  }

  const removePhase = (index: number) => {
    setEditData(prev => prev ? prev.filter((_, i) => i !== index) : prev)
  }

  const movePhase = (index: number, direction: 'up' | 'down') => {
    setEditData(prev => {
      if (!prev) return prev
      const arr = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= arr.length) return prev
      ;[arr[index], arr[target]] = [arr[target], arr[index]]
      return arr
    })
  }

  const updatePhase = (index: number, field: 'name' | 'duration', value: string) => {
    setEditData(prev =>
      prev ? prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)) : prev
    )
  }

  // ─── Task Manipulation ─────────────────────────────
  const addTask = (phaseIndex: number) => {
    setEditData(prev =>
      prev
        ? prev.map((p, i) =>
            i === phaseIndex ? { ...p, tasks: [...p.tasks, ''] } : p
          )
        : prev
    )
  }

  const updateTask = (phaseIndex: number, taskIndex: number, value: string) => {
    setEditData(prev =>
      prev
        ? prev.map((p, i) =>
            i === phaseIndex
              ? { ...p, tasks: p.tasks.map((t, j) => (j === taskIndex ? value : t)) }
              : p
          )
        : prev
    )
  }

  const removeTask = (phaseIndex: number, taskIndex: number) => {
    setEditData(prev =>
      prev
        ? prev.map((p, i) =>
            i === phaseIndex
              ? { ...p, tasks: p.tasks.filter((_, j) => j !== taskIndex) }
              : p
          )
        : prev
    )
  }

  const data = isEditing && editData ? editData : phases.map(p => ({ name: p.name, duration: p.duration, tasks: p.tasks || [] }))

  if (!isEditing && phases.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        Noch kein Handlungsplan vorhanden. Klicken Sie oben auf „Bearbeiten", um Phasen hinzuzufügen.
      </p>
    )
  }

  const inputCls = 'rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((phase, pi) => (
          <div key={pi} className="rounded-2xl border border-border bg-white p-6">
            {isEditing ? (
              // ─── Edit-Modus ───
              <>
                {/* Phase header row */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                    {pi + 1}
                  </div>

                  <input
                    className={`${inputCls} flex-1`}
                    value={phase.name}
                    onChange={(e) => updatePhase(pi, 'name', e.target.value)}
                    placeholder="Phasenname (z.B. Sofortmaßnahmen)"
                  />

                  <input
                    className={`${inputCls} w-32`}
                    value={phase.duration}
                    onChange={(e) => updatePhase(pi, 'duration', e.target.value)}
                    placeholder="Dauer (z.B. 2h)"
                  />

                  {/* Reorder buttons */}
                  <button
                    onClick={() => movePhase(pi, 'up')}
                    disabled={pi === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => movePhase(pi, 'down')}
                    disabled={pi === data.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Delete phase */}
                  <button
                    onClick={() => removePhase(pi)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Tasks */}
                <div className="ml-10 space-y-2">
                  {phase.tasks.map((task, ti) => (
                    <div key={ti} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                      <input
                        className={`${inputCls} flex-1`}
                        value={task}
                        onChange={(e) => updateTask(pi, ti, e.target.value)}
                        placeholder={`Aufgabe ${ti + 1}…`}
                      />
                      <button
                        onClick={() => removeTask(pi, ti)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addTask(pi)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    <Plus className="h-3 w-3" />
                    Aufgabe hinzufügen
                  </button>
                </div>
              </>
            ) : (
              // ─── Lese-Modus ───
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                    {pi + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{phase.name}</h3>
                    <p className="text-xs text-text-muted">{phase.duration}</p>
                  </div>
                </div>
                <ul className="space-y-2 pl-11">
                  {phase.tasks.map((task, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                      {task}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}

        {/* Neue Phase Button (nur im Edit-Modus) */}
        {isEditing && (
          <button
            onClick={addPhase}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white p-4 text-sm text-primary-600 transition-colors hover:bg-primary-50 sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            Neue Phase
          </button>
        )}

        {isEditing && data.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted sm:col-span-2">
            Noch keine Phasen. Klicken Sie auf „Neue Phase", um den Handlungsplan zu erstellen.
          </p>
        )}
      </div>

      {/* Speichern/Abbrechen Toolbar (unten, nur im Edit-Modus) */}
      {isEditing && (
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={cancelEditing}
            disabled={saving}
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            Abbrechen
          </button>
          <button
            onClick={saveEditing}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Speichern…</> : 'Speichern'}
          </button>
        </div>
      )}
    </div>
  )
}
