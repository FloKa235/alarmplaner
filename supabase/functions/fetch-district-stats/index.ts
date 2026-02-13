import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts'

// ─── Destatis Genesis API (www-genesis.destatis.de) ──────────
// Credentials: username + password als HTTP-Headers
// Parameter: application/x-www-form-urlencoded im Body
// Methode: data/table (gibt JSON mit Text-Content zurück)
const GENESIS_BASE = 'https://www-genesis.destatis.de/genesisWS/rest/2020'

interface DistrictStats {
  population?: {
    total: number
    year: string
  }
  density?: number
}

// ─── Helper: Genesis API POST Request ────────────────
async function genesisRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<string | null> {
  const username = Deno.env.get('GENESIS_USERNAME')
  const password = Deno.env.get('GENESIS_PASSWORD')

  if (!username || !password) {
    console.warn('GENESIS Credentials nicht konfiguriert')
    return null
  }

  try {
    const bodyParams = new URLSearchParams({
      language: 'de',
      ...params,
    })

    const response = await fetch(`${GENESIS_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        username,
        password,
      },
      body: bodyParams.toString(),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.warn(`Genesis API HTTP ${response.status}: ${errText.substring(0, 200)}`)
      return null
    }

    return await response.text()
  } catch (err) {
    console.warn('Genesis API Fehler:', err)
    return null
  }
}

// ─── Bevölkerungsdaten aus data/table Response parsen ────────
// Format: Tabelle 12411-0015 gibt z.B.:
// 06531;Gießen, Landkreis;268141;268418
function parsePopulationTable(content: string, agsCode: string): { total: number; year: string } | null {
  try {
    const lines = content.split('\n')

    // Finde die Zeile mit dem AGS-Code
    for (const line of lines) {
      if (line.startsWith(agsCode)) {
        const parts = line.split(';')
        if (parts.length < 3) continue

        // Letzte Spalte ist das neueste Jahr
        const lastValue = parts[parts.length - 1]?.trim()
        const population = parseInt(lastValue?.replace(/\s/g, ''))

        if (!isNaN(population) && population > 0) {
          // Jahr aus den Header-Zeilen extrahieren
          let year = ''
          for (const headerLine of lines) {
            const match = headerLine.match(/(\d{2}\.\d{2}\.(\d{4}))/)
            if (match) {
              year = match[2] // Nimm das letzte gefundene Jahr
            }
          }

          return { total: population, year: year || 'aktuell' }
        }
      }
    }

    return null
  } catch {
    return null
  }
}

// ─── Edge Function Handler ───────────────────────────
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
    if (!agsCode) {
      throw new Error('Kein AGS-Code für diesen Landkreis hinterlegt.')
    }

    // AGS: 5-stellig für Kreise (z.B. "06531")
    const ags5 = agsCode.substring(0, 5)

    console.log(`Statistiken abrufen für AGS ${ags5} (${district.name})`)

    const stats: DistrictStats = {}

    // Bevölkerung via data/table (Tabelle 12411-0015: Bevölkerung: Kreise, Stichtag)
    const tableResponse = await genesisRequest('data/table', {
      name: '12411-0015',
      area: 'all',
      compress: 'false',
      regionalvariable: 'KREISE',
      regionalkey: `${ags5}*`,
      startyear: '2022',
      endyear: '2025',
    })

    if (tableResponse) {
      try {
        const parsed = JSON.parse(tableResponse)
        const statusCode = parsed?.Status?.Code

        if (statusCode === 0 && parsed?.Object?.Content) {
          console.log('Genesis API: Daten erfolgreich abgerufen')
          const popData = parsePopulationTable(parsed.Object.Content, ags5)
          if (popData) {
            stats.population = popData
            console.log(`Bevölkerung: ${popData.total} (${popData.year})`)
          }
        } else {
          console.warn(`Genesis Status ${statusCode}: ${parsed?.Status?.Content}`)
        }
      } catch (parseErr) {
        console.warn('Genesis Response Parse-Fehler:', parseErr)
      }
    }

    // Bevölkerungsdichte berechnen (wenn wir Bevölkerung haben + Fläche vom District)
    const areaKm2 = district.area_km2 as number
    if (stats.population?.total && areaKm2 > 0) {
      stats.density = Math.round(stats.population.total / areaKm2)
    }

    // District-Daten aktualisieren wenn wir bessere Bevölkerungsdaten haben
    const updateData: Record<string, unknown> = {}
    const currentPop = district.population as number
    if (stats.population?.total && stats.population.total !== currentPop) {
      updateData.population = stats.population.total
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('districts')
        .update(updateData)
        .eq('id', districtId)

      if (updateError) {
        console.warn('District-Update Fehler:', updateError.message)
      } else {
        console.log('District-Daten aktualisiert:', updateData)
      }
    }

    return new Response(
      JSON.stringify({ success: true, stats, updated: Object.keys(updateData) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('fetch-district-stats error:', error)
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
