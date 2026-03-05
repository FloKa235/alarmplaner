import {
  Package, Plus, Search, Loader2,
  Server, Monitor, Cloud, Cpu, Shield,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Modal, { FormField, inputClass, selectClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useOrganization } from '@/hooks/useOrganization'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbInventoryItem } from '@/types/database'

// Enterprise IT-Asset Kategorien
const KATEGORIE_OPTIONS = [
  'Server', 'Netzwerk', 'Endpoints', 'Cloud-Services',
  'Software-Lizenzen', 'Datenbanken', 'Backup-Systeme',
  'Kommunikation', 'Sicherheit', 'Sonstiges',
]

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  kritisch: { label: 'Kritisch', bg: 'bg-red-50', text: 'text-red-700' },
  hoch: { label: 'Hoch', bg: 'bg-orange-50', text: 'text-orange-700' },
  mittel: { label: 'Mittel', bg: 'bg-amber-50', text: 'text-amber-700' },
  niedrig: { label: 'Niedrig', bg: 'bg-green-50', text: 'text-green-700' },
}

const CONDITION_OPTIONS = [
  { value: 'einsatzbereit', label: 'Einsatzbereit' },
  { value: 'wartung_noetig', label: 'Wartung noetig' },
  { value: 'defekt', label: 'Defekt' },
]

const categoryIcons: Record<string, typeof Server> = {
  'Server': Server,
  'Netzwerk': Cpu,
  'Endpoints': Monitor,
  'Cloud-Services': Cloud,
  'Sicherheit': Shield,
}

const emptyForm = {
  kategorie: 'Server',
  category: '',
  target_quantity: '1',
  current_quantity: '0',
  unit: 'Stueck',
  priority: 'mittel',
  condition: 'einsatzbereit',
}

export default function EnterpriseInventarPage() {
  const { organizationId, loading: orgLoading } = useOrganization()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<DbInventoryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: items, loading, refetch } = useSupabaseQuery<DbInventoryItem>(
    (sb) =>
      sb
        .from('inventory_items')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('kategorie')
        .order('category'),
    [organizationId]
  )

  const filtered = useMemo(() => {
    if (!items) return []
    if (!searchQuery) return items
    const q = searchQuery.toLowerCase()
    return items.filter(
      i => i.category.toLowerCase().includes(q) || (i.kategorie || '').toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const handleAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const handleEdit = (item: DbInventoryItem) => {
    setEditId(item.id)
    setForm({
      kategorie: item.kategorie || 'Server',
      category: item.category,
      target_quantity: (item.target_quantity || 1).toString(),
      current_quantity: (item.current_quantity || 0).toString(),
      unit: item.unit || 'Stueck',
      priority: item.priority || 'mittel',
      condition: item.condition || 'einsatzbereit',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!organizationId) return
    setSaving(true)
    try {
      const data = {
        organization_id: organizationId,
        kategorie: form.kategorie,
        category: form.category || form.kategorie,
        target_quantity: parseInt(form.target_quantity) || 1,
        current_quantity: parseInt(form.current_quantity) || 0,
        unit: form.unit,
        priority: form.priority as DbInventoryItem['priority'],
        condition: form.condition as DbInventoryItem['condition'],
      }
      if (editId) {
        const { error } = await supabase.from('inventory_items').update(data).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory_items').insert(data)
        if (error) throw error
      }
      setShowModal(false)
      refetch()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await supabase.from('inventory_items').delete().eq('id', deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } finally {
      setDeleting(false)
    }
  }

  // Group by kategorie (must be before early return to satisfy hooks rules)
  const grouped = useMemo(() => {
    const map = new Map<string, DbInventoryItem[]>()
    for (const item of filtered) {
      const key = item.kategorie || 'Sonstiges'
      const list = map.get(key) || []
      list.push(item)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [filtered])

  if (orgLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="IT-Assets & Infrastruktur"
        description={`${items?.length || 0} Assets erfasst`}
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Asset hinzufuegen
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Assets durchsuchen..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* Grouped Items */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <p className="mb-1 text-lg font-semibold text-text-primary">Keine IT-Assets</p>
          <p className="mb-4 text-sm text-text-secondary">Erfassen Sie Ihre IT-Infrastruktur und Assets.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([kategorie, categoryItems]) => {
            const Icon = categoryIcons[kategorie] || Package
            return (
              <div key={kategorie}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <h3 className="text-sm font-semibold text-text-primary">{kategorie}</h3>
                  <span className="text-xs text-text-muted">({categoryItems.length})</span>
                </div>
                <div className="space-y-2">
                  {categoryItems.map((item) => {
                    const prio = PRIORITY_CONFIG[item.priority || 'mittel'] || PRIORITY_CONFIG.mittel
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">
                            {item.category}
                          </p>
                          <p className="text-xs text-text-muted">
                            {item.current_quantity}/{item.target_quantity} {item.unit}
                            {item.condition && ` · ${CONDITION_OPTIONS.find(c => c.value === item.condition)?.label || item.condition}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${prio.bg} ${prio.text}`}>
                            {prio.label}
                          </span>
                          <RowActions
                            onEdit={() => handleEdit(item)}
                            onDelete={() => setDeleteTarget(item)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} title={editId ? 'Asset bearbeiten' : 'Neues IT-Asset'} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <FormField label="Kategorie">
            <select
              className={selectClass}
              value={form.kategorie}
              onChange={(e) => setForm(f => ({ ...f, kategorie: e.target.value }))}
            >
              {KATEGORIE_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </FormField>
          <FormField label="Bezeichnung">
            <input
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              placeholder="z.B. Dell PowerEdge R750"
            />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Soll">
              <input type="number" className={inputClass} value={form.target_quantity} min="0"
                onChange={(e) => setForm(f => ({ ...f, target_quantity: e.target.value }))} />
            </FormField>
            <FormField label="Ist">
              <input type="number" className={inputClass} value={form.current_quantity} min="0"
                onChange={(e) => setForm(f => ({ ...f, current_quantity: e.target.value }))} />
            </FormField>
            <FormField label="Einheit">
              <input className={inputClass} value={form.unit}
                onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioritaet">
              <select className={selectClass} value={form.priority}
                onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Zustand">
              <select className={selectClass} value={form.condition}
                onChange={(e) => setForm(f => ({ ...f, condition: e.target.value }))}>
                {CONDITION_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
        <ModalFooter
          onCancel={() => setShowModal(false)}
          onSubmit={handleSave}
          submitLabel={editId ? 'Speichern' : 'Hinzufuegen'}
          loading={saving}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Asset loeschen"
        message={`Moechten Sie "${deleteTarget?.category || ''}" wirklich loeschen?`}
        loading={deleting}
      />
    </div>
  )
}
