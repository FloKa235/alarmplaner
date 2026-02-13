export type TargetGroup = 'privat' | 'kommunen' | 'unternehmen'

export interface HeroContent {
  badge: string
  headlineParts: { text: string; color?: 'orange' | 'blue' | 'white' }[]
  subline: string
  primaryCta: string
  secondaryCta?: string
  trustBadges: string[]
}

export interface Challenge {
  icon: string
  title: string
  description: string
}

export interface Feature {
  icon: string
  title: string
  description: string
}

export interface Benefit {
  icon: string
  stat: string
  statSub?: string
  title: string
  description: string
}

export interface Testimonial {
  quote: string
  name: string
  role: string
  org: string
  initials: string
}

export interface PricingPlan {
  label: string
  price: string
  period?: string
  features: string[]
  cta: string
  highlighted?: boolean
}

export interface PricingSection {
  title: string
  subtitle: string
  plans: PricingPlan[]
}

export interface FaqItem {
  question: string
  answer: string
}

export interface CtaBannerContent {
  headline: string
  subline: string
  cta: string
}

export interface TabContent {
  hero: HeroContent
  challenges: { title: string; subtitle: string; items: Challenge[] }
  features: { title: string; subtitle: string; items: Feature[] }
  benefits: { title: string; subtitle: string; items: Benefit[] }
  testimonials: { title: string; items: Testimonial[] }
  pricing: PricingSection
  faq: FaqItem[]
  ctaBanner: CtaBannerContent
}

// ==========================================
// App Domain Types
// ==========================================

// Navigation
export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}

// User (Placeholder für spätere Auth)
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  avatar?: string
}

// Privat-App: Warnungen
export type WarningSeverity = 'minor' | 'moderate' | 'severe' | 'extreme'
export type WarningSource = 'nina' | 'dwd' | 'pegel'

export interface Warning {
  id: string
  type: WarningSource
  severity: WarningSeverity
  title: string
  description: string
  region: string
  startDate: string
  endDate?: string
  coordinates?: { lat: number; lng: number }
}

// Privat-App: Checkliste
export interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  category: string
  quantity?: number
  unit?: string
}

// Privat-App: Notfallplan
export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relation: string
}

export interface EmergencyPlan {
  meetingPoint: string
  contacts: EmergencyContact[]
  notes: string
}

// PRO-App: Risikoanalyse (Säule 1)
export type RiskLevel = 'niedrig' | 'mittel' | 'erhöht' | 'hoch' | 'extrem'

export interface RiskProfile {
  id: string
  districtId: string
  municipalityId?: string
  riskScore: number
  riskLevel: RiskLevel
  risks: RiskEntry[]
  generatedAt: string
}

export interface RiskEntry {
  type: string
  score: number
  level: RiskLevel
  description: string
}

// PRO-App: Szenarien (Säule 2)
export interface CrisisScenario {
  id: string
  districtId: string
  municipalityId?: string
  title: string
  type: string
  severity: number
  description: string
  affectedPopulation?: number
  isAiGenerated: boolean
  isEdited: boolean
  createdAt: string
}

export interface ActionPlan {
  id: string
  scenarioId: string
  title: string
  phases: ActionPhase[]
  isAiGenerated: boolean
  version: number
}

export interface ActionPhase {
  name: string
  duration: string
  tasks: string[]
}

// PRO-App: Inventar (Säule 3)
export interface InventoryItem {
  id: string
  districtId: string
  category: string
  name: string
  quantity: number
  unit: string
  location?: string
  organization?: string
  condition: 'gut' | 'mittel' | 'schlecht'
  lastChecked?: string
}

export interface InventoryTarget {
  id: string
  category: string
  name: string
  targetQuantity: number
  currentQuantity: number
  fulfillmentPercent: number
}

// PRO-App: Alarmierung (Säule 4)
export interface AlertContact {
  id: string
  name: string
  role: string
  organization: string
  email: string
  phone: string
  groups: string[]
  isActive: boolean
}

export interface Alert {
  id: string
  districtId: string
  scenarioId?: string
  level: 1 | 2 | 3
  title: string
  message: string
  targetGroups: string[]
  channels: string[]
  status: 'draft' | 'sent' | 'acknowledged' | 'resolved'
  sentAt?: string
  resolvedAt?: string
}

// PRO-App: Gemeinden
export interface Municipality {
  id: string
  districtId: string
  name: string
  population: number
  areaKm2: number
  latitude: number
  longitude: number
  riskLevel?: RiskLevel
  riskScore?: number
}

// PRO-App: BBK KRITIS-Sektoren
export type KritisSector =
  | 'energie' | 'wasser' | 'ernaehrung' | 'gesundheit'
  | 'transport' | 'it_telekom' | 'finanz' | 'staat'
  | 'medien' | 'wasserbau' | 'militaer'

export type KritisCategory = string // Freiform — wird durch DB-Constraint validiert

export interface KritisSite {
  id: string
  districtId: string
  municipalityId?: string
  name: string
  category: KritisCategory
  sector?: KritisSector
  latitude: number
  longitude: number
  address?: string
  riskExposure?: RiskLevel
  metadata?: Record<string, unknown>
}

// Onboarding
export interface District {
  id: string
  name: string
  state: string
  areaKm2: number
  population: number
  latitude: number
  longitude: number
}

export interface OnboardingState {
  step: 1 | 2 | 3
  district?: District
  loadingProgress: number
  loadedItems: {
    gemeinden: number
    kritis: number
    risiken: number
    szenarien: number
  }
}
