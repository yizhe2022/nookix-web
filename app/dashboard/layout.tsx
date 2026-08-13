import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import DashboardLayoutClient from "@/components/dashboard/dashboard-layout-client"

export const metadata: Metadata = {
  title: "Dashboard | Nookix",
  description: "Your personal Nookix dashboard",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 检查用户登录状态
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 未登录则重定向到登录页
  if (!user) {
    redirect("/auth/signin")
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
