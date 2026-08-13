"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

const quotes = [
  {
    text: "To learn to read is to light a fire; every syllable that is spelled out is a spark.",
    author: "Victor Hugo",
    avatar: "/login-page-avatar/Victor Hugo.webp",
  },
  {
    text: "Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.",
    author: "Francis Bacon",
    avatar: "/login-page-avatar/Francis Bacon.webp",
  },
  {
    text: "Books break the shackles of time—proof that humans can work magic.",
    author: "Carl Sagan",
    avatar: "/login-page-avatar/Carl Sagan.webp",
  },
  {
    text: "If you only read what everyone else reads, you can only think what everyone else thinks.",
    author: "Haruki Murakami",
    avatar: "/login-page-avatar/Haruki Murakami.webp",
  },
  {
    text: "You discover that your longings are universal longings... You belong.",
    author: "F. Scott Fitzgerald",
    avatar: "/login-page-avatar/F. Scott Fitzgerald.webp",
  },
  {
    text: "Reading slips us into another's skin, voice, and soul.",
    author: "Joyce Carol Oates",
    avatar: "/login-page-avatar/Joyce Carol Oates.webp",
  },
  {
    text: "Once you learn to read, you will be forever free.",
    author: "Frederick Douglass",
    avatar: "/login-page-avatar/Frederick Douglass.webp",
  },
  {
    text: "Today a reader, tomorrow a leader.",
    author: "Margaret Fuller",
    avatar: "/login-page-avatar/Margaret Fuller.webp",
  },
  {
    text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin",
    avatar: "/login-page-avatar/George R.R. Martin.webp",
  },
  {
    text: "My best friend is the man who'll get me a book I haven't read.",
    author: "Abraham Lincoln",
    avatar: "/login-page-avatar/Abraham Lincoln.webp",
  },
]

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [currentQuote, setCurrentQuote] = useState(quotes[0])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    setCurrentQuote(quotes[randomIndex])
  }, [])

  return (
    <div className="relative flex min-h-screen">
      <Link href="/" className="absolute left-6 top-6 z-20 flex items-center gap-2 sm:left-8 sm:top-8" aria-label="Back to Nookix home">
        <div className="relative h-10 w-10">
          <Image src="/nookix-logo.webp?v=5" alt="Nookix" fill className="object-contain" sizes="40px" priority />
        </div>
        <span className="text-[1.8rem] font-extrabold text-gray-900 font-[family-name:var(--font-nunito)]">Nookix</span>
      </Link>

      <div className="flex w-full items-center justify-center bg-[#fafbfc] px-6 pb-8 pt-24 sm:px-8 lg:w-[38.2%]">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[61.8%]">
        <div className="relative z-10 flex w-full flex-col items-center justify-center p-12 text-primary-foreground">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-8">
              <blockquote className="text-3xl font-medium leading-relaxed text-white">
                "{currentQuote.text}"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={currentQuote.avatar}
                    alt={currentQuote.author}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <cite className="text-lg font-medium not-italic text-white/90">
                  {currentQuote.author}
                </cite>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}