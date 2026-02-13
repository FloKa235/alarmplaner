import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { DistrictProvider } from '@/hooks/useDistrict'
import clsx from 'clsx'

export default function ProLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <DistrictProvider>
      <div className="min-h-screen bg-surface-secondary">
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
    </DistrictProvider>
  )
}
