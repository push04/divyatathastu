import DashboardShell from '@/components/layout/DashboardShell'
import ReferralClaimer from '@/components/ReferralClaimer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      {/* Picks up a referral code that survived an OAuth round-trip or an
          email-confirmation delay. Renders nothing. */}
      <ReferralClaimer />
      {children}
    </DashboardShell>
  )
}
