import type { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { CheckCircle2, Download, Headphones, WifiOff } from "lucide-react"
import { AppDownloadActions } from "@/components/app-download-actions"
import { toSiteUrl } from "@/lib/site-config"

const baseMetadata: Metadata = {
  title: "Download the Nookix App | Nookix",
  description: "Download Nookix on Android from Google Play. iPhone and iPad support is coming soon.",
  alternates: {
    canonical: toSiteUrl('/app'),
  },
  openGraph: {
    title: "Download the Nookix App | Nookix",
    description: "Take deep audio book summaries with you. Get Nookix on Android from Google Play.",
    type: "website",
    url: toSiteUrl('/app'),
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/app', baseMetadata)
}

const appBenefits = [
  {
    icon: Headphones,
    title: "Listen anywhere",
    description: "Turn commutes, workouts, and quiet moments into focused learning time.",
  },
  {
    icon: WifiOff,
    title: "Built for mobile",
    description: "Designed for long-form audio summaries, progress tracking, and focused playback.",
  },
  {
    icon: CheckCircle2,
    title: "Deep summaries",
    description: "Get beyond shallow takeaways with immersive 60-minute book insights.",
  },
]

export default function AppDownloadPage() {
  const softwareApplicationLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nookix",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Android, iOS, Web",
    url: toSiteUrl('/app'),
    downloadUrl: "https://play.google.com/store/apps/details?id=com.nookix.books",
    description: "Nookix delivers deep, engaging audio book summaries for business, leadership, and personal growth.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationLd) }}
      />

      <section className="relative overflow-hidden border-b border-slate-200/50 bg-[#FAFAF9] px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-indigo-100/40 blur-[96px]" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[980px] text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-black/[0.06]">
            <Download className="h-4 w-4" />
            Download Nookix
          </div>

          <h1 className="mx-auto max-w-[760px] text-4xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
            Get the app for deeper learning on the go.
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-base leading-7 text-slate-500 sm:text-lg">
            Take Nookix with you on your phone or tablet. Listen to engaging audio book summaries whenever you have a spare moment.
          </p>
        </div>
      </section>

      <section className="px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="mx-auto max-w-[1180px]">
          <AppDownloadActions />
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 md:grid-cols-3">
          {appBenefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-[-0.02em] text-slate-950">{benefit.title}</h3>
                <p className="text-sm leading-6 text-slate-500">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}