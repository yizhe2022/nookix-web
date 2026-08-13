import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

/**
 * 获取当前环境
 */
const getCurrentEnvironment = () => {
  const stripeEnv = process.env.STRIPE_ENV
  const nodeEnv = process.env.NODE_ENV

  // 如果明确设置了STRIPE_ENV，使用该值
  if (stripeEnv === 'production' || stripeEnv === 'test') {
    return stripeEnv
  }

  // 否则根据NODE_ENV判断
  return nodeEnv === 'production' ? 'production' : 'test'
}

/**
 * 获取Stripe环境配置
 */
const getStripeConfig = () => {
  const env = getCurrentEnvironment()
  const suffix = env === 'production' ? 'PROD' : 'TEST'

  // 处理可能被换行的环境变量
  const getEnvVar = (key: string) => {
    // 优先尝试带后缀的KEY，如果不存在则尝试不带后缀的KEY (移除 _PROD 或 _TEST)
    const standardKey = key.replace(/_(PROD|TEST)$/, '')
    const value = process.env[key] || process.env[standardKey] || ''
    // 移除所有换行符和空格
    return value.replace(/\s+/g, '')
  }

  return {
    publishableKey: getEnvVar(`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_${suffix}`),
    secretKey: getEnvVar(`STRIPE_SECRET_KEY_${suffix}`),
    webhookSecret: getEnvVar(`STRIPE_WEBHOOK_SECRET_${suffix}`),
    monthlyPriceId: getEnvVar(`STRIPE_MONTHLY_PRICE_ID_${suffix}`),
    yearlyPriceId: getEnvVar(`STRIPE_YEARLY_PRICE_ID_${suffix}`),
  }
}

// 获取当前环境配置
const stripeConfig = getStripeConfig()
const currentEnv = getCurrentEnvironment()

// 在开发环境中输出配置信息
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Stripe环境配置:')
  console.log(`📍 当前环境: ${currentEnv.toUpperCase()}`)
  console.log(`💳 月费价格ID: ${stripeConfig.monthlyPriceId}`)
  console.log(`💳 年费价格ID: ${stripeConfig.yearlyPriceId}`)
  console.log(`🔑 公钥: ${stripeConfig.publishableKey.substring(0, 20)}...`)

  if (currentEnv === 'test') {
    console.log('💡 提示: 当前使用测试环境，支付不会实际扣费')
  } else {
    console.log('⚠️  警告: 当前使用生产环境，支付将实际扣费！')
  }
}

// 服务端Stripe实例（延迟初始化）
// 服务端Stripe实例（延迟初始化）
export const getServerStripe2 = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_PROD || process.env.STRIPE_SECRET_KEY_TEST

  if (!secretKey) {
    console.warn('Stripe密钥未配置 (STRIPE_SECRET_KEY_PROD or STRIPE_SECRET_KEY_TEST)')
    // 返回一个使用假key的实例，防止构建失败，但在运行时如果没有key会报错
    return new Stripe('dummy_key_for_build', {
      apiVersion: '2025-07-30.basil' as any,
      typescript: true,
    })
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-06-20' as any,
    typescript: true,
  })
}

// 客户端Stripe实例
let stripePromise: Promise<any>
export const getStripe = () => {
  if (!stripePromise) {
    if (!stripeConfig.publishableKey) {
      console.warn('Stripe公钥未配置')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(stripeConfig.publishableKey) as Promise<Stripe | null>
  }
  return stripePromise
}

// 价格配置
export const STRIPE_PRICES = {
  MONTHLY: stripeConfig.monthlyPriceId,
  YEARLY: stripeConfig.yearlyPriceId,
} as const

// 订阅计划配置
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 5.99,
    interval: 'month',
    stripePriceId: STRIPE_PRICES.MONTHLY,
  },
  YEARLY: {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 39.99,
    interval: 'year',
    stripePriceId: STRIPE_PRICES.YEARLY,
  },
} as const

// 导出环境信息和配置（用于调试）
export const STRIPE_CONFIG = {
  environment: currentEnv,
  isTestMode: currentEnv === 'test',
  config: stripeConfig,
  prices: STRIPE_PRICES,
} as const

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]

/**
 * 获取当前环境的Webhook密钥
 */
export const getWebhookSecret = (): string => {
  return stripeConfig.webhookSecret
}

/**
 * 检查是否为测试模式
 */
export const isTestMode = (): boolean => {
  return currentEnv === 'test'
}

