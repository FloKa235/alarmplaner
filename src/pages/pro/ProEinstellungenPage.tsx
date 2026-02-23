import { useState, useEffect, useMemo } from 'react'
import { Settings, Building2, Bell, User, Save, Loader2, LogOut, CheckCircle2, Info, Users, Plus, Mail, Trash2, XCircle } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { inputClass } from '@/components/ui/Modal'
import { useDistrict } from '@/hooks/useDistrict'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import Badge from '@/components/ui/Badge'
import type { DbDistrictMember, DbMunicipality } from '@/types/database'

export default function ProEinstellungenPage() {
  const { district, districtId, refetch: refetchDistrict } = useDistrict()
  const { user, displayName, email, signOut } = useAuth()

  // ── District Edit State ──
  const [editingDistrict, setEditingDistrict] = useState(false)
  const [savingDistrict, setSavingDistrict] = useState(false)
  const [districtForm, setDistrictForm] = useState({
    population: '',
    area_km2: '',
    latitude: '',
    longitude: '',
  })
  const [districtSaved, setDistrictSaved] = useState(false)

  // ── Profile Edit State ──
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '' })
  const [profileSaved, setProfileSaved] = useState(false)

  // ── Benutzer-Verwaltung ──
  const { data: members, refetch: refetchMembers } = useSupabaseQuery<DbDistrictMember>(
    (sb) => sb.from('district_members').select('*').eq('district_id', districtId!).order('created_at', { ascending: false }),
    [districtId]
  )
  const { data: municipalities } = useSupabaseQuery<DbMunicipality>(
    (sb) => sb.from('municipalities').select('*').eq('district_id', districtId!).order('name'),
    [districtId]
  )

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'buergermeister' | 'admin'>('buergermeister')
  const [inviteMunicipalityId, setInviteMunicipalityId] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  // Gemeinden die noch keinen Bürgermeister haben
  const availableMunicipalities = useMemo(() => {
    const assignedMuniIds = new Set(
      members
        .filter(m => m.role === 'buergermeister' && m.status !== 'disabled')
        .map(m => m.municipality_id)
        .filter(Boolean)
    )
    return municipalities.filter(m => !assignedMuniIds.has(m.id))
  }, [members, municipalities])

  // Setze erste verfügbare Gemeinde als Default
  useEffect(() => {
    if (inviteRole === 'buergermeister' && availableMunicipalities.length > 0 && !inviteMunicipalityId) {
      setInviteMunicipalityId(availableMunicipalities[0].id)
    }
  }, [inviteRole, availableMunicipalities, inviteMunicipalityId])

  // ── Open District Edit ──
  const openDistrictEdit = () => {
    if (!district) return
    setDistrictForm({
      population: district.population?.toString() || '',
      area_km2: district.area_km2?.toString() || '',
      latitude: district.latitude?.toString() || '',
      longitude: district.longitude?.toString() || '',
    })
    setEditingDistrict(true)
    setDistrictSaved(false)
  }

  // ── Save District ──
  const saveDistrict = async () => {
    if (!district) return
    setSavingDistrict(true)
    try {
      const { error } = await supabase
        .from('districts')
        .update({
          population: parseInt(districtForm.population, 10) || district.population,
          area_km2: parseFloat(districtForm.area_km2) || district.area_km2,
          latitude: districtForm.latitude ? parseFloat(districtForm.latitude) : null,
          longitude: districtForm.longitude ? parseFloat(districtForm.longitude) : null,
        })
        .eq('id', district.id)

      if (error) throw error
      refetchDistrict()
      setEditingDistrict(false)
      setDistrictSaved(true)
      setTimeout(() => setDistrictSaved(false), 3000)
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      alert('Fehler beim Speichern der Landkreis-Daten.')
    } finally {
      setSavingDistrict(false)
    }
  }

  // ── Open Profile Edit ──
  const openProfileEdit = () => {
    setProfileForm({ name: displayName || '' })
    setEditingProfile(true)
    setProfileSaved(false)
  }

  // ── Save Profile ──
  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: profileForm.name.trim() },
      })
      if (error) throw error
      setEditingProfile(false)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      alert('Fehler beim Speichern des Profils.')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Einladen ──
  const handleInvite = async () => {
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Nicht angemeldet')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole,
            municipality_id: inviteRole === 'buergermeister' ? inviteMunicipalityId : undefined,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Einladen')
      }

      setInviteSuccess(result.message || `Einladung an ${inviteEmail} gesendet.`)
      setInviteEmail('')
      setShowInviteForm(false)
      refetchMembers()
      setTimeout(() => setInviteSuccess(null), 5000)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setInviting(false)
    }
  }

  // ── Mitglied deaktivieren ──
  const handleDisableMember = async (memberId: string) => {
    if (!confirm('Möchten Sie diesen Benutzer wirklich deaktivieren?')) return

    try {
      const { error } = await supabase
        .from('district_members')
        .update({ status: 'disabled' })
        .eq('id', memberId)

      if (error) throw error
      refetchMembers()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Deaktivieren des Benutzers.')
    }
  }

  // ── Einladung zurücknehmen ──
  const handleDeleteInvite = async (memberId: string) => {
    if (!confirm('Möchten Sie diese Einladung wirklich zurücknehmen?')) return

    try {
      const { error } = await supabase
        .from('district_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      refetchMembers()
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Löschen der Einladung.')
    }
  }

  // Gemeinde-Name-Lookup
  const getMunicipalityName = (muniId: string | null) => {
    if (!muniId) return null
    return municipalities.find(m => m.id === muniId)?.name || 'Unbekannt'
  }

  return (
    <div>
      <PageHeader title="Einstellungen" description="Landkreis-Profil, Benutzer-Account und System-Konfiguration." />

      <div className="space-y-6">
        {/* ── Organisation / Landkreis ── */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-text-primary">Organisation</h2>
                <p className="text-sm text-text-secondary">Landkreis-Daten und Koordinaten</p>
              </div>
            </div>
            {districtSaved && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Gespeichert
              </Badge>
            )}
            {!editingDistrict && (
              <button
                onClick={openDistrictEdit}
                className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
              >
                <Settings className="h-3.5 w-3.5" />
                Bearbeiten
              </button>
            )}
          </div>

          {district ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Landkreis-Name</label>
                <input
                  type="text"
                  value={district.name}
                  readOnly
                  className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Bundesland</label>
                <input
                  type="text"
                  value={district.state}
                  readOnly
                  className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Einwohner</label>
                {editingDistrict ? (
                  <input
                    type="number"
                    value={districtForm.population}
                    onChange={(e) => setDistrictForm({ ...districtForm, population: e.target.value })}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="text"
                    value={district.population?.toLocaleString('de-DE') || '–'}
                    readOnly
                    className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Fläche (km²)</label>
                {editingDistrict ? (
                  <input
                    type="number"
                    step="0.01"
                    value={districtForm.area_km2}
                    onChange={(e) => setDistrictForm({ ...districtForm, area_km2: e.target.value })}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="text"
                    value={district.area_km2 ? `${Number(district.area_km2).toLocaleString('de-DE')} km²` : '–'}
                    readOnly
                    className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Breitengrad</label>
                {editingDistrict ? (
                  <input
                    type="number"
                    step="0.000001"
                    value={districtForm.latitude}
                    onChange={(e) => setDistrictForm({ ...districtForm, latitude: e.target.value })}
                    className={inputClass}
                    placeholder="z.B. 51.7575"
                  />
                ) : (
                  <input
                    type="text"
                    value={district.latitude ?? '–'}
                    readOnly
                    className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Längengrad</label>
                {editingDistrict ? (
                  <input
                    type="number"
                    step="0.000001"
                    value={districtForm.longitude}
                    onChange={(e) => setDistrictForm({ ...districtForm, longitude: e.target.value })}
                    className={inputClass}
                    placeholder="z.B. 10.7865"
                  />
                ) : (
                  <input
                    type="text"
                    value={district.longitude ?? '–'}
                    readOnly
                    className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
                  />
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Kein Landkreis konfiguriert.</p>
          )}

          {editingDistrict && (
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingDistrict(false)}
                disabled={savingDistrict}
                className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Abbrechen
              </button>
              <button
                onClick={saveDistrict}
                disabled={savingDistrict}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {savingDistrict ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Speichern
              </button>
            </div>
          )}

          {/* Auto-Refresh Info */}
          {district?.last_auto_refresh && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
              <Info className="h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-xs text-blue-800">
                Letzte automatische Aktualisierung: {new Date(district.last_auto_refresh).toLocaleString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* ── Benutzer-Profil ── */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-text-primary">Benutzer-Profil</h2>
                <p className="text-sm text-text-secondary">Account und Anzeigename</p>
              </div>
            </div>
            {profileSaved && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Gespeichert
              </Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">E-Mail</label>
              <input
                type="text"
                value={email || '–'}
                readOnly
                className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Anzeigename</label>
              {editingProfile ? (
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ name: e.target.value })}
                  className={inputClass}
                  placeholder="Ihr Name"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={displayName || '–'}
                    readOnly
                    className="flex-1 rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary"
                  />
                  <button
                    onClick={openProfileEdit}
                    className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
                  >
                    Ändern
                  </button>
                </div>
              )}
            </div>
          </div>

          {editingProfile && (
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditingProfile(false)}
                disabled={savingProfile}
                className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Abbrechen
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile || !profileForm.name.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Speichern
              </button>
            </div>
          )}

          <div className="mt-4 text-xs text-text-muted">
            User-ID: <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px]">{user?.id || '–'}</code>
          </div>
        </div>

        {/* ── Benutzer-Verwaltung (NEU) ── */}
        {districtId && (
          <div className="rounded-2xl border border-border bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-text-primary">Benutzer-Verwaltung</h2>
                  <p className="text-sm text-text-secondary">Bürgermeister und weitere Admins einladen</p>
                </div>
              </div>
              {inviteSuccess && (
                <Badge variant="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {inviteSuccess}
                </Badge>
              )}
              {!showInviteForm && (
                <button
                  onClick={() => { setShowInviteForm(true); setInviteError(null); setInviteSuccess(null) }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Einladen
                </button>
              )}
            </div>

            {/* Einladungs-Formular */}
            {showInviteForm && (
              <div className="mb-5 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-text-primary">Neuen Benutzer einladen</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">E-Mail-Adresse</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="buergermeister@gemeinde.de"
                        className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">Rolle</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => { setInviteRole(e.target.value as 'buergermeister' | 'admin'); setInviteMunicipalityId('') }}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                    >
                      <option value="buergermeister">Bürgermeister/in</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {inviteRole === 'buergermeister' && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-text-secondary">Gemeinde</label>
                      {availableMunicipalities.length > 0 ? (
                        <select
                          value={inviteMunicipalityId}
                          onChange={(e) => setInviteMunicipalityId(e.target.value)}
                          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                        >
                          {availableMunicipalities.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.population?.toLocaleString('de-DE')} Einw.)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          Alle Gemeinden haben bereits einen zugewiesenen Bürgermeister.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {inviteError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {inviteError}
                  </div>
                )}

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => { setShowInviteForm(false); setInviteEmail(''); setInviteError(null) }}
                    className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim() || (inviteRole === 'buergermeister' && !inviteMunicipalityId)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    Einladung senden
                  </button>
                </div>
              </div>
            )}

            {/* Mitglieder-Liste */}
            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl bg-surface-secondary p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-text-primary">
                        {(member.invited_email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {member.invited_email}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted">
                            {member.role === 'buergermeister' ? 'Bürgermeister/in' : 'Administrator'}
                          </span>
                          {member.municipality_id && (
                            <span className="text-xs text-text-muted">
                              · {getMunicipalityName(member.municipality_id)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.status === 'invited' && (
                        <>
                          <Badge variant="warning">Eingeladen</Badge>
                          <button
                            onClick={() => handleDeleteInvite(member.id)}
                            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Einladung zurücknehmen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {member.status === 'active' && (
                        <>
                          <Badge variant="success">Aktiv</Badge>
                          <button
                            onClick={() => handleDisableMember(member.id)}
                            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Deaktivieren"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {member.status === 'disabled' && (
                        <Badge variant="default">Deaktiviert</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-surface-secondary p-6 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                <p className="text-sm text-text-secondary">
                  Noch keine Benutzer eingeladen. Laden Sie Bürgermeister Ihrer Gemeinden ein.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── System-Info ── */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">System</h2>
              <p className="text-sm text-text-secondary">Automatische Aktualisierungen und Status</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Auto-Refresh (Warnungen + Risikoanalyse)</p>
                <p className="text-xs text-text-muted">Täglich um 06:00 und 14:00 Uhr</p>
              </div>
              <Badge variant="success">Aktiv</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">KI-Analyse (Langdock EU)</p>
                <p className="text-xs text-text-muted">DSGVO-konform, Server in der EU</p>
              </div>
              <Badge variant="success">Verbunden</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Warndaten (NINA, DWD, Pegelonline)</p>
                <p className="text-xs text-text-muted">Offizielle Bundes-APIs</p>
              </div>
              <Badge variant="success">Verbunden</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">E-Mail-Alarmierung (Resend)</p>
                <p className="text-xs text-text-muted">Für Alarmierungs-Feature benötigt</p>
              </div>
              <Badge variant="default">Ausstehend</Badge>
            </div>
          </div>
        </div>

        {/* ── Abmelden ── */}
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-text-primary">Abmelden</h2>
              <p className="text-sm text-text-secondary">Von Ihrem Alarmplaner-Account abmelden.</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
