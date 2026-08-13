import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { hasActiveSubscription } from '@/types/subscription'

// Cloudflare Worker 配置
const AUDIO_WORKER_DOMAIN = process.env.AUDIO_WORKER_DOMAIN
const AUDIO_HMAC_SECRET = process.env.AUDIO_HMAC_SECRET

// 预签名 URL 有效期（4 小时）
const PRESIGNED_URL_EXPIRY = 4 * 60 * 60 // 4 hours in seconds

/**
 * 生成 HMAC-SHA256 签名
 */
async function generateHmacSignature(
  filePath: string,
  expiresAt: number,
  userIp: string,
  secret: string
): Promise<string> {
  const message = `${filePath}|${expiresAt}|${userIp}`
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const keyData = encoder.encode(secret)
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * 提取客户端 IP
 */
function extractClientIp(request: NextRequest): string {
  // 优先使用 Cloudflare 的 CF-Connecting-IP
  let ip = request.headers.get('CF-Connecting-IP')
  
  if (!ip) {
    // 其次尝试 X-Forwarded-For
    const forwardedFor = request.headers.get('X-Forwarded-For')
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim()
    }
  }
  
  // 如果都没有，使用默认值
  if (!ip) {
    ip = '0.0.0.0'
  }
  
  return normalizeIp(ip)
}

/**
 * 标准化 IP 地址（处理 IPv6 映射的 IPv4）
 */
function normalizeIp(ip: string): string {
  if (!ip) return '0.0.0.0'
  
  // 处理 IPv6 映射的 IPv4
  if (ip.includes(':')) {
    const parts = ip.split(':')
    const lastFourParts = parts.slice(-4)
    const isIpv4Mapped = lastFourParts.every(part => {
      const num = parseInt(part, 10)
      return !isNaN(num) && num >= 0 && num <= 255
    })
    
    if (isIpv4Mapped && lastFourParts.length === 4) {
      return lastFourParts.join('.')
    }
    
    return ip
  }
  
  return ip
}

/**
 * 生成 Worker 签名 URL
 * 
 * POST /api/audio-presigned-url
 * Body: { bookId: string }
 * 
 * 返回: { url: string, expiresIn: number }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 验证环境变量
    if (!AUDIO_HMAC_SECRET || !AUDIO_WORKER_DOMAIN) {
      console.error('[Audio Presigned URL] Missing AUDIO_HMAC_SECRET')
      return NextResponse.json(
        { error: 'Audio configuration missing' },
        { status: 500 }
      )
    }

    // 2. 解析请求
    const { bookId, audioType = 'full' } = await req.json()

    if (!bookId) {
      return NextResponse.json(
        { error: 'Missing bookId' },
        { status: 400 }
      )
    }

    console.log('[Audio Presigned URL] Request for book:', bookId, 'audioType:', audioType)

    // 3. 验证用户登录状态（可选，根据需求）
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    console.log('[Audio Presigned URL] User authentication check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email
    })

    if (!user) {
      console.log('[Audio Presigned URL] User not logged in')
      // 注意：这里不强制要求登录，因为免费书籍可以试听
      // 如果需要强制登录，取消下面的注释
      // return NextResponse.json(
      //   { error: 'Unauthorized' },
      //   { status: 401 }
      // )
    }

    // 4. 从数据库获取书籍信息
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, summary_audio, preview_audio_url, is_premium')
      .eq('id', bookId)
      .eq('status', 'published')
      .single()

    if (bookError || !book) {
      console.error('[Audio Presigned URL] Book not found:', bookId)
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // 根据 audioType 选择音频字段
    const audioField = audioType === 'preview' ? book.preview_audio_url : book.summary_audio
    
    if (!audioField) {
      console.error('[Audio Presigned URL] No audio file for book:', bookId, 'audioType:', audioType)
      return NextResponse.json(
        { error: 'No audio file available' },
        { status: 404 }
      )
    }

    // 5. 检查 Premium 权限
    // 注意：对于 Premium 书籍，我们允许所有用户获取预签名 URL（用于 5 分钟试听）
    // 前端会在 5 分钟后停止播放并提示升级
    let userHasActiveSubscription = false
    
    if (book.is_premium) {
      if (!user) {
        console.log('[Audio Presigned URL] Premium book, user not logged in - allowing preview access')
        // 允许未登录用户试听，前端会处理 5 分钟限制
      } else {
        // 已登录用户：检查订阅状态
        const { data: subscriptionRows, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)

        const subscription = subscriptionRows?.[0] ?? null
        
        console.log('[Audio Presigned URL] Subscription query result:', {
          hasSubscription: !!subscription,
          subscriptionStatus: subscription?.subscription_status,
          subscriptionPlan: subscription?.subscription_plan,
          endDate: subscription?.end_date,
          error: subError?.message
        })
        
        if (!subError && subscription) {
          userHasActiveSubscription = hasActiveSubscription(
            subscription.subscription_status || 'free',
            subscription.subscription_plan || 'none',
            subscription.end_date || null
          )

          if (userHasActiveSubscription) {
            console.log('[Audio Presigned URL] Premium subscription validated for user:', user.id)
          } else {
            console.log('[Audio Presigned URL] No active subscription - allowing preview access')
          }
        } else {
          console.log('[Audio Presigned URL] No subscription found - allowing preview access')
        }
      }
    }

    // 6. 解析音频文件路径
    let audioPath: string
    
    if (Array.isArray(audioField)) {
      audioPath = audioField[0]
    } else if (typeof audioField === 'string') {
      const urls = audioField.includes(',')
        ? audioField.split(',').map(s => s.trim())
        : [audioField]
      audioPath = urls[0]
    } else {
      console.error('[Audio Presigned URL] Invalid audio format:', audioField)
      return NextResponse.json(
        { error: 'Invalid audio file format' },
        { status: 500 }
      )
    }

    // 7. 提取并规范化 R2 对象键。目录结构完全来自数据库，不限定 topbook/book_01 等前缀。
    let objectKey = audioPath.trim()

    if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
      try {
        objectKey = new URL(objectKey).pathname
      } catch {
        console.error('[Audio Presigned URL] Failed to parse URL:', audioPath)
        return NextResponse.json(
          { error: 'Invalid audio file path' },
          { status: 500 }
        )
      }
    }

    objectKey = decodeURIComponent(objectKey).replace(/^\/+/, '')

    if (!objectKey || objectKey.includes('..')) {
      console.error('[Audio Presigned URL] Unsafe or empty object key:', objectKey)
      return NextResponse.json(
        { error: 'Invalid audio file path' },
        { status: 500 }
      )
    }

    console.log('[Audio Presigned URL] Object key:', objectKey)

    // 8. 签名路径由访问控制前缀、书籍 ID 和真实 R2 Key 组成。
    // Worker 验签后必须剥离前两段，只将 objectKey 交给 R2。
    const clientIp = extractClientIp(req)
    const expiresAt = Math.floor(Date.now() / 1000) + PRESIGNED_URL_EXPIRY
    const encodedObjectKey = objectKey
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/')
    const filePath = `/pbc_${encodeURIComponent(bookId)}/${encodedObjectKey}`
    
    console.log('[Audio Presigned URL] Generating signature:', {
      filePath,
      expiresAt,
      clientIp,
    })
    
    const signature = await generateHmacSignature(
      filePath,
      expiresAt,
      clientIp,
      AUDIO_HMAC_SECRET
    )
    
    // 9. 构建 Worker URL
    const workerUrl = `https://${AUDIO_WORKER_DOMAIN}${filePath}?sig=${signature}&exp=${expiresAt}&ip=${encodeURIComponent(clientIp)}`
    
    console.log('[Audio Presigned URL] Generated worker URL (expires in 4 hours)')
    console.log('[Audio Presigned URL] Using Worker domain:', AUDIO_WORKER_DOMAIN)

    // 10. 返回 Worker 签名 URL
    return NextResponse.json({
      url: workerUrl,
      expiresIn: PRESIGNED_URL_EXPIRY,
      isPremium: book.is_premium,
      hasActiveSubscription: userHasActiveSubscription,
    })

  } catch (error) {
    console.error('[Audio Presigned URL] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate signed URL',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
