import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGenreWithBooks } from "@/lib/supabase-service"
import DashboardGenreClient from "@/components/dashboard/dashboard-genre-client"

interface DashboardGenrePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: DashboardGenrePageProps): Promise<Metadata> {
  const { slug } = await params
  const genreData = await getGenreWithBooks(slug)

  if (!genreData) {
    return {
      title: "Genre Not Found | Nookix",
      description: "The requested genre could not be found.",
    }
  }

  const { genre } = genreData

  return {
    title: `${genre.name} | Nookix Dashboard`,
    description: `Explore audio book summaries in ${genre.name}`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function DashboardGenrePage({ params }: DashboardGenrePageProps) {
  const { slug } = await params
  const genreData = await getGenreWithBooks(slug)

  if (!genreData) {
    notFound()
  }

  const { genre, books } = genreData

  return <DashboardGenreClient genre={genre} books={books} />
}
