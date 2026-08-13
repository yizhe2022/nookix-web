import { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"
import TermsPageClient from "@/components/terms/terms-page-client"

const baseMetadata: Metadata = {
  title: "Terms & Privacy Policy | Nookix",
  description: "Read Nookix's Terms of Service and Privacy Policy. Learn about your rights, our commitments, and how we protect your data and privacy.",
  alternates: {
    canonical: toSiteUrl('/terms'),
  },
  openGraph: {
    title: "Terms & Privacy Policy | Nookix",
    description: "Read Nookix's Terms of Service and Privacy Policy. Learn about your rights, our commitments, and how we protect your data and privacy.",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/terms', baseMetadata)
}

export default function TermsPage() {
  return <TermsPageClient />
}
