import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const AVATAR_BUCKET = 'user-avatars'

async function ensureAvatarBucket(supabaseAdmin: { storage: ReturnType<typeof createSupabaseClient>['storage'] }) {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

  if (listError) {
    return listError
  }

  if (buckets?.some((bucket) => bucket.name === AVATAR_BUCKET)) {
    return null
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
  })

  return createError
}

function isAllowedOAuthAvatarUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:') return false

    const hostname = url.hostname.toLowerCase()
    return hostname.endsWith('googleusercontent.com')
      || hostname.endsWith('facebook.com')
      || hostname.endsWith('fbcdn.net')
  } catch {
    return false
  }
}

function getAvatarExtension(contentType: string | null): string {
  if (!contentType) return 'jpg'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  return 'jpg'
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const oauthAvatarUrl = user.user_metadata?.avatar_url
    if (!oauthAvatarUrl) {
      return NextResponse.json({ error: 'No OAuth avatar available' }, { status: 404 })
    }

    if (!isAllowedOAuthAvatarUrl(oauthAvatarUrl)) {
      return NextResponse.json({ error: 'Unsupported OAuth avatar host' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const bucketError = await ensureAvatarBucket(supabaseAdmin)
    if (bucketError) {
      return NextResponse.json(
        { error: 'Failed to prepare avatar bucket', details: bucketError.message },
        { status: 500 }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('id, avatar_url')
      .eq('id', user.id)
      .single()

    const existingAvatarUrl = profile?.avatar_url ?? null

    if (existingAvatarUrl && !existingAvatarUrl.includes('googleusercontent.com') && !existingAvatarUrl.includes('facebook.com')) {
      return NextResponse.json({ success: true, skipped: true, avatarUrl: existingAvatarUrl })
    }

    const avatarResponse = await fetch(oauthAvatarUrl)
    if (!avatarResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch OAuth avatar' }, { status: 502 })
    }

    const blob = await avatarResponse.blob()
    const contentType = blob.type || avatarResponse.headers.get('content-type')

    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'OAuth avatar is not an image' }, { status: 400 })
    }

    if (blob.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'OAuth avatar is too large' }, { status: 400 })
    }

    const ext = getAvatarExtension(contentType)
    const fileName = `${user.id}-oauth.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: contentType || 'image/jpeg',
      })

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload avatar', details: uploadError.message },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(fileName)

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
    })
  } catch (error) {
    console.error('[sync-oauth-avatar] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync OAuth avatar',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}