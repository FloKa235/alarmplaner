/**
 * NachbarschaftPage — Nachbarschafts-Netzwerk
 *
 * Opt-in Community-Feature: Nachbarn finden, Skills teilen,
 * Hilfe anbieten/suchen im Krisenfall.
 * Koordinaten werden auf ~500m gerundet (Datenschutz).
 */
import { useState, useCallback } from 'react'
import {
  Users, UserPlus, MapPin, Shield, Loader2, CheckCircle2,
  PlusCircle, HandHelping, Search, X, Settings2,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useNeighborhood, SKILLS, RESOURCES, REQUEST_CATEGORIES } from '@/hooks/useNeighborhood'
import { useCitizenLocation } from '@/hooks/useCitizenLocation'

// ─── Types ──────────────────────────────────────────────

type ViewState = 'main' | 'create-profile' | 'edit-profile' | 'create-request'

// ─── Component ──────────────────────────────────────────

export default function NachbarschaftPage() {
  const { location } = useCitizenLocation()
  const {
    myProfile,
    profileLoading,
    createProfile,
    updateProfile,
    neighbors,
    neighborsLoading,
    refreshNeighbors,
    requests,
    requestsLoading,
    createRequest,
    resolveRequest,
  } = useNeighborhood()

  const [view, setView] = useState<ViewState>('main')
  const [saving, setSaving] = useState(false)

  // Profile form
  const [formName, setFormName] = useState('')
  const [formSkills, setFormSkills] = useState<string[]>([])
  const [formResources, setFormResources] = useState<string[]>([])

  // Request form
  const [reqType, setReqType] = useState<'offer' | 'request'>('request')
  const [reqTitle, setReqTitle] = useState('')
  const [reqDescription, setReqDescription] = useState('')
  const [reqCategory, setReqCategory] = useState('sonstiges')

  // ─── Handlers ───────────────────────────────────────

  const toggleSkill = (id: string) => {
    setFormSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const toggleResource = (id: string) => {
    setFormResources(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const handleCreateProfile = useCallback(async () => {
    if (!formName.trim()) return
    setSaving(true)
    const success = await createProfile(formName, formSkills, formResources)
    setSaving(false)
    if (success) {
      setView('main')
    }
  }, [formName, formSkills, formResources, createProfile])

  const handleUpdateProfile = useCallback(async () => {
    if (!formName.trim()) return
    setSaving(true)
    const success = await updateProfile({
      display_name: formName.trim(),
      skills: formSkills,
      resources: formResources,
    })
    setSaving(false)
    if (success) {
      setView('main')
    }
  }, [formName, formSkills, formResources, updateProfile])

  const handleCreateRequest = useCallback(async () => {
    if (!reqTitle.trim()) return
    setSaving(true)
    const success = await createRequest({
      type: reqType,
      title: reqTitle.trim(),
      description: reqDescription.trim() || null,
      category: reqCategory,
    })
    setSaving(false)
    if (success) {
      setReqTitle('')
      setReqDescription('')
      setReqCategory('sonstiges')
      setView('main')
    }
  }, [reqType, reqTitle, reqDescription, reqCategory, createRequest])

  const openEditProfile = () => {
    if (myProfile) {
      setFormName(myProfile.display_name)
      setFormSkills([...(myProfile.skills || [])])
      setFormResources([...(myProfile.resources || [])])
    }
    setView('edit-profile')
  }

  const handleToggleActive = useCallback(async () => {
    if (!myProfile) return
    await updateProfile({ is_active: !myProfile.is_active })
  }, [myProfile, updateProfile])

  // ─── Loading ──────────────────────────────────────

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // ─── Create Request Form ──────────────────────────

  if (view === 'create-request') {
    return (
      <div>
        <button
          onClick={() => setView('main')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <X className="h-4 w-4" />
          Abbrechen
        </button>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-6 text-lg font-bold text-text-primary">
            {reqType === 'offer' ? 'Hilfe anbieten' : 'Hilfe suchen'}
          </h2>

          {/* Type Toggle */}
          <div className="mb-5 flex gap-2">
            <button
              onClick={() => setReqType('request')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                reqType === 'request'
                  ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
              }`}
            >
              Ich brauche Hilfe
            </button>
            <button
              onClick={() => setReqType('offer')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                reqType === 'offer'
                  ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
              }`}
            >
              Ich biete Hilfe
            </button>
          </div>

          {/* Category */}
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Kategorie</label>
          <div className="mb-5 flex flex-wrap gap-2">
            {REQUEST_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setReqCategory(cat.id)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  reqCategory === cat.id
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Titel *</label>
          <input
            type="text"
            value={reqTitle}
            onChange={e => setReqTitle(e.target.value)}
            placeholder={reqType === 'offer' ? 'z.B. Kann Powerbank verleihen' : 'z.B. Brauche Trinkwasser'}
            className="mb-4 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />

          {/* Description */}
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Beschreibung (optional)</label>
          <textarea
            value={reqDescription}
            onChange={e => setReqDescription(e.target.value)}
            placeholder="Weitere Details..."
            rows={3}
            className="mb-6 w-full resize-none rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />

          <button
            onClick={handleCreateRequest}
            disabled={saving || !reqTitle.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Veröffentlichen
          </button>
        </div>
      </div>
    )
  }

  // ─── Profile Form (Create/Edit) ───────────────────

  if (view === 'create-profile' || view === 'edit-profile') {
    const isEdit = view === 'edit-profile'
    return (
      <div>
        <button
          onClick={() => setView('main')}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <X className="h-4 w-4" />
          Abbrechen
        </button>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-6 text-lg font-bold text-text-primary">
            {isEdit ? 'Profil bearbeiten' : 'Nachbarschafts-Profil erstellen'}
          </h2>

          {/* Name */}
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Vorname *</label>
          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="Nur dein Vorname"
            className="mb-5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />

          {/* Location hint */}
          {location && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Standort: <strong>{location.districtName || 'Erkannt'}</strong> (auf ~500m gerundet)
              </span>
            </div>
          )}

          {!location && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                Bitte zuerst in den Einstellungen deinen Standort festlegen.
              </span>
            </div>
          )}

          {/* Skills */}
          <label className="mb-2 block text-sm font-medium text-text-primary">Meine Fähigkeiten</label>
          <div className="mb-5 flex flex-wrap gap-2">
            {SKILLS.map(skill => (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  formSkills.includes(skill.id)
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
                }`}
              >
                {skill.emoji} {skill.label}
              </button>
            ))}
          </div>

          {/* Resources */}
          <label className="mb-2 block text-sm font-medium text-text-primary">Meine Ressourcen</label>
          <div className="mb-6 flex flex-wrap gap-2">
            {RESOURCES.map(res => (
              <button
                key={res.id}
                onClick={() => toggleResource(res.id)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  formResources.includes(res.id)
                    ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80'
                }`}
              >
                {res.emoji} {res.label}
              </button>
            ))}
          </div>

          {/* Privacy notice */}
          <div className="mb-6 flex items-start gap-2 rounded-xl bg-surface-secondary px-4 py-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
            <p className="text-xs text-text-secondary">
              Nur dein Vorname und ungefährer Standort (~500m) sind für andere Nachbarn sichtbar.
              Du kannst dein Profil jederzeit deaktivieren.
            </p>
          </div>

          <button
            onClick={isEdit ? handleUpdateProfile : handleCreateProfile}
            disabled={saving || !formName.trim() || !location}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isEdit ? 'Profil speichern' : 'Profil erstellen'}
          </button>
        </div>
      </div>
    )
  }

  // ─── No Profile: Onboarding ───────────────────────

  if (!myProfile) {
    return (
      <div>
        <PageHeader
          title="Nachbarschafts-Netzwerk"
          description="Vernetze dich mit deinen Nachbarn für den Krisenfall."
        />

        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
            <Users className="h-8 w-8 text-primary-600" />
          </div>

          <h3 className="mb-2 text-lg font-bold text-text-primary">
            Gemeinsam besser vorbereitet
          </h3>
          <p className="mb-6 text-sm text-text-secondary">
            Im Krisenfall zählt jede helfende Hand. Zeige deinen Nachbarn, welche Fähigkeiten und
            Ressourcen du einbringen kannst — und finde heraus, wer in deiner Nähe helfen kann.
          </p>

          <div className="mb-6 space-y-3 text-left">
            {[
              { emoji: '\u{1F50D}', text: 'Finde Nachbarn mit nützlichen Fähigkeiten' },
              { emoji: '\u{1F91D}', text: 'Biete Hilfe an oder frage nach Unterstützung' },
              { emoji: '\u{1F512}', text: 'Nur Vorname + ~500m Standort sichtbar' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-secondary px-4 py-3">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm font-medium text-text-primary">{item.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setFormName('')
              setFormSkills([])
              setFormResources([])
              setView('create-profile')
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <UserPlus className="h-4 w-4" />
            Mitmachen
          </button>
        </div>
      </div>
    )
  }

  // ─── Main View (with profile) ─────────────────────

  const mySkillLabels = (myProfile.skills || [])
    .map(id => SKILLS.find(s => s.id === id))
    .filter(Boolean)

  const myResourceLabels = (myProfile.resources || [])
    .map(id => RESOURCES.find(r => r.id === id))
    .filter(Boolean)

  return (
    <div>
      <PageHeader
        title="Nachbarschafts-Netzwerk"
        description="Vernetze dich mit deinen Nachbarn für den Krisenfall."
        actions={
          <button
            onClick={openEditProfile}
            className="flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary/80"
          >
            <Settings2 className="h-4 w-4" />
            Profil
          </button>
        }
      />

      {/* My Profile Summary */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{myProfile.display_name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {mySkillLabels.map(s => s && (
                  <span key={s.id} className="text-xs" title={s.label}>{s.emoji}</span>
                ))}
                {myResourceLabels.map(r => r && (
                  <span key={r.id} className="text-xs" title={r.label}>{r.emoji}</span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleActive}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              myProfile.is_active
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {myProfile.is_active ? 'Aktiv' : 'Inaktiv'}
          </button>
        </div>
      </div>

      {/* Neighbors Section */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">
            {neighborsLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Nachbarn laden...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                {neighbors.length} {neighbors.length === 1 ? 'Nachbar' : 'Nachbarn'} im Umkreis
              </span>
            )}
          </h2>
          <button
            onClick={refreshNeighbors}
            disabled={neighborsLoading}
            className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 disabled:opacity-40"
          >
            Aktualisieren
          </button>
        </div>

        {neighbors.length === 0 && !neighborsLoading ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-secondary/50 p-8 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">
              Noch keine Nachbarn in deiner Nähe gefunden.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Lade andere ein, sich im Nachbarschafts-Netzwerk anzumelden!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {neighbors.map(neighbor => {
              const skillItems = (neighbor.skills || [])
                .map(id => SKILLS.find(s => s.id === id))
                .filter(Boolean)
              const resourceItems = (neighbor.resources || [])
                .map(id => RESOURCES.find(r => r.id === id))
                .filter(Boolean)

              return (
                <div
                  key={neighbor.id}
                  className="rounded-2xl border border-border bg-white p-4 transition-all hover:border-primary-200 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary">{neighbor.display_name}</span>
                    <span className="text-xs text-text-muted">
                      ~{neighbor.distance < 1 ? `${Math.round(neighbor.distance * 1000)}m` : `${neighbor.distance.toFixed(1)} km`}
                    </span>
                  </div>

                  {/* Skills */}
                  {skillItems.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1">
                      {skillItems.map(s => s && (
                        <span
                          key={s.id}
                          className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
                          title={s.label}
                        >
                          {s.emoji} {s.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Resources */}
                  {resourceItems.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {resourceItems.map(r => r && (
                        <span
                          key={r.id}
                          className="rounded-lg bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                          title={r.label}
                        >
                          {r.emoji} {r.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {skillItems.length === 0 && resourceItems.length === 0 && (
                    <p className="text-xs text-text-muted">Keine Angaben</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Requests Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <HandHelping className="h-4 w-4 text-amber-600" />
            Hilfe-Anfragen & Angebote
          </h2>
          <button
            onClick={() => {
              setReqTitle('')
              setReqDescription('')
              setReqCategory('sonstiges')
              setReqType('request')
              setView('create-request')
            }}
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Neu
          </button>
        </div>

        {requestsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-secondary/50 p-8 text-center">
            <HandHelping className="mx-auto mb-2 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Keine aktiven Anfragen oder Angebote.</p>
            <p className="mt-1 text-xs text-text-muted">Erstelle eine Hilfe-Anfrage oder ein Angebot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map(req => {
              const cat = REQUEST_CATEGORIES.find(c => c.id === req.category)
              const isOwn = req.profile_id === myProfile.id
              const neighbor = neighbors.find(n => n.id === req.profile_id)
              const authorName = isOwn ? myProfile.display_name : neighbor?.display_name || 'Nachbar'

              return (
                <div
                  key={req.id}
                  className={`rounded-2xl border bg-white p-4 ${
                    req.type === 'offer'
                      ? 'border-green-200'
                      : 'border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                          req.type === 'offer'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {req.type === 'offer' ? 'Bietet' : 'Sucht'}
                        </span>
                        {cat && (
                          <span className="text-xs text-text-muted">{cat.emoji} {cat.label}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-text-primary">{req.title}</p>
                      {req.description && (
                        <p className="mt-0.5 text-xs text-text-secondary">{req.description}</p>
                      )}
                      <p className="mt-1.5 text-xs text-text-muted">
                        {authorName}
                        {neighbor && ` · ~${neighbor.distance < 1 ? `${Math.round(neighbor.distance * 1000)}m` : `${neighbor.distance.toFixed(1)} km`}`}
                        {' · '}
                        {new Date(req.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {isOwn && (
                      <button
                        onClick={() => resolveRequest(req.id)}
                        className="shrink-0 rounded-xl bg-surface-secondary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary/80"
                        title="Als erledigt markieren"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
