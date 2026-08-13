import { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"
import PrivacyPolicyClient from "@/components/terms/privacy-policy-client"

const baseMetadata: Metadata = {
  title: "Privacy Policy | Nookix",
  description: "Read Nookix's Privacy Policy. Learn how we collect, use, and protect your personal data and privacy.",
  alternates: {
    canonical: toSiteUrl('/privacy-policy'),
  },
  openGraph: {
    title: "Privacy Policy | Nookix",
    description: "Read Nookix's Privacy Policy. Learn how we collect, use, and protect your personal data and privacy.",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/privacy-policy', baseMetadata)
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}
