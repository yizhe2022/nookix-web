import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { titleToSlug } from '@/lib/slug-utils'
import { SITE_URL } from '@/lib/site-config'

const baseUrl = SITE_URL
const ITEMS_PER_PAGE = 500

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SitemapUrl = {
  url: string
  lastModified?: Date
  changeFrequency: string
  priority: number
}

type SitemapEntry = {
  url: string
  lastModified?: Date
}

function escapeXml(unsafe: string) {
  if (!unsafe) return ''

  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '"': return '&quot;'
      case "'": return '&apos;'
      default: return c
    }
  })
}

function toValidDate(value: unknown) {
  if (!value || typeof value !== 'string') return undefined

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function latestDate(values: Array<unknown>) {
  return values
    .map(toValidDate)
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0]
}

function generateSitemapXml(urls: SitemapUrl[]) {
  const xmlUrls = urls.map((item) => {
    const lastmod = item.lastModified
      ? `\n    <lastmod>${item.lastModified.toISOString()}</lastmod>`
      : ''

    return `  <url>
    <loc>${escapeXml(item.url)}</loc>${lastmod}
    <changefreq>${item.changeFrequency}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`
}

function generateSitemapIndexXml(sitemaps: SitemapEntry[]) {
  const xmlSitemaps = sitemaps.map((item) => {
    const lastmod = item.lastModified
      ? `\n    <lastmod>${item.lastModified.toISOString()}</lastmod>`
      : ''

    return `  <sitemap>
    <loc>${escapeXml(item.url)}</loc>${lastmod}
  </sitemap>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlSitemaps}
</sitemapindex>`
}

function xmlResponse(xml: string, maxAge = 3600) {
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  })
}

async function getPublishedBookCount() {
  const { count, error } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .not('slug', 'is', null)

  if (error) {
    console.error('❌ [Sitemap] Failed to count books:', error)
    return 0
  }

  return count || 0
}

async function getLatestBookDate() {
  const { data, error } = await supabase
    .from('books')
    .select('updated_at, created_at')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(1)

  if (error) {
    console.error('❌ [Sitemap] Failed to fetch latest book timestamp:', error)
    return undefined
  }

  const item = data?.[0]
  return latestDate([item?.updated_at, item?.created_at])
}

async function getStaticSitemapLastmod() {
  const [blogsResult, genresResult, collectionsResult] = await Promise.all([
    supabase
      .from('blogs')
      .select('updated_at, created_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(1),
    supabase
      .from('genres')
      .select('updated_at, created_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(1),
    supabase
      .from('collections')
      .select('updated_at, created_at')
      .eq('is_enabled', true)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .limit(1),
  ])

  if (blogsResult.error) console.error('❌ [Sitemap] Failed to fetch latest blog timestamp:', blogsResult.error)
  if (genresResult.error) console.error('❌ [Sitemap] Failed to fetch latest genre timestamp:', genresResult.error)
  if (collectionsResult.error) console.error('❌ [Sitemap] Failed to fetch latest collection timestamp:', collectionsResult.error)

  return latestDate([
    blogsResult.data?.[0]?.updated_at,
    blogsResult.data?.[0]?.created_at,
    genresResult.data?.[0]?.updated_at,
    genresResult.data?.[0]?.created_at,
    collectionsResult.data?.[0]?.updated_at,
    collectionsResult.data?.[0]?.created_at,
  ])
}

async function generateSitemapIndex() {
  const [totalBooks, staticLastmod, latestBookLastmod] = await Promise.all([
    getPublishedBookCount(),
    getStaticSitemapLastmod(),
    getLatestBookDate(),
  ])

  const totalPages = Math.max(1, Math.ceil(totalBooks / ITEMS_PER_PAGE))
  const sitemaps: SitemapEntry[] = [
    { url: `${baseUrl}/sitemap.xml?page=static`, lastModified: staticLastmod },
  ]

  for (let i = 1; i <= totalPages; i++) {
    sitemaps.push({
      url: `${baseUrl}/sitemap.xml?page=${i}`,
      lastModified: latestBookLastmod,
    })
  }

  return generateSitemapIndexXml(sitemaps)
}

async function generateStaticSitemap() {
  const staticUrlConfigs = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/app', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/collections', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/premium', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/genres', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/terms-of-service', priority: 0.1, changeFrequency: 'yearly' },
    { path: '/privacy-policy', priority: 0.1, changeFrequency: 'yearly' },
    { path: '/data-policy', priority: 0.1, changeFrequency: 'yearly' },
  ]

  const [blogsResult, genresResult, collectionsResult] = await Promise.all([
    supabase
      .from('blogs')
      .select('slug, updated_at, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('genres')
      .select('slug, name, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('collections')
      .select('slug, updated_at, created_at')
      .eq('is_enabled', true)
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  if (blogsResult.error) console.error('❌ [Sitemap] Failed to fetch blogs:', blogsResult.error)
  if (genresResult.error) console.error('❌ [Sitemap] Failed to fetch genres:', genresResult.error)
  if (collectionsResult.error) console.error('❌ [Sitemap] Failed to fetch collections:', collectionsResult.error)

  const urls: SitemapUrl[] = staticUrlConfigs.map((config) => ({
    url: `${baseUrl}${config.path}`,
    changeFrequency: config.changeFrequency,
    priority: config.priority,
  }))

  ;(blogsResult.data || []).forEach((item) => {
    if (!item.slug) return

    urls.push({
      url: `${baseUrl}/blog/${item.slug}`,
      lastModified: latestDate([item.updated_at, item.created_at]),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  })

  ;(collectionsResult.data || []).forEach((item) => {
    if (!item.slug) return

    urls.push({
      url: `${baseUrl}/collections/${item.slug}`,
      lastModified: latestDate([item.updated_at, item.created_at]),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  })

  ;(genresResult.data || []).forEach((item) => {
    const slug = item.slug || titleToSlug(item.name)
    if (!slug) return

    urls.push({
      url: `${baseUrl}/genres/${slug}`,
      lastModified: latestDate([item.updated_at, item.created_at]),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  })

  return generateSitemapXml(urls)
}

async function generateBookSitemap(pageNum: number) {
  const offset = (pageNum - 1) * ITEMS_PER_PAGE
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('slug, updated_at, created_at')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (booksError) {
    console.error('❌ [Sitemap] Failed to fetch books:', booksError)
    return generateSitemapXml([])
  }

  const urls = (books || [])
    .filter((item) => Boolean(item.slug))
    .map((item) => ({
      url: `${baseUrl}/book/${item.slug}`,
      lastModified: latestDate([item.updated_at, item.created_at]),
      changeFrequency: 'monthly',
      priority: 0.5,
    }))

  return generateSitemapXml(urls)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page')

  try {
    if (!page) {
      return xmlResponse(await generateSitemapIndex())
    }

    if (page === 'static') {
      return xmlResponse(await generateStaticSitemap())
    }

    const pageNum = parseInt(page, 10)
    if (Number.isNaN(pageNum) || pageNum < 1) {
      return new NextResponse('Invalid page number', { status: 400 })
    }

    return xmlResponse(await generateBookSitemap(pageNum), 86400)
  } catch (error) {
    console.error('❌ [Sitemap] Unexpected generation error:', error)
    return xmlResponse(generateSitemapXml([]), 300)
  }
}