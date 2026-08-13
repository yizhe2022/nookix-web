'use client'

import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  fcp: number
  lcp: number
  fid: number
  cls: number
  ttfb: number
}

/**
 * 性能监控组件 - 监控和报告页面性能指标
 * @param props - 组件属性
 * @returns 性能监控组件
 */
export default function PerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  })

  useEffect(() => {
    // 只在客户端运行
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'first-contentful-paint':
            metricsRef.current.fcp = entry.startTime
            console.log('FCP:', entry.startTime)
            break
          case 'largest-contentful-paint':
            metricsRef.current.lcp = entry.startTime
            console.log('LCP:', entry.startTime)
            break
          case 'first-input':
            const fidEntry = entry as any
            metricsRef.current.fid = fidEntry.processingStart - fidEntry.startTime
            console.log('FID:', metricsRef.current.fid)
            break
          case 'layout-shift':
            const layoutShiftEntry = entry as any
            if (!layoutShiftEntry.hadRecentInput) {
              metricsRef.current.cls += layoutShiftEntry.value
              console.log('CLS:', metricsRef.current.cls)
            }
            break
        }
      }
    })

    // 观察性能指标
    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })

    // 获取 TTFB
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      metricsRef.current.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
      console.log('TTFB:', metricsRef.current.ttfb)
    }

    // 清理函数
    return () => {
      observer.disconnect()
    }
  }, [])

  // 组件不渲染任何内容
  return null
}

/**
 * 性能监控 Hook
 * @returns 性能指标对象
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      const newMetrics = { ...metrics }

      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'first-contentful-paint':
            newMetrics.fcp = entry.startTime
            break
          case 'largest-contentful-paint':
            newMetrics.lcp = entry.startTime
            break
          case 'first-input':
            const fidEntry = entry as any
            newMetrics.fid = fidEntry.processingStart - fidEntry.startTime
            break
          case 'layout-shift':
            const layoutShiftEntry = entry as any
            if (!layoutShiftEntry.hadRecentInput) {
              newMetrics.cls += layoutShiftEntry.value
            }
            break
        }
      }

      setMetrics(newMetrics)
    })

    observer.observe({ entryTypes: ['first-contentful-paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })

    // 获取 TTFB
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      setMetrics(prev => ({
        ...prev,
        ttfb: navigationEntry.responseStart - navigationEntry.requestStart
      }))
    }

    return () => observer.disconnect()
  }, [metrics])

  return metrics
}

/**
 * 性能报告函数
 * @param metrics - 性能指标
 */
export function reportPerformanceMetrics(metrics: PerformanceMetrics) {
  // 发送到分析服务
  const win = window as any
  if (typeof window !== 'undefined' && win.gtag) {
    win.gtag('event', 'performance_metrics', {
      event_category: 'performance',
      event_label: 'core_web_vitals',
      value: Math.round(metrics.lcp),
      custom_map: {
        fcp: metrics.fcp,
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        ttfb: metrics.ttfb,
      }
    })
  }
}

/**
 * 检查性能是否良好
 * @param metrics - 性能指标
 * @returns 性能状态
 */
export function checkPerformanceStatus(metrics: PerformanceMetrics): {
  isGood: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (metrics.lcp > 2500) {
    issues.push('LCP 过慢 (>2.5s)')
  }

  if (metrics.fid > 100) {
    issues.push('FID 过慢 (>100ms)')
  }

  if (metrics.cls > 0.1) {
    issues.push('CLS 过高 (>0.1)')
  }

  if (metrics.ttfb > 600) {
    issues.push('TTFB 过慢 (>600ms)')
  }

  return {
    isGood: issues.length === 0,
    issues
  }
} 