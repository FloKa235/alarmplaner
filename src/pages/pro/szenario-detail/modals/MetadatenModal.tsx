/**
 * MetadatenModal — Szenario-Details bearbeiten
 *
 * Titel, Typ, Schweregrad, Beschreibung, Betroffene, Beteiligte Organisationen.
 */
import { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import Modal, { FormField, ModalFooter, inputClass, selectClass, textareaClass } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import type { DbScenario, SzenarioMeta } from '@/types/database'
import { STANDARD_ORGANISATIONEN } from '../helpers/handbook-extract'

interface MetadatenModalProps {
  open: boolean
  onClose: () => void
  scenario: DbScenario
  onSaved: () => void
}

const scenarioTypes = [
  'Starkregen', 'Sturm', 'Hitzewelle', 'Kältewelle', 'Waldbrand',
  'Amoklauf', 'CBRN', 'Cyberangriff', 'Krieg', 'Pandemie',
  'Sabotage', 'Stromausfall', 'Terroranschlag',
]

export default function MetadatenModal({ open, onClose, scenario, onSaved }: MetadatenModalProps) {
  const [saving, setSaving] = useState(false)
  const [customOrg, setCustomOrg] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '',
    type: '',
    severity: 50,
    description: '',
    affected_population: '',
    beteiligte_organisationen: [] as string[],
  })

  // Sync form when modal opens + auto-focus
  useEffect(() => {
    if (open) {
      const meta = scenario.meta as SzenarioMeta | null
      setForm({
        title: scenario.title,
        type: scenario.type,
        severity: scenario.severity,
        description: scenario.description || '',
        affected_population: scenario.affected_population?.toString() || '',
        beteiligte_organisationen: meta?.beteiligte_organisationen || [],
      })
      setCustomOrg('')
      // Auto-focus title input after render
      setTimeout(() => titleInputRef.current?.focus(), 50)
    }
  }, [open, scenario])

  // ─── Org-Helpers ─────────────────────────────────
  const toggleOrg = (org: string) => {
    setForm(prev => ({
      ...prev,
      beteiligte_organisationen: prev.beteiligte_organisationen.includes(org)
        ? prev.beteiligte_organisationen.filter(o => o !== org)
        : [...prev.beteiligte_organisationen, org],
    }))
  }

  const addCustomOrg = () => {
    const trimmed = customOrg.trim()
    if (trimmed && !form.beteiligte_organisationen.includes(trimmed)) {
      setForm(prev => ({
        ...prev,
        beteiligte_organisationen: [...prev.beteiligte_organisationen, trimmed],
      }))
      setCustomOrg('')
    }
  }

  const removeOrg = (org: string) => {
    setForm(prev => ({
      ...prev,
      beteiligte_organisationen: prev.beteiligte_organisationen.filter(o => o !== org),
    }))
  }

  // ─── Save ────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      // Merge beteiligte_organisationen into existing meta (preserve other fields!)
      const currentMeta = (scenario.meta as unknown as Record<string, unknown>) || {}
      const updatedMeta = {
        ...currentMeta,
        beteiligte_organisationen: form.beteiligte_organisationen,
      }

      const { error } = await supabase
        .from('scenarios')
        .update({
          title: form.title.trim(),
          type: form.type,
          severity: form.severity,
          description: form.description.trim() || null,
          affected_population: form.affected_population ? parseInt(form.affected_population, 10) : null,
          is_edited: true,
          meta: updatedMeta,
        })
        .eq('id', scenario.id)
      if (error) throw error
      onSaved()
      onClose()
    } catch (err) {
      console.error('Fehler beim Speichern der Metadaten:', err)
      alert('Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setSaving(false)
    }
  }

  // Custom orgs (not in predefined list)
  const customOrgs = form.beteiligte_organisationen.filter(
    o => !(STANDARD_ORGANISATIONEN as readonly string[]).includes(o)
  )

  return (
    <Modal open={open} onClose={() => !saving && onClose()} title="Szenario-Details bearbeiten" size="md">
      <FormField label="Titel" required>
        <input
          ref={titleInputRef}
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="z.B. Großflächiger Stromausfall"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Typ" required>
          <select
            className={selectClass}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {scenarioTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </FormField>

        <FormField label={`Schweregrad: ${form.severity}/100`}>
          <input
            type="range"
            min="1"
            max="100"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: parseInt(e.target.value, 10) })}
            className="mt-2 w-full accent-primary-600"
          />
        </FormField>
      </div>

      <FormField label="Beschreibung">
        <textarea
          className={textareaClass}
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Kurze Beschreibung des Krisenszenarios..."
        />
      </FormField>

      <FormField label="Betroffene Bevölkerung">
        <input
          type="number"
          className={inputClass}
          value={form.affected_population}
          onChange={(e) => setForm({ ...form, affected_population: e.target.value })}
          placeholder="z.B. 25000"
        />
      </FormField>

      {/* ─── Beteiligte Organisationen ─── */}
      <FormField label="Beteiligte Organisationen">
        <div className="flex flex-wrap gap-2">
          {STANDARD_ORGANISATIONEN.map(org => {
            const isSelected = form.beteiligte_organisationen.includes(org)
            return (
              <button
                key={org}
                type="button"
                onClick={() => toggleOrg(org)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {org}
              </button>
            )
          })}
        </div>

        {/* Custom orgs as removable chips */}
        {customOrgs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {customOrgs.map(org => (
              <span
                key={org}
                className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white"
              >
                {org}
                <button type="button" onClick={() => removeOrg(org)} className="hover:opacity-80">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom org */}
        <div className="mt-2 flex gap-2">
          <input
            className={`${inputClass} flex-1`}
            placeholder="Weitere Organisation hinzufügen..."
            value={customOrg}
            onChange={(e) => setCustomOrg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomOrg()
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomOrg}
            disabled={!customOrg.trim()}
            className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-white px-3 py-2 text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </FormField>

      <ModalFooter
        onCancel={onClose}
        onSubmit={handleSave}
        submitLabel="Speichern"
        loading={saving}
        disabled={!form.title.trim() || !form.type}
      />
    </Modal>
  )
}
