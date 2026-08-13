/**
 * 环境初始化脚本
 * 确保在应用启动时正确设置所有环境变量
 */

import { 
  getCurrentEnvironment, 
  setCurrentEnvironmentUrls, 
  validateEnvironmentConfig,
  logEnvironmentInfo 
} from './env-config'

/**
 * 初始化环境配置
 * 这个函数应该在应用启动时调用
 */
export const initializeEnvironment = () => {
  const env = getCurrentEnvironment()
  
  // 验证环境配置
  const isValid = validateEnvironmentConfig(env)
  if (!isValid) {
    throw new Error(`环境配置验证失败: ${env}环境缺少必要的环境变量`)
  }
  
  // 设置当前环境的URL
  setCurrentEnvironmentUrls()
  
  // 在开发环境中输出配置信息
  if (process.env.NODE_ENV === 'development') {
    logEnvironmentInfo()
  }
  
  return {
    environment: env,
    isValid,
    isTestMode: env === 'test',
    isProductionMode: env === 'production',
  }
}

/**
 * 获取运行时环境信息
 */
export const getRuntimeEnvironment = () => {
  return {
    environment: getCurrentEnvironment(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    pocketbaseUrl: process.env.NEXT_PUBLIC_POCKETBASE_URL,
    nodeEnv: process.env.NODE_ENV,
    stripeEnv: process.env.STRIPE_ENV,
  }
} 