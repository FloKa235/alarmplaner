import { useState, useEffect, useCallback } from 'react'
import { MapPin, Phone, Users, FileText, Edit3, Save, Plus, Trash2, X, FileDown } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Modal, { FormField, ModalFooter, inputClass, textareaClass } from '@/components/ui/Modal'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'

// ─── Types ────────────────────────────────────────────

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relation: string
}

interface MeetingPoint {
  primary: string
  primaryAddress: string
  alternative: string
}

interface NotfallplanData {
  contacts: EmergencyContact[]
  meetingPoint: MeetingPoint
  notes: string
}

// ─── Defaults ─────────────────────────────────────────

const DEFAULT_DATA: NotfallplanData = {
  contacts: [],
  meetingPoint: {
    primary: '',
    primaryAddress: '',
    alternative: '',
  },
  notes: '',
}

const IMPORTANT_NUMBERS = [
  { name: 'Notruf (Feuerwehr & Rettung)', number: '112' },
  { name: 'Polizei', number: '110' },
  { name: 'Giftnotruf', number: '030 19240' },
  { name: 'Telefonseelsorge', number: '0800 1110111' },
  { name: 'Ärztl. Bereitschaftsdienst', number: '116117' },
]

const STORAGE_KEY = 'alarmplaner-notfallplan'

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── LocalStorage ─────────────────────────────────────

function loadData(): NotfallplanData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return {
          contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
          meetingPoint: parsed.meetingPoint || DEFAULT_DATA.meetingPoint,
          notes: typeof parsed.notes === 'string' ? parsed.notes : '',
        }
      }
    }
  } catch {
    // ignore
  }
  return structuredClone(DEFAULT_DATA)
}

function saveData(data: NotfallplanData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ─── Component ────────────────────────────────────────

export default function NotfallplanPage() {
  const [data, setData] = useState<NotfallplanData>(loadData)
  const { location } = useCitizenLocation()

  // Treffpunkt editing
  const [editMeeting, setEditMeeting] = useState(false)
  const [meetingForm, setMeetingForm] = useState<MeetingPoint>(data.meetingPoint)

  // Notes editing
  const [editNotes, setEditNotes] = useState(false)
  const [notesForm, setNotesForm] = useState(data.notes)

  // Contact modal
  const [showContactModal, setShowContactModal] = useState(false)
  const [editContactId, setEditContactId] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({ name: '', phone: '', relation: '' })

  // Persist on change
  useEffect(() => {
    saveData(data)
  }, [data])

  // ─── Handlers ───────────────────────────────────────

  const saveMeetingPoint = () => {
    setData((prev) => ({ ...prev, meetingPoint: meetingForm }))
    setEditMeeting(false)
  }

  const saveNotes = () => {
    setData((prev) => ({ ...prev, notes: notesForm }))
    setEditNotes(false)
  }

  const openAddContact = () => {
    setEditContactId(null)
    setContactForm({ name: '', phone: '', relation: '' })
    setShowContactModal(true)
  }

  const openEditContact = (contact: EmergencyContact) => {
    setEditContactId(contact.id)
    setContactForm({ name: contact.name, phone: contact.phone, relation: contact.relation })
    setShowContactModal(true)
  }

  const handleSaveContact = () => {
    if (!contactForm.name.trim()) return

    if (editContactId) {
      // Update existing
      setData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) =>
          c.id === editContactId
            ? { ...c, name: contactForm.name.trim(), phone: contactForm.phone.trim(), relation: contactForm.relation.trim() }
            : c
        ),
      }))
    } else {
      // Add new
      setData((prev) => ({
        ...prev,
        contacts: [
          ...prev.contacts,
          {
            id: generateId(),
            name: contactForm.name.trim(),
            phone: contactForm.phone.trim(),
            relation: contactForm.relation.trim(),
          },
        ],
      }))
    }
    setShowContactModal(false)
  }

  const deleteContact = (id: string) => {
    setData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
    }))
  }

  // ─── PDF Export ─────────────────────────────────────

  const handleExportPDF = useCallback(async () => {
    const { exportNotfallkartePDF } = await import('@/utils/notfallkarte-export')
    exportNotfallkartePDF({
      meetingPoint: data.meetingPoint,
      contacts: data.contacts,
      notes: data.notes,
      locationName: location?.districtName,
    })
  }, [data, location])

  const canExport = data.contacts.length > 0 || data.meetingPoint.primary

  // ─── Render ─────────────────────────────────────────

  const hasAnyData =
    data.contacts.length > 0 ||
    data.meetingPoint.primary ||
    data.notes

  return (
    <div>
      <PageHeader
        title="Persönlicher Notfallplan"
        description="Dein persönlicher Plan für den Ernstfall. Teile ihn mit deiner Familie."
        actions={
          <button
            onClick={handleExportPDF}
            disabled={!canExport}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            title={canExport ? 'PDF-Notfallkarte herunterladen' : 'Trage zuerst Treffpunkt oder Kontakte ein'}
          >
            <FileDown className="h-4 w-4" />
            PDF Notfallkarte
          </button>
        }
      />

      {/* Empty state hint */}
      {!hasAnyData && (
        <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            <strong>Tipp:</strong> Fülle deinen Notfallplan aus – trage Treffpunkte,
            Kontakte und wichtige Notizen ein. Im Ernstfall weißt du sofort, was zu tun ist.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Treffpunkt ─────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Treffpunkt</h2>
            </div>
            {editMeeting ? (
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditMeeting(false); setMeetingForm(data.meetingPoint) }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={saveMeetingPoint}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditMeeting(true); setMeetingForm(data.meetingPoint) }}
                className="text-text-muted transition-colors hover:text-text-primary"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>

          {editMeeting ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Haupt-Treffpunkt</label>
                <input
                  className={inputClass}
                  value={meetingForm.primary}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, primary: e.target.value }))}
                  placeholder="z. B. Spielplatz Musterstraße"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Adresse</label>
                <input
                  className={inputClass}
                  value={meetingForm.primaryAddress}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, primaryAddress: e.target.value }))}
                  placeholder="z. B. Musterstraße 12, 10115 Berlin"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Alternativer Treffpunkt</label>
                <input
                  className={inputClass}
                  value={meetingForm.alternative}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, alternative: e.target.value }))}
                  placeholder="z. B. Parkplatz Edeka, Hauptstr. 5"
                />
              </div>
            </div>
          ) : data.meetingPoint.primary ? (
            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="font-medium text-text-primary">{data.meetingPoint.primary}</p>
              {data.meetingPoint.primaryAddress && (
                <p className="mt-1 text-sm text-text-secondary">{data.meetingPoint.primaryAddress}</p>
              )}
              {data.meetingPoint.alternative && (
                <p className="mt-2 text-xs text-text-muted">
                  Alternativer Treffpunkt: {data.meetingPoint.alternative}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => { setEditMeeting(true); setMeetingForm(data.meetingPoint) }}
              className="w-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted hover:bg-surface-secondary/50 transition-colors"
            >
              <MapPin className="mx-auto mb-2 h-6 w-6" />
              Treffpunkt festlegen
            </button>
          )}
        </div>

        {/* ─── Notfallkontakte ────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Notfallkontakte</h2>
            </div>
            <button
              onClick={openAddContact}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" />
              Hinzufügen
            </button>
          </div>

          {data.contacts.length > 0 ? (
            <div className="space-y-3">
              {data.contacts.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center justify-between rounded-xl bg-surface-secondary p-3"
                >
                  <button
                    onClick={() => openEditContact(c)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    {c.relation && <p className="text-xs text-text-muted">{c.relation}</p>}
                  </button>
                  <div className="flex items-center gap-2">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {c.phone}
                      </a>
                    )}
                    <button
                      onClick={() => deleteContact(c.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-text-muted opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={openAddContact}
              className="w-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted hover:bg-surface-secondary/50 transition-colors"
            >
              <Phone className="mx-auto mb-2 h-6 w-6" />
              Ersten Kontakt hinzufügen
            </button>
          )}
        </div>

        {/* ─── Wichtige Nummern ────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Wichtige Nummern</h2>
          </div>
          <div className="space-y-2">
            {IMPORTANT_NUMBERS.map((n) => (
              <div key={n.number} className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
                <span className="text-sm text-text-primary">{n.name}</span>
                <a href={`tel:${n.number}`} className="text-sm font-bold text-red-500">
                  {n.number}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Notizen ────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Notizen</h2>
            </div>
            {editNotes ? (
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditNotes(false); setNotesForm(data.notes) }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={saveNotes}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditNotes(true); setNotesForm(data.notes) }}
                className="text-text-muted transition-colors hover:text-text-primary"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>

          {editNotes ? (
            <textarea
              className={textareaClass}
              rows={5}
              value={notesForm}
              onChange={(e) => setNotesForm(e.target.value)}
              placeholder="z. B. Gasabsperrhahn: Im Keller links. Sicherungskasten: Flur, oberer Schrank. Haustiere: Katze Mimi – Transportbox im Abstellraum."
              autoFocus
            />
          ) : data.notes ? (
            <div className="rounded-xl bg-surface-secondary p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {data.notes}
              </p>
            </div>
          ) : (
            <button
              onClick={() => { setEditNotes(true); setNotesForm('') }}
              className="w-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted hover:bg-surface-secondary/50 transition-colors"
            >
              <FileText className="mx-auto mb-2 h-6 w-6" />
              Notizen hinzufügen
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 rounded-xl bg-primary-50 p-4">
        <p className="text-xs leading-relaxed text-primary-700">
          <strong>Wichtig:</strong> Bespreche deinen Notfallplan mit allen Familienmitgliedern.
          Vereinbart Treffpunkte und stellt sicher, dass jeder die wichtigsten Nummern kennt.
          Dein Notfallplan wird lokal auf diesem Gerät gespeichert.
        </p>
      </div>

      {/* ─── Contact Modal ──────────────────────────────── */}
      <Modal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={editContactId ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}
        size="sm"
      >
        <FormField label="Name" required>
          <input
            className={inputClass}
            value={contactForm.name}
            onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="z. B. Maria Mustermann"
            autoFocus
          />
        </FormField>
        <FormField label="Telefonnummer">
          <input
            className={inputClass}
            type="tel"
            value={contactForm.phone}
            onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="z. B. +49 170 1234567"
          />
        </FormField>
        <FormField label="Beziehung">
          <input
            className={inputClass}
            value={contactForm.relation}
            onChange={(e) => setContactForm((p) => ({ ...p, relation: e.target.value }))}
            placeholder="z. B. Partnerin, Bruder, Hausarzt"
          />
        </FormField>
        <ModalFooter
          onCancel={() => setShowContactModal(false)}
          onSubmit={handleSaveContact}
          submitLabel={editContactId ? 'Speichern' : 'Hinzufügen'}
          disabled={!contactForm.name.trim()}
        />
      </Modal>
    </div>
  )
}
