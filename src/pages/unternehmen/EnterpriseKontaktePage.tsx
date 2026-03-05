import { Plus, Search, Mail, Phone, Smartphone, Users, Loader2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Modal, { FormField, inputClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useOrganization } from '@/hooks/useOrganization'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbAlertContact } from '@/types/database'

const emptyForm = { name: '', organization: '', role: '', email: '', phone: '', mobile_phone: '', groups: [] as string[] }
const groupOptions = ['IT-Sicherheit', 'Management', 'Krisenstab', 'Betriebsrat', 'Externes CERT', 'Facility Management']

export default function EnterpriseKontaktePage() {
  const { organizationId, loading: orgLoading } = useOrganization()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<DbAlertContact | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: contacts, loading, refetch } = useSupabaseQuery<DbAlertContact>(
    (sb) =>
      sb
        .from('alert_contacts')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('name'),
    [organizationId]
  )

  const toggleGroup = (g: string) => {
    setForm(f => ({
      ...f,
      groups: f.groups.includes(g) ? f.groups.filter(x => x !== g) : [...f.groups, g],
    }))
  }

  const filtered = useMemo(() => {
    if (!contacts) return []
    if (!searchQuery) return contacts
    const q = searchQuery.toLowerCase()
    return contacts.filter(
      c => c.name.toLowerCase().includes(q) ||
           (c.email || '').toLowerCase().includes(q) ||
           (c.role || '').toLowerCase().includes(q)
    )
  }, [contacts, searchQuery])

  const handleAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const handleEdit = (contact: DbAlertContact) => {
    setEditId(contact.id)
    setForm({
      name: contact.name,
      organization: contact.organization || '',
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      mobile_phone: contact.mobile_phone || '',
      groups: (contact.groups as string[]) || [],
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!organizationId || !form.name.trim()) return
    setSaving(true)
    try {
      const data = {
        organization_id: organizationId,
        name: form.name.trim(),
        organization: form.organization || null,
        role: form.role || null,
        email: form.email || null,
        phone: form.phone || null,
        mobile_phone: form.mobile_phone || null,
        groups: form.groups.length > 0 ? form.groups : null,
        is_active: true,
      }
      if (editId) {
        const { error } = await supabase.from('alert_contacts').update(data).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('alert_contacts').insert(data)
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
      await supabase.from('alert_contacts').delete().eq('id', deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } finally {
      setDeleting(false)
    }
  }

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
        title="Alarmierungskontakte"
        description={`${contacts?.length || 0} Kontakte registriert`}
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Kontakt hinzufuegen
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
          placeholder="Kontakte durchsuchen..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* Contacts List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-text-muted" />
          <p className="mb-1 text-lg font-semibold text-text-primary">Keine Kontakte</p>
          <p className="mb-4 text-sm text-text-secondary">Fuegen Sie Ihren ersten Alarmierungskontakt hinzu.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{contact.name}</p>
                    {contact.role && (
                      <span className="text-xs text-text-muted">· {contact.role}</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </span>
                    )}
                    {contact.mobile_phone && (
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" /> {contact.mobile_phone}
                      </span>
                    )}
                  </div>
                  {contact.groups && (contact.groups as string[]).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(contact.groups as string[]).map((g) => (
                        <span key={g} className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <RowActions
                onEdit={() => handleEdit(contact)}
                onDelete={() => setDeleteTarget(contact)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} title={editId ? 'Kontakt bearbeiten' : 'Neuer Kontakt'} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <FormField label="Name" required>
            <input className={inputClass} value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Vor- und Nachname" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Organisation / Abteilung">
              <input className={inputClass} value={form.organization}
                onChange={(e) => setForm(f => ({ ...f, organization: e.target.value }))}
                placeholder="z.B. IT-Abteilung" />
            </FormField>
            <FormField label="Rolle">
              <input className={inputClass} value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="z.B. IT-Leiter" />
            </FormField>
          </div>
          <FormField label="E-Mail">
            <input type="email" className={inputClass} value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@firma.de" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Telefon">
              <input className={inputClass} value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+49..." />
            </FormField>
            <FormField label="Mobil">
              <input className={inputClass} value={form.mobile_phone}
                onChange={(e) => setForm(f => ({ ...f, mobile_phone: e.target.value }))}
                placeholder="+49..." />
            </FormField>
          </div>
          <FormField label="Gruppen">
            <div className="flex flex-wrap gap-2">
              {groupOptions.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGroup(g)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.groups.includes(g) ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-border text-text-muted'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </FormField>
        </div>
        <ModalFooter
          onCancel={() => setShowModal(false)}
          onSubmit={handleSave}
          submitLabel={editId ? 'Speichern' : 'Hinzufuegen'}
          loading={saving}
          disabled={!form.name.trim()}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Kontakt loeschen"
        message={`Moechten Sie "${deleteTarget?.name || ''}" wirklich loeschen?`}
        loading={deleting}
      />
    </div>
  )
}
