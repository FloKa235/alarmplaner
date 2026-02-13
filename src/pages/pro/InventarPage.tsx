import { Package, Plus, Upload, Download, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, inputClass, selectClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbInventoryItem } from '@/types/database'

function getPercent(current: number, target: number) {
  if (target === 0) return 100
  return Math.min(Math.round((current / target) * 100), 100)
}

function getBarColor(percent: number) {
  if (percent >= 90) return 'bg-green-500'
  if (percent >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function InventarPage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuccess, setAiSuccess] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const emptyForm = { category: '', unit: 'Stück', target_quantity: '', current_quantity: '', location: '' }
  const [form, setForm] = useState(emptyForm)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DbInventoryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const unitOptions = ['Stück', 'kg', 'Liter', 'Paletten', 'Karton', 'Satz']

  const { data: items, loading, refetch } = useSupabaseQuery<DbInventoryItem>(
    (sb) =>
      sb
        .from('inventory_items')
        .select('*')
        .eq('district_id', districtId!)
        .order('category'),
    [districtId]
  )

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (item: DbInventoryItem) => {
    setEditId(item.id)
    setForm({
      category: item.category,
      unit: item.unit,
      target_quantity: item.target_quantity ? String(item.target_quantity) : '',
      current_quantity: item.current_quantity ? String(item.current_quantity) : '',
      location: item.location || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.category.trim() || !districtId) return
    setSaving(true)
    try {
      const payload = {
        category: form.category.trim(),
        unit: form.unit,
        target_quantity: form.target_quantity ? Number(form.target_quantity) : 0,
        current_quantity: form.current_quantity ? Number(form.current_quantity) : 0,
        location: form.location.trim() || null,
      }

      if (editId) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', editId).eq('district_id', districtId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory_items').insert({ ...payload, district_id: districtId })
        if (error) throw error
      }

      refetch()
      setShowModal(false)
      setForm(emptyForm)
      setEditId(null)
    } catch (err) {
      console.error('Inventar-Item speichern fehlgeschlagen:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !districtId) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', deleteTarget.id).eq('district_id', districtId)
      if (error) throw error
      refetch()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Inventar-Item löschen fehlgeschlagen:', err)
    } finally {
      setDeleting(false)
    }
  }

  const handleAiRecommendation = async () => {
    if (!districtId) return
    setAiLoading(true)
    setAiError(null)
    setAiSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      if (!accessToken) throw new Error('Nicht angemeldet.')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-inventory-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ districtId }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Unbekannter Fehler')

      setAiSuccess(`KI hat ${result.updatedCount} Soll-Mengen aktualisiert und ${result.createdCount} neue Kategorien hinzugefügt.`)
      refetch()
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Verbindungsfehler.')
    } finally {
      setAiLoading(false)
    }
  }

  if (districtLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Computed stats
  const totalTarget = items.reduce((sum, i) => sum + i.target_quantity, 0)
  const totalCurrent = items.reduce((sum, i) => sum + i.current_quantity, 0)
  const overallPercent = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
  const underMin = items.filter((i) => getPercent(i.current_quantity, i.target_quantity) < 60).length

  return (
    <div>
      <PageHeader
        title="KI-Inventar"
        description="Soll/Ist-Vergleich Ihrer Ressourcen. KI berechnet den optimalen Bedarf pro Szenario."
        badge="Säule 3"
        actions={
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary">
              <Upload className="h-4 w-4" />
              CSV-Import
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handleAiRecommendation}
              disabled={aiLoading}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analysiere...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> KI-Empfehlung</>
              )}
            </button>
          </div>
        }
      />

      {/* KI Loading Banner */}
      {aiLoading && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            <Sparkles className="absolute h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-primary-900">KI analysiert Ihr Inventar...</p>
            <p className="text-sm text-primary-700">
              Die KI prüft Soll-Mengen anhand Ihres Risikoprofils und der Bevölkerungszahl. Dies kann 15–30 Sekunden dauern.
            </p>
          </div>
        </div>
      )}

      {/* KI Success Banner */}
      {aiSuccess && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-900">KI-Empfehlung abgeschlossen</p>
          <p className="text-sm text-green-700">{aiSuccess}</p>
        </div>
      )}

      {/* KI Error Banner */}
      {aiError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-900">Fehler bei der KI-Empfehlung</p>
          <p className="text-sm text-red-700">{aiError}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Gesamt-Abdeckung</p>
          <p className="text-3xl font-extrabold text-text-primary">{overallPercent}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div className={`h-full rounded-full ${getBarColor(overallPercent)}`} style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Kategorien</p>
          <p className="text-3xl font-extrabold text-text-primary">{items.length}</p>
          <p className="mt-2 text-xs text-text-muted">{underMin} unter Mindestbestand</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Letzter KI-Check</p>
          <p className="text-3xl font-extrabold text-text-primary">Heute</p>
          <p className="mt-2 text-xs text-text-muted">06:00 Uhr automatisch</p>
        </div>
      </div>

      {/* Inventory table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-text-primary">Bestandsübersicht</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-sm text-primary-600 transition-colors hover:text-primary-700"
          >
            <Plus className="h-4 w-4" />
            Hinzufügen
          </button>
        </div>
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Noch keine Inventar-Einträge vorhanden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Kategorie</th>
                  <th className="px-5 py-3">Standort</th>
                  <th className="px-5 py-3">Ist / Soll</th>
                  <th className="px-5 py-3">Abdeckung</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const pct = getPercent(item.current_quantity, item.target_quantity)
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-surface-secondary/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-text-muted" />
                          <span className="text-sm font-medium text-text-primary">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{item.location || '–'}</td>
                      <td className="px-5 py-3.5 text-sm text-text-primary">
                        {item.current_quantity.toLocaleString('de-DE')} / {item.target_quantity.toLocaleString('de-DE')} {item.unit}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-surface-secondary">
                            <div className={`h-full rounded-full ${getBarColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-text-primary">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={pct >= 90 ? 'success' : pct >= 60 ? 'warning' : 'danger'}>
                          {pct >= 90 ? 'OK' : pct >= 60 ? 'Niedrig' : 'Kritisch'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <RowActions
                          onEdit={() => openEdit(item)}
                          onDelete={() => setDeleteTarget(item)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Inventar-Item bearbeiten' : 'Inventar-Item hinzufügen'}>
        <FormField label="Kategorie / Bezeichnung" required>
          <input
            className={inputClass}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="z.B. Sandsäcke, Feldbetten, Trinkwasser"
          />
        </FormField>

        <FormField label="Einheit" required>
          <select
            className={selectClass}
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            {unitOptions.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </FormField>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <FormField label="Soll-Menge">
            <input
              type="number"
              className={inputClass}
              value={form.target_quantity}
              onChange={(e) => setForm({ ...form, target_quantity: e.target.value })}
              placeholder="z.B. 5000"
            />
          </FormField>
          <FormField label="Ist-Menge">
            <input
              type="number"
              className={inputClass}
              value={form.current_quantity}
              onChange={(e) => setForm({ ...form, current_quantity: e.target.value })}
              placeholder="z.B. 3200"
            />
          </FormField>
        </div>

        <FormField label="Lagerort">
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="z.B. Katastrophenschutzlager Thale"
          />
        </FormField>

        <ModalFooter
          onCancel={() => setShowModal(false)}
          onSubmit={handleSave}
          submitLabel={editId ? 'Änderungen speichern' : 'Item speichern'}
          loading={saving}
          disabled={!form.category.trim()}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Inventar-Item löschen"
        message={`Möchten Sie "${deleteTarget?.category}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        loading={deleting}
      />
    </div>
  )
}
