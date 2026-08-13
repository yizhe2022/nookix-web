import type React from "react"
import type { Metadata } from "next"
import { Inter, Nunito } from 'next/font/google'
import Script from "next/script"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { AudioPlayerProvider } from "@/contexts/audio-player-context"
import RootLayoutContent from "@/components/layout/root-layout-content"
import { getCategoriesWithGenres } from "@/lib/supabase-service"
import { SITE_ORIGIN, SITE_URL } from "@/lib/site-config"

import { Toaster } from 'sonner'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const nunito = Nunito({
  weight: ['900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
})

const shouldLoadAnalytics = process.env.NODE_ENV === 'production'

export const metadata: Metadata = {
  metadataBase: SITE_ORIGIN,
  title: "Nookix: Deep Audio Book Summaries. Learn Smarter.",
  description:
    "Learn smarter with engaging, 60-min audio summaries. Get key insights from curated book summaries on business, leadership & personal growth. Try free today.",
  keywords: "deep audio book summaries, Blinkist alternative, 60-minute summaries, professional narration, comprehensive book insights, audiobook app",
  authors: [{ name: "Nookix Team" }],
  creator: "Nookix",
  publisher: "Nookix",
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
  icons: {
    icon: '/nookix-search-logo.webp?v=5',
    shortcut: '/favicon.ico?v=5',
    apple: '/nookix-apple-logo.webp?v=5',
  },
  openGraph: {
    title: "Nookix: Deep Audio Book Summaries. Learn Smarter.",
    description: "Learn smarter with engaging, 60-min audio summaries. Get key insights from curated book summaries on business, leadership & personal growth. Try free today.",
    type: "website",
    url: SITE_URL,
    siteName: "Nookix",
    locale: "en_US",
    images: [
      {
        url: "/nookix-logo.webp?v=5",
        width: 1200,
        height: 630,
        alt: "Nookix - Deep Audio Book Summaries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nookix: Deep Audio Book Summaries",
    description: "Learn smarter with engaging, 60-min audio summaries",
    images: ["/nookix-logo.webp?v=5"],
  },
  generator: 'Next.js',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 从 category 表获取数据，包含 name 和关联的 genres
  const groupedGenres = await getCategoriesWithGenres();

  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        {/* DNS 预解析 - 只预解析实际会立即使用的域名 */}
        <link rel="dns-prefetch" href="//api.nookix.net" />

        {/* 预连接到关键域名 - 优化网络性能 */}
        <link rel="preconnect" href={SITE_URL} />
        <link rel="preconnect" href="https://xkppzpvbvpbxzj.supabase.co" />

        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-[#FCFAF7]" suppressHydrationWarning>
        <AuthProvider>
          <AudioPlayerProvider>
            {/* Dashboard 路由使用自己的 layout，不包含官网 Header/Footer */}
            {/* 官网路由使用 RootLayoutContent，包含 Header/Footer */}
            <RootLayoutContent initialCategories={groupedGenres}>
              {children}
            </RootLayoutContent>
          </AudioPlayerProvider>
        </AuthProvider>
        <Toaster position="top-right" />

        {shouldLoadAnalytics && (
          <>
            {/* Google Analytics (gtag.js) — afterInteractive，不阻塞首屏与爬虫渲染 */}
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-Z6W5RRMWGJ"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-ED87K64H8S');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
