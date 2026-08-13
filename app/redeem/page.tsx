import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import DashboardLayoutClient from '@/components/dashboard/dashboard-layout-client'
import RedeemCodeClient from '@/components/redeem/redeem-code-client'

export const metadata: Metadata = {
  title: 'Redeem Code | Nookix',
  description: 'Redeem your Nookix membership code.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function RedeemPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?next=' + encodeURIComponent('/redeem'))
  }

  return (
    <DashboardLayoutClient>
      <RedeemCodeClient userEmail={user.email || ''} />
    </DashboardLayoutClient>
  )
}