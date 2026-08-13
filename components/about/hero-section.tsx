import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="hidden md:block relative overflow-hidden bg-gradient-to-br from-black via-slate-900 to-blue-950">
      {/* Enhanced Tech Background Pattern - Elements surrounding content areas naturally */}
      <div className="absolute inset-0 opacity-50">
        {/* Top edge elements - Above text and video */}
        <div className="absolute top-12 left-1/3 text-3xl opacity-70 animate-pulse delay-800">💡</div>

        <div className="absolute top-8 right-1/3 text-3xl opacity-60 animate-pulse delay-1200">✨</div>
        <div className="absolute top-12 right-12 w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full animate-pulse delay-1000 shadow-xl shadow-purple-400/70">
          <div className="absolute inset-1 bg-gradient-to-br from-purple-200 to-indigo-400 rounded-full opacity-80"></div>
        </div>

        {/* Left edge elements - Left side of text content */}

        {/* Right edge elements - Right side of video content */}
        <div className="absolute top-1/3 right-6 w-8 h-8 border border-purple-400 rounded-full animate-spin delay-1000 opacity-35"></div>
        <div className="absolute top-2/3 right-6 text-3xl opacity-65 animate-pulse delay-1700">✨</div>

        {/* Bottom edge elements - Below text and video */}
        <div className="absolute bottom-8 left-12 w-10 h-10 bg-gradient-to-br from-cyan-300 to-teal-500 rounded-full animate-pulse delay-1500 shadow-2xl shadow-cyan-300/90">
          <div className="absolute inset-2 bg-gradient-to-br from-cyan-100 to-teal-300 rounded-full opacity-80"></div>
        </div>
        <div className="absolute bottom-12 left-1/3 text-4xl opacity-70 animate-pulse delay-1100">📖</div>

        <div className="absolute bottom-8 right-1/3 text-3xl opacity-65 animate-pulse delay-1400">⭐</div>
        <div className="absolute bottom-4 right-12 text-3xl opacity-65 animate-pulse delay-400">📘</div>

        {/* Corner connecting elements */}

        <div className="absolute top-20 left-24 w-1 h-1 bg-cyan-300 rounded-full animate-pulse delay-700 shadow-md shadow-cyan-300/80"></div>
        <div className="absolute top-16 right-20 w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-1200 shadow-lg shadow-blue-300/60"></div>
        <div className="absolute top-20 right-24 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-300 shadow-md shadow-yellow-300/80"></div>
        <div className="absolute bottom-16 left-20 w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-1500 shadow-lg shadow-purple-300/60"></div>
        <div className="absolute bottom-20 left-24 w-1 h-1 bg-cyan-300 rounded-full animate-pulse delay-900 shadow-md shadow-cyan-300/80"></div>
        <div className="absolute bottom-12 right-20 w-2 h-2 bg-white rounded-full animate-pulse delay-600 shadow-lg shadow-white/60"></div>
        <div className="absolute bottom-16 right-24 w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-1100 shadow-md shadow-blue-300/80"></div>



        {/* Subtle background aura around content areas */}
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-300/25 via-blue-200/15 to-transparent rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-20 right-1/4 w-28 h-28 bg-gradient-to-br from-purple-300/25 via-purple-200/15 to-transparent rounded-full animate-pulse delay-1600"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-cyan-200/30 via-cyan-100/18 to-transparent rounded-full animate-pulse delay-800"></div>
        <div className="absolute bottom-20 right-1/4 w-26 h-26 bg-gradient-to-br from-yellow-200/30 via-yellow-100/18 to-transparent rounded-full animate-pulse delay-1200"></div>

        {/* Additional decorative elements floating around */}
        <div className="absolute top-1/3 left-1/5 text-2xl opacity-60 animate-pulse delay-1000">💫</div>
        <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-green-300 rounded-full animate-pulse delay-1400 shadow-md shadow-green-300/80"></div>
        <div className="absolute top-2/3 right-1/6 w-2 h-2 bg-pink-300 rounded-full animate-pulse delay-1700 shadow-lg shadow-pink-300/60"></div>
      </div>

      {/* 移动端自适应高度容器 */}
      <div className="relative min-h-[500px] py-12 lg:py-0 lg:h-[500px] w-full"></div>

      {/* Content Overlay - Perfectly centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-[1300px] w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-4 lg:space-y-6 text-white order-2 lg:order-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">Master the World's Best Books</h1>
              <div className="text-base lg:text-lg text-gray-200">
                <p>Nookix transforms full-length books into immersive 60-minute audio book summaries.<br />Engineered for insight, crafted for growth.</p>
              </div>
              <blockquote className="text-base lg:text-lg font-medium text-blue-400 italic border-l-4 border-blue-400 pl-3 lg:pl-4">
                "Read less, understand more. Join a community of lifelong learners."
              </blockquote>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative order-1 lg:order-2">
              <div className="aspect-[16/11] rounded-lg overflow-hidden shadow-lg relative">
                <Image
                  src="/hero-pic.webp"
                  alt="Nookix Learning Experience"
                  fill
                  className="object-cover rounded-lg"
                  priority
                  style={{
                    maskImage: 'radial-gradient(ellipse 75% 65% at center, black 25%, transparent 85%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at center, black 25%, transparent 85%)'
                  }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
