import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Books - Nookix',
  description: 'Browse and discover books on Nookix',
}

export default function BookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
