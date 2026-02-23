/**
 * AlarmketteEditModal — Alarmkette CRUD
 *
 * Schritte Add/Remove/Reorder, Rolle-Dropdown, Kanäle-Toggle, Wartezeit.
 */
import { useState, useEffect, useRef } from 'react'
import {
  Plus, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react'
import Modal, { ModalFooter, inputClass, selectClass } from '@/components/ui/Modal'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type {
  AlarmkettenSchritt, AlarmKanal,
  DbAlertContact,
} from '@/types/database'

interface AlarmketteEditModalProps {
  open: boolean
  onClose: () => void
  /** Aktuelle Alarmkette (direkt, ohne Massnahmenplan-Wrapper) */
  alarmkette: AlarmkettenSchritt[]
  alertContacts: DbAlertContact[]
  /** Gibt die aktualisierte Alarmkette zurück */
  onSave: (alarmkette: AlarmkettenSchritt[]) => Promise<void>
}

// ─── Kanal-Optionen ──────────────────────────────────
const KANAL_OPTIONS: { value: AlarmKanal; label: string }[] = [
  { value: 'telefon', label: 'Telefon' },
  { value: 'email', label: 'E-Mail' },
  { value: 'funk', label: 'Funk (BOS)' },
  { value: 'nina', label: 'NINA' },
  { value: 'sirene', label: 'Sirene' },
  { value: 'messenger', label: 'Messenger' },
]

// ─── Rollen-Optionen ────────────────────────────────
const ROLLE_OPTIONS = [
  'S1 \u2013 Personal',
  'S2 \u2013 Lage',
  'S3 \u2013 Einsatz',
  'S4 \u2013 Versorgung',
  'S5 \u2013 Presse/Medien',
  'S6 \u2013 IT/Kommunikation',
  'Leitung',
  'Sonstiges',
]

// ─── Default Schritt ────────────────────────────────
function createDefaultSchritt(reihenfolge: number): AlarmkettenSchritt {
  return {
    id: crypto.randomUUID(),
    reihenfolge,
    rolle: ROLLE_OPTIONS[0],
    kontaktgruppen: [],
    kanaele: ['telefon'],
    wartezeit_min: 5,
    bedingung: null,
  }
}

export default function AlarmketteEditModal({
  open, onClose, alarmkette: alarmketteInput, alertContacts, onSave,
}: AlarmketteEditModalProps) {
  const [schritte, setSchritte] = useState<AlarmkettenSchritt[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const firstSelectRef = useRef<HTMLSelectElement>(null)

  // Alle verfügbaren Kontaktgruppen
  const allGroups = [...new Set(alertContacts.flatMap(c => c.groups || []))].sort()

  useEffect(() => {
    if (open) {
      setSchritte(
        alarmketteInput.length > 0
          ? alarmketteInput.map(s => ({ ...s }))
          : [createDefaultSchritt(1)]
      )
      setSaveError(null)
      // Auto-focus first select after render
      setTimeout(() => firstSelectRef.current?.focus(), 50)
    }
  }, [open, alarmketteInput])

  // ─── Schritt Operations ──────────────────────
  const addSchritt = () => {
    setSchritte([...schritte, createDefaultSchritt(schritte.length + 1)])
  }

  const removeSchritt = (idx: number) => {
    if (schritte.length <= 1) return
    const updated = schritte.filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, reihenfolge: i + 1 }))
    setSchritte(updated)
  }

  const moveSchritt = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= schritte.length) return
    const copy = [...schritte]
    ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
    setSchritte(copy.map((s, i) => ({ ...s, reihenfolge: i + 1 })))
  }

  const updateSchritt = (idx: number, field: keyof AlarmkettenSchritt, value: unknown) => {
    const copy = [...schritte]
    copy[idx] = { ...copy[idx], [field]: value }
    setSchritte(copy)
  }

  const toggleKanal = (idx: number, kanal: AlarmKanal) => {
    const copy = [...schritte]
    const current = copy[idx].kanaele
    copy[idx] = {
      ...copy[idx],
      kanaele: current.includes(kanal)
        ? current.filter(k => k !== kanal)
        : [...current, kanal],
    }
    setSchritte(copy)
  }

  const toggleGruppe = (idx: number, gruppe: string) => {
    const copy = [...schritte]
    const current = copy[idx].kontaktgruppen
    copy[idx] = {
      ...copy[idx],
      kontaktgruppen: current.includes(gruppe)
        ? current.filter(g => g !== gruppe)
        : [...current, gruppe],
    }
    setSchritte(copy)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(schritte)
      onClose()
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      setSaveError('Fehler beim Speichern der Alarmkette. Bitte erneut versuchen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !saving && onClose()} title="Alarmierungskette bearbeiten" size="lg">
      {saveError && (
        <div className="mb-4">
          <ErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />
        </div>
      )}
      <div className="space-y-4">
        {schritte.map((schritt, idx) => (
          <div key={schritt.id} className="rounded-xl border border-border bg-surface-secondary/20 p-4">
            {/* Header Row */}
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {idx + 1}
              </span>

              {/* Rolle */}
              <select
                ref={idx === 0 ? firstSelectRef : undefined}
                className={`${selectClass} flex-1`}
                value={schritt.rolle}
                onChange={(e) => updateSchritt(idx, 'rolle', e.target.value)}
              >
                {ROLLE_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Wartezeit */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className={`${inputClass} w-16 text-center`}
                  value={schritt.wartezeit_min}
                  onChange={(e) => updateSchritt(idx, 'wartezeit_min', parseInt(e.target.value, 10) || 0)}
                  min="0"
                />
                <span className="text-xs text-text-muted">Min.</span>
              </div>

              {/* Move + Delete */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => moveSchritt(idx, -1)}
                  disabled={idx === 0}
                  className="rounded p-1 text-text-muted transition-colors hover:bg-surface-secondary disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveSchritt(idx, 1)}
                  disabled={idx === schritte.length - 1}
                  className="rounded p-1 text-text-muted transition-colors hover:bg-surface-secondary disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeSchritt(idx)}
                  disabled={schritte.length <= 1}
                  className="rounded p-1 text-text-muted transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Kanäle */}
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium text-text-muted">Kan\u00e4le:</p>
              <div className="flex flex-wrap gap-1.5">
                {KANAL_OPTIONS.map(k => {
                  const active = schritt.kanaele.includes(k.value)
                  return (
                    <button
                      key={k.value}
                      onClick={() => toggleKanal(idx, k.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                      }`}
                    >
                      {k.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Kontaktgruppen */}
            {allGroups.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs font-medium text-text-muted">Kontaktgruppen:</p>
                <div className="flex flex-wrap gap-1.5">
                  {allGroups.map(g => {
                    const active = schritt.kontaktgruppen.includes(g)
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGruppe(idx, g)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bedingung (optional) */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-text-muted">Bedingung (optional):</p>
              <input
                className={inputClass}
                value={schritt.bedingung || ''}
                onChange={(e) => updateSchritt(idx, 'bedingung', e.target.value || null)}
                placeholder="z.B. Bei Vollaktivierung"
              />
            </div>
          </div>
        ))}

        {/* Add Schritt */}
        <button
          onClick={addSchritt}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-text-secondary transition-colors hover:border-primary-300 hover:text-primary-600"
        >
          <Plus className="h-4 w-4" /> Alarmierungsschritt hinzuf\u00fcgen
        </button>
      </div>

      <ModalFooter
        onCancel={onClose}
        onSubmit={handleSave}
        submitLabel="Alarmkette speichern"
        loading={saving}
      />
    </Modal>
  )
}
