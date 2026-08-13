import type { MetadataRoute } from 'next'
import { toSiteUrl } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/dashboard/',
                '/private/',
            ],
        },
        sitemap: toSiteUrl('/sitemap.xml'),
    }
}
