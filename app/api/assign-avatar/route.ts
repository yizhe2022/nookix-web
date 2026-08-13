import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // 使用 Service Role Key 创建客户端（绕过 RLS）
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 从1.jpeg到10.jpeg中随机选择一个
    const randomAvatarNumber = Math.floor(Math.random() * 10) + 1
    const avatarPath = `/images/user avatar/${randomAvatarNumber}.jpeg`
    
    // 获取本地头像文件
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}${avatarPath}`)
    
    if (!response.ok) {
      console.error('Failed to fetch avatar image:', response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch avatar image' },
        { status: 500 }
      )
    }

    const blob = await response.blob()
    const fileName = `${userId}-${randomAvatarNumber}.jpeg`
    
    // 使用 Service Role 上传到 Supabase Storage（绕过 RLS）
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('user-avatars')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) {
      console.error('上传头像失败:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload avatar', details: uploadError.message },
        { status: 500 }
      )
    }
    
    // 获取公开URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('user-avatars')
      .getPublicUrl(fileName)
    
    // 更新用户资料
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
    
    if (updateError) {
      console.error('更新用户资料失败:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user profile', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Avatar assigned successfully:', publicUrl)

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl
    })

  } catch (error) {
    console.error('Error assigning avatar:', error)
    return NextResponse.json(
      {
        error: 'Failed to assign avatar',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
