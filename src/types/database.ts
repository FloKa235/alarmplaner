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
  title: string
  type: string
  severity: number
  description: string | null
  affected_population: number | null
  is_ai_generated: boolean
  is_edited: boolean
  is_default: boolean
  handbook: ScenarioHandbook | null
  is_handbook_generated: boolean
  created_at: string
}

// ─── Szenario-Handbuch (KI-generiert) ──────────────
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
  category: string
  target_quantity: number
  current_quantity: number
  unit: string
  location: string | null
  created_at: string
}

export interface DbAlertContact {
  id: string
  district_id: string
  name: string
  role: string | null
  organization: string | null
  email: string | null
  phone: string | null
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
  status: string
  sent_at: string | null
  resolved_at: string | null
  created_at: string
}

export interface DbDocument {
  id: string
  district_id: string
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
  title: string
  type: string
  severity?: number
  description?: string | null
  affected_population?: number | null
  is_ai_generated?: boolean
  is_edited?: boolean
  is_default?: boolean
  handbook?: ScenarioHandbook | null
  is_handbook_generated?: boolean
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
  target_quantity?: number
  current_quantity?: number
  unit: string
  location?: string | null
}

export interface DbAlertContactInsert {
  id?: string
  district_id: string
  name: string
  role?: string | null
  organization?: string | null
  email?: string | null
  phone?: string | null
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
  status?: string
  sent_at?: string | null
  resolved_at?: string | null
}

export interface DbDocumentInsert {
  id?: string
  district_id: string
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

// ─── Checklisten (Krisenstab) ────────────────────────

export interface ChecklistItem {
  id: string
  text: string
  status: 'open' | 'done' | 'skipped'
  completed_at: string | null
  completed_by: string | null
}

export interface DbChecklist {
  id: string
  district_id: string
  scenario_id: string | null
  title: string
  description: string | null
  category: 'krisenstab' | 'sofortmassnahmen' | 'kommunikation' | 'nachbereitung' | 'custom'
  items: ChecklistItem[]
  is_template: boolean
  created_at: string
  updated_at: string
}
