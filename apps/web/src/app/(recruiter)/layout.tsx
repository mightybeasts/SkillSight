import DashboardLayout from '@/components/layout/dashboard-layout'

export default function RecruiterDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="recruiter">{children}</DashboardLayout>
}
