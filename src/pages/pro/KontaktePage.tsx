import { Plus, Search, Mail, Phone, Smartphone, Users, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Badge from '@/components/ui/Badge'
import Modal, { FormField, inputClass, ModalFooter, ConfirmDialog, RowActions } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import type { DbAlertContact } from '@/types/database'

const emptyForm = { name: '', organization: '', role: '', email: '', phone: '', mobile_phone: '', groups: [] as string[] }
const groupOptions = ['Feuerwehr', 'Polizei', 'THW', 'Rettungsdienst', 'Verwaltung']

export default function KontaktePage() {
  const { districtId, loading: districtLoading } = useDistrict()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DbAlertContact | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: contacts, loading, refetch } = useSupabaseQuery<DbAlertContact>(
    (sb) =>
      sb
        .from('alert_contacts')
        .select('*')
        .eq('district_id', districtId!)
        .order('name'),
    [districtId]
  )

  const toggleGroup = (g: string) => {
    setForm((f) => ({
      ...f,
      groups: f.groups.includes(g) ? f.groups.filter((x) => x !== g) : [...f.groups, g],
    }))
  }

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (c: DbAlertContact) => {
    setEditId(c.id)
    setForm({
      name: c.name,
      organization: c.organization || '',
      role: c.role || '',
      email: c.email || '',
      phone: c.phone || '',
      mobile_phone: c.mobile_phone || '',
      groups: c.groups || [],
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !districtId) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        organization: form.organization.trim() || null,
        role: form.role.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        mobile_phone: form.mobile_phone.trim() || null,
        groups: form.groups,
      }

      if (editId) {
        const { error } = await supabase.from('alert_contacts').update(payload).eq('id', editId).eq('district_id', districtId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('alert_contacts').insert({ ...payload, district_id: districtId, is_active: true })
        if (error) throw error
      }

      refetch()
      setShowModal(false)
      setForm(emptyForm)
      setEditId(null)
    } catch (err) {
      console.error('Kontakt speichern fehlgeschlagen:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !districtId) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('alert_contacts').delete().eq('id', deleteTarget.id).eq('district_id', districtId)
      if (error) throw error
      refetch()
      setDeleteTarget(null)
    } catch (err) {
      console.error('Kontakt löschen fehlgeschlagen:', err)
    } finally {
      setDeleting(false)
    }
  }

  if (districtLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const filtered = searchQuery
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.organization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.role || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contacts

  return (
    <div>
      <Link
        to="/pro/alarmierung"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        &larr; Zurück zur Alarmzentrale
      </Link>

      <PageHeader
        title="Kontaktverwaltung"
        description="Verwalten Sie Alarmierungskontakte und Gruppen."
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Kontakt hinzufügen
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kontakte durchsuchen..."
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">Keine Kontakte vorhanden.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Organisation</th>
                  <th className="px-5 py-3">Kontakt</th>
                  <th className="px-5 py-3">Gruppen</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="transition-colors hover:bg-surface-secondary/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-600">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                          <p className="text-xs text-text-muted">{contact.role || '–'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-secondary">{contact.organization || '–'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 text-xs">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="h-3 w-3" />{contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="inline-flex items-center gap-1 text-text-muted hover:text-primary-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3 w-3" />{contact.phone}
                          </a>
                        )}
                        {contact.mobile_phone && (
                          <a
                            href={`tel:${contact.mobile_phone}`}
                            className="inline-flex items-center gap-1 text-text-muted hover:text-primary-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Smartphone className="h-3 w-3" />{contact.mobile_phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(contact.groups || []).map((g) => (
                          <Badge key={g}>{g}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={contact.is_active ? 'success' : 'default'}>
                        {contact.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <RowActions
                        onEdit={() => openEdit(contact)}
                        onDelete={() => setDeleteTarget(contact)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}>
        <FormField label="Name" required>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="z.B. Max Mustermann"
          />
        </FormField>

        <FormField label="Organisation">
          <input
            className={inputClass}
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            placeholder="z.B. Freiwillige Feuerwehr Quedlinburg"
          />
        </FormField>

        <FormField label="Rolle / Funktion">
          <input
            className={inputClass}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="z.B. Zugführer"
          />
        </FormField>

        <FormField label="E-Mail">
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="max@example.de"
          />
        </FormField>

        <FormField label="Festnetz">
          <input
            type="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+49 3946 123456"
          />
        </FormField>

        <FormField label="Handy">
          <input
            type="tel"
            className={inputClass}
            value={form.mobile_phone}
            onChange={(e) => setForm({ ...form, mobile_phone: e.target.value })}
            placeholder="+49 170 1234567"
          />
        </FormField>

        <FormField label="Gruppen">
          <div className="flex flex-wrap gap-2">
            {groupOptions.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGroup(g)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.groups.includes(g)
                    ? 'bg-primary-600 text-white'
                    : 'border border-border bg-white text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </FormField>

        <ModalFooter
          onCancel={() => setShowModal(false)}
          onSubmit={handleSave}
          submitLabel={editId ? 'Änderungen speichern' : 'Kontakt speichern'}
          loading={saving}
          disabled={!form.name.trim()}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Kontakt löschen"
        message={`Möchten Sie den Kontakt "${deleteTarget?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        loading={deleting}
      />
    </div>
  )
}
