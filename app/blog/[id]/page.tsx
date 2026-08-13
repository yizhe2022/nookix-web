import Breadcrumb from "@/components/ui/breadcrumb"
import BlogDetailContent from "@/components/blogs/blog-detail-content"
import BlogSidebar from "@/components/blogs/blog-sidebar"
import BlogNavigation from "@/components/blogs/blog-navigation"
import BlogGrid from "@/components/blogs/blog-grid"
import { getBlogBySlug, getAllBlogTags, getPopularBooks } from "@/lib/supabase-service"
import { notFound } from "next/navigation"
import { Metadata } from 'next'
import { titleToSlug } from '@/lib/slug-utils'
import { mergeMetadata } from '@/lib/seo-metadata'
import { SITE_URL, toSiteUrl } from '@/lib/site-config'

// 强制动态渲染
export const dynamic = "force-dynamic"
export const revalidate = 0

interface BlogDetailPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * 检查参数是否为 tag slug 格式
 */
async function isTagSlug(param: string): Promise<boolean> {
  try {
    const allTags = await getAllBlogTags()
    const normalizedSlug = param.toLowerCase()
    return allTags.some(tag => titleToSlug(tag).toLowerCase() === normalizedSlug)
  } catch (error) {
    return false
  }
}

/**
 * Slug 转 Tag 名称
 */
function slugToTag(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * 根据 slug 获取 blog 数据
 */
async function getBlogData(slug: string) {
  try {
    const blog = await getBlogBySlug(slug)
    
    if (!blog) {
      return null
    }

    return {
      id: blog.id,
      title: blog.name,
      slug: blog.slug,
      publishDate: blog.published_date || blog.created_at || new Date().toISOString(),
      bookCount: 0, // 可以后续实现
      image: blog.cover_image || "/placeholder.svg",
      content: blog.content || '',
      description: blog.seo_description || '',
      status: blog.status,
      tags: blog.tags || [],
      seo_title: blog.seo_title || '',
      seo_description: blog.seo_description || '',
    }
  } catch (error) {
    console.error('Failed to fetch blog from Supabase:', error)
    return null
  }
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const path = `/blog/${id}`

  // 检查是否为 tag slug
  const isTag = await isTagSlug(id)
  
  if (isTag) {
    const selectedTag = slugToTag(id)
    return mergeMetadata(path, {
      title: `In-Depth Guides on ${selectedTag} | Nookix Blog`,
      description: `Explore our collection of expert guides on ${selectedTag}. Each Nookix blog synthesizes wisdom from multiple books to give you a comprehensive understanding.`,
      alternates: {
        canonical: toSiteUrl(`/blog/${id}`),
      },
      openGraph: {
        title: `In-Depth Guides on ${selectedTag} | Nookix Blog`,
        description: `Explore our collection of expert guides on ${selectedTag}. Each Nookix blog synthesizes wisdom from multiple books to give you a comprehensive understanding.`,
        type: 'website',
        url: toSiteUrl(`/blog/${id}`),
        siteName: 'Nookix',
        images: [
          {
            url: '/nookix-logo.webp?v=5',
            width: 1200,
            height: 630,
            alt: `Nookix Blog - ${selectedTag}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `In-Depth Guides on ${selectedTag} | Nookix Blog`,
        description: `Explore our collection of expert guides on ${selectedTag}. Each Nookix blog synthesizes wisdom from multiple books to give you a comprehensive understanding.`,
        images: ['/nookix-logo.webp?v=5'],
      },
    })
  }

  // 处理 blog 详情页面
  const blog = await getBlogData(id)

  if (!blog) {
    return mergeMetadata(path, {
      title: "Blog Not Found | Nookix",
      description: "The requested blog could not be found.",
    })
  }

  // 优先使用自定义 SEO 字段
  const metaTitle = blog.seo_title || `${blog.title} | Nookix`
  const metaDescription = blog.seo_description || blog.description || blog.content?.substring(0, 160) || ''

  return mergeMetadata(path, {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: toSiteUrl(`/blog/${blog.slug}`),
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
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      url: toSiteUrl(`/blog/${blog.slug}`),
      siteName: 'Nookix',
      images: [
        {
          url: blog.image || '/nookix-logo.webp?v=5',
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [blog.image || '/nookix-logo.webp?v=5'],
    },
  })
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { id } = await params
  
  // 检查是否为 tag
  const isTag = await isTagSlug(id)

  if (isTag) {
    // 处理 tag 页面
    const selectedTag = slugToTag(id)

    const breadcrumbItems = [
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
      { label: selectedTag }
    ]

    return (
      <div className="bg-[#FAFAF9] min-h-screen">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-4 sm:pb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-6 pb-10 md:pb-[120px]">
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              Blog of {selectedTag}
            </h1>
            <p className="text-lg text-slate-600">
              Blog posts featuring "{selectedTag}" topics
            </p>
          </div>

          <BlogGrid selectedTag={selectedTag} />
        </div>
      </div>
    )
  }

  // 处理 blog 详情页面
  const blog = await getBlogData(id)

  if (!blog) {
    notFound()
  }

  // 获取 Popular Books（12本热门书籍）
  const popularBooks = await getPopularBooks(12)

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
        name: 'Blog',
        item: toSiteUrl('/blog')
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: toSiteUrl(`/blog/${blog.slug}`)
      }
    ]
  }

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.description || blog.content?.substring(0, 160),
    image: blog.image,
    datePublished: blog.publishDate,
    dateModified: blog.publishDate,
    author: {
      '@type': 'Organization',
      name: 'Nookix',
      url: toSiteUrl('/')
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nookix',
      url: toSiteUrl('/'),
      logo: {
        '@type': 'ImageObject',
        url: toSiteUrl('/nookix-logo.webp?v=5')
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': toSiteUrl(`/blog/${blog.slug}`)
    }
  }

  return (
    <div className="bg-[#FAFAF9] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-4 sm:pb-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: blog.title }
          ]}
        />
      </div>

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-6 pb-6 md:pb-[84px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <BlogDetailContent blog={blog} />
            <BlogNavigation currentBlogId={blog.id} />
          </div>

          <div className="lg:col-span-1">
            <BlogSidebar currentBlog={blog} popularBooks={popularBooks} />
          </div>
        </div>
      </div>
    </div>
  )
}
