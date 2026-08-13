import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Play, Clock, Layers, CheckCircle2, Headphones, PlayCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCollectionBySlug } from "@/lib/supabase-service"
import { notFound } from "next/navigation"
import CollectionBookList from "@/components/collections/collection-book-list"
import type { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { SITE_URL, toSiteUrl } from "@/lib/site-config"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.id
  const path = `/collections/${slug}`
  
  const collectionData = await getCollectionBySlug(slug)
  
  if (!collectionData) {
    return mergeMetadata(path, {
      title: "Collection Not Found | Nookix",
      description: "The requested collection could not be found.",
      robots: {
        index: false,
        follow: true,
      },
    })
  }
  
  // 优先使用自定义 SEO 字段，否则使用模板化生成
  const metaTitle = collectionData.seo_title || `${collectionData.title} in 60-Min Audio Summaries | Nookix`
  const metaDescription = collectionData.seo_description || `Explore the best books of ${collectionData.title}. We transform 300-page bestsellers into comprehensive 60-minute audio summaries with professional narration. Zero fluff, just actionable wisdom.`
  
  // 获取 collection 封面图片 URL - 优先使用 collection 封面
  const ogImage = collectionData.featured_image_url || collectionData.collection_cover_url || toSiteUrl('/og-default.jpg')
  
  // 确保图片 URL 是完整的 HTTPS URL
  const fullOgImageUrl = ogImage.startsWith('http') ? ogImage : toSiteUrl(ogImage)
  
  // 生成规范的 URL
  const canonicalUrl = toSiteUrl(`/collections/${slug}`)
  
  return mergeMetadata(path, {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: 'Nookix',
      images: [
        {
          url: fullOgImageUrl,
          width: 1200,
          height: 630,
          alt: `${collectionData.title} - Collection Cover`,
        },
      ],
      locale: 'en_US',
      type: 'website',
      // 添加更多信息以提升社交媒体显示效果
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [fullOgImageUrl],
      creator: '@nookix',
      site: '@nookix',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  })
}

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const slug = resolvedParams.id
  
  console.log('Collection Detail Page - slug:', slug)
  
  // 从 Supabase 获取 collection 数据
  const collectionData = await getCollectionBySlug(slug)
  
  if (!collectionData) {
    console.error('Collection not found:', slug)
    notFound()
  }

  const books = collectionData.books || []
  
  // 计算总时长（使用 audio_duration 字段，单位是秒）
  const totalSeconds = books.reduce((sum: number, book: any) => {
    if (book.audio_duration) {
      const duration = typeof book.audio_duration === 'number' 
        ? book.audio_duration 
        : parseInt(book.audio_duration) || 0;
      return sum + duration;
    }
    return sum;
  }, 0)
  const totalHours = (totalSeconds / 3600).toFixed(1) // 转换为小时，保留1位小数
  
  const collection = {
    id: collectionData.id,
    title: collectionData.title,
    subtitle: collectionData.tagline || "",
    curatorNote: collectionData.description || "A curated collection of essential books.",
    totalBooks: books.length,
    totalDuration: `${totalHours} Hours`,
    coverUrl: collectionData.featured_image_url || collectionData.collection_cover_url || '/placeholder.svg',
    books: books.map(book => {
      // 计算音频时长（分钟，四舍五入）
      let audioDurationMinutes = 30; // 默认30分钟
      if (book.audio_duration) {
        const duration = typeof book.audio_duration === 'number' 
          ? book.audio_duration 
          : parseInt(book.audio_duration) || 0;
        
        // audio_duration 是秒数，转换为分钟并四舍五入
        audioDurationMinutes = Math.round(duration / 60);
      }
      
      return {
        id: book.id,
        title: book.title,
        author: (book.authors || "Unknown Author") as string,
        coverUrl: book.cover_image || '/placeholder.svg',
        audioDuration: `${audioDurationMinutes}min`,
        ratingsCount: (book as any).ratings_count || 0,
        oneLiner: (book as any).one_liner || "Discover key insights from this book.",
        audioFile: (book as any).summary_audio || null, // 使用 summary_audio 字段
        isPremium: (book as any).is_premium || false,
        slug: (book as any).slug || book.id, // 添加 slug 字段，使用 id 作为后备
      }
    })
  }

  // 极简Schema方案
  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': toSiteUrl(`/collections/${slug}`),
    name: collection.title,
    description: collection.curatorNote,
    url: toSiteUrl(`/collections/${slug}`),
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Nookix',
      url: toSiteUrl('/')
    }
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: toSiteUrl('/')
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Collections',
        item: toSiteUrl('/collections')
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: collection.title
      }
    ]
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] selection:bg-blue-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      
      {/* === 1. 面包屑导航 === */}
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-4 sm:pb-6 relative z-20">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">Home</a>
          <ChevronRight className="h-4 w-4" />
          <a href="/collections" className="hover:text-blue-600">Collections</a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{collection.title}</span>
        </nav>
      </div>

      {/* === 2. 沉浸式 Hero 区 (克制的高级感) === */}
      <header className="relative pt-4 sm:pt-6 pb-16 sm:pb-24 overflow-hidden">
        {/* 微弱的背景氛围光 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50/60 blur-[120px] rounded-full pointer-events-none" />
        
        {/* 版心与首页完全对齐: max-w-1280px */}
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10 flex flex-col md:flex-row gap-12 lg:gap-16 items-center md:items-start">
          
          {/* 左侧：排版精良的文字与寄语 */}
          <div className="flex-1 order-2 md:order-1 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 tracking-tight mb-5 leading-[1.1] text-balance">
              {collection.title}
            </h1>
            <p className="text-xl text-slate-600 font-semibold mb-8 leading-snug">
              {collection.subtitle}
            </p>
            
            {/* Meta 数据标签 */}
            <div className="flex flex-wrap items-center gap-4 text-[13px] font-bold text-slate-500 mb-10">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg ring-1 ring-black/[0.04] shadow-sm">
                <Layers size={14} className="text-blue-500" />
                {collection.totalBooks} Books Included
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg ring-1 ring-black/[0.04] shadow-sm">
                <Clock size={14} className="text-emerald-500" />
                {collection.totalDuration} Total Audio
              </div>
            </div>

            {/* 策展人寄语 (安静的阅读区) */}
            <div className="bg-white rounded-2xl p-6 md:p-8 ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] relative">
              <div className="absolute top-0 left-8 -translate-y-1/2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ring-1 ring-blue-100/50">
                Curator's Note
              </div>
              <p className="text-slate-600 leading-relaxed font-medium text-[15px]">
                {collection.curatorNote}
              </p>
            </div>
          </div>

          {/* 右侧：1:1 比例的封面 */}
          <div className="w-full shrink-0 order-1 md:order-2 md:max-w-[280px] lg:max-w-[340px]">
             <div className="relative w-full aspect-square">
                <Image 
                  src={collection.coverUrl || '/placeholder.svg'} 
                  alt="Collection Cover" 
                  fill 
                  className="object-cover rounded-2xl ring-1 ring-black/[0.04] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]" 
                  priority 
                />
             </div>
          </div>

        </div>
      </header>

      {/* === 3. 大纲列表区 (The Syllabus) === */}
      {/* 列表区的最大宽度控制在 1024px 居中，保证文字不会横跨整个屏幕导致阅读疲劳 */}
      <section className="max-w-[1024px] mx-auto px-6 sm:px-8 pb-16 sm:pb-24">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Collection Books
          </h2>
        </div>

        <CollectionBookList books={collection.books} />
      </section>

      {/* === 4. 底部粘性转化区 (全局对齐) === */}
      <section className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="bg-white rounded-[3rem] p-10 sm:p-16 md:p-20 text-center relative overflow-hidden shadow-[0_20px_60px_-16px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-blue-50/80 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight text-balance">
              Curated Playlists for Continuous Growth
            </h3>
            <p className="text-slate-500 mb-10 text-[16px] md:text-lg font-medium leading-relaxed">
              We've organized our library of good audio books into thematic playbooks. Choose a path, hit play, and absorb actionable wisdom through our 60-minute deep-dive audio summaries.
            </p>
            <div className="flex flex-col items-center gap-6">
              <Link href="/auth/signin">
                <Button className="h-14 px-10 text-[16px] font-bold rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_24px_-4px_rgba(37,99,235,0.5)] group flex items-center gap-2 hover:-translate-y-0.5">
                  <PlayCircle size={20} />
                  Start 7-Day Free Trial
                </Button>
              </Link>
              <p className="text-[13px] text-slate-500 font-semibold">
                Only $5.99/mo after. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
