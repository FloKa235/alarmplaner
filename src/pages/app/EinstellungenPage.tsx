import { useState } from 'react'
import { MapPin, Bell, User, Shield, LogOut, Loader2, CheckCircle2, Users, Plus, Minus, PawPrint, Baby, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useCitizenLocation, type CitizenLocation } from '@/hooks/useCitizenLocation'
import { useCitizenHousehold } from '@/hooks/useCitizenHousehold'
import { germanDistricts } from '@/data/german-districts'

type NotifSetting = 'push' | 'email' | 'severe_only'

export default function EinstellungenPage() {
  const { user, displayName, email, signOut } = useAuth()
  const { location, saveLocation } = useCitizenLocation()
  const { household, saveHousehold } = useCitizenHousehold()
  const navigate = useNavigate()

  const [savingHousehold, setSavingHousehold] = useState(false)
  const [householdSaved, setHouseholdSaved] = useState(false)

  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState<typeof germanDistricts[0] | null>(null)
  const [savingLocation, setSavingLocation] = useState(false)
  const [locationSaved, setLocationSaved] = useState(false)

  // Notification settings (localStorage, UI only for now)
  const [notifSettings, setNotifSettings] = useState<Record<NotifSetting, boolean>>(() => {
    try {
      const raw = localStorage.getItem('alarmplaner-notif-settings')
      return raw ? JSON.parse(raw) : { push: true, email: false, severe_only: false }
    } catch {
      return { push: true, email: false, severe_only: false }
    }
  })

  const toggleNotif = (key: NotifSetting) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] }
    setNotifSettings(updated)
    localStorage.setItem('alarmplaner-notif-settings', JSON.stringify(updated))
  }

  const filteredDistricts = locationQuery.trim()
    ? germanDistricts
        .filter(d => d.name.toLowerCase().includes(locationQuery.toLowerCase()) || d.state.toLowerCase().includes(locationQuery.toLowerCase()))
        .slice(0, 15)
    : germanDistricts.slice(0, 15)

  const handleSaveLocation = async () => {
    if (!selectedDistrict) return
    setSavingLocation(true)
    const loc: CitizenLocation = {
      districtName: selectedDistrict.name,
      districtAgs: selectedDistrict.agsCode,
      warncellId: selectedDistrict.warncellId,
      lat: selectedDistrict.lat,
      lng: selectedDistrict.lng,
    }
    const success = await saveLocation(loc)
    setSavingLocation(false)
    if (success) {
      setLocationSaved(true)
      setTimeout(() => {
        setShowLocationPicker(false)
        setLocationSaved(false)
        setSelectedDistrict(null)
        setLocationQuery('')
      }, 1200)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div>
      <PageHeader title="Einstellungen" description="Verwalte deinen Standort, Benachrichtigungen und dein Profil." />

      <div className="space-y-6">
        {/* Standort */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Standort</h2>
              <p className="text-sm text-text-secondary">Dein Standort für lokale Warnungen</p>
            </div>
          </div>

          {location ? (
            <div className="rounded-xl bg-surface-secondary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{location.districtName}</p>
                  <p className="text-xs text-text-muted">AGS: {location.districtAgs} · Warncell: {location.warncellId}</p>
                </div>
                <button
                  onClick={() => setShowLocationPicker(!showLocationPicker)}
                  className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Standort ändern
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">Kein Standort eingerichtet</p>
              <p className="mt-1 text-xs text-amber-600">Wähle deinen Landkreis, um lokale Warnungen zu erhalten.</p>
              <button
                onClick={() => setShowLocationPicker(true)}
                className="mt-3 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Standort festlegen
              </button>
            </div>
          )}

          {/* Inline Location Picker */}
          {showLocationPicker && (
            <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50/30 p-4">
              <p className="mb-3 text-sm font-medium text-text-primary">Landkreis suchen:</p>
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => { setLocationQuery(e.target.value); setSelectedDistrict(null) }}
                placeholder="Landkreis oder Stadt suchen..."
                autoFocus
                className="mb-3 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
              <div className="max-h-[200px] overflow-y-auto">
                {filteredDistricts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-text-muted">Kein Landkreis gefunden.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredDistricts.map((d) => (
                      <button
                        key={d.agsCode}
                        onClick={() => setSelectedDistrict(d)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                          selectedDistrict?.agsCode === d.agsCode
                            ? 'bg-primary-100 text-primary-700'
                            : 'hover:bg-white'
                        }`}
                      >
                        <MapPin className={`h-3.5 w-3.5 shrink-0 ${
                          selectedDistrict?.agsCode === d.agsCode ? 'text-primary-600' : 'text-text-muted'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-text-muted">{d.state} · {d.population.toLocaleString('de-DE')} Einwohner</p>
                        </div>
                        {selectedDistrict?.agsCode === d.agsCode && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSaveLocation}
                  disabled={!selectedDistrict || savingLocation}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingLocation ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Speichern...</>
                  ) : locationSaved ? (
                    <><CheckCircle2 className="h-4 w-4" /> Gespeichert!</>
                  ) : (
                    'Speichern'
                  )}
                </button>
                <button
                  onClick={() => { setShowLocationPicker(false); setSelectedDistrict(null); setLocationQuery('') }}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Haushalt */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Haushalt</h2>
              <p className="text-sm text-text-secondary">Deine Vorratsliste basiert auf diesen Angaben</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Personen */}
            <div className="rounded-xl bg-surface-secondary p-4">
              <div className="mb-2 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Personen im Haushalt</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (household.household_persons <= 1) return
                    setSavingHousehold(true)
                    await saveHousehold({ household_persons: household.household_persons - 1 })
                    setSavingHousehold(false)
                    setHouseholdSaved(true)
                    setTimeout(() => setHouseholdSaved(false), 1500)
                  }}
                  disabled={household.household_persons <= 1 || savingHousehold}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2.5rem] text-center text-lg font-bold text-text-primary">
                  {household.household_persons}
                </span>
                <button
                  onClick={async () => {
                    if (household.household_persons >= 20) return
                    setSavingHousehold(true)
                    await saveHousehold({ household_persons: household.household_persons + 1 })
                    setSavingHousehold(false)
                    setHouseholdSaved(true)
                    setTimeout(() => setHouseholdSaved(false), 1500)
                  }}
                  disabled={household.household_persons >= 20 || savingHousehold}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Babys */}
            <div className="rounded-xl bg-surface-secondary p-4">
              <div className="mb-2 flex items-center gap-2">
                <Baby className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Babys / Kleinkinder</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (household.household_babies <= 0) return
                    setSavingHousehold(true)
                    await saveHousehold({ household_babies: household.household_babies - 1 })
                    setSavingHousehold(false)
                    setHouseholdSaved(true)
                    setTimeout(() => setHouseholdSaved(false), 1500)
                  }}
                  disabled={household.household_babies <= 0 || savingHousehold}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2.5rem] text-center text-lg font-bold text-text-primary">
                  {household.household_babies}
                </span>
                <button
                  onClick={async () => {
                    if (household.household_babies >= 10) return
                    setSavingHousehold(true)
                    await saveHousehold({ household_babies: household.household_babies + 1 })
                    setSavingHousehold(false)
                    setHouseholdSaved(true)
                    setTimeout(() => setHouseholdSaved(false), 1500)
                  }}
                  disabled={household.household_babies >= 10 || savingHousehold}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Senioren */}
            <div className="rounded-xl bg-surface-secondary p-4">
              <div className="mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Senioren (65+)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (household.household_seniors <= 0) return
                    setSavingHousehold(true)
                    await saveHousehold({ household_seniors: household.household_seniors - 1 })
                    setSavingHousehold(false)
                    setHouseholdSaved(true)
                    setTimeout(() => setHouseholdSaved(false), 1500)
                  }}
                  disabled={household.household_seniors <= 0 || savingHousehold}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2.5rem] text-center text-lg font-bold text-text-primary">
                  {household.household_seniors}
                </span>
                <button
                  onClick={async () => {
                    if (household.household_seniors >= 10) return
                    setSavingHousehold(true)
                    await saveHousehold({ household_seniors: household.household_seniors + 1 })
                    setSavingHousehold(false)
                    setHouseholdSaved(true)
                    setTimeout(() => setHouseholdSaved(false), 1500)
                  }}
                  disabled={household.household_seniors >= 10 || savingHousehold}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Haustiere */}
            <div className="rounded-xl bg-surface-secondary p-4">
              <div className="mb-2 flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Haustiere</span>
              </div>
              <button
                onClick={async () => {
                  setSavingHousehold(true)
                  await saveHousehold({ household_pets: !household.household_pets })
                  setSavingHousehold(false)
                  setHouseholdSaved(true)
                  setTimeout(() => setHouseholdSaved(false), 1500)
                }}
                disabled={savingHousehold}
                className="flex items-center gap-2"
              >
                <div
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    household.household_pets ? 'bg-primary-600' : 'bg-border'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      household.household_pets ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm text-text-secondary">
                  {household.household_pets ? 'Ja' : 'Nein'}
                </span>
              </button>
            </div>
          </div>

          {householdSaved && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Gespeichert – Vorratsliste wird automatisch angepasst
            </div>
          )}

          <p className="mt-3 text-xs text-text-muted">
            Änderungen passen die Soll-Mengen in deiner Vorratsliste an.
          </p>
        </div>

        {/* Benachrichtigungen */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Benachrichtigungen</h2>
              <p className="text-sm text-text-secondary">Wähle, wie du informiert werden möchtest</p>
            </div>
          </div>
          <div className="space-y-4">
            {([
              { key: 'push' as NotifSetting, label: 'Push-Benachrichtigungen', desc: 'Warnungen direkt auf dein Gerät' },
              { key: 'email' as NotifSetting, label: 'E-Mail-Benachrichtigungen', desc: 'Zusammenfassung per E-Mail' },
              { key: 'severe_only' as NotifSetting, label: 'Nur schwere Warnungen', desc: 'Nur bei Warnstufe "Schwer" oder höher' },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleNotif(opt.key)}
                className="flex w-full items-center justify-between rounded-xl bg-surface-secondary p-4 text-left transition-colors hover:bg-surface-secondary/80"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                  <p className="text-xs text-text-muted">{opt.desc}</p>
                </div>
                <div
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    notifSettings[opt.key] ? 'bg-primary-600' : 'bg-border'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      notifSettings[opt.key] ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Profil */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Profil</h2>
              <p className="text-sm text-text-secondary">Deine persönlichen Daten</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Name</label>
              <div className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary">
                {displayName || user?.user_metadata?.name || '–'}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">E-Mail</label>
              <div className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm text-text-primary">
                {email || user?.email || '–'}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Profildaten können über die Kontoeinstellungen geändert werden.
          </p>
        </div>

        {/* Datenschutz & Abmelden */}
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Konto</h2>
              <p className="text-sm text-text-secondary">Abmelden oder Konto verwalten</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </div>
    </div>
  )
}
