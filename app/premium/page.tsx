import { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"
import PremiumPageClient from "@/components/premium/premium-page-client"

const baseMetadata: Metadata = {
  title: "Unlock 100+ Books A Year | Upgrade to Nookix Premium",
  description: "Ready to accelerate your growth? Unlock the full power of Nookix with a Premium membership. Get unlimited access to our entire library of 60-minute deep audio summaries with professional narration.",
  alternates: {
    canonical: toSiteUrl('/premium'),
  },
  openGraph: {
    title: "Unlock 100+ Books A Year | Upgrade to Nookix Premium",
    description: "Ready to accelerate your growth? Unlock the full power of Nookix with a Premium membership. Get unlimited access to our entire library of 60-minute deep audio summaries with professional narration.",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/premium', baseMetadata)
}

export default function PremiumPage() {
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Nookix Premium',
    description: 'Unlock unlimited access to our entire library of 60-minute deep audio summaries with professional narration. Get 100+ books a year.',
    brand: {
      '@type': 'Brand',
      name: 'Nookix'
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Monthly Plan',
        price: '5.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: toSiteUrl('/premium'),
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition'
      },
      {
        '@type': 'Offer',
        name: 'Annual Plan',
        price: '39.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: toSiteUrl('/premium'),
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition'
      }
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1500'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <PremiumPageClient />
    </>
  )
}
