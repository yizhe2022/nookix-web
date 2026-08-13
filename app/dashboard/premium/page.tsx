import { Metadata } from "next"
import PremiumPageClient from "@/components/premium/premium-page-client"

export const metadata: Metadata = {
  title: "Upgrade to Premium | Nookix",
  description: "Unlock unlimited access to our entire library of 30-minute audio summaries. Get 100+ books a year.",
}

export default function DashboardPremiumPage() {
  return <PremiumPageClient showRedeemEntry />
}
