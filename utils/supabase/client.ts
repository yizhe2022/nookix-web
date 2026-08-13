import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  // Return existing instance if already created
  if (supabaseInstance) {
    console.log('[Supabase Client] 返回现有单例实例')
    return supabaseInstance
  }

  console.log('[Supabase Client] 创建新的单例实例')
  
  // Create new instance only if it doesn't exist
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return value ? decodeURIComponent(value) : null
        },
        set(name: string, value: string, options: any) {
          let cookie = `${name}=${encodeURIComponent(value)}`
          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          if (options?.path) {
            cookie += `; path=${options.path}`
          }
          document.cookie = cookie
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`
        }
      }
    }
  )

  return supabaseInstance
}

// Export function to reset the singleton (useful for testing or logout scenarios)
export function resetSupabaseClient() {
  supabaseInstance = null
}
