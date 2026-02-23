/**
 * RessourcenSection — Ressourcen & Logistik pro Eskalationsstufe
 *
 * Welche Ressourcen/Räume werden in dieser Stufe benötigt?
 * Inline-Add/Edit/Remove mit Priorität und Status.
 */
import { useState } from 'react'
import {
  Package, Plus, Trash2, Check, X,
} from 'lucide-react'
import type { EskalationsStufe, EskalationsRessource } from '@/types/database'

interface RessourcenSectionProps {
  stufe: EskalationsStufe
  stufeIdx: number
  onChange: (stufeIdx: number, update: Partial<EskalationsStufe>) => void
}

const PRIO_CONFIG: Record<EskalationsRessource['prioritaet'], { label: string; bg: string; text: string; dot: string }> = {
  kritisch: { label: 'Kritisch', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  hoch: { label: 'Hoch', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  mittel: { label: 'Mittel', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  niedrig: { label: 'Niedrig', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
}

export default function RessourcenSection({
  stufe, stufeIdx, onChange,
}: RessourcenSectionProps) {
  const ressourcen = stufe.ressourcen || []
  const [adding, setAdding] = useState(false)
  const [newKategorie, setNewKategorie] = useState('')
  const [newMenge, setNewMenge] = useState('')
  const [newPrio, setNewPrio] = useState<EskalationsRessource['prioritaet']>('mittel')

  const addRessource = () => {
    const kat = newKategorie.trim()
    const menge = newMenge.trim()
    if (!kat || !menge) return
    const newItem: EskalationsRessource = {
      id: crypto.randomUUID(),
      kategorie: kat,
      menge,
      prioritaet: newPrio,
      bereitgestellt: false,
    }
    onChange(stufeIdx, { ressourcen: [...ressourcen, newItem] })
    setNewKategorie('')
    setNewMenge('')
    setNewPrio('mittel')
    setAdding(false)
  }

  const removeRessource = (id: string) => {
    onChange(stufeIdx, { ressourcen: ressourcen.filter(r => r.id !== id) })
  }

  const toggleBereitgestellt = (id: string) => {
    onChange(stufeIdx, {
      ressourcen: ressourcen.map(r =>
        r.id === id ? { ...r, bereitgestellt: !r.bereitgestellt } : r
      ),
    })
  }

  // Stats
  const bereitgestellt = ressourcen.filter(r => r.bereitgestellt).length
  const kritisch = ressourcen.filter(r => r.prioritaet === 'kritisch' && !r.bereitgestellt).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Ressourcen & Logistik</h2>
          <p className="text-xs text-text-muted">Benötigte Materialien, Personal und Räumlichkeiten</p>
        </div>
        {ressourcen.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-text-muted">
              {bereitgestellt}/{ressourcen.length} bereitgestellt
            </span>
            {kritisch > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700">
                {kritisch} kritisch fehlend
              </span>
            )}
          </div>
        )}
      </div>

      {/* Ressourcen-Tabelle */}
      {ressourcen.length > 0 ? (
        <div className="rounded-2xl border border-border bg-white">
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_90px_80px_40px] gap-2 border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            <span>Ressource</span>
            <span>Menge</span>
            <span>Priorität</span>
            <span className="text-center">Status</span>
            <span />
          </div>

          {/* Rows */}
          {ressourcen.map(res => {
            const prio = PRIO_CONFIG[res.prioritaet]
            return (
              <div
                key={res.id}
                className={`group grid grid-cols-[1fr_120px_90px_80px_40px] items-center gap-2 border-b border-border px-5 py-3 last:border-b-0 transition-colors ${
                  res.bereitgestellt ? 'bg-green-50/30' : ''
                }`}
              >
                <span className={`text-sm font-medium ${res.bereitgestellt ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                  {res.kategorie}
                </span>
                <span className="text-xs text-text-secondary">{res.menge}</span>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${prio.bg} ${prio.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
                  {prio.label}
                </span>
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleBereitgestellt(res.id)}
                    className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                      res.bereitgestellt
                        ? 'border-green-300 bg-green-100 text-green-600'
                        : 'border-gray-300 bg-white text-gray-300 hover:border-green-300 hover:text-green-500'
                    }`}
                  >
                    {res.bereitgestellt && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  onClick={() => removeRessource(res.id)}
                  className="rounded p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      ) : !adding ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white p-8 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-text-muted" />
          <p className="text-sm font-medium text-text-secondary">Keine Ressourcen definiert</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-text-muted">
            Definieren Sie die benötigten Materialien, Geräte und Räumlichkeiten für diese Eskalationsstufe.
          </p>
        </div>
      ) : null}

      {/* Inline-Add-Formular */}
      {adding ? (
        <div className="rounded-2xl border border-primary-200 bg-primary-50/30 p-4">
          <p className="mb-3 text-xs font-semibold text-primary-700">Neue Ressource hinzufügen</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              autoFocus
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary-300"
              placeholder="Kategorie (z.B. Sandsäcke)"
              value={newKategorie}
              onChange={(e) => setNewKategorie(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRessource()}
            />
            <input
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary-300"
              placeholder="Menge (z.B. 500 Stück)"
              value={newMenge}
              onChange={(e) => setNewMenge(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRessource()}
            />
            <select
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none"
              value={newPrio}
              onChange={(e) => setNewPrio(e.target.value as EskalationsRessource['prioritaet'])}
            >
              <option value="kritisch">Kritisch</option>
              <option value="hoch">Hoch</option>
              <option value="mittel">Mittel</option>
              <option value="niedrig">Niedrig</option>
            </select>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => { setAdding(false); setNewKategorie(''); setNewMenge('') }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-text-muted hover:bg-white"
            >
              <X className="h-3.5 w-3.5" /> Abbrechen
            </button>
            <button
              onClick={addRessource}
              disabled={!newKategorie.trim() || !newMenge.trim()}
              className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-text-muted transition-colors hover:border-primary-300 hover:text-primary-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Ressource hinzufügen
        </button>
      )}
    </div>
  )
}
