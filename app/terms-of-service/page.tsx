import { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"
import TermsOfServiceClient from "@/components/terms/terms-of-service-client"

const baseMetadata: Metadata = {
  title: "Terms of Service | Nookix",
  description: "Read Nookix's Terms of Service. Learn about your rights, our commitments, and the rules governing your use of our audiobook platform.",
  alternates: {
    canonical: toSiteUrl('/terms-of-service'),
  },
  openGraph: {
    title: "Terms of Service | Nookix",
    description: "Read Nookix's Terms of Service. Learn about your rights, our commitments, and the rules governing your use of our audiobook platform.",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/terms-of-service', baseMetadata)
}

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />
}
