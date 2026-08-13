"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Gift } from "lucide-react"
import PremiumStats from "@/components/premium/premium-stats"
import PricingComparison from "@/components/premium/pricing-comparison"
import PremiumFAQ from "@/components/premium/premium-faq"

interface PremiumPageClientProps {
  showRedeemEntry?: boolean
}

export default function PremiumPageClient({ showRedeemEntry = false }: PremiumPageClientProps) {
  useEffect(() => {
    // Check if there's a hash in the URL and scroll to it
    if (window.location.hash === "#faq") {
      setTimeout(() => {
        const faqElement = document.getElementById("faq")
        if (faqElement) {
          faqElement.scrollIntoView({ behavior: "auto" })
        }
      }, 100)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF9] selection:bg-blue-100 pb-24 relative overflow-hidden">
      {/* 全局蓝色氛围光 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-50/60 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        {/* Pricing Comparison */}
        <PricingComparison />

        {showRedeemEntry && (
          <div className="max-w-[1024px] mx-auto px-6 sm:px-8 -mt-2 mb-10">
            <div className="rounded-[1.75rem] border border-blue-100 bg-white px-5 py-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Have a redeem code?</div>
                  <div className="text-sm text-slate-500">Enter a code from the community to unlock membership time.</div>
                </div>
              </div>
              <Link href="/redeem" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                Redeem now
              </Link>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <PremiumStats />

        {/* FAQ Section */}
        <PremiumFAQ />
      </div>
    </div>
  )
} 