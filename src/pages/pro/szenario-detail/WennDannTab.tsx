import { useState, useEffect } from 'react'
import { AlertTriangle, ArrowRight, TrendingUp, Plus, Trash2, Loader2 } from 'lucide-react'
import type { ScenarioHandbook } from '@/types/database'

type WennDann = ScenarioHandbook['wennDannSzenarien'][number]

interface WennDannTabProps {
  handbook: ScenarioHandbook
  onUpdateHandbook?: (section: string, data: ScenarioHandbook['wennDannSzenarien']) => Promise<void>
  saving?: boolean
  isEditing?: boolean
  onStopEditing?: () => void
}

export default function WennDannTab({ handbook, onUpdateHandbook, saving, isEditing = false, onStopEditing }: WennDannTabProps) {
  const szenarien = handbook.wennDannSzenarien || []
  const [editData, setEditData] = useState<WennDann[] | null>(null)

  useEffect(() => {
    if (isEditing && !editData) {
      setEditData(JSON.parse(JSON.stringify(szenarien)))
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
    const cleaned = editData
      .filter(s => s.trigger.trim())
      .map(s => ({
        trigger: s.trigger.trim(),
        massnahmen: s.massnahmen.filter(m => m.trim()),
        eskalation: s.eskalation.trim(),
      }))
    await onUpdateHandbook('wennDannSzenarien', cleaned)
    onStopEditing?.()
  }

  const updateField = (index: number, field: keyof WennDann, value: string) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((s, i) => i === index ? { ...s, [field]: value } : s)
    })
  }

  const updateMassnahme = (sIndex: number, mIndex: number, value: string) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((s, i) =>
        i === sIndex ? { ...s, massnahmen: s.massnahmen.map((m, j) => j === mIndex ? value : m) } : s
      )
    })
  }

  const addMassnahme = (sIndex: number) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((s, i) =>
        i === sIndex ? { ...s, massnahmen: [...s.massnahmen, ''] } : s
      )
    })
  }

  const removeMassnahme = (sIndex: number, mIndex: number) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((s, i) =>
        i === sIndex ? { ...s, massnahmen: s.massnahmen.filter((_, j) => j !== mIndex) } : s
      )
    })
  }

  const addSzenario = () => {
    setEditData(prev => prev ? [...prev, { trigger: '', massnahmen: [''], eskalation: '' }] : prev)
  }

  const removeSzenario = (index: number) => {
    setEditData(prev => prev ? prev.filter((_, i) => i !== index) : prev)
  }

  const data = isEditing && editData ? editData : szenarien

  if (!isEditing && data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        Keine Wenn-Dann-Szenarien vorhanden.
      </p>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {data.map((s, i) => (
          <div key={i} className="rounded-2xl border border-border border-l-4 border-l-amber-500 bg-white p-6">
            {isEditing ? (
              // ─── Edit-Modus ───
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">WENN</p>
                    <input
                      className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      value={s.trigger}
                      onChange={(e) => updateField(i, 'trigger', e.target.value)}
                      placeholder="Auslösende Bedingung…"
                    />
                  </div>
                  <button
                    onClick={() => removeSzenario(i)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="pl-11">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-600">DANN</p>
                  <div className="space-y-2">
                    {s.massnahmen.map((m, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                          value={m}
                          onChange={(e) => updateMassnahme(i, j, e.target.value)}
                          placeholder={`Maßnahme ${j + 1}…`}
                        />
                        <button
                          onClick={() => removeMassnahme(i, j)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addMassnahme(i)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                    >
                      <Plus className="h-3 w-3" />
                      Maßnahme hinzufügen
                    </button>
                  </div>
                </div>

                <div className="pl-11">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">Eskalation</p>
                  <input
                    className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    value={s.eskalation}
                    onChange={(e) => updateField(i, 'eskalation', e.target.value)}
                    placeholder="Was passiert, wenn Maßnahmen nicht greifen…"
                  />
                </div>
              </div>
            ) : (
              // ─── Lese-Modus ───
              <>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">WENN</p>
                    <p className="font-medium text-text-primary">{s.trigger}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 pl-11">
                  <ArrowRight className="h-4 w-4 text-text-muted" />
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="mb-4 pl-11">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-600">DANN</p>
                  <ul className="space-y-2">
                    {(s.massnahmen || []).map((m, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>

                {s.eskalation && (
                  <div className="ml-11 flex items-start gap-2 rounded-xl bg-red-50 p-3">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Eskalation</p>
                      <p className="text-sm text-red-700">{s.eskalation}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {isEditing && (
          <button
            onClick={addSzenario}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white p-4 text-sm text-primary-600 transition-colors hover:bg-primary-50"
          >
            <Plus className="h-4 w-4" />
            Neues Wenn-Dann-Szenario
          </button>
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
