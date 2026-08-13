"use client"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface PremiumConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  alignForDashboard?: boolean
}

export default function PremiumConfirmationDialog({
  isOpen,
  onClose,
  title = "Premium Content",
  message = "This book is only available for premium members. Ready to upgrade and unlock thousands of curated titles?",
  alignForDashboard: _alignForDashboard = false,
}: PremiumConfirmationDialogProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleGoToPremium = () => {
    router.push("/dashboard/premium")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl">
        <div className="text-center">
          {/* 图标区域 */}
          <div className="flex justify-center mb-6">
            <div 
              className="relative inline-flex items-center justify-center w-20 h-20 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 10px 30px rgba(251, 191, 36, 0.4)'
              }}
            >
              <Crown className="w-10 h-10 text-white" />
              
              {/* 闪光效果 */}
              <div 
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center animate-pulse"
                style={{ backgroundColor: '#fbbf24' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h3 
            className="text-2xl font-bold text-center mb-3 text-gray-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            {title}
          </h3>

          {/* 描述 */}
          <p className="text-center mb-6 leading-relaxed text-gray-600" style={{ fontSize: '15px' }}>
            {message.split('thousands of curated titles').map((part, index, array) => (
              <span key={index}>
                {part}
                {index < array.length - 1 && (
                  <span className="font-semibold text-yellow-600">
                    thousands of curated book summaries
                  </span>
                )}
              </span>
            ))}
          </p>

          {/* 功能列表 */}
          <div className="mb-6 space-y-3 text-left">
            {[
              'Unlimited access to all book summaries',
              'High-quality audio narration',
              'APP Offline reading & listening'
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div 
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)' }}
                >
                  <svg 
                    className="w-3 h-3 text-yellow-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 text-base font-medium rounded-xl border-gray-300 hover:bg-gray-50"
            >
              Maybe Later
            </Button>
            <Button 
              onClick={handleGoToPremium} 
              className="flex-1 h-12 text-base font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#ffffff',
                border: 'none'
              }}
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade Now
            </Button>
          </div>

          {/* 底部提示 */}
          <p className="text-center mt-4 text-xs text-gray-500">
            Cancel anytime • 7-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  )
}
