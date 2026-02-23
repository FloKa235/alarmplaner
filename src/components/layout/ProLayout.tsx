import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { DistrictProvider } from '@/hooks/useDistrict'
import { CrisisProvider, useCrisis } from '@/contexts/CrisisContext'
import clsx from 'clsx'

function ProLayoutInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isActive } = useCrisis()

  return (
    <div
      className={clsx(
        'min-h-screen crisis-transition',
        isActive ? 'crisis-mode bg-surface-secondary' : 'bg-surface-secondary'
      )}
    >
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div
        className={clsx(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-64'
        )}
      >
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function ProLayout() {
  return (
    <DistrictProvider>
      <CrisisProvider>
        <ProLayoutInner />
      </CrisisProvider>
    </DistrictProvider>
  )
}
