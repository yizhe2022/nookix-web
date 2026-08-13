import { Button } from "@/components/ui/button"
import { Sparkles, Gift, BookOpen, Star } from "lucide-react"

export default function PremiumCTA() {
  return (
    <section className="py-10 md:py-20" style={{ backgroundColor: "#fafbfc" }}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-3xl p-12 text-center relative overflow-hidden">
          {/* Enhanced Book and Gift Background Elements */}
          <div className="absolute inset-0 opacity-15">
            {/* Book Cover 1 */}
            <div className="absolute top-8 left-8 w-20 h-28 bg-blue-600 rounded transform rotate-12 flex flex-col items-center justify-center text-white text-xs p-2">
              <BookOpen className="w-4 h-4 mb-1" />
              <div className="text-center">
                <div className="font-bold text-[8px] leading-tight">Atomic Habits</div>
                <div className="text-[6px] mt-1">James Clear</div>
              </div>
            </div>

            {/* Book Cover 2 */}
            <div className="absolute top-16 right-12 w-16 h-22 bg-purple-600 rounded transform -rotate-6 flex flex-col items-center justify-center text-white text-xs p-2">
              <Star className="w-3 h-3 mb-1" />
              <div className="text-center">
                <div className="font-bold text-[7px] leading-tight">Sapiens</div>
                <div className="text-[5px] mt-1">Y. Harari</div>
              </div>
            </div>

            {/* Book Cover 3 */}
            <div className="absolute bottom-12 left-16 w-18 h-24 bg-green-600 rounded transform rotate-45 flex flex-col items-center justify-center text-white text-xs p-2">
              <BookOpen className="w-3 h-3 mb-1" />
              <div className="text-center">
                <div className="font-bold text-[7px] leading-tight">Think Again</div>
                <div className="text-[5px] mt-1">A. Grant</div>
              </div>
            </div>

            {/* Book Cover 4 */}
            <div className="absolute bottom-8 right-8 w-14 h-20 bg-orange-600 rounded transform -rotate-12 flex flex-col items-center justify-center text-white text-xs p-2">
              <Star className="w-3 h-3 mb-1" />
              <div className="text-center">
                <div className="font-bold text-[6px] leading-tight">Educated</div>
                <div className="text-[5px] mt-1">T. Westover</div>
              </div>
            </div>

            {/* Book Cover 5 */}
            <div className="absolute top-1/2 left-1/4 w-12 h-18 bg-indigo-600 rounded transform rotate-30 flex flex-col items-center justify-center text-white text-xs p-1">
              <BookOpen className="w-2 h-2 mb-1" />
              <div className="text-center">
                <div className="font-bold text-[6px] leading-tight">Flow</div>
                <div className="text-[4px] mt-1">M. Csik</div>
              </div>
            </div>

            {/* Book Cover 6 */}
            <div className="absolute top-1/3 right-1/3 w-16 h-22 bg-pink-600 rounded transform -rotate-20 flex flex-col items-center justify-center text-white text-xs p-2">
              <Star className="w-3 h-3 mb-1" />
              <div className="text-center">
                <div className="font-bold text-[7px] leading-tight">Mindset</div>
                <div className="text-[5px] mt-1">C. Dweck</div>
              </div>
            </div>

            {/* Gift Elements */}
            <div className="absolute top-20 right-1/4 w-8 h-8 bg-yellow-400 rounded transform rotate-45 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>

            <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-red-400 rounded transform -rotate-30 flex items-center justify-center">
              <Gift className="w-3 h-3 text-white" />
            </div>

            <div className="absolute top-1/4 left-1/2 w-7 h-7 bg-green-400 rounded transform rotate-60 flex items-center justify-center">
              <Gift className="w-3 h-3 text-white" />
            </div>

            {/* Additional decorative elements */}
            <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-blue-400 rounded-full"></div>
            <div className="absolute top-1/3 left-1/5 w-3 h-3 bg-purple-400 rounded-full"></div>
            <div className="absolute bottom-1/5 left-1/2 w-5 h-5 bg-orange-400 rounded-full"></div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-6 h-6 text-yellow-600" />
                <span className="text-yellow-600 font-medium">Unlock Your Premium Experience</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900">
                Start Your Learning Revolution Today
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Join thousands of professionals building a consistent learning habit
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-blue-600 text-white hover:bg-blue-700 font-medium text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Start 3-Day Free Trial
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 font-medium text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Gift Premium ($5.99/Month)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
