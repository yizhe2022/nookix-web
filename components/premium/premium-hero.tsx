import { Crown } from "lucide-react"
import Image from "next/image"

export default function PremiumHero() {
  return (
    <section className="hidden md:block relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-1/3 w-14 h-14 bg-white rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Content Container - 移动端自适应高度 */}
      <div className="relative min-h-[500px] py-10 lg:py-0 lg:h-[500px] flex items-center">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-4 lg:space-y-6 text-white">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" />
                  <span className="text-yellow-400 font-medium text-sm lg:text-base">Premium Experience</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">Unlock 100+ Books a Year</h1>
                <div className="pt-2 lg:pt-4">
                  <p className="text-sm lg:text-base text-gray-200 mb-4 lg:mb-8 max-w-lg leading-relaxed">
                    A universe of knowledge, distilled into 30-minute insights.
                    <br />
                    Grow smarter, one listen at a time.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Content - Single Image */}
            <div className="relative order-first lg:order-last">
              <div className="relative z-10">
                <div className="aspect-[5/3] rounded-2xl lg:rounded-3xl overflow-hidden">
                  <Image
                    src="/images/premium_hero.jpg"
                    alt="Premium audiobook experience"
                    width={600}
                    height={360}
                    className="w-full h-full object-cover"
                    priority
                    style={{
                      maskImage: 'radial-gradient(ellipse 80% 70% at center, black 40%, transparent 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at center, black 40%, transparent 100%)'
                    }}
                  />
                </div>
              </div>

              {/* Floating Elements - Repositioned for smaller image */}
              <div className="absolute -top-3 -right-3 w-12 h-12 lg:w-16 lg:h-16 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce z-20">
                <span className="text-lg lg:text-2xl">🚀</span>
              </div>
              <div className="absolute -bottom-3 -left-3 w-10 h-10 lg:w-12 lg:h-12 bg-green-400 rounded-full flex items-center justify-center animate-pulse z-20">
                <span className="text-base lg:text-xl">⚡</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
