import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Loader2 } from 'lucide-react'

// Layouts loaded eagerly (small, needed for shell)
import AppLayout from './components/layout/AppLayout'
import ProLayout from './components/layout/ProLayout'
import GemeindeLayout from './components/layout/GemeindeLayout'
import UnternehmenLayout from './components/layout/UnternehmenLayout'

// Landing loaded eagerly (first paint)
import LandingPage from './pages/LandingPage'

// Everything else lazy-loaded
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const InviteAcceptPage = lazy(() => import('./pages/auth/InviteAcceptPage'))

// Privat-App
const PrivatDashboard = lazy(() => import('./pages/app/PrivatDashboard'))
// WarnungenPage entfernt — Warnungen nur noch im Dashboard angezeigt
const VorsorgePage = lazy(() => import('./pages/app/VorsorgePage'))
const WissenssammlungPage = lazy(() => import('./pages/app/WissenssammlungPage'))
// ChecklistenPage removed — /app/checklisten now renders VorsorgePage
const NotfallplanPage = lazy(() => import('./pages/app/NotfallplanPage'))
const NotfallAssistentPage = lazy(() => import('./pages/app/NotfallAssistentPage'))
const NachbarschaftPage = lazy(() => import('./pages/app/NachbarschaftPage'))
const EinstellungenPage = lazy(() => import('./pages/app/EinstellungenPage'))

// PRO-App
const ProDashboard = lazy(() => import('./pages/pro/ProDashboard'))
const RisikoanalysePage = lazy(() => import('./pages/pro/RisikoanalysePage'))
const SzenarienPage = lazy(() => import('./pages/pro/SzenarienPage'))
const SzenarioDetailPage = lazy(() => import('./pages/pro/SzenarioDetailPage'))
const InventarPage = lazy(() => import('./pages/pro/InventarPage'))
const AlarmierungPage = lazy(() => import('./pages/pro/AlarmierungPage'))
const KontaktePage = lazy(() => import('./pages/pro/KontaktePage'))
const KrisenstabPage = lazy(() => import('./pages/pro/KrisenstabPage'))
const GemeindenPage = lazy(() => import('./pages/pro/GemeindenPage'))
const GemeindeDetailPage = lazy(() => import('./pages/pro/GemeindeDetailPage'))
const KritisPage = lazy(() => import('./pages/pro/KritisPage'))
const VorbereitungPage = lazy(() => import('./pages/pro/VorbereitungPage'))
const DokumentePage = lazy(() => import('./pages/pro/DokumentePage'))
const ProEinstellungenPage = lazy(() => import('./pages/pro/ProEinstellungenPage'))
const OnboardingPage = lazy(() => import('./pages/pro/OnboardingPage'))
const HandbuchPage = lazy(() => import('./pages/pro/HandbuchPage'))
const LagezentrumPage = lazy(() => import('./pages/pro/LagezentrumPage'))
const TimelinePage = lazy(() => import('./pages/pro/TimelinePage'))

// Unternehmen-App (Business Tier)
const UnternehmenDashboard = lazy(() => import('./pages/unternehmen/UnternehmenDashboard'))
const CompliancePage = lazy(() => import('./pages/unternehmen/CompliancePage'))
const BiaPage = lazy(() => import('./pages/unternehmen/BiaPage'))
const LieferkettenPage = lazy(() => import('./pages/unternehmen/LieferkettenPage'))
const UebungenPage = lazy(() => import('./pages/unternehmen/UebungenPage'))
const EnterpriseOnboarding = lazy(() => import('./pages/unternehmen/EnterpriseOnboarding'))
const EnterpriseStandortePage = lazy(() => import('./pages/unternehmen/EnterpriseStandortePage'))
const EnterpriseRisikoanalysePage = lazy(() => import('./pages/unternehmen/EnterpriseRisikoanalysePage'))
const EnterpriseSzenarienPage = lazy(() => import('./pages/unternehmen/EnterpriseSzenarienPage'))
const EnterpriseInventarPage = lazy(() => import('./pages/unternehmen/EnterpriseInventarPage'))
const EnterpriseAlarmierungPage = lazy(() => import('./pages/unternehmen/EnterpriseAlarmierungPage'))
const EnterpriseKontaktePage = lazy(() => import('./pages/unternehmen/EnterpriseKontaktePage'))

// Gemeinde-App (Bürgermeister-Portal)
const GemeindeDashboard = lazy(() => import('./pages/gemeinde/GemeindeDashboard'))
const GemeindeInventarPage = lazy(() => import('./pages/gemeinde/GemeindeInventarPage'))
const GemeindeKritisPage = lazy(() => import('./pages/gemeinde/GemeindeKritisPage'))
const GemeindeChecklistenPage = lazy(() => import('./pages/gemeinde/GemeindeChecklistenPage'))
const GemeindeSzenarienPage = lazy(() => import('./pages/gemeinde/GemeindeSzenarienPage'))
const GemeindeSzenarioDetailPage = lazy(() => import('./pages/gemeinde/GemeindeSzenarioDetailPage'))
const NotfallMeldenPage = lazy(() => import('./pages/gemeinde/NotfallMeldenPage'))
const GemeindeEinstellungenPage = lazy(() => import('./pages/gemeinde/GemeindeEinstellungenPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing – öffentlich */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth – öffentlich */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/invite-accept" element={<ProtectedRoute><InviteAcceptPage /></ProtectedRoute>} />

            {/* Privat-App – geschützt */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<PrivatDashboard />} />
              <Route path="vorsorge" element={<VorsorgePage />} />
              <Route path="wissen" element={<WissenssammlungPage />} />
              <Route path="checklisten" element={<VorsorgePage />} />
              <Route path="notfallplan" element={<NotfallplanPage />} />
              <Route path="assistent" element={<NotfallAssistentPage />} />
              <Route path="nachbarn" element={<NachbarschaftPage />} />
              <Route path="einstellungen" element={<EinstellungenPage />} />
            </Route>

            {/* PRO-App – geschützt */}
            <Route path="/pro" element={<ProtectedRoute><ProLayout /></ProtectedRoute>}>
              <Route index element={<ProDashboard />} />
              <Route path="risikoanalyse" element={<RisikoanalysePage />} />
              <Route path="szenarien" element={<SzenarienPage />} />
              <Route path="szenarien/:id" element={<SzenarioDetailPage />} />
              <Route path="inventar" element={<InventarPage />} />
              <Route path="alarmierung" element={<AlarmierungPage />} />
              <Route path="alarmierung/kontakte" element={<KontaktePage />} />
              <Route path="alarmierung/krisenstab" element={<KrisenstabPage />} />
              <Route path="gemeinden" element={<GemeindenPage />} />
              <Route path="gemeinden/:id" element={<GemeindeDetailPage />} />
              <Route path="handbuch" element={<HandbuchPage />} />
              <Route path="kritis" element={<KritisPage />} />
              <Route path="kritis/compliance" element={<KritisPage />} />
              <Route path="vorbereitung" element={<VorbereitungPage />} />
              <Route path="checklisten" element={<Navigate to="/pro/vorbereitung" replace />} />
              <Route path="dokumente" element={<DokumentePage />} />
              <Route path="einstellungen" element={<ProEinstellungenPage />} />
              <Route path="lagezentrum" element={<LagezentrumPage />} />
              <Route path="timeline" element={<TimelinePage />} />
            </Route>

            {/* Unternehmen-App – geschützt (Business Tier) */}
            <Route path="/unternehmen" element={<ProtectedRoute><UnternehmenLayout /></ProtectedRoute>}>
              <Route index element={<UnternehmenDashboard />} />
              <Route path="standorte" element={<EnterpriseStandortePage />} />
              <Route path="risikoanalyse" element={<EnterpriseRisikoanalysePage />} />
              <Route path="bia" element={<BiaPage />} />
              <Route path="lieferketten" element={<LieferkettenPage />} />
              <Route path="szenarien" element={<EnterpriseSzenarienPage />} />
              <Route path="szenarien/:id" element={<SzenarioDetailPage />} />
              <Route path="handbuch" element={<HandbuchPage />} />
              <Route path="vorbereitung" element={<VorbereitungPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="compliance/audit" element={<CompliancePage />} />
              <Route path="alarmierung" element={<EnterpriseAlarmierungPage />} />
              <Route path="alarmierung/kontakte" element={<EnterpriseKontaktePage />} />
              <Route path="alarmierung/krisenstab" element={<KrisenstabPage />} />
              <Route path="inventar" element={<EnterpriseInventarPage />} />
              <Route path="dokumente" element={<DokumentePage />} />
              <Route path="uebungen" element={<UebungenPage />} />
              <Route path="einstellungen" element={<ProEinstellungenPage />} />
              <Route path="lagezentrum" element={<LagezentrumPage />} />
              <Route path="timeline" element={<TimelinePage />} />
            </Route>

            {/* Enterprise Onboarding – geschützt, eigenes Layout */}
            <Route path="/unternehmen/onboarding" element={<ProtectedRoute><EnterpriseOnboarding /></ProtectedRoute>} />

            {/* Gemeinde-App – geschützt (Bürgermeister-Portal) */}
            <Route path="/gemeinde" element={<ProtectedRoute><GemeindeLayout /></ProtectedRoute>}>
              <Route index element={<GemeindeDashboard />} />
              <Route path="inventar" element={<GemeindeInventarPage />} />
              <Route path="kritis" element={<GemeindeKritisPage />} />
              <Route path="checklisten" element={<GemeindeChecklistenPage />} />
              <Route path="szenarien" element={<GemeindeSzenarienPage />} />
              <Route path="szenarien/:id" element={<GemeindeSzenarioDetailPage />} />
              <Route path="notfall" element={<NotfallMeldenPage />} />
              <Route path="einstellungen" element={<GemeindeEinstellungenPage />} />
            </Route>

            {/* PRO Onboarding – geschützt, eigenes Layout */}
            <Route path="/pro/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
