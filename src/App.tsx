import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Loader2 } from 'lucide-react'

// Layouts loaded eagerly (small, needed for shell)
import AppLayout from './components/layout/AppLayout'
import ProLayout from './components/layout/ProLayout'

// Landing loaded eagerly (first paint)
import LandingPage from './pages/LandingPage'

// Everything else lazy-loaded
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))

// Privat-App
const PrivatDashboard = lazy(() => import('./pages/app/PrivatDashboard'))
const WarnungenPage = lazy(() => import('./pages/app/WarnungenPage'))
const ChecklistenPage = lazy(() => import('./pages/app/ChecklistenPage'))
const NotfallplanPage = lazy(() => import('./pages/app/NotfallplanPage'))
const EinstellungenPage = lazy(() => import('./pages/app/EinstellungenPage'))

// PRO-App
const ProDashboard = lazy(() => import('./pages/pro/ProDashboard'))
const RisikoanalysePage = lazy(() => import('./pages/pro/RisikoanalysePage'))
const SzenarienPage = lazy(() => import('./pages/pro/SzenarienPage'))
const SzenarioDetailPage = lazy(() => import('./pages/pro/SzenarioDetailPage'))
const InventarPage = lazy(() => import('./pages/pro/InventarPage'))
const AlarmierungPage = lazy(() => import('./pages/pro/AlarmierungPage'))
const KontaktePage = lazy(() => import('./pages/pro/KontaktePage'))
const GemeindenPage = lazy(() => import('./pages/pro/GemeindenPage'))
const GemeindeDetailPage = lazy(() => import('./pages/pro/GemeindeDetailPage'))
const KritisPage = lazy(() => import('./pages/pro/KritisPage'))
const ChecklistenProPage = lazy(() => import('./pages/pro/ChecklistenProPage'))
const DokumentePage = lazy(() => import('./pages/pro/DokumentePage'))
const ProEinstellungenPage = lazy(() => import('./pages/pro/ProEinstellungenPage'))
const OnboardingPage = lazy(() => import('./pages/pro/OnboardingPage'))

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

            {/* Privat-App – geschützt */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<PrivatDashboard />} />
              <Route path="warnungen" element={<WarnungenPage />} />
              <Route path="checklisten" element={<ChecklistenPage />} />
              <Route path="notfallplan" element={<NotfallplanPage />} />
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
              <Route path="gemeinden" element={<GemeindenPage />} />
              <Route path="gemeinden/:id" element={<GemeindeDetailPage />} />
              <Route path="kritis" element={<KritisPage />} />
              <Route path="checklisten" element={<ChecklistenProPage />} />
              <Route path="dokumente" element={<DokumentePage />} />
              <Route path="einstellungen" element={<ProEinstellungenPage />} />
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
