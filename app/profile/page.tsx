import { ProfileContent } from "@/components/profile/profile-content"
import type { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"

const baseMetadata: Metadata = {
  title: "My Profile | Nookix",
  description: "Manage your Nookix account settings and preferences.",
  alternates: {
    canonical: toSiteUrl('/profile'),
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/profile', baseMetadata)
}

export default function ProfilePage() {
  return (
    <div className="bg-[#FCFAF7] min-h-screen">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 md:pt-[120px]">
        <ProfileContent />
      </div>
    </div>
  )
}
