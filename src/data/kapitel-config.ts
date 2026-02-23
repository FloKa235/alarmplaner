import {
  BookOpen, FileText, Users, AlertTriangle, MapPin, Bell,
  Package, Shield, Building, RefreshCw, Archive, ClipboardCheck,
} from 'lucide-react'

// ─── BSI/BBK-konforme 12-Kapitel-Struktur (zentralisierte Config) ──────────
// Verwendet in: pdf-export, handbook-migration

export interface KapitelConfig {
  nummer: number
  key: string
  titel: string
  color: string       // Tailwind text color
  bg: string           // Tailwind background
  accent: string       // Tailwind accent/badge bg
  rgb: [number, number, number]  // PDF-Export RGB
  icon: typeof BookOpen
}

export const KAPITEL_CONFIG: KapitelConfig[] = [
  { nummer: 1,  key: 'einleitung',                  titel: 'Einleitung',                     color: 'text-slate-600',   bg: 'bg-slate-50',   accent: 'bg-slate-600',   rgb: [71, 85, 105],   icon: BookOpen },
  { nummer: 2,  key: 'dokumentenmanagement',         titel: 'Dokumentenmanagement',            color: 'text-blue-600',    bg: 'bg-blue-50',    accent: 'bg-blue-600',    rgb: [37, 99, 235],   icon: FileText },
  { nummer: 3,  key: 'krisenorganisation',           titel: 'Krisenorganisation',              color: 'text-green-600',   bg: 'bg-green-50',   accent: 'bg-green-600',   rgb: [22, 163, 74],   icon: Users },
  { nummer: 4,  key: 'aktivierung',                  titel: 'Aktivierung',                     color: 'text-red-600',     bg: 'bg-red-50',     accent: 'bg-red-600',     rgb: [220, 38, 38],   icon: AlertTriangle },
  { nummer: 5,  key: 'lagefuehrung',                 titel: 'Lageführung',                     color: 'text-amber-600',   bg: 'bg-amber-50',   accent: 'bg-amber-600',   rgb: [217, 119, 6],   icon: MapPin },
  { nummer: 6,  key: 'alarmierung_kommunikation',    titel: 'Alarmierung und Kommunikation',   color: 'text-orange-600',  bg: 'bg-orange-50',  accent: 'bg-orange-600',  rgb: [234, 88, 12],   icon: Bell },
  { nummer: 7,  key: 'ressourcenmanagement',         titel: 'Ressourcenmanagement',            color: 'text-purple-600',  bg: 'bg-purple-50',  accent: 'bg-purple-600',  rgb: [147, 51, 234],  icon: Package },
  { nummer: 8,  key: 'schutz_kritischer_funktionen', titel: 'Schutz kritischer Funktionen',   color: 'text-teal-600',    bg: 'bg-teal-50',    accent: 'bg-teal-600',    rgb: [13, 148, 136],  icon: Shield },
  { nummer: 9,  key: 'notfallarbeitsplaetze',        titel: 'Notfallarbeitsplätze',            color: 'text-cyan-600',    bg: 'bg-cyan-50',    accent: 'bg-cyan-600',    rgb: [8, 145, 178],   icon: Building },
  { nummer: 10, key: 'wiederherstellung',            titel: 'Wiederherstellung',               color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'bg-emerald-600', rgb: [5, 150, 105],   icon: RefreshCw },
  { nummer: 11, key: 'dokumentation',                titel: 'Dokumentation',                   color: 'text-indigo-600',  bg: 'bg-indigo-50',  accent: 'bg-indigo-600',  rgb: [79, 70, 229],   icon: Archive },
  { nummer: 12, key: 'nachbereitung',                titel: 'Nachbereitung',                   color: 'text-pink-600',    bg: 'bg-pink-50',    accent: 'bg-pink-600',    rgb: [219, 39, 119],  icon: ClipboardCheck },
]

// ─── Helper ──────────────────────────────────────────────
export function getKapitelConfig(nummer: number): KapitelConfig {
  return KAPITEL_CONFIG.find(k => k.nummer === nummer) || KAPITEL_CONFIG[0]
}

export function getKapitelByKey(key: string): KapitelConfig | undefined {
  return KAPITEL_CONFIG.find(k => k.key === key)
}

export function getKapitelFarbe(nummer: number): { color: string; bg: string; accent: string } {
  const cfg = KAPITEL_CONFIG.find(k => k.nummer === nummer)
  if (!cfg) return { color: 'text-gray-600', bg: 'bg-gray-50', accent: 'bg-gray-600' }
  return { color: cfg.color, bg: cfg.bg, accent: cfg.accent }
}

export function getKapitelFarbePDF(nummer: number): [number, number, number] {
  const cfg = KAPITEL_CONFIG.find(k => k.nummer === nummer)
  return cfg?.rgb || [107, 114, 128] // gray-500 fallback
}
