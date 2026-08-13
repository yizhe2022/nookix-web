// ⚠️ DEPRECATED: 此文件已废弃，请勿使用
// 
// 请统一使用: @/utils/supabase/client
//
// 保留此文件仅为了向后兼容，将在未来版本中删除

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * ⚠️ DEPRECATED: 请使用 @/utils/supabase/client 代替
 * 
 * 简单的 Supabase 客户端（用于客户端组件）
 * 使用 @supabase/supabase-js 而不是 @supabase/ssr
 * 适用于纯客户端操作，如文件上传
 * 
 * 使用单例模式避免 Lock 冲突
 */

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  console.warn('⚠️ DEPRECATED: client-simple.ts is deprecated. Please use @/utils/supabase/client instead.')
  
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    )
  }
  return supabaseInstance
}
