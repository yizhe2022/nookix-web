import type { Metadata } from 'next'
import ExplorePage from '@/app/dashboard/explore/page'

export const metadata: Metadata = {
  title: 'Books - Nookix',
  description: 'Browse and discover books on Nookix',
}

export default function BookPage() {
  return <ExplorePage />
}
