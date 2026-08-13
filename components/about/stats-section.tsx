"use client"

import { useState, useEffect } from "react"

const statsData = [
  {
    icon: "📈", // 扁平风彩色图标
    value: 12000,
    suffix: "+ Titles Analyzed",
    description: "Comprehensive book analysis",
  },
  {
    icon: "🌍", // 扁平风彩色图标
    value: 5,
    suffix: " million Global Listener Network",
    description: "Serving learners worldwide",
  },
  {
    icon: "📚", // 扁平风彩色图标
    value: 300,
    suffix: " New Books Weekly",
    description: "Fresh content every week",
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
    <span className="text-3xl md:text-4xl font-bold text-gray-900">
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function StatsSection() {
  return (
    <section className="py-10 md:py-15" style={{ backgroundColor: "#fafbfc" }}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center space-y-4">
              {/* Emoji 图标 */}
              <div className="flex justify-center mb-4">
                <span className="text-4xl">{stat.icon}</span>
              </div>

              <div className="space-y-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />

                <p className="text-sm font-light" style={{ color: "#939999" }}>
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
