import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'

// ─── Overpass API: Echte Gemeinden per AGS-Code ─────────
interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// Fallback-Endpoints falls Haupt-API langsam/blockiert
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

async function queryOverpass(query: string, retries = 2): Promise<OverpassElement[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Overpass ${endpoint.split('//')[1]?.split('/')[0]} (Versuch ${attempt}/${retries})...`)

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 45000) // 45s hard limit

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (response.status === 429 || response.status === 504) {
          console.warn(`Overpass ${response.status} – versuche nächsten Endpoint`)
          break // Nächsten Endpoint versuchen
        }

        if (!response.ok) {
          console.warn(`Overpass HTTP ${response.status}`)
          break
        }

        const data = await response.json()
        const elements = (data.elements || []) as OverpassElement[]
        console.log(`Overpass Erfolg: ${elements.length} Elemente`)
        return elements
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`Overpass Versuch ${attempt} fehlgeschlagen: ${msg}`)
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 2000))
        }
      }
    }
  }
  console.error('Alle Overpass-Endpoints fehlgeschlagen')
  return []
}

function extractCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat !== undefined && el.lon !== undefined) return { lat: el.lat, lon: el.lon }
  if (el.center) return { lat: el.center.lat, lon: el.center.lon }
  return null
}

// ─── Edge Function Handler ───────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthenticatedUser(req)
    const { districtId } = await req.json()
    if (!districtId) throw new Error('districtId ist erforderlich.')

    const supabase = getServiceClient()

    // District laden
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
    if (!agsCode || agsCode.length < 5) {
      throw new Error('Landkreis hat keinen gültigen AGS-Code.')
    }

    // 5-stelliger Kreisschlüssel (erste 5 Stellen des AGS)
    const ags5 = agsCode.substring(0, 5)

    console.log(`Gemeinden-Import für "${district.name}" – AGS-Prefix: ${ags5}`)

    // Overpass-Abfrage: Alle admin_level=8 Relationen deren AGS mit dem Kreis-AGS beginnt
    // Das ist die zuverlässigste Methode – liefert exakt die echten Gemeinden
    const query = `[out:json][timeout:60];
relation["de:amtlicher_gemeindeschluessel"~"^${ags5}"]
  ["admin_level"="8"]
  ["boundary"="administrative"];
out center tags;`

    const elements = await queryOverpass(query)
    console.log(`${elements.length} Gemeinden aus OSM gefunden (AGS ^${ags5})`)

    // Bestehende Gemeinden laden für Duplikat-Check
    const { data: existingMunicipalities } = await supabase
      .from('municipalities')
      .select('id, name, latitude, longitude')
      .eq('district_id', districtId)

    const existingNames = new Set(
      (existingMunicipalities ?? []).map((m) => m.name.toLowerCase())
    )

    // Filtern + Aufbereiten
    interface MunicipalityInsert {
      district_id: string
      name: string
      population: number
      area_km2: number
      latitude: number
      longitude: number
      risk_level: string
      risk_score: number
    }

    const newMunicipalities: MunicipalityInsert[] = []
    const seenNames = new Set<string>()

    for (const el of elements) {
      const coords = extractCoords(el)
      if (!coords) continue

      const name = el.tags?.name || el.tags?.['name:de']
      if (!name) continue

      const nameLower = name.toLowerCase()

      // Duplikat-Check (existierende + innerhalb dieses Imports)
      if (existingNames.has(nameLower) || seenNames.has(nameLower)) continue
      seenNames.add(nameLower)

      // Population aus OSM (oft vorhanden bei Gemeinde-Relationen)
      const population = el.tags?.population ? parseInt(el.tags.population) : 0

      // Fläche schätzen basierend auf admin_level info
      // Besser: könnte man aus der Relation berechnen, aber center+tags reicht
      const placeType = el.tags?.place || el.tags?.['de:place'] || 'village'
      let estimatedArea = 20
      if (placeType === 'city') estimatedArea = 100
      else if (placeType === 'town') estimatedArea = 50

      newMunicipalities.push({
        district_id: districtId,
        name,
        population: isNaN(population) ? 0 : population,
        area_km2: estimatedArea,
        latitude: coords.lat,
        longitude: coords.lon,
        risk_level: 'niedrig',
        risk_score: 0,
      })
    }

    console.log(`${newMunicipalities.length} neue Gemeinden nach Filterung`)

    // In DB einfügen (Batches von 50)
    let insertedCount = 0
    const BATCH_SIZE = 50
    for (let i = 0; i < newMunicipalities.length; i += BATCH_SIZE) {
      const chunk = newMunicipalities.slice(i, i + BATCH_SIZE)
      const { error: insertError, data: inserted } = await supabase
        .from('municipalities')
        .insert(chunk)
        .select('id')

      if (insertError) {
        console.warn(`Insert-Batch Fehler:`, insertError.message)
      } else {
        insertedCount += inserted?.length ?? 0
      }
    }

    console.log(`Gemeinden-Import fertig: ${insertedCount} eingefügt, ${existingMunicipalities?.length ?? 0} bereits vorhanden`)

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedCount,
        existing: existingMunicipalities?.length ?? 0,
        total_found: elements.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('import-osm-municipalities error:', error)
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
