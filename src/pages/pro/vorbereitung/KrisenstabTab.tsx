/**
 * KrisenstabTab — S1–S6 Rollen + Leiter Krisenstab
 *
 * Zeigt Besetzungsstatus pro Rolle, Kontakt-Verknüpfung
 * und manuelle Eingabe als Fallback. Stellvertreter pro Rolle.
 */
import { useMemo, useState } from 'react'
import {
  UserPlus, CheckCircle2, AlertTriangle, XCircle,
  Pencil, Trash2, Phone, Mail, Loader2, StickyNote,
} from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { supabase } from '@/lib/supabase'
import Modal, { FormField, inputClass, selectClass, ModalFooter } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/Modal'
import type { DbKrisenstabMember, DbAlertContact, KrisenstabRolle } from '@/types/database'

// ─── Rollen-Config ───────────────────────────────────
const ROLLEN: { key: KrisenstabRolle; label: string; beschreibung: string }[] = [
  { key: 'Leiter', label: 'Leiter Krisenstab', beschreibung: 'Gesamtleitung, Entscheidungsbefugnis' },
  { key: 'S1', label: 'S1 – Personal', beschreibung: 'Personalwesen, Innerer Dienst' },
  { key: 'S2', label: 'S2 – Lage', beschreibung: 'Lagedarstellung, Dokumentation' },
  { key: 'S3', label: 'S3 – Einsatz', beschreibung: 'Einsatzplanung, Koordination' },
  { key: 'S4', label: 'S4 – Versorgung', beschreibung: 'Logistik, Versorgung, Technik' },
  { key: 'S5', label: 'S5 – Presse', beschreibung: 'Öffentlichkeitsarbeit, Medien' },
  { key: 'S6', label: 'S6 – IT/Kommunikation', beschreibung: 'IT-Systeme, Kommunikationstechnik' },
]

interface KrisenstabTabProps {
  districtId: string
}

// Helper: Anzeigename eines Mitglieds (Kontakt oder manuell)
function memberDisplayName(m: DbKrisenstabMember, contacts: DbAlertContact[]): string {
  if (m.contact_id) {
    const c = contacts.find((ct) => ct.id === m.contact_id)
    return c?.name || m.name || '–'
  }
  return m.name || '–'
}

function memberPhone(m: DbKrisenstabMember, contacts: DbAlertContact[]): string | null {
  if (m.contact_id) {
    const c = contacts.find((ct) => ct.id === m.contact_id)
    return c?.phone || c?.mobile_phone || m.telefon || null
  }
  return m.telefon || null
}

function memberEmail(m: DbKrisenstabMember, contacts: DbAlertContact[]): string | null {
  if (m.contact_id) {
    const c = contacts.find((ct) => ct.id === m.contact_id)
    return c?.email || m.email || null
  }
  return m.email || null
}

// ─── Component ───────────────────────────────────────
export default function KrisenstabTab({ districtId }: KrisenstabTabProps) {
  // ── Data ──
  const { data: members, loading, refetch } = useSupabaseQuery<DbKrisenstabMember>(
    (sb) =>
      sb
        .from('krisenstab_members')
        .select('*')
        .eq('district_id', districtId)
        .order('rolle')
        .order('ist_stellvertreter'),
    [districtId],
  )

  const { data: contacts } = useSupabaseQuery<DbAlertContact>(
    (sb) =>
      sb
        .from('alert_contacts')
        .select('*')
        .eq('district_id', districtId)
        .eq('is_active', true)
        .order('name'),
    [districtId],
  )

  // ── Modal State ──
  const [editMember, setEditMember] = useState<DbKrisenstabMember | null>(null)
  const [createForRolle, setCreateForRolle] = useState<{ rolle: KrisenstabRolle; isStv: boolean } | null>(null)
  const [deleteMember, setDeleteMember] = useState<DbKrisenstabMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formContactId, setFormContactId] = useState<string>('')
  const [formName, setFormName] = useState('')
  const [formTelefon, setFormTelefon] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formNotizen, setFormNotizen] = useState('')

  // ── Stats ──
  const stats = useMemo(() => {
    let besetzt = 0
    let teilweise = 0
    let unbesetzt = 0

    for (const rolle of ROLLEN) {
      const haupt = members.find((m) => m.rolle === rolle.key && !m.ist_stellvertreter)
      const stv = members.find((m) => m.rolle === rolle.key && m.ist_stellvertreter)

      if (haupt && stv) besetzt++
      else if (haupt) teilweise++
      else unbesetzt++
    }

    return { besetzt, teilweise, unbesetzt }
  }, [members])

  // ── Open Create Modal ──
  const openCreate = (rolle: KrisenstabRolle, isStv: boolean) => {
    setCreateForRolle({ rolle, isStv })
    setEditMember(null)
    setFormContactId('')
    setFormName('')
    setFormTelefon('')
    setFormEmail('')
    setFormNotizen('')
  }

  // ── Open Edit Modal ──
  const openEdit = (m: DbKrisenstabMember) => {
    setEditMember(m)
    setCreateForRolle(null)
    setFormContactId(m.contact_id || '')
    setFormName(m.name || '')
    setFormTelefon(m.telefon || '')
    setFormEmail(m.email || '')
    setFormNotizen(m.notizen || '')
  }

  // ── Save (Create / Edit) ──
  const handleSave = async () => {
    setSaving(true)
    try {
      const data = {
        district_id: districtId,
        rolle: editMember ? editMember.rolle : createForRolle!.rolle,
        ist_stellvertreter: editMember ? editMember.ist_stellvertreter : createForRolle!.isStv,
        contact_id: formContactId || null,
        name: formName || null,
        telefon: formTelefon || null,
        email: formEmail || null,
        notizen: formNotizen || null,
      }

      if (editMember) {
        const { error } = await supabase
          .from('krisenstab_members')
          .update(data)
          .eq('id', editMember.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('krisenstab_members')
          .insert(data)
        if (error) throw error
      }

      refetch()
      setEditMember(null)
      setCreateForRolle(null)
    } catch (err) {
      console.error('Krisenstab-Fehler:', err)
      alert('Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteMember) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('krisenstab_members')
        .delete()
        .eq('id', deleteMember.id)
      if (error) throw error
      refetch()
      setDeleteMember(null)
    } catch (err) {
      console.error('Lösch-Fehler:', err)
      alert('Fehler beim Entfernen.')
    } finally {
      setDeleting(false)
    }
  }

  // ── When contact selected, auto-fill name/phone/email ──
  const handleContactChange = (contactId: string) => {
    setFormContactId(contactId)
    if (contactId) {
      const c = contacts.find((ct) => ct.id === contactId)
      if (c) {
        setFormName(c.name)
        setFormTelefon(c.phone || c.mobile_phone || '')
        setFormEmail(c.email || '')
      }
    }
  }

  const isModalOpen = !!editMember || !!createForRolle
  const modalTitle = editMember
    ? `${ROLLEN.find((r) => r.key === editMember.rolle)?.label || editMember.rolle}${editMember.ist_stellvertreter ? ' (Stellvertreter)' : ''} bearbeiten`
    : createForRolle
      ? `${ROLLEN.find((r) => r.key === createForRolle.rolle)?.label || createForRolle.rolle}${createForRolle.isStv ? ' – Stellvertreter' : ''} zuweisen`
      : ''

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Summary Stats ──────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-600" />
          <p className="text-2xl font-bold text-green-700">{stats.besetzt}</p>
          <p className="text-xs text-green-600">Vollständig besetzt</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-amber-600" />
          <p className="text-2xl font-bold text-amber-700">{stats.teilweise}</p>
          <p className="text-xs text-amber-600">Stellvertreter fehlt</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <XCircle className="mx-auto mb-1 h-5 w-5 text-red-600" />
          <p className="text-2xl font-bold text-red-700">{stats.unbesetzt}</p>
          <p className="text-xs text-red-600">Unbesetzt</p>
        </div>
      </div>

      {/* ─── Rollen-Grid ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {ROLLEN.map((rolle) => {
          const haupt = members.find((m) => m.rolle === rolle.key && !m.ist_stellvertreter)
          const stv = members.find((m) => m.rolle === rolle.key && m.ist_stellvertreter)

          // Status
          const statusColor = haupt && stv
            ? 'border-green-200'
            : haupt
              ? 'border-amber-200'
              : 'border-red-200'

          const statusBadge = haupt && stv
            ? { bg: 'bg-green-50', text: 'text-green-700', label: 'Vollständig' }
            : haupt
              ? { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Stv. fehlt' }
              : { bg: 'bg-red-50', text: 'text-red-700', label: 'Unbesetzt' }

          return (
            <div key={rolle.key} className={`rounded-2xl border ${statusColor} bg-white p-5`}>
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{rolle.label}</h3>
                  <p className="text-xs text-text-muted">{rolle.beschreibung}</p>
                </div>
                <span className={`rounded-full ${statusBadge.bg} px-2.5 py-0.5 text-xs font-medium ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* Hauptperson */}
              <div className="mb-2">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">Hauptverantwortlich</p>
                {haupt ? (
                  <div className="flex items-center justify-between rounded-xl bg-surface-secondary/50 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{memberDisplayName(haupt, contacts)}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {memberPhone(haupt, contacts) && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Phone className="h-3 w-3" />
                            {memberPhone(haupt, contacts)}
                          </span>
                        )}
                        {memberEmail(haupt, contacts) && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{memberEmail(haupt, contacts)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openEdit(haupt)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-white hover:text-text-primary"
                        title="Bearbeiten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteMember(haupt)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600"
                        title="Entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openCreate(rolle.key, false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-text-muted transition-colors hover:border-primary-300 hover:text-primary-600"
                  >
                    <UserPlus className="h-4 w-4" />
                    Person zuweisen
                  </button>
                )}
              </div>

              {/* Stellvertreter */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">Stellvertreter</p>
                {stv ? (
                  <div className="flex items-center justify-between rounded-xl bg-surface-secondary/50 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{memberDisplayName(stv, contacts)}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {memberPhone(stv, contacts) && (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Phone className="h-3 w-3" />
                            {memberPhone(stv, contacts)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openEdit(stv)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-white hover:text-text-primary"
                        title="Bearbeiten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteMember(stv)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-red-50 hover:text-red-600"
                        title="Entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openCreate(rolle.key, true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-2.5 text-xs text-text-muted transition-colors hover:border-primary-300 hover:text-primary-600"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Stellvertreter zuweisen
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Edit / Create Modal ─────────────────────── */}
      <Modal
        open={isModalOpen}
        onClose={() => { if (!saving) { setEditMember(null); setCreateForRolle(null) } }}
        title={modalTitle}
        size="md"
      >
        {/* Kontakt-Verknüpfung */}
        <FormField label="Kontakt auswählen">
          <select
            className={selectClass}
            value={formContactId}
            onChange={(e) => handleContactChange(e.target.value)}
          >
            <option value="">— Manuell eingeben —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.role ? ` (${c.role})` : ''}{c.organization ? ` – ${c.organization}` : ''}
              </option>
            ))}
          </select>
        </FormField>

        <div className="mb-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">oder manuell</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Manuelle Eingabe */}
        <FormField label="Name" required>
          <input
            type="text"
            className={inputClass}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Vor- und Nachname"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Telefon">
            <input
              type="tel"
              className={inputClass}
              value={formTelefon}
              onChange={(e) => setFormTelefon(e.target.value)}
              placeholder="+49..."
            />
          </FormField>
          <FormField label="E-Mail">
            <input
              type="email"
              className={inputClass}
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="name@example.de"
            />
          </FormField>
        </div>

        <FormField label="Notizen">
          <input
            type="text"
            className={inputClass}
            value={formNotizen}
            onChange={(e) => setFormNotizen(e.target.value)}
            placeholder="z.B. Erreichbarkeit, Besonderheiten..."
          />
        </FormField>

        {/* Info bei Kontakt-Verknüpfung */}
        {formContactId && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary-50/50 px-3 py-2 text-xs text-primary-700">
            <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Kontaktdaten werden aus der Kontakte-Verwaltung übernommen. Manuelle Felder dienen als Ergänzung/Fallback.</span>
          </div>
        )}

        <ModalFooter
          onCancel={() => { setEditMember(null); setCreateForRolle(null) }}
          onSubmit={handleSave}
          submitLabel={saving ? 'Wird gespeichert...' : 'Speichern'}
          loading={saving}
          disabled={!formName.trim() && !formContactId}
        />
      </Modal>

      {/* ─── Delete Confirmation ─────────────────────── */}
      <ConfirmDialog
        open={!!deleteMember}
        onClose={() => setDeleteMember(null)}
        onConfirm={handleDelete}
        title="Zuordnung entfernen"
        message={`Möchten Sie die Zuordnung von "${deleteMember?.name || '–'}" als ${ROLLEN.find((r) => r.key === deleteMember?.rolle)?.label || deleteMember?.rolle}${deleteMember?.ist_stellvertreter ? ' (Stellvertreter)' : ''} wirklich entfernen?`}
        confirmLabel="Entfernen"
        loading={deleting}
      />
    </div>
  )
}
