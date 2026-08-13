import { Check, Minus } from "lucide-react"

export default function DisruptionComparison() {
  return (
    <section className="bg-[#FAFAF9] py-10 sm:py-14 lg:py-16 relative">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 sm:mb-4">
            A New Standard for Learning
          </h2>
          <p className="text-base sm:text-lg text-gray-500 font-light">
            See how Nookix compares to the old ways of consuming knowledge.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="relative">
          {/* Background decoration for the highlighted column */}
          <div className="absolute inset-y-0 right-0 w-full md:w-[33%] bg-blue-50/50 rounded-3xl -z-10 hidden md:block border border-blue-100/50 shadow-sm" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 md:gap-0 text-sm sm:text-base">
            
            {/* Column 1: Labels (Hidden on mobile, shown on md) */}
            <div className="hidden md:flex flex-col justify-end pb-8 pr-4">
              <div className="h-16 flex items-center text-gray-400 font-medium">Format</div>
              <div className="h-16 flex items-center text-gray-400 font-medium">Duration</div>
              <div className="h-20 flex items-center text-gray-400 font-medium">Depth</div>
              <div className="h-16 flex items-center text-gray-400 font-medium">Monthly Price</div>
            </div>

            {/* Column 2: Blinkist (Traditional) */}
            <div className="flex flex-col p-4 sm:p-6 md:p-4 rounded-2xl md:rounded-none bg-gray-50 md:bg-transparent border border-gray-100 md:border-none">
              <div className="h-12 sm:h-16 flex flex-col justify-center mb-4 sm:mb-6 md:mb-0 text-center md:text-left">
                <span className="font-bold text-gray-900 text-base sm:text-lg">Blinkist</span>
                <span className="text-xs text-gray-400">Traditional</span>
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start border-b border-gray-100 text-gray-600 text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Format:</span>
                Single-voice
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start border-b border-gray-100 text-gray-600 text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Duration:</span>
                15 mins <span className="text-gray-400 ml-1 text-xs">(Superficial)</span>
              </div>
              <div className="h-16 sm:h-20 flex items-center justify-center md:justify-start border-b border-gray-100 text-gray-600 text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Depth:</span>
                Key takeaways only
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start text-gray-500 font-medium text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Price:</span>
                ~$14.99
              </div>
            </div>

            {/* Column 3: Shortform (Heavy) */}
            <div className="flex flex-col p-4 sm:p-6 md:p-4 rounded-2xl md:rounded-none bg-gray-50 md:bg-transparent border border-gray-100 md:border-none">
              <div className="h-12 sm:h-16 flex flex-col justify-center mb-4 sm:mb-6 md:mb-0 text-center md:text-left">
                <span className="font-bold text-gray-900 text-base sm:text-lg">Shortform</span>
                <span className="text-xs text-gray-400">Text-Heavy</span>
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start border-b border-gray-100 text-gray-600 text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Format:</span>
                Deep Long-text
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start border-b border-gray-100 text-gray-600 text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Duration:</span>
                60+ mins <span className="text-gray-400 ml-1 text-xs">(Heavy)</span>
              </div>
              <div className="h-16 sm:h-20 flex items-center justify-center md:justify-start border-b border-gray-100 text-gray-600 text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Depth:</span>
                Academic analysis
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start text-gray-500 font-medium text-sm">
                <span className="md:hidden text-gray-400 mr-2 text-xs uppercase">Price:</span>
                $24.00
              </div>
            </div>

            {/* Column 4: Nookix (Highlighted) */}
            <div className="flex flex-col p-4 sm:p-6 md:p-6 rounded-2xl md:rounded-3xl bg-white shadow-xl md:shadow-none border border-blue-100 md:border-none relative transform md:-translate-y-2">
              <div className="absolute top-0 inset-x-0 h-1 bg-blue-600 rounded-t-2xl md:hidden" />
              <div className="h-12 sm:h-16 flex flex-col justify-center mb-4 sm:mb-6 md:mb-0 text-center md:text-left">
                <span className="font-bold text-blue-600 text-xl sm:text-2xl">Nookix</span>
                <span className="text-xs text-blue-400 font-medium">The Sweet Spot</span>
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start border-b border-blue-100/50 text-gray-900 font-medium text-sm">
                <span className="md:hidden text-blue-300 mr-2 text-xs uppercase">Format:</span>
                Dual-host Podcast
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start border-b border-blue-100/50 text-gray-900 font-medium text-sm">
                <span className="md:hidden text-blue-300 mr-2 text-xs uppercase">Duration:</span>
                30 mins <span className="text-blue-500 ml-1 text-xs">(Golden Ratio)</span>
              </div>
              <div className="h-16 sm:h-20 flex items-center justify-center md:justify-start border-b border-blue-100/50 text-gray-900 font-medium text-sm">
                <span className="md:hidden text-blue-300 mr-2 text-xs uppercase">Depth:</span>
                Core insights + Community debate
              </div>
              <div className="h-12 sm:h-16 flex items-center justify-center md:justify-start text-blue-600 font-bold text-base sm:text-lg">
                <span className="md:hidden text-blue-300 mr-2 text-xs uppercase">Price:</span>
                $5.99 <span className="text-sm font-normal text-gray-500 ml-1">/ mo</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
