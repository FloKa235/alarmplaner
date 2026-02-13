import {
  Zap, Droplets, ShoppingCart, Heart, Train, Wifi, Banknote,
  Landmark, Radio, Waves, Swords,
} from 'lucide-react'

// ─── BBK KRITIS-Sektoren (zentralisierte Config) ─────────────────
// Verwendet in: ProDashboard, KritisPage, GemeindeDetailPage

export const SECTOR_CONFIG: { key: string; label: string; icon: typeof Landmark; color: string; bg: string }[] = [
  { key: 'energie', label: 'Energie', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'wasser', label: 'Wasser', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'ernaehrung', label: 'Ernährung', icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'gesundheit', label: 'Gesundheit', icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'transport', label: 'Transport', icon: Train, color: 'text-slate-600', bg: 'bg-slate-100' },
  { key: 'it_telekom', label: 'IT/Telekommunikation', icon: Wifi, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'finanz', label: 'Finanzwesen', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'staat', label: 'Staat & Verwaltung', icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'medien', label: 'Medien & Kultur', icon: Radio, color: 'text-pink-600', bg: 'bg-pink-50' },
  { key: 'wasserbau', label: 'Wasserbau', icon: Waves, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'militaer', label: 'Militär', icon: Swords, color: 'text-gray-600', bg: 'bg-gray-100' },
]

// Kategorie → Sektor Mapping (für Dashboard-Aggregierung)
export const categoryToSector: Record<string, string> = {
  kraftwerk: 'energie', umspannwerk: 'energie', solarpark: 'energie', windkraftanlage: 'energie', tankstelle: 'energie', transformator: 'energie',
  wasserwerk: 'wasser', wasserturm: 'wasser', hochbehaelter: 'wasser', klaerwerk: 'wasser', pumpstation: 'wasser', quelle: 'wasser',
  supermarkt: 'ernaehrung', nahversorger: 'ernaehrung', marktplatz: 'ernaehrung', bauernhof: 'ernaehrung',
  krankenhaus: 'gesundheit', klinik: 'gesundheit', apotheke: 'gesundheit', arztpraxis: 'gesundheit', seniorenheim: 'gesundheit', zahnarzt: 'gesundheit',
  bahnhof: 'transport', haltepunkt: 'transport', busbahnhof: 'transport', flugplatz: 'transport', hubschrauberlandeplatz: 'transport', bruecke: 'transport',
  funkmast: 'it_telekom', funkturm: 'it_telekom', vermittlungsstelle: 'it_telekom',
  bank: 'finanz', geldautomat: 'finanz',
  rathaus: 'staat', feuerwehr: 'staat', polizei: 'staat', gericht: 'staat', gefaengnis: 'staat', behoerde: 'staat', schule: 'staat', kindergarten: 'staat',
  bibliothek: 'medien', theater: 'medien', kino: 'medien', buergerhaus: 'medien', sendeturm: 'medien',
  gefahrstoffbetrieb: 'gefahrstoffe',
  staudamm: 'wasserbau', wehr: 'wasserbau', deich: 'wasserbau',
  militaergebiet: 'militaer', kaserne: 'militaer',
}

// Kategorie → Label + Sektor + Marker-Farbe (für Tabellen + Karten)
export const categoryMeta: Record<string, { label: string; sector: string; markerColor: string }> = {
  // Energie
  kraftwerk: { label: 'Kraftwerk', sector: 'energie', markerColor: '#d97706' },
  umspannwerk: { label: 'Umspannwerk', sector: 'energie', markerColor: '#f59e0b' },
  solarpark: { label: 'Solaranlage', sector: 'energie', markerColor: '#fbbf24' },
  windkraftanlage: { label: 'Windkraftanlage', sector: 'energie', markerColor: '#fcd34d' },
  tankstelle: { label: 'Tankstelle', sector: 'energie', markerColor: '#92400e' },
  transformator: { label: 'Transformator', sector: 'energie', markerColor: '#b45309' },
  // Wasser
  wasserwerk: { label: 'Wasserwerk', sector: 'wasser', markerColor: '#2563eb' },
  wasserturm: { label: 'Wasserturm', sector: 'wasser', markerColor: '#3b82f6' },
  hochbehaelter: { label: 'Hochbehälter', sector: 'wasser', markerColor: '#60a5fa' },
  klaerwerk: { label: 'Klärwerk', sector: 'wasser', markerColor: '#0891b2' },
  pumpstation: { label: 'Pumpstation', sector: 'wasser', markerColor: '#06b6d4' },
  quelle: { label: 'Quelle', sector: 'wasser', markerColor: '#22d3ee' },
  // Ernährung
  supermarkt: { label: 'Supermarkt', sector: 'ernaehrung', markerColor: '#16a34a' },
  nahversorger: { label: 'Nahversorger', sector: 'ernaehrung', markerColor: '#22c55e' },
  marktplatz: { label: 'Marktplatz', sector: 'ernaehrung', markerColor: '#4ade80' },
  bauernhof: { label: 'Bauernhof', sector: 'ernaehrung', markerColor: '#86efac' },
  // Gesundheit
  krankenhaus: { label: 'Krankenhaus', sector: 'gesundheit', markerColor: '#dc2626' },
  klinik: { label: 'Klinik', sector: 'gesundheit', markerColor: '#ef4444' },
  apotheke: { label: 'Apotheke', sector: 'gesundheit', markerColor: '#f87171' },
  arztpraxis: { label: 'Arztpraxis', sector: 'gesundheit', markerColor: '#fca5a5' },
  seniorenheim: { label: 'Seniorenheim', sector: 'gesundheit', markerColor: '#fb7185' },
  zahnarzt: { label: 'Zahnarzt', sector: 'gesundheit', markerColor: '#fda4af' },
  // Transport
  bahnhof: { label: 'Bahnhof', sector: 'transport', markerColor: '#475569' },
  haltepunkt: { label: 'Haltepunkt', sector: 'transport', markerColor: '#64748b' },
  busbahnhof: { label: 'Busbahnhof', sector: 'transport', markerColor: '#94a3b8' },
  flugplatz: { label: 'Flugplatz', sector: 'transport', markerColor: '#334155' },
  hubschrauberlandeplatz: { label: 'Helipad', sector: 'transport', markerColor: '#1e293b' },
  bruecke: { label: 'Brücke', sector: 'transport', markerColor: '#4b5563' },
  // IT/Telekom
  funkmast: { label: 'Funkmast', sector: 'it_telekom', markerColor: '#7c3aed' },
  funkturm: { label: 'Funkturm', sector: 'it_telekom', markerColor: '#8b5cf6' },
  vermittlungsstelle: { label: 'Vermittlungsstelle', sector: 'it_telekom', markerColor: '#a78bfa' },
  // Finanz
  bank: { label: 'Bank', sector: 'finanz', markerColor: '#059669' },
  geldautomat: { label: 'Geldautomat', sector: 'finanz', markerColor: '#10b981' },
  // Staat/Verwaltung
  rathaus: { label: 'Rathaus', sector: 'staat', markerColor: '#7c3aed' },
  feuerwehr: { label: 'Feuerwehr', sector: 'staat', markerColor: '#f97316' },
  polizei: { label: 'Polizei', sector: 'staat', markerColor: '#4f46e5' },
  gericht: { label: 'Gericht', sector: 'staat', markerColor: '#6366f1' },
  gefaengnis: { label: 'Gefängnis', sector: 'staat', markerColor: '#312e81' },
  behoerde: { label: 'Behörde', sector: 'staat', markerColor: '#818cf8' },
  schule: { label: 'Schule', sector: 'staat', markerColor: '#2563eb' },
  kindergarten: { label: 'Kindergarten', sector: 'staat', markerColor: '#0ea5e9' },
  // Medien/Kultur
  bibliothek: { label: 'Bibliothek', sector: 'medien', markerColor: '#ec4899' },
  theater: { label: 'Theater', sector: 'medien', markerColor: '#f472b6' },
  kino: { label: 'Kino', sector: 'medien', markerColor: '#f9a8d4' },
  buergerhaus: { label: 'Bürgerhaus', sector: 'medien', markerColor: '#db2777' },
  sendeturm: { label: 'Sendeturm', sector: 'medien', markerColor: '#be185d' },
  // Gefahrstoffe
  gefahrstoffbetrieb: { label: 'Gefahrstoffbetrieb', sector: 'gefahrstoffe', markerColor: '#b91c1c' },
  // Wasserbau
  staudamm: { label: 'Staudamm', sector: 'wasserbau', markerColor: '#0e7490' },
  wehr: { label: 'Wehr', sector: 'wasserbau', markerColor: '#155e75' },
  deich: { label: 'Deich', sector: 'wasserbau', markerColor: '#164e63' },
  // Militär
  militaergebiet: { label: 'Militärgebiet', sector: 'militaer', markerColor: '#374151' },
  kaserne: { label: 'Kaserne', sector: 'militaer', markerColor: '#4b5563' },
  // Sonstige
  sonstiges: { label: 'Sonstiges', sector: 'staat', markerColor: '#6b7280' },
}

// Helper: Sektor aus Site ermitteln
export function getSector(site: { sector?: string | null; category: string }): string {
  return site.sector || categoryMeta[site.category]?.sector || 'staat'
}
