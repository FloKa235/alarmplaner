/**
 * readiness-checks.ts — Einsatzbereitschaft-Logik
 *
 * Berechnet den Vorbereitungsgrad eines Szenarios
 * basierend auf 7 Checks (Eskalationsstufen-Modell).
 */
import type {
  DbInventoryItem, DbAlertContact, DbChecklist,
  EskalationsStufe,
} from '@/types/database'
import type { StabsRolle } from './handbook-extract'

// ─── Types ─────────────────────────────────────────────

export type TabKey = 'uebersicht' | 'stufe1' | 'stufe2' | 'stufe3' | 'checklisten' | 'inventar' | 'handbuch'

export interface ReadinessCheck {
  key: string
  label: string
  done: boolean
  handlung: string
  targetTab?: TabKey
  externalLink?: string
  severity: 'kritisch' | 'warnung'
}

export interface ReadinessResult {
  checks: ReadinessCheck[]
  doneCount: number
  pct: number
  kritischeLuecken: ReadinessCheck[]
  warnLuecken: ReadinessCheck[]
}

// ─── Hauptfunktion ─────────────────────────────────────

export function calculateReadiness(opts: {
  eskalationsstufen: EskalationsStufe[]
  krisenstabRollen: StabsRolle[]
  alertContacts: DbAlertContact[]
  inventoryItems: DbInventoryItem[]
  vorbereitungChecklisten?: DbChecklist[]
  szenarioInventoryItems?: DbInventoryItem[]
}): ReadinessResult {
  const { eskalationsstufen, krisenstabRollen, alertContacts, inventoryItems, vorbereitungChecklisten, szenarioInventoryItems } = opts

  // Eskalations-Stats
  const totalCheckItems = eskalationsstufen.reduce((sum, s) => sum + s.checkliste.length, 0)
  const totalCheckDone = eskalationsstufen.reduce(
    (sum, s) => sum + s.checkliste.filter(i => i.status === 'done' || i.status === 'skipped').length, 0
  )
  const hasAnyAlarmkette = eskalationsstufen.some(s => s.alarmkette.length > 0)

  // Inventar-Stats
  const inventoryTotal = inventoryItems.length
  const inventorySufficient = inventoryItems.filter(i => i.current_quantity >= i.target_quantity).length

  const checks: ReadinessCheck[] = [
    {
      key: 'eskalation_definiert',
      label: 'Eskalationsstufen definiert',
      done: eskalationsstufen.some(s => s.checkliste.length > 0),
      handlung: 'Checklisten für die 3 Eskalationsstufen anlegen',
      targetTab: 'stufe1',
      severity: 'kritisch',
    },
    {
      key: 'krisenstab',
      label: 'Krisenstab bestimmt',
      done: krisenstabRollen.length > 0,
      handlung: 'Krisenhandbuch generieren für Rollenverteilung',
      targetTab: 'handbuch',
      severity: 'kritisch',
    },
    {
      key: 'alarmkette',
      label: 'Alarmierungsketten definiert',
      done: hasAnyAlarmkette,
      handlung: 'Alarmierungsreihenfolge pro Stufe festlegen',
      targetTab: 'stufe1',
      severity: 'kritisch',
    },
    {
      key: 'kontakte',
      label: 'Alarmierungskontakte hinterlegt',
      done: alertContacts.length > 0,
      handlung: 'Kontakte für Krisenstab hinterlegen',
      externalLink: '/pro/alarmierung',
      severity: 'kritisch',
    },
    {
      key: 'stufe1_checkliste',
      label: 'Vorwarnung-Checkliste vorhanden',
      done: (eskalationsstufen[0]?.checkliste?.length ?? 0) > 0,
      handlung: 'Checkliste für Stufe 1 (Vorwarnung) anlegen',
      targetTab: 'stufe1',
      severity: 'kritisch',
    },
    {
      key: 'inventar',
      label: 'Inventar geprüft',
      done: inventoryTotal > 0 && inventorySufficient >= inventoryTotal * 0.6,
      handlung: inventoryTotal > 0
        ? `${inventoryTotal - inventorySufficient} von ${inventoryTotal} Kategorien unter Soll`
        : 'Materialbestand im Inventar pflegen',
      externalLink: '/pro/inventar',
      severity: 'warnung',
    },
    {
      key: 'checklisten_fortschritt',
      label: 'Checklisten bearbeitet',
      done: totalCheckItems > 0 && totalCheckDone >= totalCheckItems * 0.5,
      handlung: totalCheckItems > 0
        ? `${totalCheckDone}/${totalCheckItems} Punkte erledigt`
        : 'Checklisten-Items anlegen und abarbeiten',
      targetTab: 'stufe1',
      severity: 'warnung',
    },
    // Check 8: Vorbereitungs-Checklisten (ExTrass)
    (() => {
      const allItems = (vorbereitungChecklisten || []).flatMap(c => c.items)
      const vorbereitungTotal = allItems.length
      const vorbereitungDone = allItems.filter(i => i.status === 'done' || i.status === 'partial').length
      return {
        key: 'vorbereitung_checklisten',
        label: 'Vorbereitungs-Checklisten bearbeitet',
        done: vorbereitungTotal > 0 && vorbereitungDone >= vorbereitungTotal * 0.5,
        handlung: vorbereitungTotal > 0
          ? `${vorbereitungDone}/${vorbereitungTotal} Punkte erfüllt/teilweise erfüllt`
          : 'Vorbereitungs-Checklisten aus ExTrass-Katalog anlegen',
        targetTab: 'checklisten' as TabKey,
        severity: 'warnung' as const,
      }
    })(),
    // Check 9: Szenario-Inventar zugeordnet
    {
      key: 'szenario_inventar',
      label: 'Szenario-Inventar zugeordnet',
      done: (szenarioInventoryItems?.length ?? 0) > 0,
      handlung: (szenarioInventoryItems?.length ?? 0) > 0
        ? `${szenarioInventoryItems!.length} Artikel zugeordnet`
        : 'Inventar-Artikel diesem Szenario zuordnen (auf der Inventar-Seite)',
      targetTab: 'inventar',
      severity: 'warnung',
    },
  ]

  const doneCount = checks.filter(c => c.done).length
  const pct = checks.length > 0 ? Math.round((doneCount / checks.length) * 100) : 0
  const luecken = checks.filter(c => !c.done)

  return {
    checks,
    doneCount,
    pct,
    kritischeLuecken: luecken.filter(l => l.severity === 'kritisch'),
    warnLuecken: luecken.filter(l => l.severity === 'warnung'),
  }
}
