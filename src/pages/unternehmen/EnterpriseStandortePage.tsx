import { useState } from 'react'
import {
  MapPin, Plus, Building2, Server, Factory, Warehouse,
  Loader2, CheckCircle2,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Modal, { FormField, inputClass, selectClass, textareaClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useOrganizationSites } from '@/hooks/useOrganizationSites'
import type { DbOrganizationSite, DbOrganizationSiteInsert, SiteType } from '@/types/database'

const SITE_TYPE_CONFIG: Record<string, { label: string; icon: typeof Building2; color: string; bg: string }> = {
  buero: { label: 'Buero', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
  rechenzentrum: { label: 'Rechenzentrum', icon: Server, color: 'text-purple-600', bg: 'bg-purple-50' },
  produktion: { label: 'Produktion', icon: Factory, color: 'text-amber-600', bg: 'bg-amber-50' },
  lager: { label: 'Lager', icon: Warehouse, color: 'text-green-600', bg: 'bg-green-50' },
  sonstiges: { label: 'Sonstiges', icon: MapPin, color: 'text-gray-600', bg: 'bg-gray-50' },
}

const emptyForm = {
  name: '',
  address: '',
  city: '',
  postal_code: '',
  site_type: 'buero' as SiteType,
  employee_count: '',
  is_primary: false,
  notes: '',
}

export default function EnterpriseStandortePage() {
  const { sites, loading, addSite, updateSite, deleteSite } = useOrganizationSites()
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DbOrganizationSite | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const handleAdd = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const handleEdit = (item: DbOrganizationSite) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      address: item.address || '',
      city: item.city || '',
      postal_code: item.postal_code || '',
      site_type: (item.site_type as SiteType) || 'buero',
      employee_count: item.employee_count?.toString() || '',
      is_primary: item.is_primary,
      notes: item.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data: Omit<DbOrganizationSiteInsert, 'organization_id'> = {
        name: form.name,
        address: form.address || null,
        city: form.city || null,
        postal_code: form.postal_code || null,
        site_type: form.site_type,
        employee_count: form.employee_count ? parseInt(form.employee_count, 10) : null,
        is_primary: form.is_primary,
        notes: form.notes || null,
      }
      if (editingItem) {
        await updateSite(editingItem.id, data)
      } else {
        await addSite(data)
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    await deleteSite(deletingId)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Standorte"
        description={`${sites.length} Standort${sites.length !== 1 ? 'e' : ''} registriert`}
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Standort hinzufuegen
          </button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-2xl font-bold text-text-primary">{sites.length}</p>
          <p className="text-xs text-text-muted">Gesamt</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-2xl font-bold text-text-primary">{sites.filter(s => s.site_type === 'buero').length}</p>
          <p className="text-xs text-text-muted">Bueros</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-2xl font-bold text-text-primary">{sites.filter(s => s.site_type === 'rechenzentrum').length}</p>
          <p className="text-xs text-text-muted">Rechenzentren</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="text-2xl font-bold text-text-primary">
            {sites.reduce((sum, s) => sum + (s.employee_count || 0), 0)}
          </p>
          <p className="text-xs text-text-muted">Mitarbeiter gesamt</p>
        </div>
      </div>

      {/* Sites List */}
      {sites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <MapPin className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <p className="mb-1 text-lg font-semibold text-text-primary">Keine Standorte</p>
          <p className="mb-4 text-sm text-text-secondary">Fuegen Sie Ihren ersten Unternehmensstandort hinzu.</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Standort hinzufuegen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map((site) => {
            const config = SITE_TYPE_CONFIG[site.site_type || 'sonstiges'] || SITE_TYPE_CONFIG.sonstiges
            const Icon = config.icon
            return (
              <div key={site.id} className="rounded-2xl border border-border bg-white p-5 transition-colors hover:border-primary-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-text-primary">{site.name}</p>
                        {site.is_primary && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Hauptsitz
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      {(site.address || site.city) && (
                        <p className="mt-0.5 text-sm text-text-secondary">
                          {[site.address, site.postal_code, site.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {site.employee_count && (
                        <p className="mt-0.5 text-xs text-text-muted">{site.employee_count} Mitarbeiter</p>
                      )}
                    </div>
                  </div>
                  <RowActions
                    onEdit={() => handleEdit(site)}
                    onDelete={() => setDeletingId(site.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        title={editingItem ? 'Standort bearbeiten' : 'Neuer Standort'}
        onClose={() => setShowModal(false)}
      >
        <div className="space-y-4">
          <FormField label="Name" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="z.B. Hauptsitz Berlin"
            />
          </FormField>
          <FormField label="Standorttyp">
            <select
              className={selectClass}
              value={form.site_type}
              onChange={(e) => setForm(f => ({ ...f, site_type: e.target.value as SiteType }))}
            >
              {Object.entries(SITE_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Adresse">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Musterstr. 1"
              />
            </FormField>
            <FormField label="PLZ">
              <input
                className={inputClass}
                value={form.postal_code}
                onChange={(e) => setForm(f => ({ ...f, postal_code: e.target.value }))}
                placeholder="10115"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stadt">
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="Berlin"
              />
            </FormField>
            <FormField label="Mitarbeiterzahl">
              <input
                type="number"
                className={inputClass}
                value={form.employee_count}
                onChange={(e) => setForm(f => ({ ...f, employee_count: e.target.value }))}
                placeholder="50"
                min="0"
              />
            </FormField>
          </div>
          <FormField label="Notizen">
            <textarea
              className={textareaClass}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optionale Bemerkungen..."
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm(f => ({ ...f, is_primary: e.target.checked }))}
              className="rounded border-border"
            />
            <span className="text-text-primary">Hauptsitz</span>
          </label>
        </div>
        <ModalFooter
          onCancel={() => setShowModal(false)}
          onSubmit={handleSave}
          submitLabel={editingItem ? 'Speichern' : 'Hinzufuegen'}
          loading={saving}
          disabled={!form.name.trim()}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Standort loeschen"
        message="Moechten Sie diesen Standort wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden."
      />
    </div>
  )
}
