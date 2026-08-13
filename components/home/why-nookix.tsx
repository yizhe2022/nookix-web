import Image from "next/image"

export default function WhyNookix() {
  const benefits = [
    {
      id: "01",
      title: "Turn Dead Time into Deep Learning.",
      subtitle: "Upgrade your daily commute, workout, or chores. Get the depth of a full book through engaging 60-minute audio summaries—without adding a single task to your to-do list.",
      image: "/images/whynookix001.webp"
    },
    {
      id: "02",
      title: 'Understanding, Not Skimming.',
      subtitle: "We take the time to explore ideas thoroughly — chapter by chapter. Our deep 60-minute book summaries provide the depth you need to truly grasp complex concepts and apply them.",
      image: "/images/whynookix002.webp"
    },
    {
      id: "03",
      title: "Real-World Wisdom, Not Just Theory.",
      subtitle: "We bridge the gap between academic ideas and real-world execution. Hear how theories survive the harsh reality of startup building and daily management.",
      image: "/images/whynookix003.webp"
    }
  ]

  return (
    <section className="bg-[#FAFAF9] py-10 sm:py-14 lg:py-16 relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            A Smarter Way to Absorb Books.
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-light leading-relaxed">
            We curate and summarize the most impactful bestsellers across business, leadership, and personal growth. Skip the fluff and dive into the core insights.
          </p>
        </div>

        {/* Benefits Grid - 3 columns on desktop, image on top with 1:1 ratio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="group relative"
            >
              {/* Image with 1:1 aspect ratio */}
              <div className="relative w-full aspect-square overflow-hidden rounded-2xl sm:rounded-3xl mb-4 sm:mb-5">
                <Image
                  src={benefit.image}
                  alt={benefit.title}
                  fill
                  loading="lazy"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Content Below Image */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed">
                  {benefit.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
