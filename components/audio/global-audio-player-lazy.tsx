'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// 延迟加载 GlobalAudioPlayer，减少初始 JS 包大小
const GlobalAudioPlayer = dynamic(
  () => import('./global-audio-player'),
  {
    ssr: false,
    loading: () => null // 加载时不显示任何内容
  }
)

export default function GlobalAudioPlayerLazy() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    // 策略 1: 等待页面完全加载后再加载音频播放器
    if (document.readyState === 'complete') {
      setShouldLoad(true)
    } else {
      window.addEventListener('load', () => setShouldLoad(true))
    }

    // 策略 2: 或者延迟 3 秒后加载（给首屏内容让路）
    const timer = setTimeout(() => {
      setShouldLoad(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!shouldLoad) {
    return null
  }

  return <GlobalAudioPlayer />
}
