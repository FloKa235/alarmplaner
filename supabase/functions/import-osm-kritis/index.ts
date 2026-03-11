import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'

// ─── BBK KRITIS-Sektoren → OSM-Tag Mapping ──────────────
interface OsmTagMapping {
  overpassFilter: string
  category: string
  sector: string
  labelDe: string
}

const OSM_KRITIS_MAPPINGS: OsmTagMapping[] = [
  // ── Sektor 1: Energie ──────────────────────────────────
  { overpassFilter: '["power"="plant"]', category: 'kraftwerk', sector: 'energie', labelDe: 'Kraftwerk' },
  { overpassFilter: '["power"="substation"]', category: 'umspannwerk', sector: 'energie', labelDe: 'Umspannwerk' },
  { overpassFilter: '["power"="generator"]["generator:source"="solar"]', category: 'solarpark', sector: 'energie', labelDe: 'Solaranlage' },
  { overpassFilter: '["power"="generator"]["generator:source"="wind"]', category: 'windkraftanlage', sector: 'energie', labelDe: 'Windkraftanlage' },
  { overpassFilter: '["amenity"="fuel"]', category: 'tankstelle', sector: 'energie', labelDe: 'Tankstelle' },

  // ── Sektor 2: Wasser ───────────────────────────────────
  { overpassFilter: '["man_made"="water_works"]', category: 'wasserwerk', sector: 'wasser', labelDe: 'Wasserwerk' },
  { overpassFilter: '["man_made"="water_tower"]', category: 'wasserturm', sector: 'wasser', labelDe: 'Wasserturm' },
  { overpassFilter: '["man_made"="reservoir_covered"]', category: 'hochbehaelter', sector: 'wasser', labelDe: 'Hochbehälter' },
  { overpassFilter: '["man_made"="wastewater_plant"]', category: 'klaerwerk', sector: 'wasser', labelDe: 'Klärwerk' },
  { overpassFilter: '["man_made"="pumping_station"]', category: 'pumpstation', sector: 'wasser', labelDe: 'Pumpstation' },

  // ── Sektor 3: Ernährung ────────────────────────────────
  { overpassFilter: '["shop"="supermarket"]', category: 'supermarkt', sector: 'ernaehrung', labelDe: 'Supermarkt' },
  { overpassFilter: '["shop"="convenience"]', category: 'nahversorger', sector: 'ernaehrung', labelDe: 'Nahversorger' },
  { overpassFilter: '["amenity"="marketplace"]', category: 'marktplatz', sector: 'ernaehrung', labelDe: 'Marktplatz' },

  // ── Sektor 4: Gesundheit ───────────────────────────────
  { overpassFilter: '["amenity"="hospital"]', category: 'krankenhaus', sector: 'gesundheit', labelDe: 'Krankenhaus' },
  { overpassFilter: '["amenity"="clinic"]', category: 'klinik', sector: 'gesundheit', labelDe: 'Klinik' },
  { overpassFilter: '["amenity"="pharmacy"]', category: 'apotheke', sector: 'gesundheit', labelDe: 'Apotheke' },
  { overpassFilter: '["amenity"="doctors"]', category: 'arztpraxis', sector: 'gesundheit', labelDe: 'Arztpraxis' },
  { overpassFilter: '["amenity"="nursing_home"]', category: 'seniorenheim', sector: 'gesundheit', labelDe: 'Seniorenheim' },
  { overpassFilter: '["social_facility"="nursing_home"]', category: 'seniorenheim', sector: 'gesundheit', labelDe: 'Seniorenheim' },
  { overpassFilter: '["amenity"="dentist"]', category: 'zahnarzt', sector: 'gesundheit', labelDe: 'Zahnarzt' },

  // ── Sektor 5: Transport ────────────────────────────────
  { overpassFilter: '["railway"="station"]', category: 'bahnhof', sector: 'transport', labelDe: 'Bahnhof' },
  { overpassFilter: '["railway"="halt"]', category: 'haltepunkt', sector: 'transport', labelDe: 'Haltepunkt' },
  { overpassFilter: '["amenity"="bus_station"]', category: 'busbahnhof', sector: 'transport', labelDe: 'Busbahnhof' },
  { overpassFilter: '["aeroway"="aerodrome"]', category: 'flugplatz', sector: 'transport', labelDe: 'Flugplatz' },
  { overpassFilter: '["aeroway"="helipad"]', category: 'hubschrauberlandeplatz', sector: 'transport', labelDe: 'Hubschrauberlandeplatz' },

  // ── Sektor 6: IT/Telekommunikation ─────────────────────
  { overpassFilter: '["man_made"="mast"]["tower:type"="communication"]', category: 'funkmast', sector: 'it_telekom', labelDe: 'Funkmast' },
  { overpassFilter: '["man_made"="tower"]["tower:type"="communication"]', category: 'funkturm', sector: 'it_telekom', labelDe: 'Funkturm' },
  { overpassFilter: '["telecom"="exchange"]', category: 'vermittlungsstelle', sector: 'it_telekom', labelDe: 'Vermittlungsstelle' },

  // ── Sektor 7: Finanz ───────────────────────────────────
  { overpassFilter: '["amenity"="bank"]', category: 'bank', sector: 'finanz', labelDe: 'Bank' },
  { overpassFilter: '["amenity"="atm"]', category: 'geldautomat', sector: 'finanz', labelDe: 'Geldautomat' },

  // ── Sektor 8: Staat/Verwaltung ─────────────────────────
  { overpassFilter: '["amenity"="townhall"]', category: 'rathaus', sector: 'staat', labelDe: 'Rathaus' },
  { overpassFilter: '["amenity"="fire_station"]', category: 'feuerwehr', sector: 'staat', labelDe: 'Feuerwehr' },
  { overpassFilter: '["amenity"="police"]', category: 'polizei', sector: 'staat', labelDe: 'Polizei' },
  { overpassFilter: '["amenity"="courthouse"]', category: 'gericht', sector: 'staat', labelDe: 'Gericht' },
  { overpassFilter: '["amenity"="prison"]', category: 'gefaengnis', sector: 'staat', labelDe: 'Gefängnis' },
  { overpassFilter: '["office"="government"]', category: 'behoerde', sector: 'staat', labelDe: 'Behörde' },

  // ── Sektor 9: Medien/Kultur ────────────────────────────
  { overpassFilter: '["amenity"="library"]', category: 'bibliothek', sector: 'medien', labelDe: 'Bibliothek' },
  { overpassFilter: '["amenity"="theatre"]', category: 'theater', sector: 'medien', labelDe: 'Theater' },
  { overpassFilter: '["amenity"="cinema"]', category: 'kino', sector: 'medien', labelDe: 'Kino' },
  { overpassFilter: '["amenity"="community_centre"]', category: 'buergerhaus', sector: 'medien', labelDe: 'Bürgerhaus' },

  // ── Sektor 11: Wasserbau ───────────────────────────────
  { overpassFilter: '["waterway"="dam"]', category: 'staudamm', sector: 'wasserbau', labelDe: 'Staudamm' },
  { overpassFilter: '["waterway"="weir"]', category: 'wehr', sector: 'wasserbau', labelDe: 'Wehr' },
  { overpassFilter: '["man_made"="dyke"]', category: 'deich', sector: 'wasserbau', labelDe: 'Deich' },

  // ── Sektor 12: Militär ─────────────────────────────────
  { overpassFilter: '["landuse"="military"]', category: 'militaergebiet', sector: 'militaer', labelDe: 'Militärgebiet' },
  { overpassFilter: '["military"="barracks"]', category: 'kaserne', sector: 'militaer', labelDe: 'Kaserne' },
]

// ─── Batch-Aufteilung (Fallback: 2 parallele statt 5 sequentielle) ──
const FALLBACK_BATCHES = [
  ['energie', 'wasser', 'ernaehrung', 'gesundheit', 'transport'],
  ['it_telekom', 'finanz', 'staat', 'medien', 'wasserbau', 'militaer'],
]

// ─── Haversine-Distanz (km) ──────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Nächste Gemeinde finden ─────────────────────────────
function findNearestMunicipality(
  lat: number,
  lon: number,
  municipalities: Array<{ id: string; latitude: number; longitude: number }>
): string | null {
  if (municipalities.length === 0) return null
  let nearest = municipalities[0]
  let minDist = haversineKm(lat, lon, nearest.latitude, nearest.longitude)
  for (let i = 1; i < municipalities.length; i++) {
    const d = haversineKm(lat, lon, municipalities[i].latitude, municipalities[i].longitude)
    if (d < minDist) { minDist = d; nearest = municipalities[i] }
  }
  return nearest.id
}

// ─── Overpass API ────────────────────────────────────────
interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

async function queryOverpass(query: string, retries = 3): Promise<OverpassElement[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Overpass (Versuch ${attempt}/${retries})...`)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 55000) // 55s hard limit
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (response.status === 429 || response.status === 504) {
        const waitMs = attempt * 3000
        console.warn(`Overpass ${response.status} – warte ${waitMs}ms...`)
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }
      if (!response.ok) { console.warn(`Overpass HTTP ${response.status}`); return [] }
      const data = await response.json()
      return (data.elements || []) as OverpassElement[]
    } catch (err) {
      console.warn(`Overpass Versuch ${attempt} fehlgeschlagen:`, err)
      if (attempt < retries) await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }
  return []
}

function extractName(el: OverpassElement, fallbackLabel: string): string {
  return el.tags?.name || el.tags?.['name:de'] || el.tags?.operator || el.tags?.description || `${fallbackLabel} (OSM ${el.id})`
}

function extractCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (el.lat !== undefined && el.lon !== undefined) return { lat: el.lat, lon: el.lon }
  if (el.center) return { lat: el.center.lat, lon: el.center.lon }
  return null
}

function extractAddress(tags?: Record<string, string>): string | null {
  if (!tags) return null
  const parts: string[] = []
  if (tags['addr:street']) {
    parts.push(tags['addr:street'] + (tags['addr:housenumber'] ? ` ${tags['addr:housenumber']}` : ''))
  }
  if (tags['addr:postcode'] || tags['addr:city']) {
    parts.push([tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' '))
  }
  return parts.length > 0 ? parts.join(', ') : null
}

function matchesFilter(el: OverpassElement, filter: string): boolean {
  if (!el.tags) return false
  const tagMatches = filter.matchAll(/\["([^"]+)"(?:="([^"]*)")?(?:~"([^"]*)")?\]/g)
  for (const match of tagMatches) {
    const key = match[1], exactValue = match[2], regexValue = match[3]
    if (!(key in el.tags)) return false
    if (exactValue !== undefined && el.tags[key] !== exactValue) return false
    if (regexValue !== undefined && !new RegExp(regexValue).test(el.tags[key])) return false
  }
  return true
}

// ─── KRITIS-DachG Compliance Templates (server-side) ──────
const COMPLIANCE_TEMPLATES = [
  { nummer: 1, title: 'Risikobewertungen', beschreibung: 'Systematische Bewertung aller Risiken nach dem All-Gefahren-Ansatz', gesetzesreferenz: '§ 10 KRITIS-DachG',
    items: [
      { id: '1.1', text: 'All-Gefahren-Ansatz implementiert (Natur, Mensch, technisch)' },
      { id: '1.2', text: 'Naturgefahren identifiziert und bewertet' },
      { id: '1.3', text: 'Vom Menschen verursachte Gefahren bewertet' },
      { id: '1.4', text: 'Sektoruebergreifende Abhaengigkeiten analysiert' },
      { id: '1.5', text: 'Risikobewertung dokumentiert und beim BSI eingereicht' },
      { id: '1.6', text: 'Aktualisierungszyklus festgelegt (mind. alle 4 Jahre)' },
    ] },
  { nummer: 2, title: 'Resilienzmassnahmen', beschreibung: 'Technische und organisatorische Massnahmen zur Widerstandsfaehigkeit', gesetzesreferenz: '§ 11 KRITIS-DachG',
    items: [
      { id: '2.1', text: 'Massnahmen zur Verhinderung von Vorfaellen implementiert' },
      { id: '2.2', text: 'Physische Schutzmassnahmen vorhanden' },
      { id: '2.3', text: 'Massnahmen zur Schadensbegrenzung etabliert' },
      { id: '2.4', text: 'Redundanzen fuer kritische Systeme eingerichtet' },
      { id: '2.5', text: 'Wiederherstellungsverfahren definiert und getestet' },
      { id: '2.6', text: 'Resilienzplan dem BSI vorgelegt' },
      { id: '2.7', text: 'Massnahmen verhaeltnismaessig zum Risiko' },
    ] },
  { nummer: 3, title: 'Vorfallmeldungen', beschreibung: 'Pflicht zur Meldung erheblicher Stoerungen an das BSI', gesetzesreferenz: '§ 12 KRITIS-DachG',
    items: [
      { id: '3.1', text: 'Meldeprozess fuer erhebliche Stoerungen definiert' },
      { id: '3.2', text: 'Fruehwarnung innerhalb 24 Stunden sichergestellt' },
      { id: '3.3', text: 'Vorfallmeldung innerhalb 72 Stunden sichergestellt' },
      { id: '3.4', text: 'Abschlussbericht innerhalb eines Monats vorgesehen' },
      { id: '3.5', text: 'Verantwortliche Ansprechperson fuer BSI benannt' },
    ] },
  { nummer: 4, title: 'Betriebskontinuitaetsplaene', beschreibung: 'Aufrechterhaltung oder schnelle Wiederherstellung kritischer Dienste', gesetzesreferenz: '§ 13 KRITIS-DachG',
    items: [
      { id: '4.1', text: 'Business-Continuity-Plan fuer alle kritischen Dienste erstellt' },
      { id: '4.2', text: 'Mindestversorgungsniveaus fuer den Krisenfall definiert' },
      { id: '4.3', text: 'Notfall-Lieferketten und alternative Zulieferer identifiziert' },
      { id: '4.4', text: 'Wiederanlaufplaene mit Zeitzielen dokumentiert' },
      { id: '4.5', text: 'BCP regelmaessig getestet (mind. jaehrlich)' },
      { id: '4.6', text: 'Testergebnisse dokumentiert und Verbesserungen umgesetzt' },
    ] },
  { nummer: 5, title: 'Sicherheitskonzepte', beschreibung: 'Umfassende Sicherheitskonzepte fuer KRITIS-Schutz', gesetzesreferenz: '§ 14 KRITIS-DachG',
    items: [
      { id: '5.1', text: 'Ganzheitliches Sicherheitskonzept erstellt' },
      { id: '5.2', text: 'Bedrohungsszenarien definiert und Gegenmassnahmen zugeordnet' },
      { id: '5.3', text: 'Sicherheitszonen und Schutzbereiche festgelegt' },
      { id: '5.4', text: 'Krisenmanagement-Organisation definiert' },
      { id: '5.5', text: 'Kommunikationsplan fuer Krisensituationen vorhanden' },
      { id: '5.6', text: 'Schulungs- und Sensibilisierungsprogramm etabliert' },
      { id: '5.7', text: 'Sicherheitskonzept dem BSI vorlegbar' },
    ] },
  { nummer: 6, title: 'Regelmaessige Ueberpruefungen', beschreibung: 'Audits, Inspektionen und Nachweise gegenueber dem BSI', gesetzesreferenz: '§ 15 KRITIS-DachG',
    items: [
      { id: '6.1', text: 'Regelmaessige Sicherheitsaudits durchgefuehrt (alle 3 Jahre)' },
      { id: '6.2', text: 'Audit-Ergebnisse dokumentiert und Massnahmen abgeleitet' },
      { id: '6.3', text: 'Interne Ueberpruefungen zwischen den Audits vorgesehen' },
      { id: '6.4', text: 'Nachweise gegenueber dem BSI vorlegbar' },
      { id: '6.5', text: 'Fristen und Zustaendigkeiten fuer Audits festgelegt' },
    ] },
  { nummer: 7, title: 'Registrierung beim BSI', beschreibung: 'Registrierung als KRITIS-Betreiber beim BSI', gesetzesreferenz: '§ 16 KRITIS-DachG',
    items: [
      { id: '7.1', text: 'Alle KRITIS-Anlagen identifiziert und klassifiziert' },
      { id: '7.2', text: 'Registrierung beim BSI durchgefuehrt' },
      { id: '7.3', text: 'Kontaktstelle fuer BSI benannt und gemeldet' },
      { id: '7.4', text: 'Aenderungen zeitnah gemeldet' },
    ] },
  { nummer: 8, title: 'Personelle Sicherheit', beschreibung: 'Anforderungen an Personal mit Zugang zu kritischen Bereichen', gesetzesreferenz: '§ 17 KRITIS-DachG',
    items: [
      { id: '8.1', text: 'Zuverlaessigkeitsueberpruefung fuer Schluessel-Personal' },
      { id: '8.2', text: 'Zugangsberechtigungskonzept erstellt' },
      { id: '8.3', text: 'Regelmaessige Sicherheitsschulungen' },
      { id: '8.4', text: 'Sensibilisierung fuer Insider-Bedrohungen' },
      { id: '8.5', text: 'Verfahren fuer Personalwechsel definiert' },
      { id: '8.6', text: 'Notfall-Personalplanung vorhanden' },
    ] },
  { nummer: 9, title: 'Physische Sicherheit', beschreibung: 'Physische Schutzmassnahmen fuer Anlagen', gesetzesreferenz: '§ 18 KRITIS-DachG',
    items: [
      { id: '9.1', text: 'Perimeterschutz vorhanden und gewartet' },
      { id: '9.2', text: 'Zutrittskontrollsystem installiert' },
      { id: '9.3', text: 'Videoueberwachung an neuralgischen Punkten' },
      { id: '9.4', text: 'Einbruchmeldeanlage installiert und geprueft' },
      { id: '9.5', text: 'Brandschutzkonzept umgesetzt' },
      { id: '9.6', text: 'Hochwasser- und Unwetterschutz vorhanden' },
      { id: '9.7', text: 'Notstromversorgung betriebsbereit und getestet' },
    ] },
  { nummer: 10, title: 'Cybersicherheit', beschreibung: 'IT- und OT-Sicherheitsmassnahmen gemaess BSI-Vorgaben', gesetzesreferenz: '§ 19 KRITIS-DachG i.V.m. § 8a BSIG',
    items: [
      { id: '10.1', text: 'ISMS nach ISO 27001 oder BSI IT-Grundschutz' },
      { id: '10.2', text: 'Netzwerksegmentierung zwischen IT und OT' },
      { id: '10.3', text: 'Regelmaessige Schwachstellen-Scans und Penetrationstests' },
      { id: '10.4', text: 'SOC oder SIEM-System betrieben' },
      { id: '10.5', text: 'Incident-Response-Plan vorhanden und getestet' },
      { id: '10.6', text: 'Systeme zur Angriffserkennung implementiert' },
    ] },
]

// ─── Edge Function Handler ────────────────────────────────
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
      .from('districts').select('*').eq('id', districtId).eq('user_id', user.id).single()
    if (districtError || !district) throw new Error('Landkreis nicht gefunden oder keine Berechtigung.')

    // Gemeinden für Zuordnung
    const { data: municipalities } = await supabase
      .from('municipalities').select('id, name, latitude, longitude').eq('district_id', districtId)
    const muns = municipalities ?? []

    // AGS-Code
    const agsCode = district.ags_code as string | null
    if (!agsCode || agsCode.length < 5) throw new Error('Landkreis hat keinen gültigen AGS-Code.')
    const ags5 = agsCode.substring(0, 5)

    console.log(`KRITIS-Import (BBK-Sektoren) für "${district.name}" – AGS: ${ags5}`)

    // ─── Overpass: 1 Query statt 5 sequentielle ─────────────
    // deno-lint-ignore no-explicit-any
    const allSites: any[] = []
    const seenOsmIds = new Set<string>()

    // Hilfsfunktion: Overpass-Query bauen + Elemente verarbeiten
    function buildQuery(mappings: OsmTagMapping[]): string {
      const filterStatements = mappings.map((m) =>
        `  nwr${m.overpassFilter}(area.kreis);`
      ).join('\n')
      return `[out:json][timeout:60];
relation["de:amtlicher_gemeindeschluessel"~"^${ags5}"]["admin_level"="6"];
map_to_area->.kreis;
(
${filterStatements}
);
out center tags;`
    }

    function processElements(elements: OverpassElement[], mappings: OsmTagMapping[]) {
      for (const el of elements) {
        const coords = extractCoords(el)
        if (!coords) continue

        const osmKey = `${el.type}-${el.id}`
        if (seenOsmIds.has(osmKey)) continue
        seenOsmIds.add(osmKey)

        let matched: OsmTagMapping | undefined
        for (const mapping of mappings) {
          if (matchesFilter(el, mapping.overpassFilter)) { matched = mapping; break }
        }
        if (!matched) matched = mappings[0]

        allSites.push({
          district_id: districtId,
          municipality_id: findNearestMunicipality(coords.lat, coords.lon, muns),
          name: extractName(el, matched.labelDe),
          category: matched.category,
          sector: matched.sector,
          latitude: coords.lat,
          longitude: coords.lon,
          address: extractAddress(el.tags),
          risk_exposure: 'mittel',
          metadata: {
            osm_type: el.type,
            osm_id: el.id,
            osm_tags: el.tags || {},
            imported_at: new Date().toISOString(),
            source: 'openstreetmap',
          },
        })
      }
    }

    // Strategie: 1 Query mit allen Filtern (schnellster Weg)
    console.log(`Single-Query: alle ${OSM_KRITIS_MAPPINGS.length} Filter in einer Anfrage`)
    const singleQuery = buildQuery(OSM_KRITIS_MAPPINGS)
    const singleResult = await queryOverpass(singleQuery, 2)

    if (singleResult.length > 0) {
      console.log(`  → ${singleResult.length} OSM-Elemente (Single-Query Erfolg)`)
      processElements(singleResult, OSM_KRITIS_MAPPINGS)
    } else {
      // Fallback: 2 parallele Batches statt 5 sequentielle
      console.log('Single-Query fehlgeschlagen → Fallback: 2 parallele Batches')
      const batchResults = await Promise.all(
        FALLBACK_BATCHES.map(async (sectors, idx) => {
          const mappings = OSM_KRITIS_MAPPINGS.filter((m) => sectors.includes(m.sector))
          console.log(`Batch ${idx + 1}/2: ${sectors.join(', ')} (${mappings.length} Filter)`)
          const elements = await queryOverpass(buildQuery(mappings))
          console.log(`  → ${elements.length} OSM-Elemente`)
          return { elements, mappings }
        })
      )
      for (const { elements, mappings } of batchResults) {
        processElements(elements, mappings)
      }
    }

    console.log(`Gesamt: ${allSites.length} KRITIS-Objekte aus OSM (12 BBK-Sektoren)`)

    // ─── In DB einfügen ────────────────────────────────────
    let insertedCount = 0
    let skippedCount = 0

    // Bestehende für Duplikat-Check
    const { data: existingSites } = await supabase
      .from('kritis_sites').select('id, metadata').eq('district_id', districtId)

    const existingOsmIds = new Set<string>()
    for (const site of existingSites ?? []) {
      // deno-lint-ignore no-explicit-any
      const meta = site.metadata as any
      if (meta?.osm_id && meta?.osm_type) existingOsmIds.add(`${meta.osm_type}-${meta.osm_id}`)
    }

    const newSites = allSites.filter((s) => {
      const key = `${s.metadata.osm_type}-${s.metadata.osm_id}`
      if (existingOsmIds.has(key)) { skippedCount++; return false }
      return true
    })

    console.log(`${newSites.length} neue, ${skippedCount} bereits vorhanden`)

    const BATCH_SIZE = 50
    const insertErrors: string[] = []
    for (let i = 0; i < newSites.length; i += BATCH_SIZE) {
      const chunk = newSites.slice(i, i + BATCH_SIZE)
      const { error: insertError, data: inserted } = await supabase
        .from('kritis_sites').insert(chunk).select('id')
      if (insertError) {
        console.warn(`Insert Fehler (${i}):`, insertError.message)
        insertErrors.push(`Batch ${i}: ${insertError.message}`)
      } else {
        insertedCount += inserted?.length ?? 0
      }
    }

    console.log(`KRITIS-Import fertig: ${insertedCount} eingefügt, ${skippedCount} übersprungen`)
    if (insertErrors.length > 0) console.warn('Insert-Fehler:', insertErrors)

    // Sektor-Statistik
    const sectorStats: Record<string, number> = {}
    for (const s of allSites) {
      sectorStats[s.sector] = (sectorStats[s.sector] || 0) + 1
    }

    // ─── Compliance-Checklisten auto-generieren ──────────
    let complianceCreated = false
    try {
      const { data: existingChecklists } = await supabase
        .from('checklists')
        .select('id')
        .eq('district_id', districtId)
        .eq('category', 'kritis_compliance')
        .is('scenario_id', null)
        .limit(1)

      if (!existingChecklists || existingChecklists.length === 0) {
        // Checklisten aus KRITIS-DachG Template erstellen
        const complianceRows = COMPLIANCE_TEMPLATES.map(cat => ({
          district_id: districtId,
          scenario_id: null,
          title: `${cat.nummer}. ${cat.title}`,
          description: `${cat.beschreibung} (${cat.gesetzesreferenz})`,
          category: 'kritis_compliance',
          is_template: false,
          items: cat.items.map(item => ({
            id: item.id,
            text: item.text,
            status: 'open',
            completed_at: null,
            completed_by: null,
          })),
        }))

        const { error: compError } = await supabase.from('checklists').insert(complianceRows)
        if (compError) {
          console.warn('Compliance-Checklisten Fehler:', compError.message)
        } else {
          complianceCreated = true
          console.log('Compliance-Checklisten automatisch erstellt (10 Kategorien)')
        }
      } else {
        console.log('Compliance-Checklisten existieren bereits — übersprungen')
      }
    } catch (compErr) {
      console.warn('Compliance auto-create fehlgeschlagen:', compErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedCount,
        skipped: skippedCount,
        total_found: allSites.length,
        sectors: sectorStats,
        insert_errors: insertErrors.length > 0 ? insertErrors : undefined,
        compliance_created: complianceCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('import-osm-kritis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim OSM-Import.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
