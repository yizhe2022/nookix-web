"use client"

import { ProfileContent } from "@/components/profile/profile-content"

export default function DashboardProfilePage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
      <ProfileContent />
    </div>
  )
}
