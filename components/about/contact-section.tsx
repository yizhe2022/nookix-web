"use client"

import { useState } from "react"
import { Mail, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactSection() {
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("nookixpod@gmail.com")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy email:", err)
    }
  }

  return (
    <section className="py-10 md:py-20" style={{ backgroundColor: "#fafbfc" }}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Floating Mail Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-bounce">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-blue-600 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Fuel the Knowledge Revolution</h2>
            <div className="space-y-2 text-lg text-gray-600">
              <p>Have book requests? Partnership ideas?</p>
              <p>Our curators are listening:</p>
            </div>

            {/* Email with Copy Function */}
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-4 py-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-medium text-gray-900">nookixpod@gmail.com</span>
              </div>
              <Button
                onClick={handleCopyEmail}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* 保持相同的空间占位以维持页面高度 */}
            <div className="min-h-[1rem]"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
