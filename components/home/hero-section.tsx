"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Play, Mic, Wifi, Battery, CheckCircle2, RotateCcw, RotateCw, Download } from "lucide-react"

export default function HeroSection() {
  const heroBookCover = "/hero_book_cover.avif"

  return (
    <section className="bg-[#FAFAF9] overflow-hidden pt-10 pb-10 lg:pt-16 lg:pb-20 relative">

      {/* ── Decorative background glow layers ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Large soft orb — top left */}
        <div className="absolute -top-32 -left-32 w-[640px] h-[640px] rounded-full bg-blue-100/40 blur-[120px]" />
        {/* Smaller accent orb — bottom right */}
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-indigo-100/30 blur-[100px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Bottom gradient fade to match next section */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(250, 250, 249, 0) 0%, rgba(250, 250, 249, 0.3) 30%, rgba(250, 250, 249, 0.7) 60%, #FAFAF9 100%)'
          }}
        />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left Content — Text ── */}
          <div className="max-w-lg order-1 lg:order-1">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white ring-1 ring-black/[0.06] shadow-sm text-[13px] font-medium text-slate-600 mb-6 lg:mb-8 tracking-tight">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
              </span>
              Personal Growth Hub
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 tracking-[-0.03em] mb-4 lg:mb-6">
              <span className="block mb-2 font-normal italic">Learn on the go.</span>
              <span className="block mb-2 text-blue-600 whitespace-nowrap tracking-[-0.045em]">Best Book Summaries,</span>
              <span className="block">in just 60 minutes.</span>
            </h1>

            {/* Sub-copy */}
            <p className="text-base lg:text-lg text-slate-500 mb-6 lg:mb-10 leading-relaxed font-light pr-4 lg:pr-8">
              Turn your dead time into deep learning. Join the best app for audio books and enjoy engaging, 60-minute audio summaries.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 items-start mb-5 lg:mb-7">
              <Link href="/auth/signup" className="w-full lg:w-auto">
                <Button className="w-full lg:w-auto h-12 px-7 text-[15px] font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200 shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/15 hover:-translate-y-px">
                  100% Free – Get Started
                </Button>
              </Link>
              <Link href="/app" className="w-full lg:w-auto">
                <Button variant="outline" className="w-full lg:w-auto h-12 px-7 text-[15px] font-semibold rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px">
                  <Download className="h-4 w-4" />
                  Download App
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-5 text-[13px] text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>1-Hour Deep Dive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>Studio-Quality Audio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>Actionable Takeaways</span>
              </div>
            </div>
          </div>

          {/* ── Right Content — Phone Mockup ── */}
          <div className="relative mx-auto w-full max-w-[250px] lg:max-w-[490px] order-2 lg:order-2">

            {/* Glow behind phone */}
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full bg-blue-200/30 blur-[72px] -z-10"
            />

            {/* Static Image */}
            <div className="relative w-full mx-auto">
              <Image
                src="/hero-pic.webp"
                alt="Audio book summaries in Nookix"
                width={1263}
                height={1155}
                unoptimized
                priority
                fetchPriority="high"
                sizes="(max-width: 640px) 250px, (max-width: 1024px) 400px, 490px"
                className="w-full h-auto"
              />
            </div>

          </div>

        </div>
      </div>

      {/* Float keyframe */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </section>
  )
}
