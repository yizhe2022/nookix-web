import type { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { SITE_URL, toSiteUrl } from "@/lib/site-config"

import HeroSection from "@/components/home/hero-section"
import WhyNookix from "@/components/home/why-nookix"
import FeaturedBookSection from "@/components/home/featured-book-section"
import PopularGenres from "@/components/home/popular-genres"
import CuratedCollections from "@/components/home/curated-collections"
import Testimonials from "@/components/home/testimonials"
import FaqSection from "@/components/home/faq-section"

import { getWebHomeFeaturedBooks } from "@/lib/supabase-service"

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const baseMetadata: Metadata = {
  title: "Nookix: 60-Minute Book Summaries for Deep Learning",
  description: "Join the best app for audio books & summaries. Get 60-minute audio summaries designed to turn your dead time into deep learning. Insights on business & personal growth.",
  keywords: "deep audio book summaries, Blinkist alternative, 60-minute summaries, professional narration, comprehensive book insights",
  alternates: {
    canonical: toSiteUrl('/'),
  },
  openGraph: {
    title: "Nookix: 60-Minute Book Summaries for Deep Learning",
    description: "Join the best app for audio books & summaries. Get 60-minute audio summaries designed to turn your dead time into deep learning. Insights on business & personal growth.",
    type: "website",
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/', baseMetadata)
}

export default async function HomePage() {
  let featuredSectionData: { sectionTitle: string; sectionSubtitle: string; books: any[] } | null = null

  // 从 Supabase 的 scenario_selected 表获取 Featured Book Section 数据
  try {
    console.log('[Featured Books] ========== 开始获取 Featured Books (Supabase) ==========')
    
    const result = await getWebHomeFeaturedBooks()
    
    console.log('[Featured Books] getWebHomeFeaturedBooks 返回结果:', result ? {
      hasScenario: !!result.scenario,
      scenarioTitle: result.scenario?.title,
      booksCount: result.books?.length || 0,
      books: result.books
    } : 'null')
    
    if (result && result.books.length > 0) {
      console.log('[Featured Books] 找到的书籍:', result.books.map((b: any) => ({ id: b.id, title: b.title })))
      
      // 转换书籍数据格式
      const formattedBooks = result.books.map((book: any) => ({
        id: book.id,
        title: book.title,
        slug: book.slug, // 添加 slug 字段
        authors: book.authors,
        coverUrl: book.cover_image || undefined,
        duration: book.audio_duration ? `${Math.round(book.audio_duration / 60)}min` : '30min', // 使用真实时长，秒转分钟
        rating: 0, // 默认值
        ratingsCount: 0, // 默认值
      }))
      
      featuredSectionData = {
        sectionTitle: "Editor's Picks",
        sectionSubtitle: "Hand-picked debates for this week.",
        books: formattedBooks
      }
      console.log('[Featured Books] ✅ Featured Section 数据已设置，书籍数量:', formattedBooks.length)
    } else {
      console.log('[Featured Books] ⚠️ 没有找到数据或没有关联的书籍')
      console.log('[Featured Books] result 详情:', result)
    }
  } catch (e) {
    console.error('[Featured Books] ❌ 异常:', e)
    if (e instanceof Error) {
      console.error('[Featured Books] 错误详情:', {
        message: e.message,
        stack: e.stack
      })
    }
  }
  
  console.log('[Featured Books] ========== Featured Books 处理完成 ==========')
  console.log('[Featured Books] 最终 featuredSectionData:', featuredSectionData ? {
    hasData: true,
    booksCount: featuredSectionData.books.length
  } : { hasData: false })

  // 使用 @graph 结构整合所有 Schema
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Nookix",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": toSiteUrl('/nookix-logo.webp?v=5'),
          "width": "512",
          "height": "512"
        },
        "description": "Deep audio book summaries in 60 minutes. Professional narration, comprehensive insights, and offline listening for business, leadership, and personal growth.",
        "sameAs": [
          "https://www.facebook.com/nookix",
          "https://twitter.com/nookix",
          "https://www.instagram.com/nookix"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "support@nookix.net",
          "contactType": "Customer Support",
          "availableLanguage": "English"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": "Nookix - Deep Audio Book Summaries",
        "description": "Go deeper with Nookix. 60-minute audio book summaries with professional narration. The depth you need to understand and apply ideas that matter.",
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": toSiteUrl('/book?search={search_term_string}')
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        "name": "Nookix",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": [
          {
            "@type": "Offer",
            "name": "Monthly Plan",
            "price": "5.99",
            "priceCurrency": "USD",
            "priceValidUntil": "2027-12-31",
            "availability": "https://schema.org/InStock",
            "eligibleDuration": {
              "@type": "QuantitativeValue",
              "value": "1",
              "unitCode": "MON"
            }
          },
          {
            "@type": "Offer",
            "name": "Annual Plan",
            "price": "39.99",
            "priceCurrency": "USD",
            "priceValidUntil": "2027-12-31",
            "availability": "https://schema.org/InStock",
            "eligibleDuration": {
              "@type": "QuantitativeValue",
              "value": "1",
              "unitCode": "ANN"
            }
          }
        ],
        "description": "Deep, not shallow. 60-minute audio book summaries with professional narration. Comprehensive explanations, rich context, and practical applications. Perfect Blinkist alternative for those who refuse to settle for superficial 15-minute summaries.",
        "featureList": [
          "60-minute deep summaries",
          "Professional narration",
          "Multiple voice options",
          "Offline listening",
          "Adjustable playback speed",
          "Sleep timer",
          "Bookmarks and notes",
          "Cross-platform sync",
          "Ad-free experience"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1500",
          "bestRating": "5",
          "worstRating": "1"
        },
        "provider": {
          "@id": `${SITE_URL}/#organization`
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How can Nookix help me?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Nookix turns your dead time into deep learning. If you have a stack of unread books on your shelf but no time to read, we help you unlock the real-world wisdom inside them. Through our 60-minute audio summaries with professional narration, you can absorb actionable strategies for business, leadership, and personal growth without adding another task to your busy schedule."
            }
          },
          {
            "@type": "Question",
            "name": "Why is 60 minutes the perfect length for a book summary?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "While shorter recaps often just skim the surface and list bullet points—creating an illusion of understanding—our 60‑minute format is deliberately built around a chapter‑by‑chapter breakdown of the original book. This preserves the author’s logical flow, minimises distortion, and ensures every key idea retains its full context and nuance. The result isn’t a rushed digest, but a thorough walkthrough that unpacks real‑world examples and actionable insights—all within a time frame that fits naturally into your day, without sacrificing depth or clarity."
            }
          },
          {
            "@type": "Question",
            "name": "What types of books are available on Nookix?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our core focus is on high-impact non-fiction. You'll find an extensive, handpicked collection of books on business, entrepreneurship, productivity, psychology, and personal growth. We also feature a carefully curated selection of popular fiction titles, exploring the profound ideas and cultural impact behind great storytelling."
            }
          },
          {
            "@type": "Question",
            "name": "Does Nookix offer a free plan or trial?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we offer a freemium model with basic access at no cost. For those who want the ultimate learning experience, our Premium plans come with a 7-day free trial, giving you unlimited access to our entire library and ad-free listening."
            }
          }
        ]
      }
    ]
  }

  return (
    <div className="bg-[#FAFAF9] font-sans selection:bg-blue-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
        suppressHydrationWarning
      />
      <HeroSection />
      
      <WhyNookix />
      
      {featuredSectionData && featuredSectionData.books.length > 0 && (
        <FeaturedBookSection 
          sectionTitle={featuredSectionData.sectionTitle}
          sectionSubtitle={featuredSectionData.sectionSubtitle}
          books={featuredSectionData.books}
        />
      )}
      
      <PopularGenres />
      
      <CuratedCollections />
      
      {/* Temporarily hidden: We Don't Just Summarize. module */}
      {/* <ProcessVisualization /> */}
      
      <Testimonials />
      
      <FaqSection />
    </div>
  );
}