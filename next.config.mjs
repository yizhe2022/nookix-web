/** @type {import('next').NextConfig} */
const nextConfig = {
  // SWC 编译器配置 - 禁用 polyfills
  compiler: {
    // 移除 console.log
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 禁用 Next.js 自动 polyfills
  transpilePackages: [],

  images: {
    // ✅ 全局禁用图片优化 - 适配 Vercel Hobby 计划
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 604800, // 7天缓存，优化性能
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8090',
        pathname: '/api/files/**',
      },
      {
        protocol: 'https',
        hostname: 'api.nookix.net',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-aspect-ratio',
      'recharts',
      'embla-carousel-react',
    ],
    // 启用现代 JavaScript 支持，移除旧版 polyfill
    esmExternals: true,
    // 启用 SWC 编译器优化，完全移除 core-js polyfill
    swcTraceProfiling: false,
    // 优化 CSS 输出 - 使用 Lightning CSS 移除未使用的样式
    optimizeCss: true,
    // 使用更激进的代码优化
    serverMinification: true,
  },

  // ✅ 新增：添加这个空的 turbopack 配置来解决 Next.js 16 的报错
  turbopack: {
    // 暂时禁用 Turbopack 的字体优化以避免 Google Fonts 加载错误
    resolveAlias: {},
  },

  // 保持 Next.js 14 的 params 行为，避免类型错误
  serverExternalPackages: ['@vercel/og'],
  reactStrictMode: false,
  trailingSlash: false,
  staticPageGenerationTimeout: 180,
  env: {
    CUSTOM_PORT: '3000',
  },
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // 优化构建输出
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev && !isServer) {
      // 启用现代 JavaScript 支持，移除旧版 polyfill
      // 使用 es2022 目标，完全移除 core-js polyfill
      config.target = ['web', 'es2022']

      // 配置 resolve 以支持现代浏览器
      config.resolve.alias = {
        ...config.resolve.alias,
        // 完全移除 core-js polyfill
        'core-js': false,
        'core-js-pure': false,
        '@babel/runtime-corejs3': false,
        // 禁用 Next.js polyfills
        '@next/polyfill-module': false,
      }

      // 优化模块解析
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }

      // Bundle 分析
      if (process.env.ANALYZE === 'true') {
        import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: 'bundle-analysis.html',
            })
          )
        }).catch(err => console.error('Failed to load webpack-bundle-analyzer:', err));
      }

      // 优化 chunk 分割，减少未使用的代码
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 将大型库单独打包
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            lucide: {
              name: 'lucide',
              test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // 其他第三方库
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/](?!@radix-ui|lucide-react)/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },

  // 301 重定向配置
  async redirects() {
    return [
      {
        source: '/blog/advance-your-career',
        destination: '/blog/leadership-business',
        permanent: true,
      },
      {
        source: '/blog/build-wealth',
        destination: '/blog/leadership-business',
        permanent: true,
      },
      {
        source: '/blog/find-your-focus',
        destination: '/blog/productivity-habits',
        permanent: true,
      },
      {
        source: '/blog/learn-faster',
        destination: '/blog/productivity-habits',
        permanent: true,
      },
      {
        source: '/blog/manage-a-team',
        destination: '/blog/leadership-business',
        permanent: true,
      },
      {
        source: '/blog/think-smarter',
        destination: '/blog/productivity-habits',
        permanent: true,
      },
      {
        source: '/blog/understand-tech',
        destination: '/blog/leadership-business',
        permanent: true,
      },
      {
        source: '/blog/win-people-over',
        destination: '/blog/personal-growth',
        permanent: true,
      },
    ]
  },

  // 优化 HTTP 头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // 阻止 Next.js 静态资源被搜索引擎索引
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/data/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      // 为静态资源添加长期缓存
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // 优化 Next.js 图片缓存
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

export default nextConfig
