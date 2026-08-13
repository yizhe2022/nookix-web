"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SignupSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // 倒计时
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // 倒计时结束后跳转
    if (countdown <= 0) {
      localStorage.removeItem('redirectAfterLogin')
      router.push('/dashboard/for-you')
    }
  }, [countdown, router])

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* 成功图标 */}
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Nookix! 🎉
          </h1>

          {/* 说明文字 */}
          <p className="text-base text-gray-600 mb-4">
            Your account has been created successfully.
            <br />
            You're all set to start exploring!
          </p>

          {/* 特色功能提示 */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-gray-700">
              Explore thousands of book summaries and start your learning journey
            </p>
          </div>

          {/* 继续按钮 */}
          <Button
            onClick={() => {
              localStorage.removeItem('redirectAfterLogin')
              router.push('/dashboard/for-you')
            }}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Exploring
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* 自动跳转提示 */}
          <p className="text-sm text-gray-500 mt-3">
            Redirecting to dashboard in <span className="font-semibold text-blue-600">{countdown}</span> seconds...
          </p>
        </div>
      </div>
    </div>
  )
}
