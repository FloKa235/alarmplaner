import { corsHeaders } from '../_shared/cors.ts'
import { getServiceClient } from '../_shared/auth.ts'
import { callLangdock } from '../_shared/langdock.ts'

// ─── Typen ──────────────────────────────────────────

interface AIRiskAnalysisResponse {
  gesamtrisiko: {
    score: number
    level: string
    zusammenfassung: string
  }
  risiken: Array<{
    type: string
    score: number
    level: string
    trend: string
    beschreibung: string
  }>
  gemeindeRisiken?: Array<{
    name: string
    riskScore: number
    riskLevel: string
  }>
}

interface NinaWarning {
  id: string
  severity: string
  title: string
  description?: string
  instruction?: string
  startDate: string
  expiresDate?: string
  areas?: Array<{ areaDesc: string }>
  // deno-lint-ignore no-explicit-any
  [key: string]: any
}

interface PegelStation {
  uuid: string
  shortname: string
  longname: string
  km: number
  longitude: number
  latitude: number
  water: { shortname: string; longname: string }
  timeseries?: Array<{
    shortname: string
    longname: string
    unit: string
    currentMeasurement?: {
      timestamp: string
      value: number
      stateMnwMhw: string
    }
  }>
}

interface DistrictResult {
  districtId: string
  districtName: string
  warningsCount: number
  riskScore: number | null
  error?: string
}

// ─── Severity Mapping ───────────────────────────────

function mapNinaSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
  const s = severity.toLowerCase()
  if (s === 'extreme') return 'extreme'
  if (s === 'severe') return 'severe'
  if (s === 'moderate') return 'moderate'
  return 'minor'
}

function mapDwdSeverity(level: number): 'minor' | 'moderate' | 'severe' | 'extreme' {
  if (level >= 4) return 'extreme'
  if (level >= 3) return 'severe'
  if (level >= 2) return 'moderate'
  return 'minor'
}

function mapPegelSeverity(state: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
  const s = state.toLowerCase()
  if (s === 'high') return 'severe'
  if (s === 'low') return 'moderate'
  return 'minor'
}

// ─── API-Abrufe ─────────────────────────────────────

async function fetchNinaWarnings(agsCode: string): Promise<NinaWarning[]> {
  try {
    const url = `https://warnung.bund.de/api31/dashboard/${agsCode}.json`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// deno-lint-ignore no-explicit-any
async function fetchDwdWarnings(warncellId: number): Promise<any[]> {
  try {
    const url = `https://dwd.api.bund.dev/weather/warnings`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return []
    const data = await response.json()
    const warnings = data?.warnings || {}
    const cellWarnings = warnings[String(warncellId)] || []
    return Array.isArray(cellWarnings) ? cellWarnings : []
  } catch {
    return []
  }
}

async function fetchPegelStations(lat: number, lng: number, radius = 50): Promise<PegelStation[]> {
  try {
    const url = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json?latitude=${lat}&longitude=${lng}&radius=${radius}&includeTimeseries=true&includeCurrentMeasurement=true`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// ─── Risk Analysis Prompt ───────────────────────────

function buildSystemPrompt(
  // deno-lint-ignore no-explicit-any
  district: any,
  // deno-lint-ignore no-explicit-any
  municipalities: any[],
  // deno-lint-ignore no-explicit-any
  kritisSites: any[]
): string {
  const currentMonth = new Date().toLocaleString('de-DE', { month: 'long', year: 'numeric' })

  const gemeindenList = municipalities
    .map((m) => `- ${m.name}: ${m.population} Einwohner, ${m.area_km2} km², Koordinaten: ${m.latitude}, ${m.longitude}`)
    .join('\n')

  const kritisList = kritisSites
    .map((k) => `- ${k.name} (${k.category}), Adresse: ${k.address || 'k.A.'}, Risikoexposition: ${k.risk_exposure || 'k.A.'}`)
    .join('\n')

  return `Du bist ein KI-Experte für Katastrophenschutz und Risikoanalyse in Deutschland.
Du arbeitest für den Alarmplaner – ein Krisenmanagement-System für deutsche Landkreise.

Deine Aufgabe: Erstelle eine umfassende Risikoanalyse für den folgenden Landkreis.

## Landkreis-Daten
- Name: ${district.name}
- Bundesland: ${district.state}
- Einwohner: ${district.population}
- Fläche: ${district.area_km2} km²
- Koordinaten: ${district.latitude}, ${district.longitude}

## Gemeinden (${municipalities.length})
${gemeindenList || '- Keine Gemeinden vorhanden'}

## Kritische Infrastruktur (${kritisSites.length} Objekte)
${kritisList || '- Keine KRITIS-Objekte vorhanden'}

## Analyse-Anweisungen
Bewerte folgende Risikokategorien für diesen Landkreis:
1. Hochwasser
2. Sturm/Orkan
3. Waldbrand
4. Stromausfall
5. Extremhitze
6. Pandemie
7. CBRN (chemisch, biologisch, radiologisch, nuklear)
8. Cyberangriff

Berücksichtige dabei:
- Geographische Lage und Topographie des Landkreises
- Bevölkerungsdichte und -verteilung
- Art und Verteilung der kritischen Infrastruktur
- Typische Risiken für das Bundesland ${district.state}
- Saisonale Faktoren (aktueller Monat: ${currentMonth})

Antworte AUSSCHLIESSLICH im folgenden JSON-Format (kein Markdown, kein Text drumherum):
{
  "gesamtrisiko": {
    "score": <number 0-100>,
    "level": "<niedrig|mittel|erhöht|hoch|extrem>",
    "zusammenfassung": "<2-3 Sätze Gesamtbewertung>"
  },
  "risiken": [
    {
      "type": "<Risikokategorie>",
      "score": <number 0-100>,
      "level": "<niedrig|mittel|erhöht|hoch|extrem>",
      "trend": "<z.B. +5, -3, 0>",
      "beschreibung": "<1-2 Sätze spezifisch für diesen Landkreis>"
    }
  ],
  "gemeindeRisiken": [
    {
      "name": "<Gemeindename exakt wie oben>",
      "riskScore": <number 0-100>,
      "riskLevel": "<niedrig|mittel|erhöht|hoch|extrem>"
    }
  ]
}`
}

// ─── Per-District: Warnungen abrufen ────────────────

// deno-lint-ignore no-explicit-any
async function refreshWarningsForDistrict(supabase: any, district: any): Promise<number> {
  const districtId = district.id
  const agsCode = district.ags_code as string | null
  const warncellId = district.warncell_id as number | null
  const lat = district.latitude as number | null
  const lng = district.longitude as number | null

  // deno-lint-ignore no-explicit-any
  const allWarnings: any[] = []

  // NINA
  if (agsCode) {
    const ninaWarnings = await fetchNinaWarnings(agsCode)
    for (const w of ninaWarnings) {
      allWarnings.push({
        district_id: districtId,
        source: 'nina',
        external_id: w.id || `nina-${Date.now()}-${Math.random()}`,
        severity: mapNinaSeverity(w.severity || 'Minor'),
        title: w.title || 'NINA Warnung',
        description: w.description || null,
        affected_areas: (w.areas || []).map((a: { areaDesc: string }) => a.areaDesc),
        effective_at: w.startDate || new Date().toISOString(),
        expires_at: w.expiresDate || null,
        instruction: w.instruction || null,
        raw_data: w,
      })
    }
  }

  // DWD
  if (warncellId) {
    const dwdWarnings = await fetchDwdWarnings(warncellId)
    // deno-lint-ignore no-explicit-any
    for (const w of dwdWarnings) {
      allWarnings.push({
        district_id: districtId,
        source: 'dwd',
        external_id: w.warnId || `dwd-${Date.now()}-${Math.random()}`,
        severity: mapDwdSeverity(w.level || 1),
        title: w.headline || w.event || 'DWD Warnung',
        description: w.description || null,
        affected_areas: w.regionName ? [w.regionName] : [],
        effective_at: w.start ? new Date(w.start).toISOString() : new Date().toISOString(),
        expires_at: w.end ? new Date(w.end).toISOString() : null,
        instruction: w.instruction || null,
        raw_data: w,
      })
    }
  }

  // Pegelonline
  if (lat && lng) {
    const pegelStations = await fetchPegelStations(lat, lng, 50)
    for (const station of pegelStations) {
      const waterLevel = station.timeseries?.find((ts) => ts.shortname === 'W')
      if (!waterLevel?.currentMeasurement) continue

      const measurement = waterLevel.currentMeasurement
      const state = measurement.stateMnwMhw || 'normal'
      if (state === 'normal' || state === 'unknown' || state === 'out-dated') continue

      const severity = mapPegelSeverity(state)
      const waterName = station.water?.longname || station.water?.shortname || 'Gewässer'
      const stationName = station.longname || station.shortname
      const valueStr = `${measurement.value} ${waterLevel.unit}`

      allWarnings.push({
        district_id: districtId,
        source: 'pegel',
        external_id: `pegel-${station.uuid}-${new Date().toISOString().slice(0, 10)}`,
        severity,
        title: state === 'high'
          ? `Hochwasser: ${waterName} bei ${stationName} (${valueStr})`
          : `Niedrigwasser: ${waterName} bei ${stationName} (${valueStr})`,
        description: `Messstation ${stationName} am ${waterName} (km ${station.km}). Aktueller Wasserstand: ${valueStr}. Status: ${state === 'high' ? 'Über MHW' : 'Unter MNW'}. Messzeitpunkt: ${new Date(measurement.timestamp).toLocaleString('de-DE')}.`,
        affected_areas: [waterName, stationName],
        effective_at: measurement.timestamp,
        expires_at: null,
        instruction: state === 'high'
          ? 'Hochwasserlage beobachten. Ggf. Schutzmaßnahmen einleiten.'
          : 'Niedrigwasserlage beobachten. Ggf. Wasserentnahme einschränken.',
        raw_data: { station, waterLevel: { ...waterLevel } },
      })
    }
  }

  // Abgelaufene bereinigen
  await supabase
    .from('external_warnings')
    .delete()
    .eq('district_id', districtId)
    .lt('expires_at', new Date().toISOString())

  // Upserten
  for (const w of allWarnings) {
    await supabase
      .from('external_warnings')
      .upsert(w, { onConflict: 'source,external_id' })
  }

  return allWarnings.length
}

// ─── Per-District: KI-Risikoanalyse ─────────────────

// deno-lint-ignore no-explicit-any
async function refreshRiskAnalysisForDistrict(supabase: any, district: any): Promise<number | null> {
  const districtId = district.id

  // Gemeinden + KRITIS laden
  const { data: municipalities } = await supabase
    .from('municipalities')
    .select('*')
    .eq('district_id', districtId)
    .order('name')

  const { data: kritisSites } = await supabase
    .from('kritis_sites')
    .select('*')
    .eq('district_id', districtId)
    .order('name')

  // Prompt bauen + KI aufrufen
  const systemPrompt = buildSystemPrompt(district, municipalities ?? [], kritisSites ?? [])

  const aiResponse = await callLangdock([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Erstelle jetzt die Risikoanalyse für den Landkreis ${district.name} als JSON.` },
  ])

  const analysis: AIRiskAnalysisResponse = JSON.parse(aiResponse)

  if (!analysis.gesamtrisiko || !Array.isArray(analysis.risiken)) {
    throw new Error('KI-Antwort hat ein ungültiges Format.')
  }

  // Alte Profiles löschen
  const { data: oldProfiles } = await supabase
    .from('risk_profiles')
    .select('id')
    .eq('district_id', districtId)

  if (oldProfiles && oldProfiles.length > 0) {
    const oldIds = oldProfiles.map((p: { id: string }) => p.id)
    await supabase.from('risk_entries').delete().in('risk_profile_id', oldIds)
    await supabase.from('risk_profiles').delete().eq('district_id', districtId)
  }

  // Neues Profile
  const { data: newProfile, error: profileError } = await supabase
    .from('risk_profiles')
    .insert({
      district_id: districtId,
      risk_score: Math.min(100, Math.max(0, analysis.gesamtrisiko.score)),
      risk_level: analysis.gesamtrisiko.level,
    })
    .select()
    .single()

  if (profileError || !newProfile) {
    throw new Error('Fehler beim Speichern des Risikoprofils.')
  }

  // Entries
  const entries = analysis.risiken.map((r) => ({
    risk_profile_id: newProfile.id,
    type: r.type,
    score: Math.min(100, Math.max(0, r.score)),
    level: r.level,
    trend: r.trend,
    description: r.beschreibung,
  }))

  await supabase.from('risk_entries').insert(entries)

  // Gemeinde-Risiken updaten
  if (analysis.gemeindeRisiken && municipalities) {
    for (const gr of analysis.gemeindeRisiken) {
      const match = (municipalities as { id: string; name: string }[]).find(
        (m) => m.name.toLowerCase() === gr.name.toLowerCase()
      )
      if (match) {
        await supabase
          .from('municipalities')
          .update({
            risk_score: Math.min(100, Math.max(0, gr.riskScore)),
            risk_level: gr.riskLevel,
          })
          .eq('id', match.id)
      }
    }
  }

  return newProfile.risk_score as number
}

// ─── Edge Function Handler ──────────────────────────

Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // KEIN Auth-Check – wird vom n8n Cron mit Service Role Key aufgerufen.
    // Der Service Role Key wird über den Authorization-Header gesendet,
    // Supabase Edge Functions akzeptieren das automatisch.
    const supabase = getServiceClient()

    // Alle Districts laden
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('*')

    if (districtsError || !districts) {
      throw new Error('Fehler beim Laden der Landkreise.')
    }

    console.log(`auto-refresh-all: ${districts.length} Landkreise gefunden`)

    const results: DistrictResult[] = []
    const errors: string[] = []

    // Sequentiell abarbeiten (um API Rate-Limits zu respektieren)
    for (const district of districts) {
      const result: DistrictResult = {
        districtId: district.id,
        districtName: district.name,
        warningsCount: 0,
        riskScore: null,
      }

      try {
        // 1. Warnungen abrufen
        console.log(`[${district.name}] Warnungen abrufen...`)
        result.warningsCount = await refreshWarningsForDistrict(supabase, district)
        console.log(`[${district.name}] ${result.warningsCount} Warnungen verarbeitet`)

        // 2. KI-Risikoanalyse
        console.log(`[${district.name}] KI-Risikoanalyse starten...`)
        result.riskScore = await refreshRiskAnalysisForDistrict(supabase, district)
        console.log(`[${district.name}] Risiko-Score: ${result.riskScore}/100`)

        // 3. last_auto_refresh Timestamp updaten
        await supabase
          .from('districts')
          .update({ last_auto_refresh: new Date().toISOString() })
          .eq('id', district.id)

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
        console.error(`[${district.name}] Fehler:`, msg)
        result.error = msg
        errors.push(`${district.name}: ${msg}`)

        // Trotz Fehler: last_auto_refresh updaten (damit wir wissen, dass ein Versuch stattfand)
        await supabase
          .from('districts')
          .update({ last_auto_refresh: new Date().toISOString() })
          .eq('id', district.id)
      }

      results.push(result)
    }

    console.log(`auto-refresh-all fertig: ${results.length} verarbeitet, ${errors.length} Fehler`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        errors,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('auto-refresh-all error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
