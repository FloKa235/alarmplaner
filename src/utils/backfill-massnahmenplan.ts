/**
 * Einmaliges Backfill-Script:
 * Bestehende Default-Szenarien in der DB mit Alarmketten aus DEFAULT_SCENARIOS befüllen.
 * Wird automatisch beim Laden der SzenarienPage aufgerufen, wenn Szenarien ohne Massnahmenplan existieren.
 */
import { supabase } from '@/lib/supabase'
import { DEFAULT_SCENARIOS } from '@/data/default-scenarios'
import type { DbScenario } from '@/types/database'

export async function backfillMassnahmenplan(districtId: string): Promise<number> {
  // 1. Alle Default-Szenarien des Districts laden
  const { data: scenarios, error } = await supabase
    .from('scenarios')
    .select('id, type, title, meta, is_default')
    .eq('district_id', districtId)
    .eq('is_default', true)

  if (error || !scenarios) {
    console.warn('Backfill: Konnte Szenarien nicht laden:', error)
    return 0
  }

  let updated = 0

  for (const scenario of scenarios as Pick<DbScenario, 'id' | 'type' | 'title' | 'meta' | 'is_default'>[]) {
    // Prüfe ob bereits massnahmenplan existiert
    const meta = (scenario.meta as unknown as Record<string, unknown>) || {}
    if (meta.massnahmenplan) continue // Bereits vorhanden

    // Finde das passende Default-Template anhand des Typs
    const template = DEFAULT_SCENARIOS.find(t => t.type === scenario.type)
    if (!template?.alarmkette) continue // Kein Template mit Alarmkette

    // Massnahmenplan erstellen
    const massnahmenplan = {
      alarmkette: template.alarmkette.map((schritt, idx) => ({
        id: crypto.randomUUID(),
        reihenfolge: idx + 1,
        rolle: schritt.rolle,
        kontaktgruppen: schritt.kontaktgruppen,
        kanaele: schritt.kanaele,
        wartezeit_min: schritt.wartezeit_min,
        bedingung: null,
      })),
      aufgaben_zuweisung: [],
      generated_at: new Date().toISOString(),
      last_edited: null,
    }

    // In DB speichern
    const updatedMeta = { ...meta, massnahmenplan }
    const { error: updateError } = await supabase
      .from('scenarios')
      .update({ meta: updatedMeta })
      .eq('id', scenario.id)

    if (updateError) {
      console.warn(`Backfill: Fehler bei Szenario ${scenario.title}:`, updateError)
    } else {
      updated++
    }
  }

  if (updated > 0) {
    console.log(`Backfill: ${updated} Szenarien mit Alarmketten aktualisiert`)
  }

  return updated
}
