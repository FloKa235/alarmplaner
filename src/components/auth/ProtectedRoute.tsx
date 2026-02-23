import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { DistrictMemberRole } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Optional: Beschränkt den Zugriff auf bestimmte Rollen. Ohne = nur Login nötig. */
  requiredRole?: DistrictMemberRole | DistrictMemberRole[]
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-text-secondary">Wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Wenn requiredRole gesetzt ist, wird die Rollenprüfung an den jeweiligen Layout-Provider delegiert.
  // Das ProtectedRoute stellt nur sicher, dass der User eingeloggt ist.
  // Die Rollenprüfung passiert im MembershipProvider innerhalb GemeindeLayout/ProLayout.
  // requiredRole ist hier für die Zukunft vorbereitet (z.B. für eine Zwischenseite "Kein Zugriff").

  // Für jetzt: Ignoriere requiredRole, es wird nur als Marker genutzt.
  void requiredRole

  return <>{children}</>
}
