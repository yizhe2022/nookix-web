"use client"

import { toast } from "sonner"
import { Smartphone } from "lucide-react"

const androidDownloadUrl = "https://play.google.com/store/apps/details?id=com.nookix.books"
const androidQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(androidDownloadUrl)}`

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

function StoreBadge({
  platform,
  disabled = false,
  onClick,
}: {
  platform: "ios" | "android"
  disabled?: boolean
  onClick?: () => void
}) {
  const isIos = platform === "ios"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={disabled}
      className={`group inline-flex h-[58px] min-w-[210px] items-center gap-3 rounded-[14px] bg-slate-950 px-5 text-left text-white shadow-lg shadow-slate-900/10 transition-all duration-200 ${
        disabled
          ? "cursor-not-allowed opacity-55 grayscale"
          : "hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/15"
      }`}
    >
      {isIos ? (
        <AppleLogo className="h-8 w-8 shrink-0 text-white" />
      ) : (
        <GooglePlayLogo className="h-8 w-8 shrink-0 object-contain" />
      )}
      <span className="flex flex-col leading-none">
        <span className="text-[11px] font-medium text-white/75">
          {isIos ? "Download on the" : "GET IT ON"}
        </span>
        <span className="mt-1 text-[21px] font-bold tracking-[-0.03em]">
          {isIos ? "App Store" : "Google Play"}
        </span>
      </span>
    </button>
  )
}

function DisabledQrPlaceholder() {
  return (
    <div
      className="relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 opacity-55 grayscale shadow-sm"
      aria-label="Nookix for iOS QR code coming soon"
    >
      <div className="relative h-[142px] w-[142px] overflow-hidden rounded-lg bg-white">
        <div
          aria-hidden="true"
          className="h-full w-full rounded-lg bg-cover bg-center blur-[1px]"
          style={{ backgroundImage: `url(${androidQrCodeUrl})` }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-white/45">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            Soon
          </span>
        </div>
      </div>
    </div>
  )
}

function AndroidQrCode() {
  return (
    <a
      href={androidDownloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      aria-label="Scan or open Nookix on Google Play"
    >
      <img
        src={androidQrCodeUrl}
        alt="QR code for Nookix on Google Play"
        width={142}
        height={142}
        className="h-[142px] w-[142px] rounded-lg"
      />
    </a>
  )
}

export function AppDownloadActions() {
  const handleIosClick = () => {
    toast.info("Coming soon", {
      description: "Nookix for iPhone and iPad is not available yet.",
    })
  }

  const handleAndroidClick = () => {
    window.open(androidDownloadUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8 lg:p-10">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-slate-200/50 blur-3xl" />
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
            <AppleLogo className="h-4 w-4" />
            iPhone & iPad
          </div>

          <h2 className="mb-3 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">
            Nookix for iOS
          </h2>
          <p className="mb-8 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            The iOS app is on the way. Soon you’ll be able to keep deep audio book summaries on your iPhone and iPad.
          </p>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <StoreBadge platform="ios" disabled onClick={handleIosClick} />
            <DisabledQrPlaceholder />
          </div>

          <p className="mt-5 text-xs font-medium text-slate-400">
            Not available yet. Tap the badge to see the latest status.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-blue-100/80 bg-white p-6 shadow-[0_24px_80px_rgba(37,99,235,0.08)] sm:p-8 lg:p-10">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
            <Smartphone className="h-4 w-4" />
            Android
          </div>

          <h2 className="mb-3 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">
            Get Nookix on Android
          </h2>
          <p className="mb-8 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
            Download Nookix from Google Play and listen to deep, engaging book summaries wherever your day takes you.
          </p>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <StoreBadge platform="android" onClick={handleAndroidClick} />
            <AndroidQrCode />
          </div>
        </div>
      </section>
    </div>
  )
}