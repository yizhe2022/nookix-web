'use client'

import { useState } from 'react'
import { Lock, ChevronDown, ChevronUp, Play, Pause } from 'lucide-react'
import { formatTimestamp } from '@/lib/audio-playback-utils'

interface TimelineItem {
  timestamp: number
  title: string
  content: string
}

interface AudioTimelineProps {
  timeline: TimelineItem[]
  bookId: string
  isAuthenticated?: boolean
  isPremium?: boolean
  isBookPremium?: boolean
  playbackTime?: number
  hasActivePlaybackSession?: boolean
  isAudioPlaying?: boolean
  onUnlockClick?: () => void
  onSectionPlay?: (startTime: number, index: number) => void
  onTogglePlay?: () => void
}

/**
 * AudioTimeline 组件
 * 显示音频的时间轴，包含章节时间戳、标题和可折叠的正文内容
 * 根据用户状态显示不同的锁定状态
 */
export default function AudioTimeline({
  timeline,
  bookId,
  isAuthenticated = false,
  isPremium = false,
  isBookPremium = false,
  playbackTime = 0,
  hasActivePlaybackSession = false,
  isAudioPlaying = false,
  onUnlockClick,
  onSectionPlay,
  onTogglePlay
}: AudioTimelineProps) {
  // 跟踪每个条目的展开/折叠状态
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  // 如果没有 timeline 数据，不渲染
  if (!timeline || timeline.length === 0) {
    return null
  }

  // 切换条目的展开/折叠状态
  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
        Timeline
      </h3>
      
      <div className="space-y-0">
        {timeline.map((item, index) => {
          const sectionStartTime = index === 0 ? 0 : item.timestamp
          const nextSectionStartTime = timeline[index + 1]?.timestamp
          const isCurrentSection = hasActivePlaybackSession && playbackTime >= sectionStartTime && (
            typeof nextSectionStartTime !== 'number' || playbackTime < nextSectionStartTime
          )
          const isSectionPlaying = isCurrentSection && isAudioPlaying
          const canPlaySection = !isBookPremium || index === 0 || isPremium
          const isLocked = !canPlaySection
          const isExpanded = expandedItems.has(index)
          
          return (
            <div
              key={`${bookId}-timeline-${index}`}
              className={`${
                index !== timeline.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* 标题行 */}
              <div className="flex items-center justify-between py-3">
                {/* 左侧：时间戳、标题和展开按钮 */}
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-500 w-12 md:w-14 flex-shrink-0">
                    {formatTimestamp(sectionStartTime)}
                  </span>
                  
                  <button
                    onClick={() => toggleExpand(index)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left hover:text-blue-600 transition-colors"
                  >
                    <span className="text-sm md:text-base font-medium text-gray-900 truncate">
                      {item.title}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="ml-2 flex flex-shrink-0 items-center">
                  {isLocked ? (
                    <button
                      type="button"
                      onClick={onUnlockClick}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      aria-label={isAuthenticated ? 'Upgrade to unlock this section' : 'Sign in to unlock this section'}
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (isCurrentSection && onTogglePlay) {
                          onTogglePlay()
                          return
                        }
                        onSectionPlay?.(sectionStartTime, index)
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                      aria-label={`${isSectionPlaying ? 'Pause' : 'Play'} ${item.title} from ${formatTimestamp(sectionStartTime)}`}
                    >
                      {isSectionPlaying ? (
                        <Pause className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* 可折叠的正文内容 */}
              {isExpanded && item.content && (
                <div className="pb-3 pl-16 md:pl-20 pr-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
