import Image from "next/image"
import Link from "next/link"

export default function IntroSection() {
  return (
    <section className="pt-10 md:pt-30 pb-0" style={{ backgroundColor: "#fafbfc", marginTop: "40px" }}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-xl overflow-hidden relative">
              <Image
                src="/images/about_section_1.png"
                alt="Nookix audiobook platform interface"
                fill
                className="object-cover rounded-xl"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </div>

          {/* Right Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              The Craft of Knowledge Condensation
            </h2>
            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
              <p>
                <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Nookix
                </Link>{" "}
                is a revolutionary audiobook platform where we don't just summarize; we painstakingly condense full-length books into highly engaging audio book summaries, enriched with real community discussions and social media insights. Available for busy professionals and lifelong learners worldwide.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                One-Liner Insights
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Key Takeaways
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                Community Validated
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                Trending Hot Topics
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
