import mapboxgl from 'mapbox-gl'

const token = import.meta.env.VITE_MAPBOX_TOKEN

if (token) {
  mapboxgl.accessToken = token
}

/** Default center: Sachsen-Anhalt area */
export const MAP_DEFAULTS = {
  center: [11.5, 51.75] as [number, number], // [lng, lat]
  zoom: 10,
  style: 'mapbox://styles/mapbox/light-v11',
}

/** Whether a Mapbox token is configured */
export const MAPBOX_AVAILABLE = Boolean(token)

export { mapboxgl }
