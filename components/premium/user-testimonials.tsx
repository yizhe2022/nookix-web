"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    profession: "Product Manager",
    avatar: "/images/people%20avatar/Sarah_Chen.jpg",
    testimonial:
      "Nookix transformed my commute into a learning powerhouse. I've absorbed 50+ business books this year, gaining insights that directly improved my product strategy and team leadership skills.",
    joinDate: "March 2024",
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    profession: "Entrepreneur",
    avatar: "/images/people%20avatar/Marcus_Rodriguez.jpg",
    testimonial:
      "As a startup founder, time is everything. Nookix's 30-minute summaries let me stay current with industry trends while managing my business. The AI curation is incredibly accurate.",
    joinDate: "January 2024",
  },
  {
    id: 3,
    name: "Dr. Emily Watson",
    profession: "Physician",
    avatar: "/images/people%20avatar/Dr._Emily_Watson%20.jpg",
    testimonial:
      "Between hospital shifts, Nookix helps me explore psychology and leadership books. The quality of summaries rivals academic abstracts, perfect for evidence-based learning during busy schedules.",
    joinDate: "February 2024",
  },
  {
    id: 4,
    name: "James Thompson",
    profession: "Software Engineer",
    avatar: "/images/people%20avatar/James_Thompson%20.jpg",
    testimonial:
      "The technical depth in programming and AI books is impressive. Nookix captures complex concepts clearly, helping me stay ahead in rapidly evolving tech landscapes without overwhelming time commitment.",
    joinDate: "April 2024",
  },
  {
    id: 5,
    name: "Lisa Park",
    profession: "Marketing Director",
    avatar: "/images/people%20avatar/Lisa_Park.jpg",
    testimonial:
      "Nookix's marketing and psychology summaries have revolutionized my campaign strategies. I can quickly digest consumer behavior insights and apply them immediately to improve conversion rates.",
    joinDate: "May 2024",
  },
  {
    id: 6,
    name: "David Kumar",
    profession: "Financial Analyst",
    avatar: "/images/people%20avatar/David_Kumar.jpg",
    testimonial:
      "Investment and economics books become actionable through Nookix's structured summaries. I've enhanced my portfolio management skills by consuming 40+ finance books in six months.",
    joinDate: "December 2023",
  },
  {
    id: 7,
    name: "Rachel Green",
    profession: "HR Manager",
    avatar: "/images/people%20avatar/Rachel_Green.jpg",
    testimonial:
      "People management books on Nookix have transformed my leadership approach. The practical insights help me build stronger teams and navigate complex workplace dynamics more effectively.",
    joinDate: "June 2024",
  },
  {
    id: 8,
    name: "Alex Johnson",
    profession: "Consultant",
    avatar: "/images/people%20avatar/Alex_Johnson.jpg",
    testimonial:
      "Client meetings require diverse knowledge. Nookix enables me to quickly grasp industry-specific insights from business books, making me more valuable to clients across different sectors.",
    joinDate: "March 2024",
  },
  {
    id: 9,
    name: "Maria Santos",
    profession: "Teacher",
    avatar: "/images/people%20avatar/Maria_Santos.jpg",
    testimonial:
      "Educational psychology and pedagogy summaries on Nookix have enhanced my teaching methods. I can implement research-backed strategies without spending hours reading full academic texts.",
    joinDate: "September 2024",
  },
  {
    id: 10,
    name: "Robert Kim",
    profession: "Sales Manager",
    avatar: "/images/people%20avatar/Robert%20Kim.jpg",
    testimonial:
      "Sales psychology and negotiation books become immediately applicable through Nookix. My team's performance improved 30% after implementing strategies from summarized sales methodologies.",
    joinDate: "February 2024",
  },
  {
    id: 11,
    name: "Jennifer Liu",
    profession: "Designer",
    avatar: "/images/people%20avatar/Jennifer_Liu.jpg",
    testimonial:
      "Creative and design thinking books on Nookix inspire my projects daily. The summaries capture essential creative processes, helping me innovate faster and deliver better client solutions.",
    joinDate: "July 2024",
  },
  {
    id: 12,
    name: "Michael Brown",
    profession: "Operations Manager",
    avatar: "/images/people%20avatar/Michael_Brown.jpg",
    testimonial:
      "Lean management and operations books become actionable through Nookix's clear summaries. I've streamlined processes and reduced costs by applying insights from 25+ operations books.",
    joinDate: "January 2024",
  },
  {
    id: 13,
    name: "Amanda Davis",
    profession: "Lawyer",
    avatar: "/images/people%20avatar/Amanda_Davis.jpg",
    testimonial:
      "Legal strategy and negotiation books help me serve clients better. Nookix's summaries provide quick access to proven methodologies that enhance my courtroom and client interaction skills.",
    joinDate: "April 2024",
  },
  {
    id: 14,
    name: "Kevin Miller",
    profession: "Data Scientist",
    avatar: "/images/people%20avatar/Kevin_Miller.jpg",
    testimonial:
      "Statistics and machine learning books become digestible through Nookix. I can quickly understand new methodologies and apply them to improve model accuracy and data insights.",
    joinDate: "May 2024",
  },
  {
    id: 15,
    name: "Sophie Wilson",
    profession: "Project Manager",
    avatar: "/images/people%20avatar/Sophie_Wilson.jpg",
    testimonial:
      "Project management and leadership summaries have transformed my team coordination. Nookix helps me implement best practices from industry experts without lengthy reading commitments.",
    joinDate: "August 2024",
  },
  {
    id: 16,
    name: "Carlos Mendez",
    profession: "Chef",
    avatar: "/images/people%20avatar/Carlos_Mendez.jpg",
    testimonial:
      "Culinary arts and business books on Nookix have elevated my restaurant management. I can quickly learn from successful restaurateurs and implement proven strategies in my kitchen.",
    joinDate: "June 2024",
  },
  {
    id: 17,
    name: "Hannah Lee",
    profession: "Therapist",
    avatar: "/images/people%20avatar/Hannah_Lee.jpg",
    testimonial:
      "Psychology and therapy technique books become immediately applicable through Nookix's structured summaries. My client sessions have improved significantly with evidence-based insights.",
    joinDate: "October 2024",
  },
  {
    id: 18,
    name: "Thomas Anderson",
    profession: "Real Estate Agent",
    avatar: "/images/people%20avatar/Thomas_Anderson.jpg",
    testimonial:
      "Sales and negotiation books help me close deals more effectively. Nookix's summaries provide quick access to proven strategies that have increased my commission by 40%.",
    joinDate: "September 2024",
  },
]

export default function UserTestimonials() {
  const [currentOffset, setCurrentOffset] = useState(0)

  // Split testimonials into 3 rows
  const row1 = testimonials.slice(0, 9)
  const row2 = testimonials.slice(9, 18)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOffset((prev) => (prev + 1) % 100)
    }, 50) // Smooth scrolling

    return () => clearInterval(interval)
  }, [])

  const TestimonialCard = ({ testimonial }: { testimonial: (typeof testimonials)[0] }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-w-[450px] mx-3">
      <div className="flex items-center space-x-3 mb-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <Image src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} fill sizes="48px" className="object-cover" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
          <p className="text-sm text-gray-600">{testimonial.profession}</p>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-3">"{testimonial.testimonial}"</p>
      <p className="text-xs text-gray-500">Member since {testimonial.joinDate}</p>
    </div>
  )

  return (
    <section className="py-10 md:py-20 overflow-hidden" style={{ backgroundColor: "#FCFAF7" }}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Global Impact Stories</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Lifelong learners share their 30-minute breakthroughs
          </p>
        </div>
      </div>

      <div className="relative">
        {/* Fade effects */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#FCFAF7] to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#FCFAF7] to-transparent z-10"></div>

        {/* Row 1 - Moving right */}
        <div className="mb-6">
          <div
            className="flex transition-transform duration-75 ease-linear"
            style={{
              transform: `translateX(-${currentOffset * 2}px)`,
              width: "calc(100% + 800px)",
            }}
          >
            {[...row1, ...row1].map((testimonial, index) => (
              <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>

        {/* Row 2 - Moving left */}
        <div className="mb-6">
          <div
            className="flex transition-transform duration-75 ease-linear"
            style={{
              transform: `translateX(${currentOffset * 2 - 400}px)`,
              width: "calc(100% + 800px)",
            }}
          >
            {[...row2, ...row2].map((testimonial, index) => (
              <TestimonialCard key={`row2-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
