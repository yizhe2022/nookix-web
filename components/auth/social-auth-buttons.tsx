"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useState, useEffect } from "react"

interface SocialAuthButtonsProps {
  mode: "signin" | "signup"
  onSuccess?: () => void
  preserveSavedRedirect?: boolean
  compactLabels?: boolean
}

export default function SocialAuthButtons({ mode, onSuccess, preserveSavedRedirect = false, compactLabels = false }: SocialAuthButtonsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  /**
   * 处理 OAuth 登录
   * @param provider OAuth 提供商 (google, facebook)
   */
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      const supabase = createClient()
      setIsLoading(provider)

      // 保存当前重定向信息到 cookie（仅限书本详情页内弹窗发起的 OAuth）
      const currentRedirect = preserveSavedRedirect ? localStorage.getItem('redirectAfterLogin') : null
      if (currentRedirect?.startsWith('/dashboard/book/')) {
        // 保存到 cookie，有效期 10 分钟
        document.cookie = `oauth_redirect=${encodeURIComponent(currentRedirect)}; path=/; max-age=600; SameSite=Lax`
        console.log('[OAuth] Saved redirect to cookie:', currentRedirect)
      } else {
        document.cookie = 'oauth_redirect=; path=/; max-age=0; SameSite=Lax'
      }

      // Supabase OAuth 登录
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const oauthOptions = provider === 'google'
        ? {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
            queryParams: {
              prompt: 'select_account',
            },
          }
        : {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
          }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: oauthOptions,
      })

      if (error) {
        throw error
      }

      // OAuth 会重定向到提供商页面，然后回调到 /auth/callback
      // 不需要在这里处理成功逻辑

    } catch (error) {
      console.error(`OAuth ${provider} login failed:`, error)
      setIsLoading(null)

      // 显示错误提示
      let errorMessage = '登录失败，请重试'
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          errorMessage = '弹窗被阻止，请允许弹窗后重试'
        } else if (error.message.includes('network')) {
          errorMessage = '网络错误，请检查网络连接'
        }
      }
      alert(errorMessage)
    }
  }

  // 监听认证状态变化 - 仅处理重定向逻辑
  // 头像处理由 auth-context.tsx 统一管理
  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && isLoading) {
        // 处理重定向
        setIsLoading(null)
        
        const redirectUrl = preserveSavedRedirect
          ? sessionStorage.getItem('oauth_redirect') || localStorage.getItem('redirectAfterLogin')
          : null
        
        if (onSuccess) {
          onSuccess()
        } else if (redirectUrl?.startsWith('/dashboard/book/')) {
          sessionStorage.removeItem('oauth_redirect')
          localStorage.removeItem('redirectAfterLogin')
          router.push(redirectUrl)
        } else {
          sessionStorage.removeItem('oauth_redirect')
          localStorage.removeItem('redirectAfterLogin')
          // 默认跳转到用户后台
          router.push('/dashboard/for-you')
        }
        
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [isLoading, router, onSuccess])

  const handleGoogleAuth = () => handleOAuthLogin('google')
  const handleFacebookAuth = () => handleOAuthLogin('facebook')

  const actionText = compactLabels ? 'Continue' : (mode === "signin" ? "Sign in" : "Sign up")

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full h-12 border-gray-300 hover:bg-gray-50 justify-center"
        onClick={handleGoogleAuth}
        disabled={isLoading !== null}
      >
        {isLoading === 'google' ? (
          <div className="w-5 h-5 mr-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        ) : (
          <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {isLoading === 'google' ? 'Connecting...' : `${actionText} with Google`}
      </Button>

      <Button
        variant="outline"
        className="w-full h-12 border-gray-300 hover:bg-gray-50 justify-center"
        onClick={handleFacebookAuth}
        disabled={isLoading !== null}
      >
        {isLoading === 'facebook' ? (
          <div className="w-5 h-5 mr-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        ) : (
          <svg className="w-6 h-6 mr-3" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        {isLoading === 'facebook' ? 'Connecting...' : `${actionText} with Facebook`}
      </Button>
    </div>
  )
}
