/**
 * useShelterPoints — Lädt Schutz- und Notfallpunkte via Overpass API
 *
 * Zeigt auf der Bürger-Karte:
 * - 🏥 Krankenhäuser
 * - 🚒 Feuerwachen
 * - 👮 Polizeistationen
 * - 🏫 Schulen (potenzielle Notunterkünfte)
 * - 🏛️ Rathäuser
 * - ⛽ Tankstellen
 *
 * Verwendet Overpass API basierend auf Koordinaten + Radius.
 */
import { useState, useEffect, useRef } from 'react'
import type { MapMarker } from '@/components/ui/MapView'

export interface ShelterCategory {
  id: string
  label: string
  emoji: string
  color: string
  enabled: boolean
}

export const SHELTER_CATEGORIES: ShelterCategory[] = [
  { id: 'krankenhaus', label: 'Krankenhäuser', emoji: '🏥', color: '#dc2626', enabled: true },
  { id: 'feuerwehr', label: 'Feuerwachen', emoji: '🚒', color: '#ea580c', enabled: true },
  { id: 'polizei', label: 'Polizei', emoji: '👮', color: '#2563eb', enabled: true },
  { id: 'schule', label: 'Schulen (Notunterkünfte)', emoji: '🏫', color: '#7c3aed', enabled: false },
  { id: 'rathaus', label: 'Rathäuser', emoji: '🏛️', color: '#0d9488', enabled: false },
  { id: 'tankstelle', label: 'Tankstellen', emoji: '⛽', color: '#ca8a04', enabled: false },
]

interface OverpassElement {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

function buildOverpassQuery(lat: number, lng: number, radiusKm: number, categories: string[]): string {
  const r = radiusKm * 1000 // in Meter
  const filters: string[] = []

  for (const cat of categories) {
    switch (cat) {
      case 'krankenhaus':
        filters.push(`node["amenity"="hospital"](around:${r},${lat},${lng});`)
        filters.push(`way["amenity"="hospital"](around:${r},${lat},${lng});`)
        break
      case 'feuerwehr':
        filters.push(`node["amenity"="fire_station"](around:${r},${lat},${lng});`)
        filters.push(`way["amenity"="fire_station"](around:${r},${lat},${lng});`)
        break
      case 'polizei':
        filters.push(`node["amenity"="police"](around:${r},${lat},${lng});`)
        filters.push(`way["amenity"="police"](around:${r},${lat},${lng});`)
        break
      case 'schule':
        filters.push(`node["amenity"="school"](around:${r},${lat},${lng});`)
        filters.push(`way["amenity"="school"](around:${r},${lat},${lng});`)
        break
      case 'rathaus':
        filters.push(`node["amenity"="townhall"](around:${r},${lat},${lng});`)
        filters.push(`way["amenity"="townhall"](around:${r},${lat},${lng});`)
        break
      case 'tankstelle':
        filters.push(`node["amenity"="fuel"](around:${r},${lat},${lng});`)
        break
    }
  }

  return `[out:json][timeout:15];(${filters.join('')});out center 100;`
}

function getCategoryForElement(tags: Record<string, string>): string | null {
  const amenity = tags.amenity
  if (amenity === 'hospital') return 'krankenhaus'
  if (amenity === 'fire_station') return 'feuerwehr'
  if (amenity === 'police') return 'polizei'
  if (amenity === 'school') return 'schule'
  if (amenity === 'townhall') return 'rathaus'
  if (amenity === 'fuel') return 'tankstelle'
  return null
}

function getCategoryConfig(catId: string): ShelterCategory | undefined {
  return SHELTER_CATEGORIES.find(c => c.id === catId)
}

export function useShelterPoints(
  lat: number | null,
  lng: number | null,
  enabledCategories: string[],
  radiusKm = 15,
) {
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedKey = useRef<string>('')

  useEffect(() => {
    if (!lat || !lng || enabledCategories.length === 0) {
      setMarkers([])
      return
    }

    // Nur neu laden wenn sich die Params wirklich ändern
    const key = `${lat.toFixed(3)}_${lng.toFixed(3)}_${enabledCategories.sort().join(',')}`
    if (key === fetchedKey.current) return
    fetchedKey.current = key

    const controller = new AbortController()
    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const query = buildOverpassQuery(lat, lng, radiusKm, enabledCategories)
        const res = await fetch(OVERPASS_URL, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`Overpass API: ${res.status}`)
        const data = await res.json()

        const newMarkers: MapMarker[] = []
        const seen = new Set<string>()

        for (const el of data.elements as OverpassElement[]) {
          const elLat = el.lat ?? el.center?.lat
          const elLng = el.lon ?? el.center?.lon
          if (!elLat || !elLng || !el.tags) continue

          const catId = getCategoryForElement(el.tags)
          if (!catId) continue

          const config = getCategoryConfig(catId)
          if (!config) continue

          // Deduplizieren nach Name + Koordinate (gerundet)
          const dedupeKey = `${el.tags.name || ''}_${elLat.toFixed(4)}_${elLng.toFixed(4)}`
          if (seen.has(dedupeKey)) continue
          seen.add(dedupeKey)

          const name = el.tags.name || config.label
          const addr = el.tags['addr:street']
            ? `${el.tags['addr:street']}${el.tags['addr:housenumber'] ? ' ' + el.tags['addr:housenumber'] : ''}`
            : ''

          newMarkers.push({
            id: `shelter-${el.id}`,
            lng: elLng,
            lat: elLat,
            label: name,
            color: config.color,
            popup: `<div style="font-family:'Plus Jakarta Sans',sans-serif">
              <div style="font-size:16px;margin-bottom:2px">${config.emoji}</div>
              <strong style="font-size:13px">${name}</strong>
              ${addr ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${addr}</div>` : ''}
              <div style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;background:${config.color}15;color:${config.color}">${config.label}</div>
            </div>`,
          })
        }

        setMarkers(newMarkers)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Schutzpunkte laden fehlgeschlagen:', err)
          setError((err as Error).message)
        }
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [lat, lng, enabledCategories, radiusKm])

  return { markers, loading, error }
}
