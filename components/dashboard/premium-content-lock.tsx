"use client"

import { useRouter } from "next/navigation"
import { Crown, Sparkles, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PremiumContentLockProps {
  isDarkMode?: boolean
  onUpgradeClick?: () => void
}

/**
 * Premium 内容锁定组件
 * 用于在非会员用户阅读 Premium 书本时，在 5 分钟后显示升级提示
 */
export default function PremiumContentLock({ isDarkMode = false, onUpgradeClick }: PremiumContentLockProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      router.push('/dashboard/premium')
    }
  }

  return (
    <div className="relative">
      {/* 升级提示卡片 - 最顶层，不受任何遮罩影响 */}
      <div className="relative z-50 flex items-center justify-center py-8">
        <div 
          className="max-w-md mx-auto px-6 py-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: isDarkMode 
              ? 'rgba(31, 41, 55, 0.98)' 
              : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDarkMode ? '#374151' : '#e5e7eb'
          }}
        >
          {/* 图标区域 */}
          <div className="flex justify-center mb-6">
            <div 
              className="relative inline-flex items-center justify-center w-20 h-20 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: isDarkMode
                  ? '0 10px 30px rgba(251, 191, 36, 0.3)'
                  : '0 10px 30px rgba(251, 191, 36, 0.4)'
              }}
            >
              <Crown className="w-10 h-10 text-white" />
              
              {/* 闪光效果 */}
              <div 
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center animate-pulse"
                style={{
                  backgroundColor: '#fbbf24'
                }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h3 
            className="text-2xl font-bold text-center mb-3 transition-colors duration-200"
            style={{ 
              color: isDarkMode ? '#f3f4f6' : '#111827',
              letterSpacing: '-0.02em'
            }}
          >
            Unlock Full Summary
          </h3>

          {/* 描述 */}
          <p 
            className="text-center mb-6 leading-relaxed transition-colors duration-200"
            style={{ 
              color: isDarkMode ? '#d1d5db' : '#4b5563',
              fontSize: '15px'
            }}
          >
            You've reached the free preview limit. Upgrade to Premium to continue reading and unlock{' '}
            <span 
              className="font-semibold"
              style={{ color: isDarkMode ? '#fbbf24' : '#f59e0b' }}
            >
              thousands of curated book summaries
            </span>.
          </p>

          {/* 功能列表 */}
          <div className="mb-6 space-y-3">
            {[
              'Unlimited access to all book summaries',
              'High-quality audio narration',
              'APP Offline reading & listening'
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div 
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    backgroundColor: isDarkMode 
                      ? 'rgba(251, 191, 36, 0.2)' 
                      : 'rgba(251, 191, 36, 0.15)'
                  }}
                >
                  <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    style={{ color: isDarkMode ? '#fbbf24' : '#f59e0b' }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                <span 
                  className="text-sm transition-colors duration-200"
                  style={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* 升级按钮 */}
          <Button
            onClick={handleUpgrade}
            className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#ffffff',
              border: 'none'
            }}
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Premium
          </Button>

          {/* 底部提示 */}
          <p 
            className="text-center mt-4 text-xs transition-colors duration-200"
            style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
          >
            Cancel anytime • 7-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  )
}
