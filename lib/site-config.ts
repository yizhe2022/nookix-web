const DEFAULT_SITE_URL = 'http://localhost:3000'

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

export const SITE_URL = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL
)

export const SITE_ORIGIN = new URL(SITE_URL)

export const toSiteUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return new URL(normalizedPath, SITE_ORIGIN).toString()
}
