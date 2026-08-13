"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqData = [
  {
    id: 1,
    question: "What is Nookix's Premium pricing structure?",
    answer:
      "Premium subscriptions start at $5.99/month for the monthly plan. For the best value, our annual plan is $39.99/year (which breaks down to only $3.33 per month, saving you 44%). Both plans grant you unlimited access to our full library, uninterrupted ad-free listening, and premium customer support.",
  },
  {
    id: 2,
    question: "Are there any content limitations for Premium subscribers?",
    answer:
      "None at all. Nookix Premium offers unlimited streaming access to our growing library of carefully curated titles across many categories, with new published summaries added regularly.",
  },
  {
    id: 3,
    question: "What if I don't like it after subscribing?",
    answer:
      "You are completely protected by our Zero-Risk Guarantee. Every Premium plan comes with a 7-day free trial. If you feel Nookix isn't right for you, you can cancel with one click in your dashboard before the trial ends, and you won't be charged a single cent.",
  },
  {
    id: 4,
    question: "How easy is it to cancel my subscription?",
    answer:
      "It's incredibly easy. There are no hidden hoops to jump through or customer service calls to make. You can manage or cancel your subscription at any time directly from your account settings with just a couple of clicks.",
  },
  {
    id: 5,
    question: "Will my subscription renew automatically?",
    answer:
      "Yes, to ensure uninterrupted access to your audio library, your Premium plan will automatically renew at the end of your billing cycle (monthly or annually). However, we will always notify you before any annual renewal, and you can turn off auto-renew at any time.",
  },
]

export default function PremiumFAQ() {
  const [openQuestion, setOpenQuestion] = useState(1) // Default to first question open

  const toggleQuestion = (id: number) => {
    setOpenQuestion(openQuestion === id ? 0 : id)
  }

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("support@nookix.net")
      // 可以在这里添加一个简单的提示，或者使用toast通知
      alert("邮箱地址已复制到剪贴板！")
    } catch (err) {
      console.error("Failed to copy email:", err)
      // 如果剪贴板API失败，可以提供其他方式
      alert("复制失败，请手动复制：support@nookix.net")
    }
  }

  return (
    <section id="faq" className="pt-10 pb-10 sm:pt-14 sm:pb-14 md:pt-16 md:pb-16 lg:pt-16 lg:pb-16 bg-[#FAFAF9]">
      <div className="max-w-[1024px] mx-auto px-6 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            Smart Listening FAQs
          </h2>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Get instant answers to your questions about Nookix
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqData.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-white rounded-2xl shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] hover:ring-black/[0.08] transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <h3 className="text-[15px] sm:text-[17px] font-bold text-slate-900 pr-4 tracking-tight">{faq.question}</h3>
                  {openQuestion === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {openQuestion === faq.id && (
                  <div className="px-6 pb-5">
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-[15px] text-slate-600 font-medium leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-[15px] text-slate-600 font-medium">
            Still have questions? Email us at{" "}
            <button
              onClick={handleCopyEmail}
              className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer underline underline-offset-2"
            >
              support@nookix.net
            </button>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
