import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/utils/supabase/client'
import { SubscriptionStatus as DbSubscriptionStatus, SubscriptionPlan, hasActiveSubscription } from '@/types/subscription'

/**
 * 订阅状态类型定义
 */
export interface SubscriptionStatus {
  hasSubscription: boolean
  isActive: boolean
  plan: SubscriptionPlan
  status: DbSubscriptionStatus
  startDate: string | null
  endDate: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

/**
 * 支付方式类型定义
 */
export interface PaymentMethod {
  id: string
  type: string
  last4: string
  isDefault: boolean
}

/**
 * 订阅管理Hook
 */
export function useSubscription() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    hasSubscription: false,
    isActive: false,
    plan: 'none',
    status: 'free',
    startDate: null,
    endDate: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  })

  /**
   * 获取用户订阅状态
   */
  const fetchSubscriptionStatus = async () => {
    try {
      setIsLoading(true)

      if (!user) {
        setSubscription({
          hasSubscription: false,
          isActive: false,
          plan: 'none',
          status: 'free',
          startDate: null,
          endDate: null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        })
        return
      }

      const supabase = createClient()

      // 从 user_subscriptions 表获取订阅信息
      const { data: subscriptionRows, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      const subscriptionData = subscriptionRows?.[0] ?? null

      if (error) {
        console.error('获取订阅状态失败:', error)
      }

      if (!subscriptionData) {
        // No subscription found
        setSubscription({
          hasSubscription: false,
          isActive: false,
          plan: 'none',
          status: 'free',
          startDate: null,
          endDate: null,
          cancelAtPeriodEnd: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        })
        return
      }

      // Parse subscription data
      const plan: SubscriptionPlan = subscriptionData.subscription_plan || 'none'
      const status: DbSubscriptionStatus = subscriptionData.subscription_status || 'free'
      const endDate = subscriptionData.end_date || null
      const hasSubscription = hasActiveSubscription(status, plan, endDate)

      setSubscription({
        hasSubscription,
        isActive: hasSubscription,
        plan,
        status,
        startDate: subscriptionData.start_date || null,
        endDate,
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
        stripeCustomerId: subscriptionData.stripe_customer_id || null,
        stripeSubscriptionId: subscriptionData.stripe_subscription_id || null
      })
    } catch (error) {
      console.error('获取订阅状态失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 创建订阅
   */
  const createSubscription = async (plan: 'monthly' | 'yearly', cancelUrl?: string) => {
    try {
      console.log('[Subscription] Starting creation for plan:', plan)

      if (!user) {
        console.log('[Subscription] No user logged in, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      setIsLoading(true)

      // Get Supabase session token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.log('[Subscription] No session found, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      console.log('[Subscription] Sending checkout request to /api/stripe/checkout')
      const response = await fetch(`/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
          cancelUrl,
        }),
      })

      const data = await response.json()
      console.log('[Subscription] API Response:', data)

      if (!response.ok) {
        throw new Error(data.error || '创建订阅失败')
      }

      if (data.sessionId) {
        console.log('[Subscription] Loading Stripe...')
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        )

        if (!stripe) {
          console.error('[Subscription] Failed to load Stripe. Key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
          throw new Error('Stripe initialization failed - invalid key?')
        }

        console.log('[Subscription] Redirecting to checkout...')
        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        })

        if (result.error) {
          console.error('[Subscription] Stripe redirect error:', result.error)
          throw result.error
        }
      } else {
        console.error('[Subscription] No sessionId returned')
        throw new Error('No session ID returned from API')
      }
    } catch (error) {
      console.error('[Subscription] createSubscription failed:', error)
      throw error // Re-throw to be caught by UI
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 打开 Stripe Customer Portal（取消或管理订阅）
   */
  const openPortal = async () => {
    try {
      setIsLoading(true)

      // Get Supabase session token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/signin')
        return
      }

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '无法打开账单管理页面')
      }

      // 新标签页打开 Stripe Portal
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('打开 Stripe Portal 失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 恢复订阅
   */
  const resumeSubscription = async () => {
    try {
      setIsLoading(true)

      // Get Supabase session token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/signin')
        return
      }

      const response = await fetch(`/api/manage-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'resume',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '恢复订阅失败')
      }

      // 刷新订阅状态
      await fetchSubscriptionStatus()
      return data
    } catch (error) {
      console.error('恢复订阅失败:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 获取格式化的订阅信息
   */
  const getSubscriptionDisplay = () => {
    if (!subscription.hasSubscription) {
      return {
        planName: 'Free',
        planPrice: '$0',
        planPeriod: '',
        statusText: '未订阅',
        statusColor: 'gray'
      }
    }

    const planInfo = subscription.plan === 'monthly'
      ? { name: 'Premium', price: '$5.99', period: '/month' }
      : subscription.plan === 'yearly'
        ? { name: 'Premium', price: '$39.99', period: '/year' }
        : { name: 'Premium', price: '-', period: '' }

    let statusText = '未知状态'
    let statusColor = 'gray'

    switch (subscription.status) {
      case 'active':
        statusText = subscription.cancelAtPeriodEnd ? '即将到期' : '活跃'
        statusColor = subscription.cancelAtPeriodEnd ? 'orange' : 'green'
        break
      case 'canceled':
        statusText = '已取消'
        statusColor = 'red'
        break
      case 'past_due':
        statusText = '逾期'
        statusColor = 'red'
        break
      case 'free':
        statusText = '未订阅'
        statusColor = 'gray'
        break
    }

    return {
      planName: planInfo.name,
      planPrice: planInfo.price,
      planPeriod: planInfo.period,
      statusText,
      statusColor
    }
  }

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 初始化时获取订阅状态
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus()
    }
  }, [user])

  return {
    subscription,
    isLoading,
    createSubscription,
    openPortal,
    fetchSubscriptionStatus,
    getSubscriptionDisplay,
    formatDate
  }
}
