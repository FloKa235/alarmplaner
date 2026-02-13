import { useState, useEffect } from 'react'
import { MessageCircle, Megaphone, Info, Plus, Trash2, Loader2, X } from 'lucide-react'
import type { ScenarioHandbook } from '@/types/database'

type KommPlan = ScenarioHandbook['kommunikationsplan']

interface KommunikationsplanTabProps {
  handbook: ScenarioHandbook
  onUpdateHandbook?: (section: string, data: KommPlan) => Promise<void>
  saving?: boolean
  isEditing?: boolean
  onStopEditing?: () => void
}

const inputCls = 'w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

function EditableList({
  items,
  onUpdate,
  onAdd,
  onRemove,
  placeholder,
  textarea,
}: {
  items: string[]
  onUpdate: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  placeholder: string
  textarea?: boolean
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {textarea ? (
            <textarea
              className={`${inputCls} flex-1`}
              rows={2}
              value={item}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder={placeholder}
            />
          ) : (
            <input
              className={`${inputCls} flex-1`}
              value={item}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder={placeholder}
            />
          )}
          <button
            onClick={() => onRemove(i)}
            className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
      >
        <Plus className="h-3 w-3" />
        Hinzufügen
      </button>
    </div>
  )
}

function ReadOnlyList({ items, dotColor }: { items: string[]; dotColor: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
          <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function KommunikationsplanTab({ handbook, onUpdateHandbook, saving, isEditing = false, onStopEditing }: KommunikationsplanTabProps) {
  const k = handbook.kommunikationsplan
  const [editData, setEditData] = useState<KommPlan | null>(null)

  useEffect(() => {
    if (isEditing && !editData) {
      setEditData(JSON.parse(JSON.stringify(k)))
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
    if (!editData || !onUpdateHandbook) return
    const cleaned: KommPlan = {
      intern: {
        sofort: editData.intern.sofort.filter(s => s.trim()),
        laufend: editData.intern.laufend.filter(s => s.trim()),
      },
      extern: {
        bevoelkerung: editData.extern.bevoelkerung.filter(s => s.trim()),
        medien: editData.extern.medien.filter(s => s.trim()),
        behoerden: editData.extern.behoerden.filter(s => s.trim()),
      },
      kanaele: editData.kanaele.filter(s => s.trim()),
      sprachregelungen: editData.sprachregelungen.filter(s => s.trim()),
    }
    await onUpdateHandbook('kommunikationsplan', cleaned)
    onStopEditing?.()
  }

  // Helper für verschachtelte Updates
  const updateNestedItem = (path: string[], index: number, value: string) => {
    setEditData(prev => {
      if (!prev) return prev
      const copy = JSON.parse(JSON.stringify(prev))
      let obj: Record<string, unknown> = copy
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>
      const arr = obj[path[path.length - 1]] as string[]
      arr[index] = value
      return copy
    })
  }

  const addNestedItem = (path: string[]) => {
    setEditData(prev => {
      if (!prev) return prev
      const copy = JSON.parse(JSON.stringify(prev))
      let obj: Record<string, unknown> = copy
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>
      ;(obj[path[path.length - 1]] as string[]).push('')
      return copy
    })
  }

  const removeNestedItem = (path: string[], index: number) => {
    setEditData(prev => {
      if (!prev) return prev
      const copy = JSON.parse(JSON.stringify(prev))
      let obj: Record<string, unknown> = copy
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>
      ;(obj[path[path.length - 1]] as string[]).splice(index, 1)
      return copy
    })
  }

  const data = isEditing && editData ? editData : k

  return (
    <div>
      <div className="space-y-6">
        {/* Interne Kommunikation */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Interne Kommunikation</h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Sofortmeldungen</h4>
              {isEditing ? (
                <EditableList
                  items={data.intern?.sofort || []}
                  onUpdate={(i, v) => updateNestedItem(['intern', 'sofort'], i, v)}
                  onAdd={() => addNestedItem(['intern', 'sofort'])}
                  onRemove={(i) => removeNestedItem(['intern', 'sofort'], i)}
                  placeholder="Sofortmeldung…"
                />
              ) : (
                <ReadOnlyList items={data.intern?.sofort || []} dotColor="bg-red-400" />
              )}
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Laufende Kommunikation</h4>
              {isEditing ? (
                <EditableList
                  items={data.intern?.laufend || []}
                  onUpdate={(i, v) => updateNestedItem(['intern', 'laufend'], i, v)}
                  onAdd={() => addNestedItem(['intern', 'laufend'])}
                  onRemove={(i) => removeNestedItem(['intern', 'laufend'], i)}
                  placeholder="Laufende Kommunikation…"
                />
              ) : (
                <ReadOnlyList items={data.intern?.laufend || []} dotColor="bg-blue-400" />
              )}
            </div>
          </div>
        </div>

        {/* Externe Kommunikation */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <Megaphone className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Externe Kommunikation</h3>
          </div>

          <div className="space-y-5">
            {([
              { key: 'bevoelkerung' as const, label: 'Bevölkerung', dot: 'bg-amber-400' },
              { key: 'medien' as const, label: 'Medien', dot: 'bg-pink-400' },
              { key: 'behoerden' as const, label: 'Behörden', dot: 'bg-purple-400' },
            ]).map(({ key, label, dot }) => (
              <div key={key}>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">{label}</h4>
                {isEditing ? (
                  <EditableList
                    items={data.extern?.[key] || []}
                    onUpdate={(i, v) => updateNestedItem(['extern', key], i, v)}
                    onAdd={() => addNestedItem(['extern', key])}
                    onRemove={(i) => removeNestedItem(['extern', key], i)}
                    placeholder={`${label}…`}
                  />
                ) : (
                  <ReadOnlyList items={data.extern?.[key] || []} dotColor={dot} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kanäle */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-text-primary">Kommunikationskanäle</h3>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {(data.kanaele || []).map((kanal, i) => (
                <div key={i} className="flex items-center gap-1 rounded-full border border-border bg-primary-50 px-3 py-1.5">
                  <input
                    className="w-32 border-0 bg-transparent p-0 text-sm font-medium text-primary-700 focus:outline-none"
                    value={kanal}
                    onChange={(e) => updateNestedItem(['kanaele'], i, e.target.value)}
                  />
                  <button
                    onClick={() => removeNestedItem(['kanaele'], i)}
                    className="rounded-full p-0.5 text-primary-400 transition-colors hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addNestedItem(['kanaele'])}
                className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-primary-600 transition-colors hover:bg-primary-50"
              >
                <Plus className="h-3 w-3" />
                Kanal
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(data.kanaele || []).map((kanal, i) => (
                <span key={i} className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700">
                  {kanal}
                </span>
              ))}
              {(!data.kanaele || data.kanaele.length === 0) && (
                <p className="text-sm text-text-muted">Keine Kanäle definiert.</p>
              )}
            </div>
          )}
        </div>

        {/* Sprachregelungen */}
        <div className={`rounded-2xl border p-6 ${isEditing ? 'border-border bg-white' : 'border-amber-200 bg-amber-50'}`}>
          <div className="mb-4 flex items-center gap-2">
            <Info className={`h-5 w-5 ${isEditing ? 'text-text-muted' : 'text-amber-600'}`} />
            <h3 className={`text-lg font-bold ${isEditing ? 'text-text-primary' : 'text-amber-900'}`}>Sprachregelungen</h3>
          </div>
          {isEditing ? (
            <EditableList
              items={data.sprachregelungen || []}
              onUpdate={(i, v) => updateNestedItem(['sprachregelungen'], i, v)}
              onAdd={() => addNestedItem(['sprachregelungen'])}
              onRemove={(i) => removeNestedItem(['sprachregelungen'], i)}
              placeholder="Sprachregelung / Kernaussage…"
              textarea
            />
          ) : (
            <ol className="space-y-3">
              {(data.sprachregelungen || []).map((regel, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-amber-800">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">
                    {i + 1}
                  </span>
                  <span className="italic">„{regel}"</span>
                </li>
              ))}
            </ol>
          )}
        </div>
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
