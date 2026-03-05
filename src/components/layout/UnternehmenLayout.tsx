import { Outlet, Navigate } from 'react-router-dom'
import { useState } from 'react'
import UnternehmenSidebar from './UnternehmenSidebar'
import UnternehmenTopBar from './UnternehmenTopBar'
import { OrganizationProvider, useOrganization } from '@/hooks/useOrganization'
import { EnterpriseCrisisProvider, useEnterpriseCrisis } from '@/contexts/EnterpriseCrisisContext'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

function UnternehmenLayoutInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isActive } = useEnterpriseCrisis()
  const { organization, loading } = useOrganization()

  // Show loading while checking for organization
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Redirect to onboarding if no organization exists
  if (!organization) {
    return <Navigate to="/unternehmen/onboarding" replace />
  }

  return (
    <div
      className={clsx(
        'min-h-screen crisis-transition',
        isActive ? 'crisis-mode bg-surface-secondary' : 'bg-surface-secondary'
      )}
    >
      <UnternehmenSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div
        className={clsx(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-64'
        )}
      >
        <UnternehmenTopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function UnternehmenLayout() {
  return (
    <OrganizationProvider>
      <EnterpriseCrisisProvider>
        <UnternehmenLayoutInner />
      </EnterpriseCrisisProvider>
    </OrganizationProvider>
  )
}
