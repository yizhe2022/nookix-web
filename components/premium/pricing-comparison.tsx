"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, Gift } from "lucide-react"
import { useSubscription } from '@/hooks/use-subscription'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import LoginDialog from '@/components/auth/login-dialog'
import SignupDialog from '@/components/auth/signup-dialog'

const pricingPlans = {
  monthly: {
    name: "Monthly Plan",
    price: "$5.99",
    period: "month",
    description: "Just the price of a coffee",
    features: [
      { text: "Unlimited access to all book summaries", included: true },
      { text: "High-quality audio narration", included: true },
      { text: "Offline reading & listening", included: true },
      { text: "Premium customer support", included: true },
    ],
    cta: "Start Monthly Plan",
    popular: false,
  },
  yearly: {
    name: "Annual Plan",
    price: "$39.99",
    period: "year",
    description: "Save 44% with annual billing",
    features: [
      { text: "Unlimited access to all book summaries", included: true },
      { text: "High-quality audio narration", included: true },
      { text: "Offline reading & listening", included: true },
      { text: "Premium customer support", included: true },
    ],
    cta: "Start Annual Plan",
    popular: true,
  },
}

export default function PricingComparison() {
  const [activeTab, setActiveTab] = useState("yearly")
  const pathname = usePathname()
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    subscription,
    isLoading: subscriptionLoading,
    createSubscription,
  } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<'monthly' | 'yearly' | null>(null)

  // 根据当前路径确定取消后的返回 URL
  const getCancelUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log('[PricingComparison] getCancelUrl - pathname:', pathname)
    if (pathname?.startsWith('/dashboard')) {
      console.log('[PricingComparison] getCancelUrl - returning dashboard URL')
      return `${baseUrl}/dashboard/premium?canceled=true`
    }
    console.log('[PricingComparison] getCancelUrl - returning website URL')
    return `${baseUrl}/premium?canceled=true`
  }

  // 处理订阅创建
  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    console.log('[PricingComparison] handleSubscribe called with plan:', plan)
    console.log('[PricingComparison] user:', user)
    
    // 检查用户是否登录
    if (!user) {
      // 未登录，保存待处理的计划并打开登录弹窗
      console.log('[PricingComparison] User not logged in, showing login dialog')
      setPendingPlan(plan)
      setShowLoginDialog(true)
      return
    }

    // 已登录，直接创建订阅
    try {
      setIsProcessing(true)
      console.log('[PricingComparison] Plan:', plan)

      const cancelUrl = getCancelUrl()
      console.log('[PricingComparison] Calling createSubscription with cancelUrl:', cancelUrl)
      await createSubscription(plan, cancelUrl)
    } catch (error: any) {
      console.error('[PricingComparison] Subscription error:', error)
      toast({
        title: "订阅失败",
        description: error.message || "创建订阅失败，请重试",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 登录成功后的处理
  const handleLoginSuccess = async () => {
    setShowLoginDialog(false)
    
    // 如果有待处理的计划，立即调起 Stripe
    if (pendingPlan) {
      try {
        setIsProcessing(true)
        const cancelUrl = getCancelUrl()
        await createSubscription(pendingPlan, cancelUrl)
      } catch (error: any) {
        toast({
          title: "订阅失败",
          description: error.message || "创建订阅失败，请重试",
          variant: "destructive"
        })
      } finally {
        setIsProcessing(false)
        setPendingPlan(null)
      }
    }
  }

  // 注册成功后的处理（与登录相同）
  const handleSignupSuccess = async () => {
    setShowSignupDialog(false)
    
    // 如果有待处理的计划，立即调起 Stripe
    if (pendingPlan) {
      try {
        setIsProcessing(true)
        const cancelUrl = getCancelUrl()
        await createSubscription(pendingPlan, cancelUrl)
      } catch (error: any) {
        toast({
          title: "订阅失败",
          description: error.message || "创建订阅失败，请重试",
          variant: "destructive"
        })
      } finally {
        setIsProcessing(false)
        setPendingPlan(null)
      }
    }
  }

  return (
    <section className="relative pt-16 sm:pt-24 pb-12 sm:pb-16 bg-[#FAFAF9]">
      <div className="max-w-[1024px] mx-auto px-6 sm:px-8 relative z-10">
        {/* Header 区域 */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1 ring-blue-200/60 bg-blue-50 mb-6">
            <Gift size={12} className="text-blue-600" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600">
              Premium Plans
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            The Ultimate Gift for Book Lovers
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Invest in continuous growth. Whether you're upgrading your own routine or searching for perfect gifts for book lovers, Nookix is the best audio book subscription to turn dead time into actionable wisdom.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {Object.entries(pricingPlans).map(([key, plan]) => {
            const isYearly = key === 'yearly'
            const isActive = activeTab === key
            
            return (
              <div
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative rounded-[2rem] bg-white transition-all duration-500 cursor-pointer ring-1 ring-black/[0.04] shadow-[0_20px_60px_-16px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)] ${
                  isYearly
                    ? "ring-[3px] ring-blue-500 hover:ring-blue-600"
                    : "hover:ring-black/[0.08]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8 md:p-10">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold mb-4 tracking-tight text-slate-900">
                      {plan.name}
                    </h3>
                    <div className="mb-3">
                      <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="ml-1.5 text-lg font-medium text-slate-500">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-600">
                      {key === 'yearly' ? (
                        <>Save <span className="font-bold text-blue-600">44%</span> with annual billing</>
                      ) : (
                        plan.description
                      )}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-slate-300 mr-3 flex-shrink-0" />
                        )}
                        <span className="text-[15px] font-medium text-slate-900">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full py-3.5 text-[15px] font-bold rounded-xl transition-all duration-300 ${
                      isYearly
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (key === 'monthly') handleSubscribe('monthly')
                      else if (key === 'yearly') handleSubscribe('yearly')
                    }}
                    disabled={
                      isProcessing ||
                      (subscription.hasSubscription && subscription.plan === key)
                    }
                  >
                    {key === "yearly" && <Gift className="w-4 h-4 mr-2" />}
                    {isProcessing ? "Processing..." :
                      (subscription.hasSubscription && subscription.plan === key) ? "Current Plan" :
                        plan.cta}
                  </Button>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    7-day free trial • Cancel anytime
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 登录/注册弹窗 */}
        <LoginDialog 
          isOpen={showLoginDialog} 
          onClose={() => {
            setShowLoginDialog(false)
            setPendingPlan(null)
          }}
          onSuccess={handleLoginSuccess}
          onSwitchToSignup={() => {
            setShowLoginDialog(false)
            setShowSignupDialog(true)
          }}
        />
        <SignupDialog 
          isOpen={showSignupDialog} 
          onClose={() => {
            setShowSignupDialog(false)
            setPendingPlan(null)
          }}
          onSuccess={handleSignupSuccess}
          onSwitchToLogin={() => {
            setShowSignupDialog(false)
            setShowLoginDialog(true)
          }}
        />
      </div>
    </section>
  )
}
