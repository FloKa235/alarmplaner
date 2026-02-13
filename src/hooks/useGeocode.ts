import { useState, useRef, useCallback } from 'react'

// ─── Photon API (komoot) – OSM-basiertes Geocoding ─────
// Nominatim verbietet explizit Autocomplete-Nutzung.
// Photon ist dafür vorgesehen und nutzt die gleichen OSM-Daten.
// Bounding Box auf Deutschland beschränkt.

const PHOTON_BASE = 'https://photon.komoot.io'
const GERMANY_BBOX = '5.87,47.27,15.04,55.06'
const DEBOUNCE_MS = 400
const MIN_CHARS = 3

export interface GeocodeSuggestion {
  name: string
  street?: string
  housenumber?: string
  city?: string
  postcode?: string
  state?: string
  country?: string
  countryCode?: string
  lat: number
  lng: number
  osmId?: number
  osmType?: string
  displayName: string
}

interface UseGeocodeResult {
  suggestions: GeocodeSuggestion[]
  loading: boolean
  search: (query: string) => void
  clear: () => void
}

function formatDisplayName(props: Record<string, unknown>): string {
  const parts: string[] = []

  const name = props.name as string | undefined
  const street = props.street as string | undefined
  const housenumber = props.housenumber as string | undefined
  const postcode = props.postcode as string | undefined
  const city = props.city as string | undefined

  if (name) parts.push(name)
  if (street) {
    const streetPart = housenumber ? `${street} ${housenumber}` : street
    if (streetPart !== name) parts.push(streetPart)
  }
  if (postcode || city) {
    parts.push([postcode, city].filter(Boolean).join(' '))
  }

  return parts.join(', ')
}

export function useGeocode(limit = 5): UseGeocodeResult {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cacheRef = useRef<Map<string, GeocodeSuggestion[]>>(new Map())

  const search = useCallback(
    (query: string) => {
      // Timer abbrechen
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      // Zu kurz
      if (query.length < MIN_CHARS) {
        setSuggestions([])
        return
      }

      // Cache prüfen
      const cached = cacheRef.current.get(query)
      if (cached) {
        setSuggestions(cached)
        return
      }

      // Debounce
      timerRef.current = setTimeout(async () => {
        // Vorherige Anfrage abbrechen
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        setLoading(true)

        try {
          const url = `${PHOTON_BASE}/api?q=${encodeURIComponent(query)}&lang=de&limit=${limit}&bbox=${GERMANY_BBOX}`

          const res = await fetch(url, {
            signal: abortRef.current.signal,
          })

          if (!res.ok) {
            console.warn(`Photon API: HTTP ${res.status}`)
            setSuggestions([])
            return
          }

          const data = await res.json()
          const features = data.features || []

          const results: GeocodeSuggestion[] = features
            // deno-lint-ignore no-explicit-any
            .filter((f: any) => f.geometry?.coordinates)
            // deno-lint-ignore no-explicit-any
            .map((f: any) => {
              const props = f.properties || {}
              const [lng, lat] = f.geometry.coordinates

              return {
                name: props.name || '',
                street: props.street,
                housenumber: props.housenumber,
                city: props.city || props.town || props.village,
                postcode: props.postcode,
                state: props.state,
                country: props.country,
                countryCode: props.countrycode,
                lat,
                lng,
                osmId: props.osm_id,
                osmType: props.osm_type,
                displayName: formatDisplayName(props),
              } as GeocodeSuggestion
            })
            .filter((s: GeocodeSuggestion) => s.countryCode === 'DE' || !s.countryCode)

          // Cachen
          cacheRef.current.set(query, results)

          // Max 100 Cache-Einträge
          if (cacheRef.current.size > 100) {
            const firstKey = cacheRef.current.keys().next().value
            if (firstKey) cacheRef.current.delete(firstKey)
          }

          setSuggestions(results)
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          console.warn('Photon API Fehler:', err)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      }, DEBOUNCE_MS)
    },
    [limit]
  )

  const clear = useCallback(() => {
    setSuggestions([])
    if (timerRef.current) clearTimeout(timerRef.current)
    abortRef.current?.abort()
  }, [])

  return { suggestions, loading, search, clear }
}
