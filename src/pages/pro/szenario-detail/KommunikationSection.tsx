/**
 * KommunikationSection — Kommunikationsplan pro Eskalationsstufe
 *
 * Intern/Extern-Kommunikation, Kanäle, Sprachregelungen.
 * Alles inline editierbar.
 */
import { useState } from 'react'
import {
  Megaphone, MessageSquare, Radio, Quote,
  Plus, Trash2,
} from 'lucide-react'
import type { EskalationsStufe, EskalationsKommunikation } from '@/types/database'
import { ESKALATION_COLORS } from './helpers/eskalation-defaults'

interface KommunikationSectionProps {
  stufe: EskalationsStufe
  stufeIdx: number
  onChange: (stufeIdx: number, update: Partial<EskalationsStufe>) => void
}

const KANAL_OPTIONS = [
  'NINA', 'Sirene', 'Lautsprecherdurchsage', 'Social Media',
  'Website', 'Presse', 'E-Mail', 'Telefon', 'Funk', 'Messenger',
]

// ─── Inline List Editor ────────────────────────────────
function InlineListEditor({
  items,
  onAdd,
  onRemove,
  placeholder,
  emptyText,
}: {
  items: string[]
  onAdd: (text: string) => void
  onRemove: (idx: number) => void
  placeholder: string
  emptyText: string
}) {
  const [newText, setNewText] = useState('')
  const handleAdd = () => {
    const t = newText.trim()
    if (!t) return
    onAdd(t)
    setNewText('')
  }

  return (
    <div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="group flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
              <span className="flex-1 text-xs leading-relaxed text-text-secondary">{item}</span>
              <button
                onClick={() => onRemove(i)}
                className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-text-muted">{emptyText}</p>
      )}
      <div className="mt-2 flex gap-1.5">
        <input
          className="flex-1 rounded-lg border border-border bg-surface-secondary/30 px-2.5 py-1.5 text-xs outline-none focus:border-primary-300"
          placeholder={placeholder}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="rounded-lg bg-surface-secondary px-2 py-1.5 text-xs text-text-secondary hover:bg-gray-200 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function KommunikationSection({
  stufe, stufeIdx, onChange,
}: KommunikationSectionProps) {
  const colors = ESKALATION_COLORS[stufe.stufe]
  const komm = stufe.kommunikation || { intern: [], extern: [], kanaele: [], sprachregelungen: [] }

  const updateKomm = (update: Partial<EskalationsKommunikation>) => {
    onChange(stufeIdx, { kommunikation: { ...komm, ...update } })
  }

  const toggleKanal = (kanal: string) => {
    const current = komm.kanaele || []
    if (current.includes(kanal)) {
      updateKomm({ kanaele: current.filter(k => k !== kanal) })
    } else {
      updateKomm({ kanaele: [...current, kanal] })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Kommunikation</h2>
        <p className="text-xs text-text-muted">Wer informiert wen, über welchen Kanal, mit welcher Botschaft</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ─── Interne Kommunikation ─── */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Interne Kommunikation
          </h4>
          <InlineListEditor
            items={komm.intern}
            onAdd={(t) => updateKomm({ intern: [...komm.intern, t] })}
            onRemove={(i) => updateKomm({ intern: komm.intern.filter((_, idx) => idx !== i) })}
            placeholder="Interne Maßnahme..."
            emptyText="Keine internen Kommunikationsmaßnahmen definiert"
          />
        </div>

        {/* ─── Externe Kommunikation ─── */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
            <Megaphone className="h-4 w-4 text-orange-500" />
            Externe Kommunikation
          </h4>
          <InlineListEditor
            items={komm.extern}
            onAdd={(t) => updateKomm({ extern: [...komm.extern, t] })}
            onRemove={(i) => updateKomm({ extern: komm.extern.filter((_, idx) => idx !== i) })}
            placeholder="Externe Maßnahme..."
            emptyText="Keine externen Kommunikationsmaßnahmen definiert"
          />
        </div>

        {/* ─── Kommunikationskanäle ─── */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
            <Radio className="h-4 w-4 text-green-500" />
            Kommunikationskanäle
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {KANAL_OPTIONS.map(kanal => {
              const active = (komm.kanaele || []).includes(kanal)
              return (
                <button
                  key={kanal}
                  onClick={() => toggleKanal(kanal)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? `${colors.badge} ring-1 ring-inset ${colors.border}`
                      : 'bg-gray-50 text-text-muted hover:bg-gray-100'
                  }`}
                >
                  {kanal}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Sprachregelungen ─── */}
        <div className="rounded-2xl border border-border bg-white p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
            <Quote className="h-4 w-4 text-violet-500" />
            Sprachregelungen
          </h4>
          <SprachregelungenEditor
            items={komm.sprachregelungen}
            onAdd={(t) => updateKomm({ sprachregelungen: [...komm.sprachregelungen, t] })}
            onRemove={(i) => updateKomm({ sprachregelungen: komm.sprachregelungen.filter((_, idx) => idx !== i) })}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Sprachregelungen mit Zitat-Stil ───────────────────
function SprachregelungenEditor({
  items,
  onAdd,
  onRemove,
}: {
  items: string[]
  onAdd: (text: string) => void
  onRemove: (idx: number) => void
}) {
  const [newText, setNewText] = useState('')
  const handleAdd = () => {
    const t = newText.trim()
    if (!t) return
    onAdd(t)
    setNewText('')
  }

  return (
    <div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="group flex items-start gap-2">
              <div className="flex-1 rounded-lg border-l-2 border-violet-300 bg-violet-50/50 px-3 py-2">
                <p className="text-xs italic leading-relaxed text-text-secondary">„{item}"</p>
              </div>
              <button
                onClick={() => onRemove(i)}
                className="shrink-0 rounded p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs italic text-text-muted">
          Keine Sprachregelungen definiert
        </p>
      )}
      <div className="mt-2 flex gap-1.5">
        <input
          className="flex-1 rounded-lg border border-border bg-surface-secondary/30 px-2.5 py-1.5 text-xs outline-none focus:border-primary-300"
          placeholder="Vorgefertigte Formulierung..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="rounded-lg bg-surface-secondary px-2 py-1.5 text-xs text-text-secondary hover:bg-gray-200 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
