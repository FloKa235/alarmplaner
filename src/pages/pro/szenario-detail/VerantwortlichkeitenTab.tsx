import { useState, useEffect } from 'react'
import { UserCheck, Phone, Plus, Trash2, Loader2 } from 'lucide-react'
import type { ScenarioHandbook, DbAlertContact } from '@/types/database'

type Rolle = ScenarioHandbook['verantwortlichkeiten'][number]

interface VerantwortlichkeitenTabProps {
  handbook: ScenarioHandbook
  contacts: DbAlertContact[]
  onUpdateHandbook?: (section: string, data: ScenarioHandbook['verantwortlichkeiten']) => Promise<void>
  saving?: boolean
  isEditing?: boolean
  onStopEditing?: () => void
}

// S1–S6 Farben für visuelle Unterscheidung
const rollenFarben: Record<string, { bg: string; accent: string }> = {
  'S1': { bg: 'bg-blue-50', accent: 'bg-blue-600' },
  'S2': { bg: 'bg-green-50', accent: 'bg-green-600' },
  'S3': { bg: 'bg-red-50', accent: 'bg-red-600' },
  'S4': { bg: 'bg-amber-50', accent: 'bg-amber-600' },
  'S5': { bg: 'bg-purple-50', accent: 'bg-purple-600' },
  'S6': { bg: 'bg-cyan-50', accent: 'bg-cyan-600' },
}

function getRolleConfig(funktion: string) {
  const key = funktion.substring(0, 2).toUpperCase()
  return rollenFarben[key] || { bg: 'bg-gray-50', accent: 'bg-gray-600' }
}

export default function VerantwortlichkeitenTab({ handbook, contacts, onUpdateHandbook, saving, isEditing = false, onStopEditing }: VerantwortlichkeitenTabProps) {
  const rollen = handbook.verantwortlichkeiten || []
  const [editData, setEditData] = useState<Rolle[] | null>(null)

  useEffect(() => {
    if (isEditing && !editData) {
      setEditData(JSON.parse(JSON.stringify(rollen)))
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
      .filter(r => r.funktion.trim())
      .map(r => ({
        funktion: r.funktion.trim(),
        aufgaben: r.aufgaben.filter(a => a.trim()),
        ...(r.kontaktgruppe ? { kontaktgruppe: r.kontaktgruppe.trim() } : {}),
      }))
    await onUpdateHandbook('verantwortlichkeiten', cleaned)
    onStopEditing?.()
  }

  const updateFunktion = (index: number, value: string) => {
    setEditData(prev => prev ? prev.map((r, i) => i === index ? { ...r, funktion: value } : r) : prev)
  }

  const updateKontaktgruppe = (index: number, value: string) => {
    setEditData(prev => prev ? prev.map((r, i) => i === index ? { ...r, kontaktgruppe: value || undefined } : r) : prev)
  }

  const updateAufgabe = (rIndex: number, aIndex: number, value: string) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((r, i) =>
        i === rIndex ? { ...r, aufgaben: r.aufgaben.map((a, j) => j === aIndex ? value : a) } : r
      )
    })
  }

  const addAufgabe = (rIndex: number) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((r, i) =>
        i === rIndex ? { ...r, aufgaben: [...r.aufgaben, ''] } : r
      )
    })
  }

  const removeAufgabe = (rIndex: number, aIndex: number) => {
    setEditData(prev => {
      if (!prev) return prev
      return prev.map((r, i) =>
        i === rIndex ? { ...r, aufgaben: r.aufgaben.filter((_, j) => j !== aIndex) } : r
      )
    })
  }

  const addRolle = () => {
    setEditData(prev => prev ? [...prev, { funktion: '', aufgaben: [''], kontaktgruppe: undefined }] : prev)
  }

  const removeRolle = (index: number) => {
    setEditData(prev => prev ? prev.filter((_, i) => i !== index) : prev)
  }

  // Kontaktgruppen für Dropdown sammeln
  const allGroups = new Set<string>()
  contacts.forEach(c => (c.groups || []).forEach((g: string) => allGroups.add(g)))
  const availableGroups = [...allGroups].sort()

  const data = isEditing && editData ? editData : rollen

  if (!isEditing && data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        Keine Verantwortlichkeiten definiert.
      </p>
    )
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((rolle, i) => {
          const cfg = getRolleConfig(rolle.funktion)
          const matchedContacts = rolle.kontaktgruppe
            ? contacts.filter(c => c.groups?.includes(rolle.kontaktgruppe!))
            : []

          return (
            <div key={i} className={`rounded-2xl border border-border ${isEditing ? 'bg-white' : cfg.bg} p-5`}>
              {isEditing ? (
                // ─── Edit-Modus ───
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.accent} text-sm font-bold text-white`}>
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <input
                      className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-bold text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      value={rolle.funktion}
                      onChange={(e) => updateFunktion(i, e.target.value)}
                      placeholder="z.B. S1 – Personal"
                    />
                    <button
                      onClick={() => removeRolle(i)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Kontaktgruppe */}
                  <div>
                    <label className="mb-1 block text-xs text-text-muted">Kontaktgruppe</label>
                    <select
                      className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      value={rolle.kontaktgruppe || ''}
                      onChange={(e) => updateKontaktgruppe(i, e.target.value)}
                    >
                      <option value="">– Keine –</option>
                      {availableGroups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Aufgaben */}
                  <div>
                    <label className="mb-1 block text-xs text-text-muted">Aufgaben</label>
                    <div className="space-y-2">
                      {rolle.aufgaben.map((aufgabe, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input
                            className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-primary focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                            value={aufgabe}
                            onChange={(e) => updateAufgabe(i, j, e.target.value)}
                            placeholder={`Aufgabe ${j + 1}…`}
                          />
                          <button
                            onClick={() => removeAufgabe(i, j)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addAufgabe(i)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-600 transition-colors hover:bg-primary-50"
                      >
                        <Plus className="h-3 w-3" />
                        Aufgabe hinzufügen
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // ─── Lese-Modus ───
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cfg.accent} text-sm font-bold text-white`}>
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">{rolle.funktion}</h3>
                      {rolle.kontaktgruppe && (
                        <p className="text-xs text-text-muted">Kontaktgruppe: {rolle.kontaktgruppe}</p>
                      )}
                    </div>
                  </div>

                  <ul className="mb-4 space-y-2">
                    {(rolle.aufgaben || []).map((aufgabe, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                        {aufgabe}
                      </li>
                    ))}
                  </ul>

                  {matchedContacts.length > 0 && (
                    <div className="border-t border-border/50 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Kontakte</p>
                      <div className="space-y-1.5">
                        {matchedContacts.slice(0, 3).map(contact => (
                          <div key={contact.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-text-primary">{contact.name}</span>
                            {contact.phone && (
                              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                              </span>
                            )}
                          </div>
                        ))}
                        {matchedContacts.length > 3 && (
                          <p className="text-xs text-text-muted">+{matchedContacts.length - 3} weitere</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}

        {isEditing && (
          <button
            onClick={addRolle}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white p-8 text-sm text-primary-600 transition-colors hover:bg-primary-50"
          >
            <Plus className="h-4 w-4" />
            Neue Rolle
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
