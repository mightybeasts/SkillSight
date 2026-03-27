'use client'

import { useState } from 'react'
import Sidebar from './sidebar'
import Topbar from './topbar'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar sidebarCollapsed={collapsed} />
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          collapsed ? 'pl-[68px]' : 'pl-60',
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
