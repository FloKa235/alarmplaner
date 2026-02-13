import { useRef, useEffect } from 'react'
import { mapboxgl, MAP_DEFAULTS, MAPBOX_AVAILABLE } from '@/lib/mapbox'
import { MapPin } from 'lucide-react'
import clsx from 'clsx'

export interface MapMarker {
  id: string
  lng: number
  lat: number
  label: string
  color?: string
  popup?: string
}

interface MapViewProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  onMapLoad?: (map: mapboxgl.Map) => void
  showControls?: boolean
  fallbackTitle?: string
  fallbackDescription?: string
}

export default function MapView({
  markers,
  center,
  zoom,
  height = '400px',
  className,
  onMapLoad,
  showControls = true,
  fallbackTitle = 'Karte nicht verfügbar',
  fallbackDescription = 'Bitte VITE_MAPBOX_TOKEN in .env setzen.',
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_AVAILABLE || !containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_DEFAULTS.style,
      center: center || MAP_DEFAULTS.center,
      zoom: zoom ?? MAP_DEFAULTS.zoom,
    })

    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    }

    map.on('load', () => {
      onMapLoad?.(map)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle resize (sidebar collapse etc.)
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize()
    })
    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markers) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Add new markers
    markers.forEach((marker) => {
      const el = document.createElement('div')
      el.style.width = '22px'
      el.style.height = '22px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = marker.color || '#2563eb'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
      el.style.cursor = 'pointer'

      const m = new mapboxgl.Marker(el).setLngLat([marker.lng, marker.lat])

      if (marker.popup) {
        m.setPopup(
          new mapboxgl.Popup({
            offset: 15,
            closeButton: false,
            maxWidth: '240px',
          }).setHTML(
            `<div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px 0;">${marker.popup}</div>`
          )
        )
      }

      m.addTo(mapRef.current!)
      markersRef.current.push(m)
    })
  }, [markers])

  // Fallback when no Mapbox token
  if (!MAPBOX_AVAILABLE) {
    return (
      <div
        className={clsx(
          'flex flex-col items-center justify-center bg-primary-50/50 text-center',
          className
        )}
        style={{ height }}
      >
        <MapPin className="mb-3 h-10 w-10 text-primary-400" />
        <p className="text-lg font-semibold text-text-primary">{fallbackTitle}</p>
        <p className="mt-1 text-sm text-text-secondary">{fallbackDescription}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={clsx('w-full', className)}
      style={{ height }}
    />
  )
}
