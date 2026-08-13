'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useAudioPlayer } from '@/contexts/audio-player-context'

interface TimelineItem {
  time: number
  title: string
  description?: string
}

interface AudioPlayerStickyProps {
  audioUrl?: string
  timeline?: TimelineItem[]
  hosts?: string[]
  duration?: number
}

export default function AudioPlayerSticky({ 
  audioUrl, 
  timeline = [], 
  hosts = [],
  duration: totalDuration = 0
}: AudioPlayerStickyProps) {
  const [isSticky, setIsSticky] = useState(false)
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(0)
  const playerRef = useRef<HTMLDivElement>(null)
  
  const { 
    isPlaying, 
    togglePlay, 
    currentTime, 
    duration,
    seekTo 
  } = useAudioPlayer()

  // 监听滚动，判断是否需要悬浮
  useEffect(() => {
    const handleScroll = () => {
      if (playerRef.current) {
        const rect = playerRef.current.getBoundingClientRect()
        setIsSticky(rect.top <= 80)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 根据当前播放时间更新时间轴高亮
  useEffect(() => {
    if (timeline.length === 0) return
    
    const currentIndex = timeline.findIndex((item, index) => {
      const nextItem = timeline[index + 1]
      return currentTime >= item.time && (!nextItem || currentTime < nextItem.time)
    })
    
    if (currentIndex !== -1) {
      setCurrentTimelineIndex(currentIndex)
    }
  }, [currentTime, timeline])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimelineClick = (time: number) => {
    seekTo(time)
  }

  const handleSkip = (seconds: number) => {
    seekTo(Math.max(0, Math.min(currentTime + seconds, duration)))
  }

  if (!audioUrl && timeline.length === 0) return null

  return (
    <div ref={playerRef} className="relative">
      <Card className={`transition-all duration-300 ${
        isSticky 
          ? 'fixed top-20 right-6 w-80 z-40 shadow-2xl' 
          : 'w-full shadow-none border-0 bg-transparent'
      }`}>
        {/* 播放器控制区 */}
        <div className="p-4 bg-white rounded-t-xl">
          {hosts.length > 0 && (
            <div className="mb-3 text-sm text-gray-600">
              <span className="font-medium">Narrator:</span> {hosts.join(' & ')}
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => handleSkip(-15)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={togglePlay}
              className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" fill="white" />
              ) : (
                <Play className="w-6 h-6 text-white" fill="white" />
              )}
            </button>
            
            <button
              onClick={() => handleSkip(15)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            <div className="flex-1 text-right text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(duration || totalDuration)}
            </div>
          </div>

          <Slider
            value={[currentTime]}
            max={duration || totalDuration || 100}
            step={1}
            onValueChange={([value]) => seekTo(value)}
            className="w-full"
          />
        </div>

        {/* 时间轴 */}
        {timeline.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-b-xl max-h-96 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2">
              {timeline.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleTimelineClick(item.time)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    currentTimelineIndex === index
                      ? 'bg-blue-100 border-l-4 border-blue-600'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-gray-500 flex-shrink-0 mt-0.5">
                      {formatTime(item.time)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
