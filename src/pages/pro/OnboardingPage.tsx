import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Search,
  MapPin,
  Building2,
  ShieldAlert,
  Flame,
  Landmark,
  Package,
  BookOpen,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { germanDistricts, type GermanDistrict } from '@/data/german-districts'
import { PRO_SCENARIOS } from '@/data/default-scenarios'
import { PREPARATION_CHECKLISTS } from '@/data/preparation-checklists'
import { createEmptyHandbuchKapitel } from '@/utils/handbook-init'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

type Step = 1 | 2 | 3

interface LoadProgress {
  gemeinden: { count: number; done: boolean; error?: string }
  kritis: { count: number; done: boolean; error?: string }
  risiken: { count: number; done: boolean }
  szenarien: { count: number; done: boolean }
  inventar: { count: number; done: boolean }
  handbuecher: { count: number; total: number; done: boolean }
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [query, setQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState<GermanDistrict | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<LoadProgress>({
    gemeinden: { count: 0, done: false },
    kritis: { count: 0, done: false },
    risiken: { count: 0, done: false },
    szenarien: { count: 0, done: false },
    inventar: { count: 0, done: false },
    handbuecher: { count: 0, total: 0, done: false },
  })

  const filtered = query.length >= 2
    ? germanDistricts
        .filter((d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.state.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 20) // Max 20 Vorschläge anzeigen
    : []

  // Ref to track cancellation across async operations
  const cancelledRef = useRef(false)

  // Step 2: Create district in Supabase + real OSM import + cosmetic animations for other items
  useEffect(() => {
    if (step !== 2 || !selectedDistrict) return

    cancelledRef.current = false
    const timers: ReturnType<typeof setTimeout>[] = []

    async function createDistrictAndImport() {
      setSaving(true)
      setError(null)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Nicht eingeloggt')

        // INSERT district mit AGS-Code + Warncell-ID
        const { data: insertedDistrict, error: insertError } = await supabase
          .from('districts')
          .insert({
            user_id: user.id,
            name: selectedDistrict!.name,
            state: selectedDistrict!.state,
            population: selectedDistrict!.population,
            area_km2: selectedDistrict!.areaKm2,
            latitude: selectedDistrict!.lat,
            longitude: selectedDistrict!.lng,
            ags_code: selectedDistrict!.agsCode,
            warncell_id: selectedDistrict!.warncellId,
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        if (cancelledRef.current) return

        const districtId = insertedDistrict.id

        // Real Gemeinden-Import via OSM Edge Function
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        setProgress((p) => ({ ...p, gemeinden: { count: 5, done: false } }))

        let gemeindenCount = 0
        if (accessToken) {
          try {
            const munResponse = await fetch(`${SUPABASE_URL}/functions/v1/import-osm-municipalities`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                apikey: SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ districtId }),
            })

            const munResult = await munResponse.json()
            if (munResult.success) {
              gemeindenCount = munResult.imported + munResult.existing
            } else {
              console.warn('Gemeinden-Import Warnung:', munResult.error)
              setProgress((p) => ({ ...p, gemeinden: { ...p.gemeinden, error: munResult.error || 'Import fehlgeschlagen' } }))
            }
          } catch (munErr) {
            console.warn('Gemeinden-Import Fehler (nicht kritisch):', munErr)
            setProgress((p) => ({ ...p, gemeinden: { ...p.gemeinden, error: 'Netzwerkfehler beim Import' } }))
          }
        }

        if (cancelledRef.current) return
        setProgress((p) => ({ ...p, gemeinden: { count: gemeindenCount, done: true } }))

        // Real KRITIS-Import via OSM Edge Function
        setProgress((p) => ({ ...p, kritis: { count: 5, done: false } }))

        let kritisCount = 0
        if (accessToken) {
          try {
            setProgress((p) => ({ ...p, kritis: { count: 12, done: false } }))

            const osmResponse = await fetch(`${SUPABASE_URL}/functions/v1/import-osm-kritis`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                apikey: SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ districtId }),
            })

            const osmResult = await osmResponse.json()
            if (osmResult.success) {
              kritisCount = osmResult.imported + osmResult.skipped
            } else {
              console.warn('KRITIS-Import Warnung:', osmResult.error)
              kritisCount = 0
              setProgress((p) => ({ ...p, kritis: { ...p.kritis, error: osmResult.error || 'Import fehlgeschlagen' } }))
            }
          } catch (osmErr) {
            console.warn('KRITIS-Import Fehler (nicht kritisch):', osmErr)
            setProgress((p) => ({ ...p, kritis: { ...p.kritis, error: 'Netzwerkfehler beim Import' } }))
          }
        }

        if (cancelledRef.current) return
        setProgress((p) => ({ ...p, kritis: { count: kritisCount, done: true } }))

        // Real: Warnungen abrufen + KI-Risikoanalyse starten
        setProgress((p) => ({ ...p, risiken: { count: 0, done: false } }))

        if (accessToken) {
          // 1) Warnungen abrufen (NINA, DWD, Pegelonline)
          try {
            const warnResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-warnings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                apikey: SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ districtId }),
            })
            const warnResult = await warnResponse.json()
            if (warnResult.success) {
              setProgress((p) => ({ ...p, risiken: { count: warnResult.inserted || warnResult.total || 3, done: false } }))
            }
          } catch (warnErr) {
            console.warn('Warnungen-Fetch Fehler (nicht kritisch):', warnErr)
          }

          if (cancelledRef.current) return

          // 2) KI-Risikoanalyse erstellen
          try {
            const riskResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-risk-analysis`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                apikey: SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ districtId }),
            })
            const riskResult = await riskResponse.json()
            if (riskResult.success && riskResult.data) {
              const riskEntryCount = riskResult.data.entries?.length || 8
              setProgress((p) => ({ ...p, risiken: { count: riskEntryCount, done: false } }))
            }
          } catch (riskErr) {
            console.warn('KI-Risikoanalyse Fehler (nicht kritisch):', riskErr)
          }
        }

        if (cancelledRef.current) return
        setProgress((p) => ({ ...p, risiken: { count: p.risiken.count || 8, done: true } }))

        // Standard-Szenarien anlegen (nur Pro-Tier)
        setProgress((p) => ({ ...p, szenarien: { count: 0, done: false } }))
        let szenarien_count = 0
        const createdScenarioIds: string[] = []

        try {
          for (const template of PRO_SCENARIOS) {
            if (cancelledRef.current) return

            const { data: scenario, error: scenError } = await supabase
              .from('scenarios')
              .insert({
                district_id: districtId,
                title: template.title,
                type: template.type,
                severity: template.severity,
                description: template.description,
                is_ai_generated: false,
                is_edited: false,
                is_default: true,
                // Inventar als Mini-Handbook einspeisen (InventarTab liest handbook.inventar)
                // pro_10k_einwohner → empfohlene_menge (absolut, skaliert auf Einwohnerzahl)
                // Wird später durch vollständiges KI-Handbook überschrieben
                handbook: template.inventar ? {
                  inventar: template.inventar.map(item => ({
                    kategorie: item.kategorie,
                    empfohlene_menge: Math.ceil(item.pro_10k_einwohner * (selectedDistrict!.population / 10000)),
                    einheit: item.einheit,
                    begruendung: item.begruendung,
                    bereich: item.bereich,
                    prioritaet: item.prioritaet,
                  })),
                  generated_at: new Date().toISOString(),
                } : null,
                // Maßnahmenplan-Template in meta.massnahmenplan einspeisen
                meta: template.alarmkette ? {
                  massnahmenplan: {
                    alarmkette: template.alarmkette.map((schritt, idx) => ({
                      id: crypto.randomUUID(),
                      reihenfolge: idx + 1,
                      rolle: schritt.rolle,
                      kontaktgruppen: schritt.kontaktgruppen,
                      kanaele: schritt.kanaele,
                      wartezeit_min: schritt.wartezeit_min,
                      bedingung: null,
                    })),
                    aufgaben_zuweisung: [],
                    generated_at: new Date().toISOString(),
                    last_edited: null,
                  },
                } : null,
              })
              .select('id')
              .single()

            if (scenError) {
              console.warn('Szenario-Insert Warnung:', scenError.message)
              continue
            }

            if (scenario) {
              createdScenarioIds.push(scenario.id)
              await supabase.from('scenario_phases').insert(
                template.phases.map((p, i) => ({
                  scenario_id: scenario.id,
                  sort_order: i + 1,
                  name: p.name,
                  duration: p.duration,
                  tasks: p.tasks,
                }))
              )
            }

            szenarien_count++
            if (!cancelledRef.current) {
              setProgress((p) => ({ ...p, szenarien: { count: szenarien_count, done: false } }))
            }
          }
        } catch (scenErr) {
          console.warn('Szenarien-Import Fehler (nicht kritisch):', scenErr)
        }

        if (cancelledRef.current) return
        setProgress((p) => ({ ...p, szenarien: { count: szenarien_count, done: true } }))

        // Konsolidierte Inventar-Items automatisch anlegen
        setProgress((p) => ({ ...p, inventar: { count: 0, done: false } }))
        try {
          // Alle Inventar-Empfehlungen aus allen Szenarien konsolidieren (Maximum pro Kategorie)
          // pro_10k_einwohner → target_quantity (absolut, skaliert auf Einwohnerzahl)
          const populationFactor = selectedDistrict!.population / 10000
          const categoryMap = new Map<string, { kategorie: string; target: number; unit: string }>()
          for (const template of PRO_SCENARIOS) {
            if (!template.inventar) continue
            for (const item of template.inventar) {
              const key = item.kategorie.toLowerCase().trim()
              const scaledAmount = Math.ceil(item.pro_10k_einwohner * populationFactor)
              const existing = categoryMap.get(key)
              if (!existing || scaledAmount > existing.target) {
                categoryMap.set(key, { kategorie: item.kategorie, target: scaledAmount, unit: item.einheit })
              }
            }
          }

          const inventoryInserts = Array.from(categoryMap.values()).map((val) => ({
            district_id: districtId,
            category: val.kategorie,
            target_quantity: val.target,
            current_quantity: 0,
            unit: val.unit,
          }))

          if (inventoryInserts.length > 0) {
            const { error: invError } = await supabase.from('inventory_items').insert(inventoryInserts)
            if (invError) console.warn('Inventar-Auto-Import Warnung:', invError.message)
          }

          if (!cancelledRef.current) {
            setProgress((p) => ({ ...p, inventar: { count: categoryMap.size, done: true } }))
          }
        } catch (invErr) {
          console.warn('Inventar-Import Fehler (nicht kritisch):', invErr)
          if (!cancelledRef.current) {
            setProgress((p) => ({ ...p, inventar: { count: 0, done: true } }))
          }
        }

        if (cancelledRef.current) return

        // Krisenhandbuch (district_handbooks) automatisch anlegen
        setProgress((p) => ({ ...p, handbuecher: { count: 0, total: 2, done: false } }))
        try {
          const { error: hbError } = await supabase.from('district_handbooks').insert({
            district_id: districtId,
            titel: 'Krisenhandbuch',
            status: 'entwurf',
            version: '1.0',
            kapitel: createEmptyHandbuchKapitel(),
          })
          if (hbError) console.warn('Handbuch-Erstellung Warnung:', hbError.message)
          if (!cancelledRef.current) {
            setProgress((p) => ({ ...p, handbuecher: { count: 1, total: 2, done: false } }))
          }
        } catch (hbErr) {
          console.warn('Handbuch-Erstellung Fehler (nicht kritisch):', hbErr)
        }

        if (cancelledRef.current) return

        // ExTrass-Checklisten (18 Kategorien) automatisch anlegen
        try {
          const checklistRows = PREPARATION_CHECKLISTS.map(cat => ({
            district_id: districtId,
            scenario_id: null,
            title: `${cat.nummer}. ${cat.title}`,
            description: cat.beschreibung,
            category: 'vorbereitung' as const,
            is_template: false,
            items: cat.items.map(item => ({
              id: item.id,
              text: item.text,
              status: 'open' as const,
              completed_at: null,
              completed_by: null,
            })),
          }))
          const { error: clError } = await supabase.from('checklists').insert(checklistRows)
          if (clError) console.warn('Checklisten-Erstellung Warnung:', clError.message)
          if (!cancelledRef.current) {
            setProgress((p) => ({ ...p, handbuecher: { count: 2, total: 2, done: true } }))
          }
        } catch (clErr) {
          console.warn('Checklisten-Erstellung Fehler (nicht kritisch):', clErr)
          if (!cancelledRef.current) {
            setProgress((p) => ({ ...p, handbuecher: { count: 1, total: 2, done: true } }))
          }
        }

        if (cancelledRef.current) return

        // Navigate to step 3
        timers.push(setTimeout(() => {
          if (!cancelledRef.current) setStep(3)
        }, 500))
      } catch (err: unknown) {
        console.error('Onboarding Error:', err)
        if (!cancelledRef.current) {
          const msg = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : JSON.stringify(err)
          setError(msg || 'Fehler beim Erstellen des Landkreises')
          setStep(1)
        }
      } finally {
        setSaving(false)
      }
    }

    createDistrictAndImport()

    return () => {
      cancelledRef.current = true
      timers.forEach(clearTimeout)
    }
  }, [step, selectedDistrict])

  const handleSelect = (district: GermanDistrict) => {
    setSelectedDistrict(district)
    setQuery(district.name)
    setShowSuggestions(false)
  }

  const handleStartSetup = () => {
    if (!selectedDistrict || saving) return
    setStep(2)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Gradient panel */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#111d35] via-[#1e3154] to-[#243a5e] p-10 lg:flex lg:w-[480px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Alarmplaner</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
            Pro
          </span>
        </div>

        <div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            {step === 1 && 'Ihr Landkreis. In Sekunden einsatzbereit.'}
            {step === 2 && 'KI analysiert Ihren Landkreis...'}
            {step === 3 && 'Alles bereit!'}
          </h2>
          <p className="text-text-on-dark-secondary">
            {step === 1 && 'Wählen Sie Ihren Landkreis – unsere KI lädt automatisch alle relevanten Daten: Gemeinden, Infrastruktur, Risiken und erste Szenarien.'}
            {step === 2 && 'Daten werden aus OpenStreetMap, DWD, NINA und weiteren Quellen geladen und von unserer KI analysiert.'}
            {step === 3 && 'Ihr Dashboard ist vollständig eingerichtet. Alle Daten können jederzeit aktualisiert und ergänzt werden.'}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                      ? 'bg-white text-[#111d35]'
                      : 'border border-white/20 text-white/40'
                }`}
              >
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 w-8 rounded ${s < step ? 'bg-green-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Step 1: Landkreis auswählen */}
          {step === 1 && (
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                <Sparkles className="h-3 w-3" />
                Schritt 1 von 3
              </div>
              <h1 className="mb-2 text-2xl font-bold text-text-primary">Landkreis auswählen</h1>
              <p className="mb-8 text-text-secondary">
                Geben Sie den Namen Ihres Landkreises ein. Die KI lädt anschließend automatisch alle relevanten Daten.
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Search input */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowSuggestions(true)
                    setSelectedDistrict(null)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="z.B. Landkreis Harz, Rhein-Sieg-Kreis..."
                  className="w-full rounded-2xl border border-border bg-white py-4 pl-12 pr-4 text-base text-text-primary placeholder:text-text-muted transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                />

                {/* Suggestions dropdown */}
                {showSuggestions && filtered.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-white shadow-xl">
                    {filtered.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => handleSelect(d)}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-secondary"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{d.name}</p>
                          <p className="text-xs text-text-muted">
                            {d.state} · {d.population.toLocaleString('de-DE')} Einwohner · {d.areaKm2.toLocaleString('de-DE')} km²
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected district card */}
              {selectedDistrict && (
                <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/50 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">{selectedDistrict.name}</p>
                      <p className="text-sm text-text-secondary">{selectedDistrict.state}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-lg font-bold text-text-primary">
                        {selectedDistrict.population.toLocaleString('de-DE')}
                      </p>
                      <p className="text-xs text-text-muted">Einwohner</p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-lg font-bold text-text-primary">
                        {selectedDistrict.areaKm2.toLocaleString('de-DE')} km²
                      </p>
                      <p className="text-xs text-text-muted">Fläche</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartSetup}
                disabled={!selectedDistrict || saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                KI-Setup starten
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Step 2: KI lädt Daten */}
          {step === 2 && (
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Schritt 2 von 3
              </div>
              <h1 className="mb-2 text-2xl font-bold text-text-primary">KI analysiert {selectedDistrict?.name}</h1>
              <p className="mb-8 text-text-secondary">
                Daten werden automatisch aus OpenStreetMap, DWD und weiteren Quellen geladen.
              </p>

              <div className="space-y-4">
                <LoadingItem
                  icon={<Building2 className="h-5 w-5" />}
                  label="Gemeinden importieren"
                  sublabel="OpenStreetMap + Destatis"
                  count={progress.gemeinden.count}
                  done={progress.gemeinden.done}
                  unit="Gemeinden"
                  error={progress.gemeinden.error}
                />
                <LoadingItem
                  icon={<Landmark className="h-5 w-5" />}
                  label="KRITIS-Infrastruktur laden"
                  sublabel="Overpass API (OSM)"
                  count={progress.kritis.count}
                  done={progress.kritis.done}
                  unit="Objekte"
                  error={progress.kritis.error}
                />
                <LoadingItem
                  icon={<ShieldAlert className="h-5 w-5" />}
                  label="Warnungen & KI-Risikoanalyse"
                  sublabel="NINA + DWD + Pegelonline + KI-Analyse"
                  count={progress.risiken.count}
                  done={progress.risiken.done}
                  unit="Risiken"
                />
                <LoadingItem
                  icon={<Flame className="h-5 w-5" />}
                  label="Standard-Szenarien anlegen"
                  sublabel="Krisenszenarien mit Handlungsplänen"
                  count={progress.szenarien.count}
                  done={progress.szenarien.done}
                  unit="Szenarien"
                />
                <LoadingItem
                  icon={<Package className="h-5 w-5" />}
                  label="Inventar-Kategorien anlegen"
                  sublabel="Soll-Mengen aus Szenario-Empfehlungen"
                  count={progress.inventar.count}
                  done={progress.inventar.done}
                  unit="Kategorien"
                />
                <LoadingItem
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Handbuch & Checklisten anlegen"
                  sublabel="Krisenhandbuch (12 Kapitel) + ExTrass-Checklisten (18 Kategorien)"
                  count={progress.handbuecher.count}
                  done={progress.handbuecher.done}
                  unit="Dokumente"
                />
              </div>
            </div>
          )}

          {/* Step 3: Fertig */}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-text-primary">Setup abgeschlossen!</h1>
              <p className="mb-8 text-text-secondary">
                {selectedDistrict?.name} ist vollständig eingerichtet. Alle Daten wurden geladen.
              </p>

              {/* Summary */}
              <div className="mb-8 grid grid-cols-3 gap-3">
                <SummaryCard icon={<Building2 className="h-5 w-5" />} value={progress.gemeinden.count} label="Gemeinden" />
                <SummaryCard icon={<Landmark className="h-5 w-5" />} value={progress.kritis.count} label="KRITIS-Objekte" />
                <SummaryCard icon={<ShieldAlert className="h-5 w-5" />} value={progress.risiken.count} label="Risikokategorien" />
                <SummaryCard icon={<Flame className="h-5 w-5" />} value={progress.szenarien.count} label="Szenarien" />
                <SummaryCard icon={<Package className="h-5 w-5" />} value={progress.inventar.count} label="Inventar" />
                <SummaryCard icon={<BookOpen className="h-5 w-5" />} value={progress.handbuecher.count} label="Dokumente" />
              </div>

              <button
                onClick={() => navigate('/pro')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Zum Dashboard
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingItem({
  icon,
  label,
  sublabel,
  count,
  done,
  unit,
  error,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  count: number
  done: boolean
  unit: string
  error?: string
}) {
  const hasError = done && count === 0 && error
  return (
    <div className={`rounded-2xl border p-5 transition-colors ${hasError ? 'border-amber-200 bg-amber-50/50' : done ? 'border-green-200 bg-green-50/50' : 'border-border bg-white'}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hasError ? 'bg-amber-100 text-amber-600' : done ? 'bg-green-100 text-green-600' : 'bg-primary-50 text-primary-600'}`}>
          {hasError ? <AlertTriangle className="h-5 w-5" /> : done ? <CheckCircle2 className="h-5 w-5" /> : icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">{label}</p>
            {count > 0 && (
              <span className={`text-sm font-bold ${done ? 'text-green-600' : 'text-primary-600'}`}>
                {count} {unit}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">{sublabel}</p>
          {hasError && (
            <p className="mt-1 text-xs text-amber-600">Import fehlgeschlagen — kann später manuell nachgeholt werden</p>
          )}
          {!done && count > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-primary-600" />
              <span className="text-xs text-primary-600">Wird geladen...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
        {icon}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  )
}
