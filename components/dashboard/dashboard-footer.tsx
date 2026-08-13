import Link from "next/link"
import Image from "next/image"

export default function DashboardFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-2">
        {/* 主要内容区 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          {/* Logo 和版权 */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard/for-you" className="flex items-center space-x-2">
              <Image src="/footer-logo.png?v=5" alt="Nookix" width={28} height={28} />
              <span className="text-lg font-bold font-[family-name:var(--font-nunito)] text-gray-900">Nookix</span>
            </Link>
            <span className="text-xs text-gray-500">© 2026 Nookix</span>
          </div>

          {/* 链接 */}
          <div className="flex items-center gap-4 text-xs">
            <Link href="/dashboard/premium" className="text-gray-600 hover:text-gray-900 transition-colors">
              Premium
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/redeem" className="text-gray-600 hover:text-gray-900 transition-colors">
              Redeem Code
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/terms-of-service" className="text-gray-600 hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/privacy-policy" className="text-gray-600 hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="mailto:support@nookix.net" className="text-gray-600 hover:text-gray-900 transition-colors">
              Support
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/dashboard/app" className="text-gray-600 hover:text-gray-900 transition-colors">
              Get App
            </Link>
          </div>

          {/* 社交媒体图标 */}
          <div className="flex items-center gap-3">
            <Link
              href="https://x.com/NookixBooks"
              className="flex h-4 w-4 items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="X (Twitter)"
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 bg-current"
                style={{
                  mask: "url('/x-logo.svg') center / contain no-repeat",
                  WebkitMask: "url('/x-logo.svg') center / contain no-repeat"
                }}
              />
            </Link>
            <Link
              href="https://www.reddit.com/r/60minutesbooks/"
              className="flex h-4 w-4 items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Reddit"
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 bg-current"
                style={{
                  mask: "url('/reddit-logo.svg') center / contain no-repeat",
                  WebkitMask: "url('/reddit-logo.svg') center / contain no-repeat"
                }}
              />
            </Link>
            <Link
              href="https://open.spotify.com/show/033C9an9kpiqmHFLY77XfZ"
              className="flex h-4 w-4 items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Spotify"
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 bg-current"
                style={{
                  mask: "url('/spotify-logo.svg') center / contain no-repeat",
                  WebkitMask: "url('/spotify-logo.svg') center / contain no-repeat"
                }}
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
