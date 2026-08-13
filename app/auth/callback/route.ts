import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing OAuth authorization code' }, { status: 400 })
  }

  try {
    const supabase = createClient(await cookies())
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Callback Route] Session exchange failed:', error)
      return NextResponse.json({ error: 'OAuth session exchange failed' }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error('[Callback Route] Unexpected error:', error)
    return NextResponse.json({ error: 'OAuth session exchange failed' }, { status: 500 })
  }
}
