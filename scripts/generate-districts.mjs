/**
 * Script: Generiert src/data/german-districts.ts aus der AGS-JSON-Datei
 *
 * Ausführen: node scripts/generate-districts.mjs
 */
import { writeFileSync } from 'fs'

const AGS_URL = 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/ags.json'

// Durchschnittliche Fläche pro Bundesland-Typ (Schätzwerte)
const DEFAULT_AREA_KM2 = 1200

async function main() {
  console.log('Lade AGS-Daten...')
  const response = await fetch(AGS_URL)
  const data = await response.json()

  const entries = []
  const seen = new Set()

  for (const [agsRaw, info] of Object.entries(data)) {
    // AGS auf 5 Stellen padden
    const ags = agsRaw.padStart(5, '0')

    // Skip Berlin-Bezirke (11001-11012) – nur 11000 (Gesamt-Berlin) nehmen
    if (ags.startsWith('110') && ags !== '11000') continue

    // Skip alte/doppelte Einträge (z.B. "3152" = Göttingen alt)
    if (!info.population) continue

    // Skip wenn schon gesehen
    if (seen.has(ags)) continue
    seen.add(ags)

    // Name bereinigen: "SK " / "LK " Prefix entfernen für Display
    let displayName = info.name
    const isStadt = info.name.startsWith('SK ')
    const isLandkreis = info.name.startsWith('LK ')

    if (isStadt) {
      displayName = info.name.replace('SK ', '')
    } else if (isLandkreis) {
      displayName = 'Landkreis ' + info.name.replace('LK ', '')
    }

    // Sonderfälle
    if (ags === '11000') displayName = 'Berlin'
    if (ags === '02000') displayName = 'Hamburg'
    if (info.name === 'Region Hannover') displayName = 'Region Hannover'
    if (info.name.startsWith('StadtRegion')) displayName = info.name

    // Warncell-ID: "1" + AGS + "000" (9 Stellen)
    const warncellId = parseInt('1' + ags + '000')

    // Fläche schätzen aus Population (kreisfreie Städte sind kleiner)
    let areaKm2 = DEFAULT_AREA_KM2
    if (isStadt || ags === '11000' || ags === '02000') {
      // Kreisfreie Städte: ca. 100-900 km²
      areaKm2 = Math.max(50, Math.round(info.population / 2000))
    } else {
      // Landkreise: ca. 500-3000 km²
      areaKm2 = Math.max(400, Math.round(info.population / 100))
    }

    entries.push({
      name: displayName,
      state: info.state,
      population: info.population,
      areaKm2,
      lat: info.lat,
      lng: info.lon,
      agsCode: ags,
      warncellId,
    })
  }

  // Sortieren nach Bundesland, dann Name
  entries.sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state, 'de')
    return a.name.localeCompare(b.name, 'de')
  })

  console.log(`${entries.length} Kreise/Städte generiert`)

  // TypeScript-Datei generieren
  let ts = `// ============================================
// Alle deutschen Landkreise und kreisfreien Städte
// Generiert aus: ${AGS_URL}
// Anzahl: ${entries.length} Einträge
// ============================================

export interface GermanDistrict {
  name: string
  state: string
  population: number
  areaKm2: number
  lat: number
  lng: number
  agsCode: string
  warncellId: number
}

export const germanDistricts: GermanDistrict[] = [\n`

  for (const e of entries) {
    // Escape single quotes in names
    const name = e.name.replace(/'/g, "\\'")
    const state = e.state.replace(/'/g, "\\'")
    ts += `  { name: '${name}', state: '${state}', population: ${e.population}, areaKm2: ${e.areaKm2}, lat: ${e.lat}, lng: ${e.lng}, agsCode: '${e.agsCode}', warncellId: ${e.warncellId} },\n`
  }

  ts += `]\n`

  const outUrl = new URL('../src/data/german-districts.ts', import.meta.url)
  const outPath = decodeURIComponent(outUrl.pathname)
  writeFileSync(outPath, ts, 'utf-8')
  console.log(`Geschrieben: ${outPath}`)
}

main().catch(console.error)
