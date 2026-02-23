/**
 * Regionale Risiko-Extras für die Bürger-Vorsorge
 *
 * Heuristik basierend auf Bundesland/Geografie → zusätzliche Vorrats-Items
 * die über die BBK-Standard-Empfehlung hinausgehen.
 */

import type { SupplyCategory } from './bbk-supply-templates'

export interface RegionalRiskItem {
  category: SupplyCategory
  itemName: string
  qtyPerPerson10Days: number
  unit: string
  scaleType: 'per_person' | 'per_household'
  notes?: string
}

export interface RiskType {
  id: string
  name: string
  icon: string
  description: string
  items: RegionalRiskItem[]
}

/** Alle möglichen regionalen Risikotypen */
export const RISK_TYPES: RiskType[] = [
  {
    id: 'hochwasser',
    name: 'Hochwasser',
    icon: 'Waves',
    description: 'Flusshochwasser, Sturzfluten durch Starkregen',
    items: [
      { category: 'werkzeuge', itemName: 'Sandsäcke (leer)', qtyPerPerson10Days: 20, unit: 'Stk', scaleType: 'per_household', notes: 'Sand separat bevorraten' },
      { category: 'werkzeuge', itemName: 'Gummistiefel', qtyPerPerson10Days: 1, unit: 'Paar', scaleType: 'per_person' },
      { category: 'werkzeuge', itemName: 'Wasserdichte Dokumententasche', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household' },
      { category: 'werkzeuge', itemName: 'Tauchpumpe (klein)', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household', notes: 'Für Kellerwasser' },
      { category: 'notfallausruestung', itemName: 'Schwimmweste', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_person', notes: 'Besonders für Kinder' },
    ],
  },
  {
    id: 'sturmflut',
    name: 'Sturmflut',
    icon: 'Wind',
    description: 'Küstennahe Überflutungsgefahr durch Sturm',
    items: [
      { category: 'werkzeuge', itemName: 'Sandsäcke (leer)', qtyPerPerson10Days: 30, unit: 'Stk', scaleType: 'per_household' },
      { category: 'werkzeuge', itemName: 'Gummistiefel', qtyPerPerson10Days: 1, unit: 'Paar', scaleType: 'per_person' },
      { category: 'notfallausruestung', itemName: 'Schwimmweste', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_person' },
      { category: 'notfallausruestung', itemName: 'Signalpfeife', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_person' },
      { category: 'dokumente', itemName: 'Evakuierungs-Rucksack (gepackt)', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_person' },
    ],
  },
  {
    id: 'sturm',
    name: 'Sturm / Orkan',
    icon: 'Wind',
    description: 'Schwere Stürme, Orkane, Tornados',
    items: [
      { category: 'werkzeuge', itemName: 'Abdeckplane / Folie (stabil)', qtyPerPerson10Days: 2, unit: 'Stk', scaleType: 'per_household', notes: 'Für Fensterschäden' },
      { category: 'werkzeuge', itemName: 'Spanngurte', qtyPerPerson10Days: 4, unit: 'Stk', scaleType: 'per_household' },
      { category: 'werkzeuge', itemName: 'Motorsäge / Handsäge', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household', notes: 'Für umgestürzte Bäume' },
    ],
  },
  {
    id: 'hitze',
    name: 'Hitzewelle',
    icon: 'Sun',
    description: 'Extreme Hitze, Dürreperioden',
    items: [
      { category: 'getraenke', itemName: 'Elektrolyt-Getränke', qtyPerPerson10Days: 5, unit: 'L', scaleType: 'per_person' },
      { category: 'medikamente', itemName: 'Sonnenschutzmittel (LSF 50)', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_person' },
      { category: 'medikamente', itemName: 'Kühlkompressen (Instant)', qtyPerPerson10Days: 3, unit: 'Stk', scaleType: 'per_household' },
      { category: 'notfallausruestung', itemName: 'Batteriebetriebener Ventilator', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household' },
    ],
  },
  {
    id: 'lawine',
    name: 'Lawine / Erdrutsch',
    icon: 'Mountain',
    description: 'Lawinengefahr, Erdrutsche, Hangrutschungen',
    items: [
      { category: 'notfallausruestung', itemName: 'Lawinenschaufel', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household' },
      { category: 'notfallausruestung', itemName: 'Schneeschuhe', qtyPerPerson10Days: 1, unit: 'Paar', scaleType: 'per_person' },
      { category: 'notfallausruestung', itemName: 'Signalpfeife', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_person' },
      { category: 'notfallausruestung', itemName: 'Wärmedecke (Rettungsdecke)', qtyPerPerson10Days: 2, unit: 'Stk', scaleType: 'per_person' },
    ],
  },
  {
    id: 'erdrutsch',
    name: 'Erdrutsch',
    icon: 'Mountain',
    description: 'Hangrutschungen, Muren, Bodenbewegungen',
    items: [
      { category: 'werkzeuge', itemName: 'Schaufel', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household' },
      { category: 'notfallausruestung', itemName: 'Signalpfeife', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_person' },
      { category: 'notfallausruestung', itemName: 'Wärmedecke (Rettungsdecke)', qtyPerPerson10Days: 2, unit: 'Stk', scaleType: 'per_person' },
    ],
  },
  {
    id: 'stromausfall',
    name: 'Langzeit-Stromausfall',
    icon: 'ZapOff',
    description: 'Blackout über mehrere Tage',
    items: [
      { category: 'notfallausruestung', itemName: 'Gaskocher (extra Kartuschen)', qtyPerPerson10Days: 3, unit: 'Stk', scaleType: 'per_household' },
      { category: 'notfallausruestung', itemName: 'Solar-Ladegerät', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household' },
      { category: 'notfallausruestung', itemName: 'LED-Laternen (zusätzlich)', qtyPerPerson10Days: 2, unit: 'Stk', scaleType: 'per_household' },
    ],
  },
  {
    id: 'unwetter',
    name: 'Unwetter / Starkregen',
    icon: 'CloudRain',
    description: 'Gewitter, Starkregen, Hagel',
    items: [
      { category: 'werkzeuge', itemName: 'Abdeckplane', qtyPerPerson10Days: 1, unit: 'Stk', scaleType: 'per_household' },
      { category: 'werkzeuge', itemName: 'Eimer / Schöpfgefäße', qtyPerPerson10Days: 2, unit: 'Stk', scaleType: 'per_household' },
    ],
  },
]

/** Küsten-Bundesländer */
const COASTAL_STATES = ['Schleswig-Holstein', 'Niedersachsen', 'Mecklenburg-Vorpommern', 'Bremen', 'Hamburg']

/** Alpine Regionen (BY/BW südlich von ~48.0°) */
function isAlpineRegion(state: string, lat: number): boolean {
  return (state === 'Bayern' || state === 'Baden-Württemberg') && lat < 48.5
}

/** Fluss-Namens-Heuristik */
const RIVER_KEYWORDS = /rhein|elbe|donau|mosel|main|weser|ems|oder|spree|neckar|saale|isar|inn|lech|aller|ruhr|lippe|mulde|werra|fulda/i

/**
 * Erkennt relevante Risiken basierend auf Standort-Daten.
 * Gibt eine Liste von Risiko-IDs zurück.
 */
export function detectRegionalRisks(districtName: string, state: string, lat: number): string[] {
  const risks: string[] = []

  // Universelle Risiken
  risks.push('stromausfall')
  risks.push('unwetter')
  risks.push('hitze')

  // Küste → Sturmflut + Sturm
  if (COASTAL_STATES.includes(state)) {
    risks.push('sturmflut')
    risks.push('sturm')
  }

  // Alpen → Lawine + Erdrutsch
  if (isAlpineRegion(state, lat)) {
    risks.push('lawine')
    risks.push('erdrutsch')
  }

  // Flusstäler → Hochwasser
  if (RIVER_KEYWORDS.test(districtName)) {
    risks.push('hochwasser')
  }

  // Mittelgebirge (Harz, Schwarzwald, Erzgebirge, etc.)
  if (/harz|schwarzwald|erzgebirge|thüringer|bayerischer wald|odenwald|spessart|eifel|hunsrück|taunus|sauerland|westerwald/i.test(districtName)) {
    risks.push('erdrutsch')
    risks.push('sturm')
  }

  return [...new Set(risks)]
}

/**
 * Gibt die Extra-Items für eine Risiko-ID zurück.
 */
export function getRegionalItems(riskIds: string[]): RegionalRiskItem[] {
  const items: RegionalRiskItem[] = []
  const seen = new Set<string>()

  for (const riskId of riskIds) {
    const risk = RISK_TYPES.find(r => r.id === riskId)
    if (!risk) continue

    for (const item of risk.items) {
      const key = `${item.category}:${item.itemName}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push(item)
      }
    }
  }

  return items
}
