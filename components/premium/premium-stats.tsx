"use client"

import { useState, useEffect } from "react"

const statsData = [
  {
    emoji: "📚",
    value: 1500,
    suffix: "+",
    label: "Curated Books Analyzed",
    description: "Expert-selected titles across all genres",
  },
  {
    emoji: "🎧",
    value: 50,
    suffix: "+",
    label: "New Summaries Weekly",
    description: "Fresh content added every week",
  },
  {
    emoji: "🌍",
    value: 180,
    suffix: "k",
    label: "Global Listeners",
    description: "Worldwide community of learners",
  },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = value / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setCount(Math.min(Math.floor(increment * currentStep), value))

      if (currentStep >= steps) {
        clearInterval(timer)
        setCount(value)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value])

  return (
    <>
      {count.toLocaleString()}
      {suffix}
    </>
  )
}

export default function PremiumStats() {
  return (
    <section className="py-10 sm:py-14 md:py-16 lg:py-16 bg-[#FAFAF9]">
      <div className="max-w-[1024px] mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center space-y-4">
              {/* Emoji 图标 */}
              <div className="flex justify-center mb-4">
                <span className="text-5xl">{stat.emoji}</span>
              </div>

              <div className="space-y-2">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{stat.label}</h3>
                <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
