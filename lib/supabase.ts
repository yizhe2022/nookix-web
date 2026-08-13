// ⚠️ DEPRECATED: 此文件已废弃，请勿使用
// 
// 客户端组件请使用: @/utils/supabase/client
// 服务器端组件请使用: @/lib/supabase-service
//
// 保留此文件仅为了向后兼容，将在未来版本中删除

import { createClient } from '@supabase/supabase-js'

// 获取 Supabase 配置
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase configuration is missing. Please check your environment variables.')
}

// ⚠️ DEPRECATED: 请使用 @/utils/supabase/client 代替
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export default supabase
