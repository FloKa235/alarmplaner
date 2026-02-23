// ============================================
// Alarmplaner – Supabase Database Types
// ============================================
// Diese Typen spiegeln 1:1 das SQL-Schema wider.
// Supabase gibt snake_case zurück – wir mappen auf camelCase in den Hooks.
// ============================================

export interface Database {
  public: {
    Tables: {
      districts: {
        Row: DbDistrict
        Insert: DbDistrictInsert
        Update: Partial<DbDistrictInsert>
        Relationships: []
      }
      municipalities: {
        Row: DbMunicipality
        Insert: DbMunicipalityInsert
        Update: Partial<DbMunicipalityInsert>
        Relationships: []
      }
      kritis_sites: {
        Row: DbKritisSite
        Insert: DbKritisSiteInsert
        Update: Partial<DbKritisSiteInsert>
        Relationships: []
      }
      risk_profiles: {
        Row: DbRiskProfile
        Insert: DbRiskProfileInsert
        Update: Partial<DbRiskProfileInsert>
        Relationships: []
      }
      risk_entries: {
        Row: DbRiskEntry
        Insert: DbRiskEntryInsert
        Update: Partial<DbRiskEntryInsert>
        Relationships: []
      }
      scenarios: {
        Row: DbScenario
        Insert: DbScenarioInsert
        Update: Partial<DbScenarioInsert>
        Relationships: []
      }
      scenario_phases: {
        Row: DbScenarioPhase
        Insert: DbScenarioPhaseInsert
        Update: Partial<DbScenarioPhaseInsert>
        Relationships: []
      }
      inventory_items: {
        Row: DbInventoryItem
        Insert: DbInventoryItemInsert
        Update: Partial<DbInventoryItemInsert>
        Relationships: []
      }
      inventory_scenario_links: {
        Row: DbInventoryScenarioLink
        Insert: DbInventoryScenarioLink
        Update: Partial<DbInventoryScenarioLink>
        Relationships: []
      }
      alert_contacts: {
        Row: DbAlertContact
        Insert: DbAlertContactInsert
        Update: Partial<DbAlertContactInsert>
        Relationships: []
      }
      alerts: {
        Row: DbAlert
        Insert: DbAlertInsert
        Update: Partial<DbAlertInsert>
        Relationships: []
      }
      documents: {
        Row: DbDocument
        Insert: DbDocumentInsert
        Update: Partial<DbDocumentInsert>
        Relationships: []
      }
      crisis_events: {
        Row: DbCrisisEvent
        Insert: DbCrisisEventInsert
        Update: Partial<DbCrisisEventInsert>
        Relationships: []
      }
      neighborhood_profiles: {
        Row: DbNeighborhoodProfile
        Insert: DbNeighborhoodProfileInsert
        Update: Partial<DbNeighborhoodProfileInsert>
        Relationships: []
      }
      neighborhood_requests: {
        Row: DbNeighborhoodRequest
        Insert: DbNeighborhoodRequestInsert
        Update: Partial<DbNeighborhoodRequestInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// ==================
// Row Types (SELECT)
// ==================

export interface DbDistrict {
  id: string
  user_id: string
  name: string
  state: string
  population: number
  area_km2: number
  latitude: number | null
  longitude: number | null
  last_auto_refresh: string | null
  crisis_active: boolean
  crisis_scenario_id: string | null
  crisis_stufe: 'vorwarnung' | 'teilaktivierung' | 'vollaktivierung' | null
  crisis_started_at: string | null
  crisis_ended_at: string | null
  created_at: string
}

export interface DbMunicipality {
  id: string
  district_id: string
  name: string
  population: number
  area_km2: number
  latitude: number
  longitude: number
  risk_level: string | null
  risk_score: number
  created_at: string
}

export interface DbKritisSite {
  id: string
  district_id: string
  municipality_id: string | null
  name: string
  category: string
  sector: string | null
  latitude: number
  longitude: number
  address: string | null
  risk_exposure: string | null
  metadata: Record<string, unknown>
  // Ansprechpartner vor Ort
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  // Betreiber
  operator: string | null
  employee_count: number | null
  // Notfallbereitschaft
  has_emergency_plan: boolean
  emergency_plan_updated_at: string | null
  emergency_plan_notes: string | null
  // Resilienz
  redundancy_level: 'keine' | 'teilweise' | 'voll' | null
  has_backup_power: boolean
  // Inspektion
  last_inspected_at: string | null
  created_at: string
}

export interface DbRiskProfile {
  id: string
  district_id: string
  risk_score: number
  risk_level: string | null
  generated_at: string
}

export interface DbRiskEntry {
  id: string
  risk_profile_id: string
  type: string
  score: number
  level: string | null
  trend: string
  description: string | null
}

export interface DbScenario {
  id: string
  district_id: string
  municipality_id: string | null
  title: string
  type: string
  severity: number
  description: string | null
  affected_population: number | null
  is_ai_generated: boolean
  is_edited: boolean
  is_default: boolean
  handbook: ScenarioHandbook | ScenarioHandbookV2 | ScenarioHandbookV3 | null
  is_handbook_generated: boolean
  meta: SzenarioMeta | null
  created_at: string
  updated_at: string | null
}

// ─── Krisenhandbuch V2 (Kapitel-basiert) ──────────────
export interface KapitelChecklistItem {
  id: string
  text: string
  status: 'open' | 'done' | 'skipped'
  notiz: string
  completed_at: string | null
}

export interface KrisenhandbuchKapitel {
  id: string
  nummer: number
  titel: string
  inhalt: string
  checkliste: KapitelChecklistItem[]
}

export interface ScenarioHandbookV2 {
  version: 2
  kapitel: KrisenhandbuchKapitel[]
  generated_at: string
}

export function isHandbookV2(h: ScenarioHandbook | ScenarioHandbookV2 | ScenarioHandbookV3 | null): h is ScenarioHandbookV2 {
  return h !== null && 'version' in h && (h as ScenarioHandbookV2).version === 2
}

// ─── Krisenhandbuch V3 (BSI/BBK 12-Kapitel) ──────────────
export interface KrisenhandbuchKapitelV3 extends KrisenhandbuchKapitel {
  key: string  // Semantischer Key aus KAPITEL_CONFIG (z.B. 'einleitung', 'krisenorganisation')
}

export interface ScenarioHandbookV3 {
  version: 3
  kapitel: KrisenhandbuchKapitelV3[]
  generated_at: string
}

export function isHandbookV3(h: ScenarioHandbook | ScenarioHandbookV2 | ScenarioHandbookV3 | null): h is ScenarioHandbookV3 {
  return h !== null && 'version' in h && (h as ScenarioHandbookV3).version === 3
}

// ─── Plan-Metadaten (Deckblatt/Impressum) ──────────────
export interface PlanMetadaten {
  ersteller: string | null
  version: string              // Default "1.0"
  gueltig_bis: string | null   // ISO date
  naechste_ueberpruefung: string | null
  freigabe_durch: string | null
  verteiler: string[]
}

// ─── Maßnahmenplan (operatives Einsatzprotokoll) ─────────
export type AlarmKanal = 'telefon' | 'email' | 'funk' | 'nina' | 'sirene' | 'messenger'

export interface AlarmkettenSchritt {
  id: string                    // crypto.randomUUID()
  reihenfolge: number           // 1, 2, 3...
  rolle: string                 // "S3 – Einsatz"
  kontaktgruppen: string[]      // Mappt auf alert_contacts.groups[]
  kanaele: AlarmKanal[]
  wartezeit_min: number         // Wartezeit zum nächsten Schritt
  bedingung: string | null      // z.B. "Bei Vollaktivierung"
}

export interface MassnahmenZuweisung {
  task_text: string             // Task-Text (matcht Phase-Task)
  verantwortlich: string | null // "S1"..."S6" oder "Alle"
  prioritaet: 'sofort' | 'hoch' | 'mittel' | 'niedrig'
}

export interface Massnahmenplan {
  alarmkette: AlarmkettenSchritt[]
  aufgaben_zuweisung: MassnahmenZuweisung[]
  generated_at: string | null
  last_edited: string | null
}

// ─── Eskalationsstufen (3-Stufen-Modell) ──────────────────
export type EskalationsStufeNummer = 1 | 2 | 3

export interface EskalationsChecklistItem {
  id: string                    // crypto.randomUUID()
  text: string                  // Schritt-Titel (z.B. "Krisenstab einberufen")
  beschreibung?: string         // Detailbeschreibung des Schritts
  status: 'open' | 'done' | 'skipped'
  completed_at: string | null
}

export interface EskalationsKommunikation {
  intern: string[]               // Interne Kommunikationsmaßnahmen
  extern: string[]               // Externe Kommunikation (Bevölkerung, Medien, Behörden)
  kanaele: string[]              // Kommunikationskanäle (NINA, Sirene, Social Media, etc.)
  sprachregelungen: string[]     // Vorgefertigte Formulierungen für diese Stufe
}

export interface EskalationsRessource {
  id: string
  kategorie: string              // z.B. "Sandsäcke", "Notstromaggregate"
  menge: string                  // z.B. "500 Stück", "3 Einheiten"
  prioritaet: 'kritisch' | 'hoch' | 'mittel' | 'niedrig'
  bereitgestellt: boolean        // Wurde bereits beschafft/bereitgestellt?
}

export interface EskalationsStufe {
  stufe: EskalationsStufeNummer
  name: string                  // "Vorwarnung" | "Akuter Vorfall" | "Katastrophe"
  beschreibung: string
  checkliste: EskalationsChecklistItem[]
  alarmkette: AlarmkettenSchritt[]
  krisenstab_rollen: string[]   // ["S2", "S5"] etc.
  // Card-Übersicht (optional für Backward-Kompatibilität)
  ausloeser?: string[]           // Wann wird diese Stufe aktiviert (mehrere Kriterien)
  informierte?: string[]        // Wer wird informiert (konkrete Rollen/Behörden)
  sofortmassnahmen?: string[]   // Sofortmaßnahmen pro Stufe
  // Erweiterte Felder (v2)
  kommunikation?: EskalationsKommunikation
  ressourcen?: EskalationsRessource[]
  lage_zusammenfassung?: string  // Kurze Lagebeschreibung für diese Stufe
  eskalations_kriterien?: string[] // Wann wird zur nächsten Stufe eskaliert
}

// ─── Szenario-Metadaten (operativer Ablauf) ──────────────
export interface SzenarioMeta {
  ausloese_kriterien: string[]
  sofortmassnahmen: string[]
  zeitphasen: Array<{
    phase: string          // "0-2h", "2-12h", "12-48h", ">48h"
    massnahmen: string[]
  }>
  prioritaeten: Array<{
    stufe: 'P1' | 'P2' | 'P3' | 'P4'
    beschreibung: string
    massnahmen: string[]
  }>
  massnahmenplan?: Massnahmenplan
  beteiligte_organisationen?: string[]
  eskalationsstufen?: EskalationsStufe[]
}

// ─── Szenario-Handbuch V1 (Legacy, KI-generiert) ─────
export interface ScenarioHandbook {
  risikobewertung: {
    bedrohungsanalyse: string
    eintrittswahrscheinlichkeit: string  // niedrig | mittel | hoch | sehr_hoch
    schadensausmass: string              // gering | mittel | erheblich | katastrophal
    betroffene_sektoren: string[]        // BBK-Sektor-Keys
    risikoeinschaetzung: string
  }
  praevention: {
    vorbereitung: string[]
    fruehwarnung: string[]
    schulungen: string[]
    materialvorhaltung: string[]
  }
  kommunikationsplan: {
    intern: { sofort: string[]; laufend: string[] }
    extern: { bevoelkerung: string[]; medien: string[]; behoerden: string[] }
    kanaele: string[]
    sprachregelungen: string[]
  }
  wennDannSzenarien: Array<{
    trigger: string
    massnahmen: string[]
    eskalation: string
  }>
  verantwortlichkeiten: Array<{
    funktion: string           // "S1 – Personal", "S2 – Lage", etc.
    aufgaben: string[]
    kontaktgruppe?: string     // Matching alert_contacts.groups
  }>
  inventar?: Array<{
    kategorie: string           // z.B. "Sandsäcke", "Stromgeneratoren"
    empfohlene_menge: number    // KI-empfohlene Menge für dieses Szenario
    einheit: string             // "Stück" | "kg" | "Liter" | "Paletten" | "Karton" | "Satz"
    begruendung: string         // 1-Satz Begründung
  }>
  generated_at: string
}

export interface DbScenarioPhase {
  id: string
  scenario_id: string
  sort_order: number
  name: string
  duration: string
  tasks: string[]
}

export interface DbInventoryItem {
  id: string
  district_id: string
  category: string                // Artikel-Name (UI: "Artikel")
  kategorie: string | null        // Breitere Kategorie ("Medizin", "Technik", etc.)
  priority: 'kritisch' | 'hoch' | 'mittel' | 'niedrig' | null
  target_quantity: number
  current_quantity: number
  unit: string
  price_per_unit: number | null
  location: string | null
  municipality_id: string | null  // FK → municipalities
  condition: 'einsatzbereit' | 'wartung_noetig' | 'defekt' | null
  last_inspected: string | null
  responsible: string | null
  created_at: string
}

export interface DbInventoryScenarioLink {
  inventory_item_id: string
  scenario_id: string
}

export interface DbAlertContact {
  id: string
  district_id: string
  name: string
  role: string | null
  organization: string | null
  email: string | null
  phone: string | null
  mobile_phone: string | null
  groups: string[]
  is_active: boolean
  created_at: string
}

export interface DbAlert {
  id: string
  district_id: string
  scenario_id: string | null
  level: number
  title: string
  message: string | null
  target_groups: string[]
  channels: string[]
  scope: 'landkreis' | 'gemeinden'
  municipality_ids: string[]
  municipality_names: string[]
  status: string
  sent_at: string | null
  resolved_at: string | null
  // Gemeinde-Alarmierung
  source: 'landkreis' | 'gemeinde'
  source_municipality_id: string | null
  is_escalated: boolean
  created_at: string
}

export interface DbDocument {
  id: string
  district_id: string
  scenario_id: string | null
  name: string
  file_type: string
  size_bytes: number | null
  category: string | null
  storage_path: string | null
  is_processed: boolean
  summary: string | null
  created_at: string
}

// ====================
// Insert Types (INSERT)
// ====================

export interface DbDistrictInsert {
  id?: string
  user_id: string
  name: string
  state: string
  population: number
  area_km2: number
  latitude?: number | null
  longitude?: number | null
  last_auto_refresh?: string | null
  crisis_active?: boolean
  crisis_scenario_id?: string | null
  crisis_stufe?: 'vorwarnung' | 'teilaktivierung' | 'vollaktivierung' | null
  crisis_started_at?: string | null
  crisis_ended_at?: string | null
}

export interface DbMunicipalityInsert {
  id?: string
  district_id: string
  name: string
  population?: number
  area_km2?: number
  latitude: number
  longitude: number
  risk_level?: string | null
  risk_score?: number
}

export interface DbKritisSiteInsert {
  id?: string
  district_id: string
  municipality_id?: string | null
  name: string
  category: string
  sector?: string | null
  latitude: number
  longitude: number
  address?: string | null
  risk_exposure?: string | null
  metadata?: Record<string, unknown>
  // Ansprechpartner vor Ort
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  // Betreiber
  operator?: string | null
  employee_count?: number | null
  // Notfallbereitschaft
  has_emergency_plan?: boolean
  emergency_plan_updated_at?: string | null
  emergency_plan_notes?: string | null
  // Resilienz
  redundancy_level?: 'keine' | 'teilweise' | 'voll' | null
  has_backup_power?: boolean
  // Inspektion
  last_inspected_at?: string | null
}

export interface DbRiskProfileInsert {
  id?: string
  district_id: string
  risk_score?: number
  risk_level?: string | null
}

export interface DbRiskEntryInsert {
  id?: string
  risk_profile_id: string
  type: string
  score?: number
  level?: string | null
  trend?: string
  description?: string | null
}

export interface DbScenarioInsert {
  id?: string
  district_id: string
  municipality_id?: string | null
  title: string
  type: string
  severity?: number
  description?: string | null
  affected_population?: number | null
  is_ai_generated?: boolean
  is_edited?: boolean
  is_default?: boolean
  handbook?: ScenarioHandbook | ScenarioHandbookV2 | ScenarioHandbookV3 | null
  is_handbook_generated?: boolean
  meta?: SzenarioMeta | null
  updated_at?: string | null
}

export interface DbScenarioPhaseInsert {
  id?: string
  scenario_id: string
  sort_order?: number
  name: string
  duration: string
  tasks?: string[]
}

export interface DbInventoryItemInsert {
  id?: string
  district_id: string
  category: string
  kategorie?: string | null
  priority?: 'kritisch' | 'hoch' | 'mittel' | 'niedrig' | null
  target_quantity?: number
  current_quantity?: number
  unit: string
  price_per_unit?: number | null
  location?: string | null
  municipality_id?: string | null
  condition?: 'einsatzbereit' | 'wartung_noetig' | 'defekt' | null
  last_inspected?: string | null
  responsible?: string | null
}

export interface DbAlertContactInsert {
  id?: string
  district_id: string
  name: string
  role?: string | null
  organization?: string | null
  email?: string | null
  phone?: string | null
  mobile_phone?: string | null
  groups?: string[]
  is_active?: boolean
}

export interface DbAlertInsert {
  id?: string
  district_id: string
  scenario_id?: string | null
  level: number
  title: string
  message?: string | null
  target_groups?: string[]
  channels?: string[]
  scope?: 'landkreis' | 'gemeinden'
  municipality_ids?: string[]
  municipality_names?: string[]
  status?: string
  sent_at?: string | null
  resolved_at?: string | null
  // Gemeinde-Alarmierung
  source?: 'landkreis' | 'gemeinde'
  source_municipality_id?: string | null
  is_escalated?: boolean
}

export interface DbDocumentInsert {
  id?: string
  district_id: string
  scenario_id?: string | null
  name: string
  file_type: string
  size_bytes?: number | null
  category?: string | null
  storage_path?: string | null
  is_processed?: boolean
  summary?: string | null
}

// ==================
// External Warnings (NINA/DWD)
// ==================

export interface DbExternalWarning {
  id: string
  district_id: string
  source: 'nina' | 'dwd' | 'pegel'
  external_id: string
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
  title: string
  description: string | null
  affected_areas: string[]
  effective_at: string
  expires_at: string | null
  instruction: string | null
  raw_data: Record<string, unknown> | null
  fetched_at: string
}

export interface DbExternalWarningInsert {
  id?: string
  district_id: string
  source: 'nina' | 'dwd' | 'pegel'
  external_id: string
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
  title: string
  description?: string | null
  affected_areas?: string[]
  effective_at: string
  expires_at?: string | null
  instruction?: string | null
  raw_data?: Record<string, unknown> | null
}

// ─── Krisen-Events (Crisis Timeline) ────────────────────
export type CrisisEventType =
  | 'krise_aktiviert'
  | 'krise_beendet'
  | 'stufe_geaendert'
  | 'alarm_gesendet'
  | 'massnahme_erledigt'
  | 'checkliste_aktualisiert'
  | 'warnung_eingegangen'
  | 'manueller_eintrag'
  | 'kontakt_alarmiert'
  | 'eskalation'

export interface DbCrisisEvent {
  id: string
  district_id: string
  scenario_id: string | null
  type: CrisisEventType
  beschreibung: string
  details: Record<string, unknown>
  erstellt_von: string | null
  created_at: string
}

export interface DbCrisisEventInsert {
  id?: string
  district_id: string
  scenario_id?: string | null
  type: CrisisEventType
  beschreibung: string
  details?: Record<string, unknown>
  erstellt_von?: string | null
}

// ─── Checklisten (Krisenstab) ────────────────────────

export interface ChecklistItem {
  id: string
  text: string
  status: 'open' | 'done' | 'skipped' | 'partial'
  completed_at: string | null
  completed_by: string | null
}

export interface DbChecklist {
  id: string
  district_id: string
  scenario_id: string | null
  municipality_id: string | null
  title: string
  description: string | null
  category: 'krisenstab' | 'sofortmassnahmen' | 'kommunikation' | 'nachbereitung' | 'custom' | 'vorbereitung'
  items: ChecklistItem[]
  is_template: boolean
  created_at: string
  updated_at: string
}

// ─── Gemeinde-Portal: Mitglieder + Meldungen ────────────

export type DistrictMemberRole = 'admin' | 'buergermeister'
export type DistrictMemberStatus = 'invited' | 'active' | 'disabled'

export interface DbDistrictMember {
  id: string
  user_id: string | null
  district_id: string
  municipality_id: string | null
  role: DistrictMemberRole
  invited_by: string | null
  invited_email: string | null
  status: DistrictMemberStatus
  created_at: string
  activated_at: string | null
}

export interface DbDistrictMemberInsert {
  id?: string
  user_id?: string | null
  district_id: string
  municipality_id?: string | null
  role: DistrictMemberRole
  invited_by?: string | null
  invited_email?: string | null
  status?: DistrictMemberStatus
  activated_at?: string | null
}

export type IncidentSeverity = 'niedrig' | 'mittel' | 'hoch' | 'kritisch'
export type IncidentStatus = 'offen' | 'in_bearbeitung' | 'erledigt' | 'abgelehnt'

export interface DbIncidentReport {
  id: string
  district_id: string
  municipality_id: string
  reported_by: string
  title: string
  description: string | null
  severity: IncidentSeverity
  category: string | null
  status: IncidentStatus
  admin_notes: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string | null
}

export interface DbIncidentReportInsert {
  id?: string
  district_id: string
  municipality_id: string
  reported_by: string
  title: string
  description?: string | null
  severity: IncidentSeverity
  category?: string | null
  status?: IncidentStatus
  admin_notes?: string | null
  latitude?: number | null
  longitude?: number | null
}

// ─── Bürger-App: Citizen Inventory ────────────────────────

export type CitizenInventoryCategory =
  | 'getraenke'
  | 'lebensmittel'
  | 'hygiene'
  | 'medikamente'
  | 'notfallausruestung'
  | 'werkzeuge'
  | 'dokumente'
  | 'babybedarf'
  | 'tierbedarf'

export interface DbCitizenInventory {
  id: string
  user_id: string
  category: CitizenInventoryCategory
  subcategory: string | null
  item_name: string
  target_qty: number
  current_qty: number
  unit: string
  expiry_date: string | null
  purchase_date: string | null
  product_name: string | null
  notes: string | null
  is_checked: boolean
  is_custom: boolean
  is_regional: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DbCitizenInventoryInsert {
  id?: string
  user_id: string
  category: CitizenInventoryCategory
  subcategory?: string | null
  item_name: string
  target_qty?: number
  current_qty?: number
  unit?: string
  expiry_date?: string | null
  purchase_date?: string | null
  product_name?: string | null
  notes?: string | null
  is_checked?: boolean
  is_custom?: boolean
  is_regional?: boolean
  sort_order?: number
}

// ─── Bürger-App: Household Profile (user_metadata) ────────

export interface CitizenHouseholdProfile {
  household_persons: number
  household_babies: number
  household_seniors: number
  household_pets: boolean
  dietary_restrictions: string[]
  risk_profile: string[]
  onboarding_completed: boolean
}

// ─── Nachbarschafts-Netzwerk ─────────────────────────────

export interface DbNeighborhoodProfile {
  id: string
  user_id: string
  display_name: string
  skills: string[]
  resources: string[]
  lat: number
  lng: number
  district_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbNeighborhoodProfileInsert {
  id?: string
  user_id: string
  display_name: string
  skills?: string[]
  resources?: string[]
  lat: number
  lng: number
  district_id?: string | null
  is_active?: boolean
}

export interface DbNeighborhoodRequest {
  id: string
  profile_id: string
  type: 'offer' | 'request'
  title: string
  description: string | null
  category: string
  is_resolved: boolean
  created_at: string
}

export interface DbNeighborhoodRequestInsert {
  id?: string
  profile_id: string
  type: 'offer' | 'request'
  title: string
  description?: string | null
  category: string
  is_resolved?: boolean
}
