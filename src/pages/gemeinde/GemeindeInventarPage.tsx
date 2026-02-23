import { useState, useMemo } from 'react'
import { Package, Plus, Search, Loader2, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useMembership } from '@/hooks/useMembership'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import { inputClass } from '@/components/ui/Modal'
import type { DbInventoryItem } from '@/types/database'

export default function GemeindeInventarPage() {
  const { municipalityId, districtId, municipality } = useMembership()

  const { data: items, refetch } = useSupabaseQuery<DbInventoryItem>(
    (sb) => sb.from('inventory_items').select('*')
      .eq('district_id', districtId!)
      .eq('municipality_id', municipalityId!)
      .order('category'),
    [districtId, municipalityId]
  )

  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    category: '', unit: '', target_quantity: '', current_quantity: '',
    location: '', kategorie: '', priority: '' as string,
  })

  const filtered = useMemo(() =>
    items.filter(i =>
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      (i.kategorie || '').toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  )

  const openCreate = () => {
    setEditId('new')
    setForm({ category: '', unit: 'Stück', target_quantity: '', current_quantity: '0', location: '', kategorie: '', priority: 'mittel' })
  }

  const openEdit = (item: DbInventoryItem) => {
    setEditId(item.id)
    setForm({
      category: item.category,
      unit: item.unit,
      target_quantity: item.target_quantity?.toString() || '',
      current_quantity: item.current_quantity?.toString() || '0',
      location: item.location || '',
      kategorie: item.kategorie || '',
      priority: item.priority || 'mittel',
    })
  }

  const handleSave = async () => {
    if (!form.category.trim()) return
    setSaving(true)
    try {
      const payload = {
        district_id: districtId!,
        municipality_id: municipalityId!,
        category: form.category.trim(),
        unit: form.unit || 'Stück',
        target_quantity: parseInt(form.target_quantity) || 0,
        current_quantity: parseInt(form.current_quantity) || 0,
        location: form.location || null,
        kategorie: form.kategorie || null,
        priority: (form.priority || null) as DbInventoryItem['priority'],
      }

      if (editId === 'new') {
        const { error } = await supabase.from('inventory_items').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', editId!)
        if (error) throw error
      }
      setEditId(null)
      refetch()
    } catch (err) {
      console.error(err)
      alert('Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Diesen Artikel wirklich löschen?')) return
    const { error } = await supabase.from('inventory_items').delete().eq('id', id)
    if (error) { alert('Fehler beim Löschen.'); return }
    refetch()
  }

  const getStatusColor = (item: DbInventoryItem) => {
    const pct = item.target_quantity > 0 ? (item.current_quantity / item.target_quantity) * 100 : 0
    if (pct >= 100) return 'bg-green-100 text-green-700'
    if (pct >= 60) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  const getStatusLabel = (item: DbInventoryItem) => {
    const pct = item.target_quantity > 0 ? (item.current_quantity / item.target_quantity) * 100 : 0
    if (pct >= 100) return 'Ausreichend'
    if (pct >= 60) return 'Niedrig'
    return 'Kritisch'
  }

  return (
    <div>
      <PageHeader
        title={`Inventar – ${municipality?.name || 'Gemeinde'}`}
        description="Materialbestände und Ausrüstung Ihrer Gemeinde verwalten."
      />

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Artikel suchen..."
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Neuer Artikel
        </button>
      </div>

      {/* Edit Form */}
      {editId && (
        <div className="mb-4 rounded-2xl border border-primary-200 bg-primary-50/50 p-5">
          <h3 className="mb-3 font-semibold text-text-primary">
            {editId === 'new' ? 'Neuer Artikel' : 'Artikel bearbeiten'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Artikel *</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} placeholder="z.B. Sandsäcke" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Kategorie</label>
              <input type="text" value={form.kategorie} onChange={(e) => setForm({ ...form, kategorie: e.target.value })} className={inputClass} placeholder="z.B. Hochwasserschutz" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Soll-Menge</label>
              <input type="number" value={form.target_quantity} onChange={(e) => setForm({ ...form, target_quantity: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Ist-Bestand</label>
              <input type="number" value={form.current_quantity} onChange={(e) => setForm({ ...form, current_quantity: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Einheit</label>
              <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Lagerort</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="z.B. Feuerwehrhaus" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Priorität</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
                <option value="kritisch">Kritisch</option>
                <option value="hoch">Hoch</option>
                <option value="mittel">Mittel</option>
                <option value="niedrig">Niedrig</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setEditId(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary">Abbrechen</button>
            <button onClick={handleSave} disabled={saving || !form.category.trim()} className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Tabelle */}
      <div className="rounded-2xl border border-border bg-white">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-semibold text-text-primary">Artikel</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Kategorie</th>
                <th className="px-4 py-3 font-semibold text-text-primary text-right">Soll</th>
                <th className="px-4 py-3 font-semibold text-text-primary text-right">Ist</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Einheit</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Lagerort</th>
                <th className="px-4 py-3 font-semibold text-text-primary">Status</th>
                <th className="px-4 py-3 font-semibold text-text-primary w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Package className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                    <p className="text-text-secondary">Noch keine Inventar-Artikel. Klicken Sie auf "Neuer Artikel".</p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-surface-secondary/50 cursor-pointer" onClick={() => openEdit(item)}>
                    <td className="px-4 py-3 font-medium text-text-primary">{item.category}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.kategorie || '–'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.target_quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.current_quantity}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.unit}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.location || '–'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(item)}`}>
                        {getStatusLabel(item)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-text-muted hover:bg-primary-50 hover:text-primary-600">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
