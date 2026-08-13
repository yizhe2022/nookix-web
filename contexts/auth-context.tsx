"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  userProfile: UserProfile | null
  isLoading: boolean
  refreshUserProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  userProfile: null,
  isLoading: true,
  refreshUserProfile: async () => {},
  signOut: async () => {},
})

/**
 * 触发服务端同步 OAuth 头像
 * 服务端负责下载第三方头像并用 service role 写入 Storage，避免浏览器直传被 Storage policy 拦截。
 */
async function syncOAuthAvatarIfNeeded(user: User, profile: UserProfile, onSynced?: () => Promise<void>) {
  try {
    const oauthAvatarUrl = user.user_metadata?.avatar_url
    
    if (!oauthAvatarUrl) return

    if (profile.avatar_url && !profile.avatar_url.includes('googleusercontent.com') && !profile.avatar_url.includes('facebook.com')) {
      return
    }

    const response = await fetch('/api/sync-oauth-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })

    if (response.ok) {
      await onSynced?.()
    }
  } catch (error) {
    console.warn('[auth-context] OAuth avatar sync failed:', error)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUserProfile = async (targetUser: User, token: string): Promise<UserProfile | null> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_profiles?id=eq.${targetUser.id}&select=id,display_name,avatar_url`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const profile = data?.[0] ?? null

    if (profile) {
      setUserProfile(profile)
    }

    return profile
  }

  // 刷新用户资料的函数
  const refreshUserProfile = async () => {
    if (!user || !accessToken) return

    try {
      const profile = await loadUserProfile(user, accessToken)
      if (profile) {
        console.log('[auth-context] refreshUserProfile - 获取到新数据:', profile)
      }
    } catch (error) {
      console.error('[auth-context] refreshUserProfile 失败:', error)
    }
  }

  // 登出函数
  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('[auth-context] signOut 失败:', error)
    }
  }

  useEffect(() => {
    const supabase = createClient()
    let active = true

    void supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!active) return
        setUser(session?.user ?? null)
        setAccessToken(session?.access_token ?? null)
      })
      .catch(error => {
        console.error('[auth-context] 初始会话加载失败:', error)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    // 认证回调只发布状态，不能在 Supabase 持有 auth lock 时发起嵌套请求。
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAccessToken(session?.access_token ?? null)
      if (!session?.user) setUserProfile(null)
      setIsLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user || !accessToken) return

    let active = true

    void loadUserProfile(user, accessToken)
      .then(profile => {
        if (!active || !profile) return
        console.log('[auth-context] 获取到用户资料:', profile)
        void syncOAuthAvatarIfNeeded(user, profile, async () => {
          if (active) await loadUserProfile(user, accessToken)
        })
      })
      .catch(error => {
        if (active) console.error('[auth-context] 用户资料加载失败:', error)
      })

    return () => {
      active = false
    }
  }, [user, accessToken])

  return (
    <AuthContext.Provider value={{ user, accessToken, userProfile, isLoading, refreshUserProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
