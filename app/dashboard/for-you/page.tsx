"use client"

import { usePageModules } from "@/hooks/use-page-modules"
import ModuleRenderer from "@/components/dashboard/module-renderer"
import ContinueReadingSection from "@/components/dashboard/continue-reading-section"
import { Loader2 } from "lucide-react"

export default function ForYouPage() {
  const { modules, isLoading, error, refetch } = usePageModules("home")

  if (isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your personalized content...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center py-12">
          <p className="text-gray-600">No content available at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-8">
      {/* 渲染所有模块 */}
      {modules.map((module, index) => (
        <div key={module.id}>
          <ModuleRenderer module={module} />
          {/* 在第一个模块（hero）后插入 Continue Reading */}
          {index === 0 && <ContinueReadingSection />}
        </div>
      ))}
    </div>
  )
}
