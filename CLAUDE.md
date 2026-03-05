# Alarmplaner - Projekt-Kontext

## Projekt-Ziel
KI-gestütztes Krisenmanagement-SaaS ("Alarmplaner") for German municipalities and districts. BBK-Pitch (Bundesamt für Bevölkerungsschutz, 1M EUR Funding). Zielgruppe: Landkreise, Landrat, Krisenstab-Leiter.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Maps**: Mapbox GL JS
- **AI**: OpenAI GPT-4o (via Supabase Edge Functions)
- **Rich Text**: TipTap (Krisenhandbuch)
- **PDF**: jsPDF + jspdf-autotable
- **State**: React Query (TanStack Query v5)
- **Routing**: React Router v7

## 3 Apps in einer Codebase
1. **Alarmplaner Pro** (`/pro/*`) - Landkreis-Tool (Hauptprodukt)
2. **Gemeinde-Portal** (`/gemeinde/*`) - Gemeinde-Ansicht (eingeschränkt)
3. **Buerger-App** (`/app/*`) - Buerger-Vorsorge-Tool

## Navigation (Sidebar.tsx)
```
Uebersicht:
  - Landkreis (/pro)          → ProDashboard.tsx (Map + KPIs + Gemeinden-Tabelle)
  - Gemeinden (/pro/gemeinden) → GemeindenPage.tsx (Card-Grid + Detail)

Vorbereitung:
  - Aufgaben (/pro/vorbereitung)    → VorbereitungPage.tsx (2 Tabs: Checkliste + Krisenstab)
  - Risikoanalyse (/pro/risikoanalyse) → RisikoanalysePage.tsx
  - Szenarien (/pro/szenarien)       → SzenarienPage.tsx → SzenarioDetailPage.tsx (8 Tabs)
  - KRITIS (/pro/kritis)             → KritisPage.tsx

Alarmierung:
  - Alarmierung (/pro/alarmierung)           → AlarmierungPage.tsx
  - Kontakte (/pro/alarmierung/kontakte)     → KontaktePage.tsx

Ressourcen:
  - Inventar (/pro/inventar)    → InventarPage.tsx
  - Dokumente (/pro/dokumente)  → DokumentePage.tsx (Ordner-System)

Krisenmodus (nur wenn aktiv):
  - Lagezentrum (/pro/lagezentrum) → LagezentrumPage.tsx
  - Timeline (/pro/timeline)       → TimelinePage.tsx
```

## Schluessel-Patterns

### Data Fetching
```typescript
const { data, loading, error, refetch } = useSupabaseQuery<Type>(
  supabase.from('table').select('*').eq('district_id', districtId),
  [districtId]
)
```

### District Context
```typescript
const { districtId } = useDistrict() // von DistrictContext
```

### Tab Pattern (State-basiert, kein Routing)
```typescript
type PageTab = 'tab1' | 'tab2'
const TABS = [{ key: 'tab1', label: 'Tab 1', icon: Icon }]
const [activeTab, setActiveTab] = useState<PageTab>('tab1')
// Conditional render: {activeTab === 'tab1' && (...)}
```

### Modal CRUD Pattern
```typescript
import { Modal, FormField, inputClass, selectClass, ModalFooter, ConfirmDialog } from '@/components/ui/Modal'
```

### UI Components
- Alle in `src/components/ui/` (Modal.tsx, DropZone.tsx, etc.)
- Lucide React Icons (lucide-react)
- clsx fuer conditional classNames
- Tailwind v4 CSS Variables: text-text-primary, bg-surface-secondary, border-border, etc.

## Datenbank (Supabase PostgreSQL)
Schluessel-Tabellen:
- `districts` - Landkreise (user_id FK)
- `municipalities` - Gemeinden (district_id FK)
- `kritis_sites` - KRITIS-Infrastruktur (district_id FK, 12 BBK-Sektoren)
- `scenarios` - Krisenszenarien (district_id FK)
- `scenario_handbook_sections` - KI-generiertes Handbuch (8 Kapitel)
- `alert_contacts` - Kontakte (district_id FK)
- `alerts` - Alarme (district_id FK)
- `documents` - Dokumente (district_id FK, category = Ordner)
- `inventory_items` - Inventar (district_id FK)
- `checklists` / `checklist_items` - ExTrass-Checklisten
- `krisenstab_members` - S1-S6 + Leiter Rollen (district_id FK, contact_id FK nullable)
- `risk_profiles` - KI-Risikoanalyse
- `external_warnings` - NINA/DWD/Pegel Warnungen
- `citizen_inventory` - Buerger-Vorsorge

RLS: Alle Tabellen mit Row-Level-Security via `districts.user_id = auth.uid()`

## Edge Functions (Supabase Deno)
- `ai-enrich-scenario` - KI-Anreicherung eines Szenarios (GPT-4o)
- `ai-generate-scenario` - KI-Szenario-Generierung
- `ai-risk-analysis` - KI-Risikoanalyse (auto 2x taeglich)
- `ai-alert-message` - KI-Alarmnachrichten
- `ai-citizen-chat` - KI-Chat fuer Buerger-App
- `ai-inventory-recommendation` - KI-Inventar-Empfehlungen
- `auto-refresh-all` - Cron: Warnungen + Risiko-Update
- `fetch-warnings` - NINA + DWD + Pegelonline APIs
- `fetch-district-stats` - Landkreis-Statistiken
- `import-osm-kritis` - KRITIS-Import via OSM Overpass API
- `import-osm-municipalities` - Gemeinden-Import via OSM
- `invite-member` - Einladungs-System
- `process-document` - Dokumenten-KI-Analyse

## USPs / Alleinstellungsmerkmale
1. KI-Risikoanalyse (auto 2x taeglich, kein Wettbewerber hat das)
2. KI-Krisenhandbuch (8 Sektionen, editierbar via TipTap)
3. KRITIS Auto-Import (12 BBK-Sektoren via OSM)
4. Echtzeit-Warnungen (NINA + DWD + Pegelonline integriert)
5. Buerger-App (Differenzierung vs B2B-only Wettbewerber)
6. One-Click Onboarding mit echten Daten

## Wettbewerber
NKM/SIUS, MultiBel, F24/FACT24, Fireboard, CommandX, safeREACH, Telekom

## Zuletzt implementierte Features (Session Feb 2026)
- Dokumente Ordner-System (category = Ordner, Custom-Folder-Erstellung)
- VorbereitungPage 2-Tab-Layout (Checkliste + Krisenstab)
- KrisenstabTab mit S1-S6 + Leiter Rollen, Kontakt-Verknuepfung + manuelle Eingabe
- Toter "Alarm-Vorlage" Button entfernt auf AlarmierungPage

## Offene Verbesserungen (BBK-Pitch Prioritaet)
- CSV/Excel-Export fuer Inventar, Kontakte, KRITIS-Tabellen
- Dashboard-KPIs prominenter gestalten
- Einsatztagebuch (Chronologie bei Krisenfaellen)
- Nachbereitung/Lessons Learned
- KRITIS-Dachgesetz Compliance-Modul

## Notion Doku
https://www.notion.so/313000b43746814b80d4e79443d0df11

## Build & Deploy
```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npx supabase db push --linked --include-all  # Migrationen deployen
npm run deploy:all   # Edge Functions deployen
```
