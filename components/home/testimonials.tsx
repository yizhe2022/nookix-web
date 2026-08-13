import Image from "next/image"
import { Quote } from "lucide-react"

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      quote: "I used to feel guilty about my unread shelf. Now I listen during my commute. No fluff, no endless anecdotes – just the framework and why it matters. I finally stopped feeling behind.",
      author: "Alex J.",
      role: "SaaS Founder & CEO",
      avatar: "/images/people avatar/Alex_Johnson.jpg",
      fallbackInitials: "AJ"
    },
    {
      id: 2,
      quote: "I buy books I never finish. Between work and family, a 300‑page business book takes me three months. Nookix gives me the core debate in 60 minutes – and I actually remember it the next day.",
      author: "Maria S.",
      role: "Head of Marketing",
      avatar: "/images/people avatar/Maria_Santos.jpg",
      fallbackInitials: "MS"
    },
    {
      id: 3,
      quote: "I tried other summary apps but they felt too rushed and superficial. Nookix's 60-minute format gives me the comprehensive understanding I need. The professional narration keeps me engaged throughout.",
      author: "David K.",
      role: "Senior Product Manager",
      avatar: "/images/people avatar/David_Kumar.jpg",
      fallbackInitials: "DK"
    }
  ]

  return (
    <section className="bg-[#FAFAF9] py-10 sm:py-14 lg:py-16 relative">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 sm:mb-4">
            Loved by Builders & Thinkers
          </h2>
          <p className="text-base sm:text-lg text-gray-500 font-light">
            Don't just take our word for it. See how professionals are turning dead time into deep learning.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex flex-col p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#FCFAF7] border border-gray-100 hover:shadow-lg transition-shadow duration-300 relative group"
            >
              {/* Subtle Quote Icon */}
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 text-gray-200 group-hover:text-blue-100 transition-colors duration-300">
                <Quote size={32} className="sm:w-10 sm:h-10 transform rotate-180" />
              </div>

              {/* Quote Content */}
              <div className="flex-1 mb-6 sm:mb-8 relative z-10">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
                  "{testimonial.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 sm:gap-4 mt-auto">
                {/* Avatar with fallback */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-sm">
                  {testimonial.avatar ? (
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      fill
                      loading="lazy"
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-xs sm:text-sm font-bold">
                      {testimonial.fallbackInitials}
                    </div>
                  )}
                </div>
                
                {/* Name & Role */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{testimonial.author}</h4>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
