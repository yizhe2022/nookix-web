/**
 * 环境配置管理工具
 * 提供环境切换和配置验证功能
 */

export type Environment = 'test' | 'production'

/**
 * 完整的环境配置类型
 */
export type EnvironmentConfig = {
  stripe: {
    publishableKey: string
    secretKey: string
    webhookSecret: string
    monthlyPriceId: string
    yearlyPriceId: string
  }
  urls: {
    app: string
    pocketbase: string
  }
}

/**
 * 获取当前环境
 */
export const getCurrentEnvironment = (): Environment => {
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
 * 获取完整的环境配置
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = getCurrentEnvironment()
  const suffix = env === 'production' ? 'PROD' : 'TEST'
  
  return {
    stripe: {
      publishableKey: process.env[`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_${suffix}`] || '',
      secretKey: process.env[`STRIPE_SECRET_KEY_${suffix}`] || '',
      webhookSecret: process.env[`STRIPE_WEBHOOK_SECRET_${suffix}`] || '',
      monthlyPriceId: process.env[`STRIPE_MONTHLY_PRICE_ID_${suffix}`] || '',
      yearlyPriceId: process.env[`STRIPE_YEARLY_PRICE_ID_${suffix}`] || '',
    },
    urls: {
      app: process.env[`NEXT_PUBLIC_APP_URL_${suffix}`] || '',
      pocketbase: process.env[`NEXT_PUBLIC_POCKETBASE_URL_${suffix}`] || '',
    }
  }
}

/**
 * 检查环境变量是否完整
 */
export const validateEnvironmentConfig = (env: Environment): boolean => {
  const suffix = env === 'production' ? 'PROD' : 'TEST'
  
  const requiredVars = [
    `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_${suffix}`,
    `STRIPE_SECRET_KEY_${suffix}`,
    `STRIPE_WEBHOOK_SECRET_${suffix}`,
    `STRIPE_MONTHLY_PRICE_ID_${suffix}`,
    `STRIPE_YEARLY_PRICE_ID_${suffix}`,
    `NEXT_PUBLIC_APP_URL_${suffix}`,
    `NEXT_PUBLIC_POCKETBASE_URL_${suffix}`,
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ 缺少${env}环境变量:`, missingVars)
    return false
  }
  
  return true
}

/**
 * 设置当前环境的全局变量
 * 这个函数会根据当前环境设置 NEXT_PUBLIC_APP_URL 和 NEXT_PUBLIC_POCKETBASE_URL
 */
export const setCurrentEnvironmentUrls = () => {
  const config = getEnvironmentConfig()
  
  // 设置当前环境的URL到全局变量
  process.env.NEXT_PUBLIC_APP_URL = config.urls.app
  process.env.NEXT_PUBLIC_POCKETBASE_URL = config.urls.pocketbase
}

/**
 * 获取环境配置摘要
 */
export const getEnvironmentSummary = () => {
  const env = getCurrentEnvironment()
  const isValid = validateEnvironmentConfig(env)
  const config = getEnvironmentConfig()
  
  return {
    environment: env,
    isValid,
    isTestMode: env === 'test',
    isProductionMode: env === 'production',
    config,
  }
}

/**
 * 输出环境配置信息（仅在开发环境）
 */
export const logEnvironmentInfo = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  const summary = getEnvironmentSummary()
  
  console.log('🔧 =============== 环境配置信息 ===============')
  console.log(`📍 当前环境: ${summary.environment.toUpperCase()}`)
  console.log(`✅ 配置状态: ${summary.isValid ? '完整' : '缺失变量'}`)
  console.log(`🧪 测试模式: ${summary.isTestMode ? '是' : '否'}`)
  
  console.log('🌐 URL配置:')
  console.log(`   前端地址: ${summary.config.urls.app}`)
  console.log(`   后端地址: ${summary.config.urls.pocketbase}`)
  
  console.log('💳 Stripe配置:')
  console.log(`   月费价格ID: ${summary.config.stripe.monthlyPriceId}`)
  console.log(`   年费价格ID: ${summary.config.stripe.yearlyPriceId}`)
  console.log(`   Webhook密钥: ${summary.config.stripe.webhookSecret.substring(0, 20)}...`)
  
  if (summary.isTestMode) {
    console.log('💡 提示: 当前使用测试环境，支付不会实际扣费')
  } else {
    console.log('⚠️  警告: 当前使用生产环境，支付将实际扣费！')
  }
  
  console.log('===============================================')
}

/**
 * 获取当前环境的应用URL
 */
export const getAppUrl = (): string => {
  const config = getEnvironmentConfig()
  return config.urls.app
}

/**
 * 获取当前环境的PocketBase URL
 */
export const getPocketBaseUrl = (): string => {
  const config = getEnvironmentConfig()
  return config.urls.pocketbase
}

/**
 * 检查是否为本地开发环境
 */
export const isLocalDevelopment = (): boolean => {
  const config = getEnvironmentConfig()
  return config.urls.app.includes('localhost')
}

/**
 * 检查是否为生产环境
 */
export const isProduction = (): boolean => {
  return getCurrentEnvironment() === 'production'
} 