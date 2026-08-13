import { redirect } from "next/navigation"

export default function DashboardPage() {
  // 重定向到 for-you 页面
  redirect("/dashboard/for-you")
}
