import type { Metadata } from 'next'

export async function mergeMetadata(
  _path: string,
  baseMetadata: Metadata
): Promise<Metadata> {
  return baseMetadata
}

export async function generateMetadata(_path: string): Promise<Metadata> {
  return {}
}
