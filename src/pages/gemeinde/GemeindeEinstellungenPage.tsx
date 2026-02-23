import { useState } from 'react'
import { Settings, User, Building2, LogOut, Loader2, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import { inputClass } from '@/components/ui/Modal'
import { useMembership } from '@/hooks/useMembership'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function GemeindeEinstellungenPage() {
  const navigate = useNavigate()
  const { municipality, districtId, membership } = useMembership()
  const { displayName, email, signOut } = useAuth()

  const [profileForm, setProfileForm] = useState({
    display_name: displayName || '',
  })
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: profileForm.display_name.trim() },
      })
      if (error) throw error
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Profil speichern:', err)
      alert('Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // District name laden
  const [districtName, setDistrictName] = useState<string>('')
  if (districtId && !districtName) {
    supabase.from('districts').select('name').eq('id', districtId).single().then(({ data }) => {
      if (data) setDistrictName(data.name)
    })
  }

  return (
    <div>
      <PageHeader
        title="Einstellungen"
        description="Profil und Gemeinde-Informationen."
      />

      <div className="space-y-6">
        {/* Gemeinde-Info (read-only) */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Ihre Gemeinde</h2>
              <p className="text-sm text-text-secondary">Diese Informationen werden vom Landkreis-Admin verwaltet.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Gemeinde</label>
              <p className="text-sm font-medium text-text-primary">{municipality?.name || '–'}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Landkreis</label>
              <p className="text-sm font-medium text-text-primary">{districtName || '–'}</p>
            </div>
            {municipality?.population && (
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Einwohner</label>
                <p className="text-sm font-medium text-text-primary">{municipality.population.toLocaleString('de-DE')}</p>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Rolle</label>
              <p className="text-sm font-medium text-text-primary">
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Bürgermeister/in
                </span>
              </p>
            </div>
            {membership?.activated_at && (
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Mitglied seit</label>
                <p className="text-sm font-medium text-text-primary">
                  {new Date(membership.activated_at).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Profil bearbeiten */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Benutzer-Profil</h2>
              <p className="text-sm text-text-secondary">Ihre persönlichen Daten.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Anzeigename</label>
              <input
                type="text"
                value={profileForm.display_name}
                onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                className={inputClass}
                placeholder="Ihr Name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">E-Mail</label>
              <input
                type="email"
                value={email || ''}
                disabled
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Speichern
            </button>
            {saveSuccess && (
              <span className="text-sm text-green-600">Gespeichert!</span>
            )}
          </div>
        </div>

        {/* System */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">System</h2>
              <p className="text-sm text-text-secondary">Sitzung und Kontoeinstellungen.</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  )
}
