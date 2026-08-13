import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"

export default function FaqSection() {
  const faqs = [
    {
      question: "How can Nookix help me?",
      answer: "Nookix turns your dead time into deep learning. If you have a stack of unread books on your shelf but no time to read, we help you unlock the real-world wisdom inside them. Through our engaging podcast format, you can absorb actionable strategies for business, leadership, and personal growth without adding another task to your busy schedule."
    },
    {
      question: "Why is 60 minutes the perfect length for a book summary?",
      answer: "While shorter recaps often just skim the surface and list bullet points—creating an illusion of understanding—our 60‑minute format is deliberately built around a chapter‑by‑chapter breakdown of the original book. This preserves the author’s logical flow, minimises distortion, and ensures every key idea retains its full context and nuance. The result isn’t a rushed digest, but a thorough walkthrough that unpacks real‑world examples and actionable insights—all within a time frame that fits naturally into your day, without sacrificing depth or clarity."
    },
    {
      question: "What makes Nookix different from other summary apps?",
      answer: "While other apps rush through books in 15 minutes with superficial bullet points, Nookix delivers truly deep summaries in 60 minutes. We provide comprehensive explanations, rich context, practical applications, and complete understanding. Plus, our professional narration with multiple voice options makes learning enjoyable, not rushed."
    },
    {
      question: "What types of books are available on Nookix?",
      answer: "Our core focus is on high-impact non-fiction. You'll find an extensive, handpicked collection of books on business, entrepreneurship, productivity, psychology, and personal growth. However, we also feature a carefully curated selection of popular fiction titles, exploring the profound ideas and cultural impact behind great storytelling."
    },
    {
      question: "Can I request specific books?",
      answer: "Yes! You can request specific books by emailing our team at support@nookix.net. While we prioritize making sure our library covers trending titles with strong editorial reviews, we always love hearing what our users want to listen to next."
    },
    {
      question: "Does Nookix offer a free plan or trial?",
      answer: "Yes, we offer a freemium model with basic access at no cost. For those who want the ultimate learning experience, our Premium plans come with a 7-day free trial, giving you unlimited access to our entire library and ad-free listening."
    }
  ]

  return (
    <section className="bg-[#FAFAF9] py-10 sm:py-14 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 pb-8 sm:pb-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 sm:mb-5">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-light leading-relaxed">
            Everything you need to know about the product and billing.
          </p>
        </div>

        {/* Accordion FAQ */}
        <div className="space-y-3 sm:space-y-4 mb-20 sm:mb-24 md:mb-32 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <details key={`faq-${index}`} id={`faq-${index}`} className="group bg-white rounded-xl sm:rounded-2xl ring-1 ring-black/[0.04] shadow-sm open:ring-blue-100 open:shadow-md transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 font-bold text-[14px] sm:text-[15px] text-slate-900 select-none list-none [&::-webkit-details-marker]:hidden tracking-tight">
                <span className="pr-3 sm:pr-4">{faq.question}</span>
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 group-open:rotate-180 group-open:text-blue-600" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 text-slate-500 font-medium leading-relaxed text-[13px] sm:text-[14px] animate-in slide-in-from-top-2 fade-in duration-200">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        {/* Bottom CTA (重构为高级浅色风格) */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-8 sm:p-12 md:p-16 lg:p-20 text-center relative overflow-hidden shadow-[0_20px_60px_-16px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
          {/* 浅色模式下的柔和顶部光晕 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-blue-50/80 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 sm:mb-5 md:mb-6 leading-tight">
              Ready to dive deeper?
            </h3>
            <p className="text-slate-500 mb-8 sm:mb-10 text-base sm:text-lg font-medium leading-relaxed">
              Unlock your potential with access to every business unlimited audio book summary in our library. One flat rate, endless real-world wisdom.
            </p>
            <div className="flex flex-col items-center gap-5 sm:gap-6 md:gap-7">
              <Link href="/auth/signin" className="w-full sm:w-auto">
                {/* 强化了蓝色按钮的阴影和微动效，使其在浅色背景下绝对吸睛 */}
                <Button className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 text-[15px] sm:text-[16px] font-bold rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_24px_-4px_rgba(37,99,235,0.5)] group flex items-center justify-center gap-2 hover:-translate-y-0.5">
                  Start your 7-day free trial
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-8 gap-y-2 sm:gap-y-3 text-[13px] sm:text-[14px] text-slate-600 font-semibold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-500" />
                  <span>Skip one coffee. Get a month.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-500" />
                  <span>Cancel anytime in 1 click</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
