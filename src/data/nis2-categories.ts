/**
 * NIS2-Sektoren, KRITIS-Sektoren und Schwellenwerte
 * fuer die automatische Kategorisierung im Enterprise-Onboarding.
 */

export interface Nis2Sector {
  id: string
  label: string
  category: 'wesentlich' | 'wichtig'
  isKritis: boolean
  kritisLabel?: string
}

/**
 * NIS2-Sektoren gemaess Richtlinie (EU) 2022/2555
 * Anhang I = Sektoren mit hoher Kritikalitaet (wesentliche Einrichtungen)
 * Anhang II = Sonstige kritische Sektoren (wichtige Einrichtungen)
 */
export const NIS2_SECTORS: Nis2Sector[] = [
  // Anhang I — Sektoren mit hoher Kritikalitaet
  { id: 'energie', label: 'Energie', category: 'wesentlich', isKritis: true, kritisLabel: 'Energie' },
  { id: 'transport', label: 'Verkehr / Transport', category: 'wesentlich', isKritis: true, kritisLabel: 'Transport und Verkehr' },
  { id: 'bankwesen', label: 'Bankwesen', category: 'wesentlich', isKritis: true, kritisLabel: 'Finanz- und Versicherungswesen' },
  { id: 'finanzmarkt', label: 'Finanzmarktinfrastrukturen', category: 'wesentlich', isKritis: true, kritisLabel: 'Finanz- und Versicherungswesen' },
  { id: 'gesundheit', label: 'Gesundheitswesen', category: 'wesentlich', isKritis: true, kritisLabel: 'Gesundheit' },
  { id: 'trinkwasser', label: 'Trinkwasser', category: 'wesentlich', isKritis: true, kritisLabel: 'Wasser' },
  { id: 'abwasser', label: 'Abwasser', category: 'wesentlich', isKritis: true, kritisLabel: 'Wasser' },
  { id: 'digitale_infra', label: 'Digitale Infrastruktur', category: 'wesentlich', isKritis: true, kritisLabel: 'Informationstechnik und Telekommunikation' },
  { id: 'ikt_dienste', label: 'IKT-Dienstleistungsmanagement (B2B)', category: 'wesentlich', isKritis: false },
  { id: 'oeffentliche_verwaltung', label: 'Oeffentliche Verwaltung', category: 'wesentlich', isKritis: false },
  { id: 'weltraum', label: 'Weltraum', category: 'wesentlich', isKritis: false },

  // Anhang II — Sonstige kritische Sektoren
  { id: 'post_kurier', label: 'Post- und Kurierdienste', category: 'wichtig', isKritis: false },
  { id: 'abfallbewirtschaftung', label: 'Abfallbewirtschaftung', category: 'wichtig', isKritis: false },
  { id: 'chemie', label: 'Chemie', category: 'wichtig', isKritis: false },
  { id: 'lebensmittel', label: 'Lebensmittelproduktion und -vertrieb', category: 'wichtig', isKritis: true, kritisLabel: 'Ernaehrung' },
  { id: 'verarbeitendes_gewerbe', label: 'Verarbeitendes Gewerbe / Herstellung', category: 'wichtig', isKritis: false },
  { id: 'digitale_dienste', label: 'Anbieter digitaler Dienste', category: 'wichtig', isKritis: false },
  { id: 'forschung', label: 'Forschung', category: 'wichtig', isKritis: false },

  // Nicht-NIS2 Branchen (haeufig genutzt)
  { id: 'it_dienstleistung', label: 'IT-Dienstleistung / Software', category: 'wichtig', isKritis: false },
  { id: 'beratung', label: 'Beratung / Agentur', category: 'wichtig', isKritis: false },
  { id: 'sonstige', label: 'Sonstige Branche', category: 'wichtig', isKritis: false },
]

export const LEGAL_FORMS = [
  { value: 'gmbh', label: 'GmbH' },
  { value: 'ug', label: 'UG (haftungsbeschraenkt)' },
  { value: 'ag', label: 'AG' },
  { value: 'kg', label: 'KG' },
  { value: 'gmbh_co_kg', label: 'GmbH & Co. KG' },
  { value: 'ohg', label: 'OHG' },
  { value: 'einzelunternehmen', label: 'Einzelunternehmen' },
  { value: 'gbr', label: 'GbR' },
  { value: 'eg', label: 'eG (Genossenschaft)' },
  { value: 'ev', label: 'e.V. (Verein)' },
  { value: 'stiftung', label: 'Stiftung' },
  { value: 'sonstige', label: 'Sonstige' },
]

/**
 * NIS2-Schwellenwerte (vereinfacht nach NIS2UmsuCG-Entwurf):
 *
 * Wesentliche Einrichtung:
 *   - Sektor aus Anhang I UND (>=250 MA ODER >=50 Mio EUR Umsatz)
 *
 * Wichtige Einrichtung:
 *   - Sektor aus Anhang I oder II UND (>=50 MA ODER >=10 Mio EUR Umsatz)
 *
 * Nicht betroffen:
 *   - Unter Schwellenwerten ODER Branche nicht gelistet
 */
export interface Nis2Result {
  nis2Relevant: boolean
  nis2Category: 'wesentlich' | 'wichtig' | null
  kritisRelevant: boolean
  kritisSector: string | null
  explanation: string
}

export function calculateNis2Status(
  sectorId: string | null,
  employeeCount: number | null,
  annualRevenue: number | null,
): Nis2Result {
  if (!sectorId) {
    return {
      nis2Relevant: false,
      nis2Category: null,
      kritisRelevant: false,
      kritisSector: null,
      explanation: 'Keine Branche ausgewaehlt. Kategorisierung nicht moeglich.',
    }
  }

  const sector = NIS2_SECTORS.find(s => s.id === sectorId)
  if (!sector) {
    return {
      nis2Relevant: false,
      nis2Category: null,
      kritisRelevant: false,
      kritisSector: null,
      explanation: 'Branche nicht in NIS2-Sektoren gelistet.',
    }
  }

  const employees = employeeCount || 0
  const revenue = annualRevenue || 0

  // Check KRITIS
  const kritisRelevant = sector.isKritis
  const kritisSector = sector.kritisLabel || null

  // Wesentliche Einrichtung: Anhang-I-Sektor + grosse Unternehmen
  if (sector.category === 'wesentlich' && (employees >= 250 || revenue >= 50_000_000)) {
    return {
      nis2Relevant: true,
      nis2Category: 'wesentlich',
      kritisRelevant,
      kritisSector,
      explanation: `Ihr Unternehmen ist als wesentliche Einrichtung eingestuft. Branche "${sector.label}" faellt unter Anhang I der NIS2-Richtlinie und Sie ueberschreiten die Groessenschwelle (>=250 Mitarbeiter oder >=50 Mio. EUR Umsatz).`,
    }
  }

  // Wichtige Einrichtung: Anhang I oder II + mittlere Unternehmen
  if (employees >= 50 || revenue >= 10_000_000) {
    return {
      nis2Relevant: true,
      nis2Category: 'wichtig',
      kritisRelevant,
      kritisSector,
      explanation: `Ihr Unternehmen ist als wichtige Einrichtung eingestuft. Branche "${sector.label}" faellt unter die NIS2-Richtlinie und Sie ueberschreiten die Schwelle (>=50 Mitarbeiter oder >=10 Mio. EUR Umsatz).`,
    }
  }

  // Unter Schwellenwerten
  return {
    nis2Relevant: false,
    nis2Category: null,
    kritisRelevant,
    kritisSector,
    explanation: `Ihr Unternehmen liegt voraussichtlich unter den NIS2-Schwellenwerten (<50 Mitarbeiter und <10 Mio. EUR Umsatz). Eine freiwillige Umsetzung der NIS2-Anforderungen wird dennoch empfohlen.`,
  }
}
