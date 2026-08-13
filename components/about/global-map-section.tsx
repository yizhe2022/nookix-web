"use client"

import Image from "next/image"

const languages = [
  { name: "English", progress: 100, status: "Available" },
  { name: "Spanish", progress: 40, status: "2026 Q2" },
  { name: "French", progress: 20, status: "2027 Q1" },
]

export default function GlobalMapSection() {

  return (
    <section className="py-10 md:py-15" style={{ backgroundColor: "#fafbfc" }}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Knowledge Without Borders</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Published audio content for a growing selection of languages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Image */}
          <div className="relative">
            <div className="aspect-[16/10] rounded-lg overflow-hidden relative">
              <Image
                src="/images/about_section_2.png"
                alt="Knowledge Without Borders - Global Learning"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </div>



          {/* Language Progress */}
          <div className="space-y-6">
            {languages.map((lang, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{lang.name}</span>
                  <span className="text-sm text-gray-600">
                    {lang.progress}% {lang.status !== "Available" && `(${lang.status})`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${lang.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
