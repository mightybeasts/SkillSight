import DashboardLayout from '@/components/layout/dashboard-layout'

export default function UniversityDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="university">{children}</DashboardLayout>
}
