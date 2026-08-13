/**
 * SimpleToast组件 - 用于显示临时提示消息
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface SimpleToastProps {
  message: string | null
  onClose: () => void
}

export default function SimpleToast({ message, onClose }: SimpleToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setIsVisible(true)
      // 3秒后自动关闭
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // 等待动画完成后调用onClose
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] transition-all duration-300 ${
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    }`}>
      <div className="bg-yellow-400 text-black px-6 py-4 rounded-lg shadow-lg border border-yellow-500 min-w-[300px] max-w-[500px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">
              <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <span className="font-medium text-sm">{message}</span>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="ml-4 text-black hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 