/**
 * BuergerOnboarding — 4-Schritt-Wizard für Bürger-Ersteinrichtung
 *
 * Step 1: 📍 Standort — Landkreis-Suche
 * Step 2: 👥 Haushalt — Personenzahl, Babys, Senioren, Haustiere
 * Step 3: ⚡ Risikoprofil — Auto-erkannte Risiken basierend auf Standort
 * Step 4: ✅ Fertig — Zusammenfassung + Vorratsliste erstellen
 */
import { useState, useMemo } from 'react'
import {
  MapPin, Search, CheckCircle2, Users, Baby, HeartPulse,
  PawPrint, ChevronRight, ChevronLeft, Loader2, ShieldCheck,
  Waves, Wind, Sun, Mountain, ZapOff, CloudRain, AlertTriangle, Flame,
} from 'lucide-react'
import { germanDistricts, type GermanDistrict } from '@/data/german-districts'
import { useCitizenLocation, type CitizenLocation } from '@/hooks/useCitizenLocation'
import { useCitizenHousehold, type CitizenHouseholdProfile } from '@/hooks/useCitizenHousehold'
import { useCitizenInventory } from '@/hooks/useCitizenInventory'
import { detectRegionalRisks, RISK_TYPES } from '@/data/regional-risk-items'

const RISK_ICONS: Record<string, typeof Waves> = {
  hochwasser: Waves,
  sturmflut: Wind,
  sturm: Wind,
  hitze: Sun,
  lawine: Mountain,
  erdrutsch: Mountain,
  stromausfall: ZapOff,
  unwetter: CloudRain,
}

const STEPS = [
  { label: 'Standort', icon: MapPin },
  { label: 'Haushalt', icon: Users },
  { label: 'Risiken', icon: AlertTriangle },
  { label: 'Fertig', icon: ShieldCheck },
]

export default function BuergerOnboarding() {
  const { saveLocation } = useCitizenLocation()
  const { saveHousehold, completeOnboarding } = useCitizenHousehold()
  const { generateFromTemplate } = useCitizenInventory()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1: Standort
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState<GermanDistrict | null>(null)

  // Step 2: Haushalt
  const [persons, setPersons] = useState(2)
  const [babies, setBabies] = useState(0)
  const [seniors, setSeniors] = useState(0)
  const [hasPets, setHasPets] = useState(false)

  // Step 3: Risiken (auto-erkannt)
  const detectedRisks = useMemo(() => {
    if (!selectedDistrict) return []
    return detectRegionalRisks(
      selectedDistrict.name,
      selectedDistrict.state,
      selectedDistrict.lat,
    )
  }, [selectedDistrict])

  const filteredDistricts = useMemo(() => {
    if (!locationQuery.trim()) return germanDistricts.slice(0, 20)
    const q = locationQuery.toLowerCase()
    return germanDistricts
      .filter(d => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q))
      .slice(0, 20)
  }, [locationQuery])

  // ─── Navigation ─────────────────────────────────────────

  const canContinue = () => {
    if (step === 0) return !!selectedDistrict
    return true
  }

  const handleNext = async () => {
    if (step === 0 && selectedDistrict) {
      // Standort speichern
      setSaving(true)
      const loc: CitizenLocation = {
        districtName: selectedDistrict.name,
        districtAgs: selectedDistrict.agsCode,
        warncellId: selectedDistrict.warncellId,
        lat: selectedDistrict.lat,
        lng: selectedDistrict.lng,
      }
      const success = await saveLocation(loc)
      setSaving(false)
      if (!success) return
      setStep(1)
    } else if (step === 1) {
      // Haushalt speichern
      setSaving(true)
      const success = await saveHousehold({
        household_persons: persons,
        household_babies: babies,
        household_seniors: seniors,
        household_pets: hasPets,
      })
      setSaving(false)
      if (!success) return
      setStep(2)
    } else if (step === 2) {
      // Risikoprofil speichern
      setSaving(true)
      await saveHousehold({ risk_profile: detectedRisks })
      setSaving(false)
      setStep(3)
    }
  }

  const handleFinish = async () => {
    if (!selectedDistrict) return
    setSaving(true)

    try {
      // Vorratsliste generieren
      const householdProfile: CitizenHouseholdProfile = {
        household_persons: persons,
        household_babies: babies,
        household_seniors: seniors,
        household_pets: hasPets,
        dietary_restrictions: [],
        risk_profile: detectedRisks,
        onboarding_completed: true,
      }

      const location: CitizenLocation = {
        districtName: selectedDistrict.name,
        districtAgs: selectedDistrict.agsCode,
        warncellId: selectedDistrict.warncellId,
        lat: selectedDistrict.lat,
        lng: selectedDistrict.lng,
      }

      await generateFromTemplate(householdProfile, location, selectedDistrict.state)
      await completeOnboarding()
    } catch (err) {
      console.error('Onboarding Abschluss fehlgeschlagen:', err)
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 flex w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Progress Bar */}
        <div className="border-b border-border px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={s.label} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                        isDone
                          ? 'bg-green-100 text-green-600'
                          : isActive
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-surface-secondary text-text-muted'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs font-medium ${
                      isActive ? 'text-primary-600' : isDone ? 'text-green-600' : 'text-text-muted'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 rounded-full ${
                      i < step ? 'bg-green-300' : 'bg-border'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 0 && (
            <StepStandort
              query={locationQuery}
              setQuery={setLocationQuery}
              filtered={filteredDistricts}
              selected={selectedDistrict}
              setSelected={setSelectedDistrict}
            />
          )}
          {step === 1 && (
            <StepHaushalt
              persons={persons}
              setPersons={setPersons}
              babies={babies}
              setBabies={setBabies}
              seniors={seniors}
              setSeniors={setSeniors}
              hasPets={hasPets}
              setHasPets={setHasPets}
            />
          )}
          {step === 2 && (
            <StepRisiken
              risks={detectedRisks}
              districtName={selectedDistrict?.name || ''}
            />
          )}
          {step === 3 && (
            <StepFertig
              district={selectedDistrict}
              persons={persons}
              babies={babies}
              seniors={seniors}
              hasPets={hasPets}
              risks={detectedRisks}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canContinue() || saving}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Speichern...</>
              ) : (
                <>Weiter <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Vorratsliste wird erstellt...</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Vorratsliste erstellen</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Standort ───────────────────────────────────

function StepStandort({
  query, setQuery, filtered, selected, setSelected,
}: {
  query: string
  setQuery: (q: string) => void
  filtered: GermanDistrict[]
  selected: GermanDistrict | null
  setSelected: (d: GermanDistrict) => void
}) {
  return (
    <div className="px-6 py-5">
      <h2 className="mb-1 text-lg font-bold text-text-primary">Wo wohnst du?</h2>
      <p className="mb-4 text-sm text-text-secondary">
        Wähle deinen Landkreis, um lokale Warnungen und regionale Vorsorge-Empfehlungen zu erhalten.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Landkreis oder Stadt suchen..."
          autoFocus
          className="w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </div>

      <div className="max-h-[240px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Kein Landkreis gefunden.</p>
        ) : (
          <div className="space-y-1">
            {filtered.map((d) => (
              <button
                key={d.agsCode}
                onClick={() => setSelected(d)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  selected?.agsCode === d.agsCode
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-surface-secondary'
                }`}
              >
                <MapPin className={`h-4 w-4 shrink-0 ${
                  selected?.agsCode === d.agsCode ? 'text-primary-600' : 'text-text-muted'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-text-muted">{d.state} · {d.population.toLocaleString('de-DE')} Einwohner</p>
                </div>
                {selected?.agsCode === d.agsCode && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 2: Haushalt ───────────────────────────────────

function StepHaushalt({
  persons, setPersons, babies, setBabies, seniors, setSeniors, hasPets, setHasPets,
}: {
  persons: number; setPersons: (n: number) => void
  babies: number; setBabies: (n: number) => void
  seniors: number; setSeniors: (n: number) => void
  hasPets: boolean; setHasPets: (v: boolean) => void
}) {
  return (
    <div className="px-6 py-5">
      <h2 className="mb-1 text-lg font-bold text-text-primary">Dein Haushalt</h2>
      <p className="mb-5 text-sm text-text-secondary">
        Diese Angaben helfen, die Vorratsliste an deinen Haushalt anzupassen.
      </p>

      <div className="space-y-4">
        {/* Personen */}
        <CounterField
          icon={<Users className="h-5 w-5 text-primary-600" />}
          label="Personen im Haushalt"
          description="Erwachsene + Kinder"
          value={persons}
          onChange={setPersons}
          min={1}
          max={12}
        />

        {/* Babys */}
        <CounterField
          icon={<Baby className="h-5 w-5 text-pink-500" />}
          label="Babys / Kleinkinder"
          description="Unter 3 Jahre (zusätzlicher Bedarf)"
          value={babies}
          onChange={setBabies}
          min={0}
          max={6}
        />

        {/* Senioren */}
        <CounterField
          icon={<HeartPulse className="h-5 w-5 text-red-500" />}
          label="Senioren / Pflegebedürftige"
          description="Personen mit besonderem Medikamentenbedarf"
          value={seniors}
          onChange={setSeniors}
          min={0}
          max={6}
        />

        {/* Haustiere */}
        <button
          onClick={() => setHasPets(!hasPets)}
          className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
            hasPets ? 'border-primary-300 bg-primary-50' : 'border-border hover:bg-surface-secondary'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            hasPets ? 'bg-primary-100' : 'bg-surface-secondary'
          }`}>
            <PawPrint className={`h-5 w-5 ${hasPets ? 'text-primary-600' : 'text-text-muted'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Haustiere</p>
            <p className="text-xs text-text-muted">Hund, Katze, etc. (Futter + Transport einplanen)</p>
          </div>
          <div className={`flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            hasPets ? 'bg-primary-600' : 'bg-border'
          }`}>
            <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
              hasPets ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`} />
          </div>
        </button>
      </div>
    </div>
  )
}

function CounterField({
  icon, label, description, value, onChange, min, max,
}: {
  icon: React.ReactNode
  label: string
  description: string
  value: number
  onChange: (n: number) => void
  min: number
  max: number
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-bold text-text-primary">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Risiken ────────────────────────────────────

function StepRisiken({ risks, districtName }: { risks: string[]; districtName: string }) {
  return (
    <div className="px-6 py-5">
      <h2 className="mb-1 text-lg font-bold text-text-primary">Regionale Risiken</h2>
      <p className="mb-5 text-sm text-text-secondary">
        Basierend auf deinem Standort <span className="font-medium text-text-primary">{districtName}</span> haben
        wir folgende Risiken erkannt. Diese bestimmen zusätzliche Vorrats-Empfehlungen.
      </p>

      <div className="space-y-2">
        {risks.map(riskId => {
          const risk = RISK_TYPES.find(r => r.id === riskId)
          if (!risk) return null
          const Icon = RISK_ICONS[riskId] || AlertTriangle

          return (
            <div
              key={riskId}
              className="flex items-center gap-4 rounded-xl border border-border p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Icon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{risk.name}</p>
                <p className="text-xs text-text-muted">{risk.description}</p>
              </div>
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                +{risk.items.length} Artikel
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-text-muted">
        Diese Risiken werden automatisch erkannt. Du kannst sie später in den Einstellungen anpassen.
      </p>
    </div>
  )
}

// ─── Step 4: Fertig ─────────────────────────────────────

function StepFertig({
  district, persons, babies, seniors, hasPets, risks,
}: {
  district: GermanDistrict | null
  persons: number
  babies: number
  seniors: number
  hasPets: boolean
  risks: string[]
}) {
  return (
    <div className="px-6 py-5">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <ShieldCheck className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">Fast geschafft!</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Deine personalisierte Vorratsliste wird jetzt erstellt.
        </p>
      </div>

      {/* Zusammenfassung */}
      <div className="space-y-3 rounded-xl bg-surface-secondary p-4">
        <SummaryRow
          icon={<MapPin className="h-4 w-4 text-primary-600" />}
          label="Standort"
          value={district?.name || '—'}
        />
        <SummaryRow
          icon={<Users className="h-4 w-4 text-primary-600" />}
          label="Haushalt"
          value={`${persons} Person${persons !== 1 ? 'en' : ''}${babies > 0 ? `, ${babies} Baby${babies !== 1 ? 's' : ''}` : ''}${seniors > 0 ? `, ${seniors} Senior${seniors !== 1 ? 'en' : ''}` : ''}`}
        />
        {hasPets && (
          <SummaryRow
            icon={<PawPrint className="h-4 w-4 text-primary-600" />}
            label="Haustiere"
            value="Ja"
          />
        )}
        <SummaryRow
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Erkannte Risiken"
          value={`${risks.length} Risikotypen`}
        />
        <SummaryRow
          icon={<Flame className="h-4 w-4 text-primary-600" />}
          label="Vorsorgezeitraum"
          value="10 Tage (BBK-Empfehlung)"
        />
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        Klicke auf &quot;Vorratsliste erstellen&quot; — du kannst alles später anpassen.
      </p>
    </div>
  )
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  )
}
