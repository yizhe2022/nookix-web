"use client"

import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { SITE_URL } from "@/lib/site-config"

type FooterLinkGroup = {
  title: string
  baseUrl: string
  slugs: string[]
}

function AppleLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" aria-hidden="true" fill="currentColor">
      <path d="M213.2 177.3c-4.6 10.4-6.8 15.1-12.7 24.3-8.2 12.6-19.8 28.3-34.1 28.5-12.7.1-16-8.4-33.3-8.3-17.3.1-20.9 8.5-33.6 8.4-14.3-.1-25.2-14.3-33.4-26.9-22.8-35-25.2-76.1-11.1-97.9 10-15.5 25.8-24.5 40.7-24.5 15.1 0 24.6 8.3 37.1 8.3 12.1 0 19.5-8.3 37-8.3 13.2 0 27.2 7.2 37.1 19.6-32.6 17.9-27.3 64.5 10.3 76.8ZM156.9 67c6.4-8.2 11.2-19.8 9.5-31.6-10.4.7-22.6 7.3-29.7 15.9-6.5 7.8-11.9 19.5-9.8 30.8 11.3.4 23.1-6.4 30-15.1Z" />
    </svg>
  )
}

function GooglePlayLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/android_gp.svg"
      alt="Google Play"
      aria-hidden="true"
      className={className}
      draggable={false}
    />
  )
}

function FooterAppBadge({ platform }: { platform: "ios" | "android" }) {
  const isIos = platform === "ios"
  const androidUrl = "https://play.google.com/store/apps/details?id=com.nookix.books"

  const handleClick = () => {
    if (isIos) {
      toast.info("Coming soon", {
        description: "Nookix for iPhone and iPad is not available yet.",
      })
    } else {
      window.open(androidUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group inline-flex h-11 min-w-[160px] items-center gap-2.5 rounded-lg bg-white/5 px-3.5 text-left transition-all duration-200 ${
        isIos
          ? "cursor-pointer hover:bg-white/10"
          : "hover:bg-white/10"
      }`}
    >
      {isIos ? (
        <AppleLogo className="h-6 w-6 shrink-0 text-white" />
      ) : (
        <GooglePlayLogo className="h-6 w-6 shrink-0 object-contain" />
      )}
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-medium text-gray-400">
          {isIos ? "Download on the" : "GET IT ON"}
        </span>
        <span className="mt-0.5 text-sm font-semibold text-white">
          {isIos ? "App Store" : "Google Play"}
        </span>
      </span>
    </button>
  )
}

const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "Popular books",
    baseUrl: `${SITE_URL}/book/`,
    slugs: [
      "the-immortal-life-of-henrietta-lacks",
      "outliers",
      "the-art-of-racing-in-the-rain",
      "ready-player-one",
      "in-cold-blood",
      "sapiens",
      "elon-musk",
      "the-tipping-point",
      "never-split-the-difference",
      "mans-search-for-meaning",
    ],
  },
  {
    title: "Best collections",
    baseUrl: `${SITE_URL}/collections/`,
    slugs: [
      "startup-books-for-starting-a-business",
      "best-book-club-books",
      "self-help-books-for-women",
      "best-leadership-books",
      "book-of-wealth",
      "best-business-books-of-all-time",
      "best-book-to-read-as-ceo",
      "top-books-on-investing",
      "self-help-books-for-men",
    ],
  },
  {
    title: "Best fiction books",
    baseUrl: `${SITE_URL}/book/`,
    slugs: [
      "the-diary-of-a-young-girl",
      "the-book-thief",
      "a-thousand-splendid-suns",
      "of-mice-and-men",
      "thirteen-reasons-why",
      "team-of-rivals",
      "the-fifth-wave",
      "into-thin-air",
      "crown-of-midnight",
      "fahrenheit-451",
    ],
  },
  {
    title: "Popular topics",
    baseUrl: `${SITE_URL}/genres/`,
    slugs: [
      "society-books",
      "politics-books",
      "biography-books",
      "classics-books",
      "mindset-books",
      "historical-fiction-books",
      "self-help-books",
      "business-books",
      "leadership-books",
      "relationship-books",
    ],
  },
  {
    title: "Featured titles",
    baseUrl: `${SITE_URL}/book/`,
    slugs: [
      "a-short-history-of-nearly-everything",
      "the-subtle-art-of-not-giving-a-fck",
      "atomic-habits",
      "the-7-habits-of-highly-effective-people",
      "we-should-all-be-feminists",
      "freakonomics",
      "the-lean-startup",
      "rich-dad-poor-dad",
      "blink",
      "zero-to-one",
    ],
  },
  {
    title: "Nookix Reviews",
    baseUrl: `${SITE_URL}/blog/`,
    slugs: [
      "free-microlearning-apps",
      "book-summary-app-alternatives",
      "isaacson-s-geniuses",
      "the-gladwell-effect",
      "daniel-kahneman-unfolded",
      "roach-s-funny-science",
      "bryson-s-grand-tour",
      "inside-nassim-nicholas-taleb-s-world",
      "pollan-s-plate",
      "krakauer-s-edge",
    ],
  },
]

const footerLinkTitleOverrides: Record<string, string> = {
  "mans-search-for-meaning": "Man's Search for Meaning",
  "best-book-to-read-as-ceo": "Best Book to Read as CEO",
  "the-subtle-art-of-not-giving-a-fck": "The Subtle Art of Not Giving a F*ck",
  "isaacson-s-geniuses": "Isaacson's Geniuses",
  "roach-s-funny-science": "Roach's Funny Science",
  "bryson-s-grand-tour": "Bryson's Grand Tour",
  "inside-nassim-nicholas-taleb-s-world": "Inside Nassim Nicholas Taleb's World",
  "pollan-s-plate": "Pollan's Plate",
  "krakauer-s-edge": "Krakauer's Edge",
}

function formatFooterLinkTitle(slug: string): string {
  if (footerLinkTitleOverrides[slug]) return footerLinkTitleOverrides[slug]

  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:pt-12 sm:pb-10 md:pt-[60px] md:pb-12 border-b border-gray-800">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300 mb-6 sm:mb-8">
          Explore the Nookix library
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {footerLinkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-base font-semibold mb-3 md:mb-4">{group.title}</h3>
              <ul className="space-y-2 md:space-y-2">
                {group.slugs.map((slug) => (
                  <li key={slug}>
                    <a href={`${group.baseUrl}${slug}`} className="text-sm text-gray-400 hover:text-white transition-colors font-normal break-words">
                      {formatFooterLinkTitle(slug)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:pt-[60px] md:pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 mb-8 md:mb-12">
          {/* Logo and Description */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image src="/footer-logo.png?v=5" alt="Nookix" width={42} height={42} />
              <span className="text-[1.49rem] font-extrabold font-[family-name:var(--font-nunito)]">Nookix</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm text-sm leading-relaxed font-normal">
              Deep audio book summaries in 60 minutes. Your personal learning hub.
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://x.com/NookixBooks"
                className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Follow us on X (Twitter)"
              >
                <Image src="/x-logo.svg" alt="X" width={20} height={20} className="h-5 w-5 opacity-70 transition-opacity hover:opacity-100" />
              </Link>
              <Link
                href="https://www.reddit.com/r/60minutesbooks/"
                className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Join us on Reddit"
              >
                <Image src="/reddit-logo.svg" alt="Reddit" width={20} height={20} className="h-5 w-5 opacity-70 transition-opacity hover:opacity-100" />
              </Link>
              <Link
                href="https://open.spotify.com/show/033C9an9kpiqmHFLY77XfZ"
                className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Listen to us on Spotify"
              >
                <Image src="/spotify-logo.svg" alt="Spotify" width={20} height={20} className="h-5 w-5 opacity-70 transition-opacity hover:opacity-100" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-3 md:mb-4">Quick Links</h3>
            <ul className="space-y-2 md:space-y-2">
              <li>
                <Link href="/collections" className="text-sm text-gray-400 hover:text-white transition-colors font-normal">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-sm text-gray-400 hover:text-white transition-colors font-normal">
                  Premium
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-sm text-gray-400 hover:text-white transition-colors font-normal">
                  Download App
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition-colors font-normal">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-base font-semibold mb-3 md:mb-4">Support</h3>
            <div className="space-y-2 md:space-y-2 mb-4">
              <Link
                href="mailto:support@nookix.net"
                className="block text-sm text-gray-400 hover:text-white transition-colors font-normal"
              >
                support@nookix.net
              </Link>
            </div>
            <div className="space-y-3">
              <FooterAppBadge platform="ios" />
              <FooterAppBadge platform="android" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 md:pt-8 pb-2 md:pb-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-gray-400 text-sm font-normal">
            <p>
              &copy; 2026 Nookix. All rights reserved.
            </p>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}