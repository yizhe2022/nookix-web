import { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"

import BlogGrid from "@/components/blogs/blog-grid";

const baseMetadata: Metadata = {
  title: "Actionable Insights & Book Summaries | Nookix Blog",
  description: "Dive into the Nookix blog. Discover actionable takeaways from top non-fiction books, productivity hacks for founders, and insights from our comprehensive audio summaries.",
  alternates: {
    canonical: toSiteUrl('/blog'),
  },
  openGraph: {
    title: "Actionable Insights & Book Summaries | Nookix Blog",
    description: "Dive into the Nookix blog. Discover actionable takeaways from top non-fiction books, productivity hacks for founders, and insights from our comprehensive audio summaries.",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/blog', baseMetadata)
}

export default function BlogPage() {
  const blogPageLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Nookix Blog',
    description: 'Dive into the Nookix blog. Discover actionable takeaways from top non-fiction books, productivity hacks for founders, and insights from our comprehensive audio summaries.',
    url: toSiteUrl('/blog'),
    publisher: {
      '@type': 'Organization',
      name: 'Nookix',
      url: toSiteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: toSiteUrl('/nookix-logo.webp?v=5')
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPageLd) }}
      />
      {/* Banner */}
      {/* Banner - Removed */}


      {/* Main content */}
      <BlogGrid />
    </>
  );
}