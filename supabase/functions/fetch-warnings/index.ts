import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'

// ─── NINA API Typen ──────────────────────────────────
interface NinaWarning {
  id: string
  version: number
  startDate: string
  expiresDate?: string
  severity: string
  type: string
  title: string
  description?: string
  instruction?: string
  areas?: Array<{ areaDesc: string }>
  // deno-lint-ignore no-explicit-any
  [key: string]: any
}

// ─── Pegelonline API Typen ───────────────────────────
interface PegelStation {
  uuid: string
  number: string
  shortname: string
  longname: string
  km: number
  agency: string
  longitude: number
  latitude: number
  water: { shortname: string; longname: string }
  timeseries?: PegelTimeseries[]
}

interface PegelTimeseries {
  shortname: string
  longname: string
  unit: string
  equidistance: number
  currentMeasurement?: {
    timestamp: string
    value: number
    stateMnwMhw: string
    stateNswHsw: string
  }
  gaugeZero?: {
    unit: string
    value: number
    validFrom: string
  }
}

// ─── Severity Mapping ─────────────────────────────────
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
  // stateMnwMhw: "low", "normal", "high", "unknown", "commented", "out-dated"
  const s = state.toLowerCase()
  if (s === 'high') return 'severe'
  if (s === 'low') return 'moderate'
  return 'minor'
}

// ─── NINA API Abruf ──────────────────────────────────
async function fetchNinaWarnings(agsCode: string): Promise<NinaWarning[]> {
  try {
    // NINA Dashboard API – returns active warnings for a region
    const url = `https://warnung.bund.de/api31/dashboard/${agsCode}.json`
    console.log(`NINA API abrufen: ${url}`)

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      console.warn(`NINA API Fehler für ${agsCode}: HTTP ${response.status}`)
      return []
    }

    const data = await response.json()

    // NINA returns an array of warnings
    if (Array.isArray(data)) {
      return data
    }

    return []
  } catch (err) {
    console.warn('NINA API Fehler:', err)
    return []
  }
}

// ─── DWD API Abruf ───────────────────────────────────
// deno-lint-ignore no-explicit-any
async function fetchDwdWarnings(warncellId: number): Promise<any[]> {
  try {
    // DWD Open Data Warnings API
    const url = `https://dwd.api.bund.dev/weather/warnings`
    console.log(`DWD API abrufen: ${url}`)

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      console.warn(`DWD API Fehler: HTTP ${response.status}`)
      return []
    }

    const data = await response.json()

    // DWD API returns { warnings: { <warncellId>: [...] } }
    const warnings = data?.warnings || {}

    // Alle Warnungen für die passende Warncell-ID filtern
    const cellWarnings = warnings[String(warncellId)] || []

    return Array.isArray(cellWarnings) ? cellWarnings : []
  } catch (err) {
    console.warn('DWD API Fehler:', err)
    return []
  }
}

// ─── Pegelonline API Abruf ────────────────────────────
async function fetchPegelStations(lat: number, lng: number, radius = 50): Promise<PegelStation[]> {
  try {
    const url = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json?latitude=${lat}&longitude=${lng}&radius=${radius}&includeTimeseries=true&includeCurrentMeasurement=true`
    console.log(`Pegelonline API abrufen: Radius ${radius}km um ${lat},${lng}`)

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      console.warn(`Pegelonline API Fehler: HTTP ${response.status}`)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('Pegelonline API Fehler:', err)
    return []
  }
}

// ─── Edge Function Handler ────────────────────────────
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Auth validieren
    const user = await getAuthenticatedUser(req)

    // 2. Input parsen
    const { districtId } = await req.json()
    if (!districtId) {
      throw new Error('districtId ist erforderlich.')
    }

    // 3. Service-Client
    const supabase = getServiceClient()

    // 4. District laden + User-Berechtigung prüfen
    const { data: district, error: districtError } = await supabase
      .from('districts')
      .select('*')
      .eq('id', districtId)
      .eq('user_id', user.id)
      .single()

    if (districtError || !district) {
      throw new Error('Landkreis nicht gefunden oder keine Berechtigung.')
    }

    const agsCode = district.ags_code as string | null
    const warncellId = district.warncell_id as number | null

    // deno-lint-ignore no-explicit-any
    const allWarnings: any[] = []

    // 5. NINA Warnungen abrufen (wenn AGS-Code vorhanden)
    if (agsCode) {
      const ninaWarnings = await fetchNinaWarnings(agsCode)
      console.log(`NINA: ${ninaWarnings.length} Warnungen für AGS ${agsCode}`)

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
    } else {
      console.log('Kein AGS-Code für NINA konfiguriert – überspringe.')
    }

    // 6. DWD Warnungen abrufen (wenn Warncell-ID vorhanden)
    if (warncellId) {
      const dwdWarnings = await fetchDwdWarnings(warncellId)
      console.log(`DWD: ${dwdWarnings.length} Warnungen für Warncell ${warncellId}`)

      // deno-lint-ignore no-explicit-any
      for (const w of dwdWarnings) {
        allWarnings.push({
          district_id: districtId,
          source: 'dwd',
          external_id: w.warnId || `dwd-${Date.now()}-${Math.random()}`,
          severity: mapDwdSeverity(w.level || 1),
          title: w.headline || w.event || 'DWD Warnung',
          description: w.description || null,
          affected_areas: (w.regionName ? [w.regionName] : []),
          effective_at: w.start ? new Date(w.start).toISOString() : new Date().toISOString(),
          expires_at: w.end ? new Date(w.end).toISOString() : null,
          instruction: w.instruction || null,
          raw_data: w,
        })
      }
    } else {
      console.log('Keine Warncell-ID für DWD konfiguriert – überspringe.')
    }

    // 6b. Pegelonline Warnungen abrufen (wenn Koordinaten vorhanden)
    const districtLat = district.latitude as number | null
    const districtLng = district.longitude as number | null

    if (districtLat && districtLng) {
      const pegelStations = await fetchPegelStations(districtLat, districtLng, 50)
      console.log(`Pegelonline: ${pegelStations.length} Stationen im Umkreis`)

      for (const station of pegelStations) {
        // Wasserstand-Timeseries suchen (shortname "W")
        const waterLevel = station.timeseries?.find((ts) => ts.shortname === 'W')
        if (!waterLevel?.currentMeasurement) continue

        const measurement = waterLevel.currentMeasurement
        const state = measurement.stateMnwMhw || 'normal'

        // Nur abnormale Pegelstände als Warnung einfügen (high oder low)
        if (state === 'normal' || state === 'unknown' || state === 'out-dated') continue

        const severity = mapPegelSeverity(state)
        const waterName = station.water?.longname || station.water?.shortname || 'Gewässer'
        const stationName = station.longname || station.shortname
        const valueStr = `${measurement.value} ${waterLevel.unit}`

        const title = state === 'high'
          ? `Hochwasser: ${waterName} bei ${stationName} (${valueStr})`
          : `Niedrigwasser: ${waterName} bei ${stationName} (${valueStr})`

        const description = `Messstation ${stationName} am ${waterName} (km ${station.km}). ` +
          `Aktueller Wasserstand: ${valueStr}. ` +
          `Status: ${state === 'high' ? 'Über Mittleres Hochwasser (MHW)' : 'Unter Mittleres Niedrigwasser (MNW)'}. ` +
          `Messzeitpunkt: ${new Date(measurement.timestamp).toLocaleString('de-DE')}.`

        allWarnings.push({
          district_id: districtId,
          source: 'pegel',
          external_id: `pegel-${station.uuid}-${new Date().toISOString().slice(0, 10)}`,
          severity,
          title,
          description,
          affected_areas: [waterName, stationName],
          effective_at: measurement.timestamp,
          expires_at: null, // Pegelstände haben kein Ablaufdatum – werden täglich erneuert
          instruction: state === 'high'
            ? 'Hochwasserlage beobachten. Ggf. Schutzmaßnahmen einleiten.'
            : 'Niedrigwasserlage beobachten. Ggf. Wasserentnahme einschränken.',
          raw_data: { station, waterLevel: { ...waterLevel } },
        })
      }
    } else {
      console.log('Keine Koordinaten für Pegelonline konfiguriert – überspringe.')
    }

    // 7. Abgelaufene Warnungen bereinigen
    const { count: deletedCount } = await supabase
      .from('external_warnings')
      .delete({ count: 'exact' })
      .eq('district_id', districtId)
      .lt('expires_at', new Date().toISOString())

    console.log(`${deletedCount ?? 0} abgelaufene Warnungen bereinigt`)

    // 8. Neue Warnungen upserten (UNIQUE auf source + external_id)
    let upsertedCount = 0
    for (const w of allWarnings) {
      const { error: upsertError } = await supabase
        .from('external_warnings')
        .upsert(w, { onConflict: 'source,external_id' })

      if (!upsertError) upsertedCount++
      else console.warn('Upsert-Fehler:', upsertError.message)
    }

    // 9. Aktuelle Warnungen laden und zurückgeben
    const { data: currentWarnings } = await supabase
      .from('external_warnings')
      .select('*')
      .eq('district_id', districtId)
      .order('severity', { ascending: false })

    console.log(
      `fetch-warnings fertig: ${upsertedCount} upserted, ${currentWarnings?.length ?? 0} aktiv`
    )

    return new Response(
      JSON.stringify({
        success: true,
        warnings: currentWarnings ?? [],
        fetched: allWarnings.length,
        upserted: upsertedCount,
        deleted: deletedCount ?? 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('fetch-warnings error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unbekannter Fehler beim Abrufen der Warnungen.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
