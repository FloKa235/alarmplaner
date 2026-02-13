import { useState, useEffect } from 'react'
import { Shield, Bell, GraduationCap, Package, Plus, Trash2, Loader2 } from 'lucide-react'
import type { ScenarioHandbook } from '@/types/database'

interface PraeventionTabProps {
  handbook: ScenarioHandbook
  onUpdateHandbook?: (section: string, data: ScenarioHandbook['praevention']) => Promise<void>
  saving?: boolean
  isEditing?: boolean
  onStopEditing?: () => void
}

type SectionKey = keyof ScenarioHandbook['praevention']

const sections: { key: SectionKey; label: string; icon: typeof Shield; color: string; bg: string }[] = [
  { key: 'vorbereitung', label: 'Vorbereitung', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'fruehwarnung', label: 'Frühwarnung', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'schulungen', label: 'Schulungen & Übungen', icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'materialvorhaltung', label: 'Materialvorhaltung', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
]

export default function PraeventionTab({ handbook, onUpdateHandbook, saving, isEditing = false, onStopEditing }: PraeventionTabProps) {
  const p = handbook.praevention
  const [editData, setEditData] = useState<ScenarioHandbook['praevention'] | null>(null)

  // Wenn isEditing von außen aktiviert wird → editData initialisieren
  useEffect(() => {
    if (isEditing && !editData) {
      setEditData(JSON.parse(JSON.stringify(p)))
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
    const cleaned = {
      vorbereitung: editData.vorbereitung.filter(s => s.trim()),
      fruehwarnung: editData.fruehwarnung.filter(s => s.trim()),
      schulungen: editData.schulungen.filter(s => s.trim()),
      materialvorhaltung: editData.materialvorhaltung.filter(s => s.trim()),
    }
    await onUpdateHandbook('praevention', cleaned)
    onStopEditing?.()
  }

  const updateItem = (key: SectionKey, index: number, value: string) => {
    setEditData(prev => {
      if (!prev) return prev
      const items = [...prev[key]]
      items[index] = value
      return { ...prev, [key]: items }
    })
  }

  const addItem = (key: SectionKey) => {
    setEditData(prev => {
      if (!prev) return prev
      return { ...prev, [key]: [...prev[key], ''] }
    })
  }

  const removeItem = (key: SectionKey, index: number) => {
    setEditData(prev => {
      if (!prev) return prev
      return { ...prev, [key]: prev[key].filter((_, i) => i !== index) }
    })
  }

  const data = isEditing && editData ? editData : p

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ key, label, icon: Icon, color, bg }) => {
          const items = data[key] || []
          return (
            <div key={key} className="rounded-2xl border border-border bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-bold text-text-primary">{label}</h3>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                        value={item}
                        onChange={(e) => updateItem(key, i, e.target.value)}
                        placeholder={`${label} Punkt ${i + 1}…`}
                      />
                      <button
                        onClick={() => removeItem(key, i)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addItem(key)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                  >
                    <Plus className="h-3 w-3" />
                    Hinzufügen
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
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
