"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { X, BookOpen, Moon, Sun } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createClient } from "@/utils/supabase/client"
import { getAuthorName } from "@/lib/author-utils"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useAuth } from "@/contexts/auth-context"
import PremiumContentLock from "./premium-content-lock"

interface BookReaderProps {
  bookId: string
  bookTitle: string
  bookAuthor: string
  book: any
  isOpen: boolean
  onClose: () => void
}

// 新的 JSON 结构接口
interface Sentence {
  text: string
  startTime: number
  endTime: number
}

interface Paragraph {
  sentences: Sentence[]
}

interface TranscriptSection {
  title?: string
  paragraphs: Paragraph[]
}

interface BookTranscript {
  sections: TranscriptSection[]
}

function InlineMarkdown({ text }: { text: string }) {
  const InlineBlock = ({ children }: { children?: ReactNode }) => (
    <span className="inline">{children}</span>
  )

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        p: ({ children }) => <>{children}</>,
        h1: InlineBlock,
        h2: InlineBlock,
        h3: InlineBlock,
        h4: InlineBlock,
        h5: InlineBlock,
        h6: InlineBlock,
        blockquote: InlineBlock,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        del: ({ children }) => <del className="opacity-75">{children}</del>,
        code: ({ children }) => (
          <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.92em]">
            {children}
          </code>
        ),
        pre: InlineBlock,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </a>
        ),
        ul: InlineBlock,
        ol: InlineBlock,
        li: InlineBlock,
        table: InlineBlock,
        thead: InlineBlock,
        tbody: InlineBlock,
        tr: InlineBlock,
        th: InlineBlock,
        td: InlineBlock,
        br: () => <br />,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

export default function BookReader({ bookId, bookTitle, bookAuthor, book, isOpen, onClose }: BookReaderProps) {
  const [transcript, setTranscript] = useState<BookTranscript | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const sectionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const tocRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set())
  
  // 获取音频播放器上下文
  const { currentTime, seekTo, isPlaying, isUserPremium } = useAudioPlayer()
  
  // 获取用户认证信息
  const { user } = useAuth()
  
  // 检查用户是否是 Premium 会员
  const isPremiumUser = isUserPremium
  
  // 检查书本是否是 Premium 类型
  const isPremiumBook = book?.is_premium === true
  
  // 5 分钟 = 300 秒
  const FREE_PREVIEW_TIME = 300

  // 切换 dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // 点击句子跳转到对应时间
  const handleSentenceClick = (startTime: number) => {
    seekTo(startTime)
  }

  // 判断句子是否应该高亮
  const isSentenceActive = (sentence: Sentence): boolean => {
    return currentTime >= sentence.startTime && currentTime < sentence.endTime
  }

  // 点击目录项滚动到对应章节
  const scrollToSection = (sectionIndex: number) => {
    const element = sectionRefs.current[sectionIndex]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 获取当前激活的章节（基于播放时间）
  const getActiveSectionIndex = (): number => {
    if (!transcript) return -1
    
    for (let i = 0; i < transcript.sections.length; i++) {
      const section = transcript.sections[i]
      for (const paragraph of section.paragraphs) {
        for (const sentence of paragraph.sentences) {
          if (currentTime >= sentence.startTime && currentTime < sentence.endTime) {
            return i
          }
        }
      }
    }
    return -1
  }

  const activeSectionIndex = getActiveSectionIndex()
  
  // 判断是否需要显示 Premium 锁定
  const shouldShowPremiumLock = isPremiumBook && !isPremiumUser
  
  // 找到锁定位置：从第二个 title（section）开始锁定
  const findLockPosition = (): { 
    sectionIndex: number; 
    paragraphIndex: number;
    sentenceIndex: number;
  } | null => {
    if (!transcript || !shouldShowPremiumLock) return null
    
    // 如果有第二个 section，从第二个 section 的开始位置锁定
    if (transcript.sections.length > 1) {
      const secondSection = transcript.sections[1]
      if (secondSection.paragraphs.length > 0 && secondSection.paragraphs[0].sentences.length > 0) {
        // 找到第一个 section 的最后一个段落的最后 2 句话，开始淡出
        const firstSection = transcript.sections[0]
        const lastParagraphIndex = firstSection.paragraphs.length - 1
        const lastParagraph = firstSection.paragraphs[lastParagraphIndex]
        const sentenceCount = lastParagraph.sentences.length
        const fadeStartIndex = Math.max(0, sentenceCount - 2)
        
        return { 
          sectionIndex: 0, 
          paragraphIndex: lastParagraphIndex,
          sentenceIndex: fadeStartIndex
        }
      }
    }
    
    return null
  }
  
  const lockPosition = findLockPosition()

  // 控制 body 滚动
  useEffect(() => {
    if (isOpen) {
      // 阅读器打开时，禁用所有滚动
      document.body.style.overflow = 'hidden'
      // 添加一个 class 来隐藏所有可能的滚动容器
      document.body.classList.add('reader-open')
    } else {
      // 阅读器关闭时，恢复滚动
      document.body.style.overflow = ''
      document.body.classList.remove('reader-open')
    }
    
    // 清理函数：组件卸载时恢复滚动
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('reader-open')
    }
  }, [isOpen])

  // 动态计算目录位置
  useEffect(() => {
    if (!isOpen || !tocRef.current || !contentRef.current) return

    const updateTocPosition = () => {
      if (!tocRef.current || !contentRef.current) return
      const contentRect = contentRef.current.getBoundingClientRect()
      const leftPosition = contentRect.right + 32 // 内容右边 + 32px 间距
      tocRef.current.style.left = `${leftPosition}px`
    }

    updateTocPosition()
    window.addEventListener('resize', updateTocPosition)
    
    return () => {
      window.removeEventListener('resize', updateTocPosition)
    }
  }, [isOpen, transcript])

  // 基础防护：禁用右键、复制、打印
  useEffect(() => {
    if (!isOpen) return

    // 禁用右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // 禁用复制快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C / Cmd+C (复制)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        return false
      }
      // Ctrl+P / Cmd+P (打印)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        return false
      }
      // Ctrl+S / Cmd+S (保存)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        return false
      }
      // Ctrl+A / Cmd+A (全选)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        return false
      }
    }

    // 禁用复制事件
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('copy', handleCopy)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('copy', handleCopy)
    }
  }, [isOpen])

  // 虚拟滚动：使用 Intersection Observer 检测可见区域
  useEffect(() => {
    if (!isOpen || !transcript) return

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSections((prev) => {
          const newVisible = new Set(prev)
          entries.forEach((entry) => {
            const sectionIndex = parseInt(entry.target.getAttribute('data-section-index') || '-1')
            if (sectionIndex >= 0) {
              if (entry.isIntersecting) {
                // 添加当前可见的 section 及其前后各 1 个
                newVisible.add(sectionIndex)
                if (sectionIndex > 0) newVisible.add(sectionIndex - 1)
                if (sectionIndex < (transcript?.sections.length || 0) - 1) newVisible.add(sectionIndex + 1)
              } else {
                // 移除不可见的 section（但保留前后 1 个作为缓冲）
                const shouldKeep = Array.from(newVisible).some(visibleIdx => 
                  Math.abs(visibleIdx - sectionIndex) <= 1
                )
                if (!shouldKeep) {
                  newVisible.delete(sectionIndex)
                }
              }
            }
          })
          return newVisible
        })
      },
      {
        root: null,
        rootMargin: '200px', // 提前 200px 加载
        threshold: 0.01
      }
    )

    // 观察所有 section
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => {
      observer.disconnect()
    }
  }, [isOpen, transcript])

  useEffect(() => {
    if (!isOpen || !bookId) return

    const fetchTranscript = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("books")
          .select("book_transcript")
          .eq("id", bookId)
          .single()

        if (error) {
          console.warn("Transcript fetch error:", error.message)
          setTranscript(null)
          return
        }

        if (data?.book_transcript) {
          try {
            const parsedTranscript = typeof data.book_transcript === 'string' 
              ? JSON.parse(data.book_transcript) 
              : data.book_transcript
            
            // 验证新的 JSON 结构
            if (parsedTranscript && parsedTranscript.sections && Array.isArray(parsedTranscript.sections)) {
              setTranscript(parsedTranscript as BookTranscript)
              // 初始化虚拟滚动：显示前 3 个 sections
              setVisibleSections(new Set([0, 1, 2]))
            } else {
              console.warn("Invalid transcript structure:", parsedTranscript)
              setTranscript(null)
            }
          } catch (parseError) {
            console.warn("Failed to parse transcript:", parseError)
            setTranscript(null)
          }
        } else {
          setTranscript(null)
        }
      } catch (error: any) {
        console.warn("Failed to fetch transcript:", error?.message || "Unknown error")
        setTranscript(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTranscript()
  }, [bookId, isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* 自定义滚动条样式 + 隐藏其他滚动条 */}
      <style jsx global>{`
        /* 当阅读器打开时，隐藏所有其他滚动条 */
        body.reader-open,
        body.reader-open * {
          overflow: hidden !important;
        }
        
        /* 但允许阅读器内容区域滚动 */
        body.reader-open .reader-content-area {
          overflow-y: auto !important;
        }
        
        /* 允许目录滚动 */
        body.reader-open .reader-toc {
          overflow-y: auto !important;
        }
        
        /* 基础防护：禁止文本选择和复制 */
        .reader-content-protected {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#374151' : '#d1d5db'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#4b5563' : '#9ca3af'};
        }
        
        /* 目录滚动条样式 */
        .reader-toc::-webkit-scrollbar {
          width: 6px;
        }
        .reader-toc::-webkit-scrollbar-track {
          background: transparent;
        }
        .reader-toc::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#374151' : '#d1d5db'};
          border-radius: 3px;
        }
        .reader-toc::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#4b5563' : '#9ca3af'};
        }
      `}</style>
      
      <div 
        className="fixed inset-0 lg:left-[240px] z-40 flex flex-col transition-colors duration-200 custom-scrollbar"
        style={{ 
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          scrollbarWidth: 'thin', // Firefox
          scrollbarColor: isDarkMode ? '#374151 #1a1a1a' : '#d1d5db #ffffff', // Firefox
          overflow: 'hidden' // 禁止容器本身滚动
        }}
      >
      {/* 顶部栏 */}
      <div 
        className="border-b flex-shrink-0 transition-colors duration-200"
        style={{ 
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderColor: isDarkMode ? '#1f2937' : '#e5e7eb'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：书名和作者 */}
            <div className="flex-1 min-w-0">
              <h1 
                className="text-lg font-bold truncate transition-colors duration-200"
                style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
              >
                {bookTitle}
              </h1>
              <p 
                className="text-sm truncate transition-colors duration-200"
                style={{ color: isDarkMode ? '#9ca3af' : '#4b5563' }}
              >
                by {bookAuthor}
              </p>
            </div>

            {/* 右侧：Dark Mode 切换按钮 + 关闭按钮 */}
            <div className="flex items-center gap-2 ml-4">
              {/* Dark Mode 切换按钮 */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ 
                  color: isDarkMode ? '#9ca3af' : '#4b5563'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#1f2937' : '#f3f4f6'
                  e.currentTarget.style.color = isDarkMode ? '#e5e7eb' : '#111827'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#4b5563'
                }}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ 
                  color: isDarkMode ? '#9ca3af' : '#4b5563'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? '#1f2937' : '#f3f4f6'
                  e.currentTarget.style.color = isDarkMode ? '#e5e7eb' : '#111827'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#4b5563'
                }}
                aria-label="Close reader"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 - 居中布局，右侧显示目录 */}
      <div className="flex-1 pb-32 overflow-y-auto custom-scrollbar reader-content-area" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? '#374151 #1a1a1a' : '#d1d5db #ffffff'
      }}>
        {isLoading ? (
          // 加载状态
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div 
                className="inline-block w-8 h-8 border-4 rounded-full animate-spin mb-4"
                style={{
                  borderColor: isDarkMode ? '#374151' : '#d1d5db',
                  borderTopColor: isDarkMode ? '#3b82f6' : '#2563eb'
                }}
              ></div>
              <p style={{ color: isDarkMode ? '#9ca3af' : '#4b5563' }}>
                Loading transcript...
              </p>
            </div>
          </div>
        ) : transcript && transcript.sections && transcript.sections.length > 0 ? (
          // 显示 transcript 内容 + 右侧目录
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-8" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
            {/* 主内容区域 - 添加防复制保护 */}
            <div ref={contentRef} className="flex-1 max-w-[800px] mx-auto reader-content-protected">
              {transcript.sections.map((section, sectionIndex) => {
                // 检查这个 section 是否应该完全隐藏（Premium 锁定）
                const shouldHideSection = lockPosition && sectionIndex > lockPosition.sectionIndex
                
                if (shouldHideSection) {
                  return null // 完全隐藏后续的 section
                }
                
                // 虚拟滚动：检查是否应该渲染此 section
                const isVisible = visibleSections.has(sectionIndex)
                
                return (
                  <div key={sectionIndex}>
                    <div 
                      className="mb-10"
                      ref={(el) => { sectionRefs.current[sectionIndex] = el }}
                      data-section-index={sectionIndex}
                      style={{ minHeight: isVisible ? 'auto' : '400px' }} // 占位高度
                    >
                      {/* Section Title - 始终显示 */}
                      {section.title && (
                        <h3 
                          className="text-2xl font-bold mb-6 transition-colors duration-200"
                          style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
                        >
                          <InlineMarkdown text={section.title} />
                        </h3>
                      )}
                      
                      {/* Paragraphs - 只在可见时渲染 */}
                      {isVisible && section.paragraphs.map((paragraph, paragraphIndex) => {
                        // 检查这个段落是否应该完全隐藏
                        const shouldHideParagraph = lockPosition && 
                          sectionIndex === lockPosition.sectionIndex && 
                          paragraphIndex > lockPosition.paragraphIndex
                        
                        if (shouldHideParagraph) {
                          return null // 完全隐藏后续的段落
                        }
                        
                        return (
                          <div key={paragraphIndex} className="mb-6">
                            <p className="m-0 text-base leading-relaxed" style={{ textIndent: 0 }}>
                              {/* Sentences with highlighting and fade effect */}
                              {paragraph.sentences.map((sentence, sentenceIndex) => {
                                const isActive = isSentenceActive(sentence)
                                const sentenceText = sentence.text.trimStart()
                                
                                // 检查是否是淡出区域的句子
                                const isFadingSentence = lockPosition && 
                                  sectionIndex === lockPosition.sectionIndex && 
                                  paragraphIndex === lockPosition.paragraphIndex && 
                                  sentenceIndex >= lockPosition.sentenceIndex
                                
                                // 计算淡出程度（0-2 句话，opacity 从 1.0 到 0.3）
                                let opacity = 1.0
                                if (isFadingSentence && lockPosition) {
                                  const fadeIndex = sentenceIndex - lockPosition.sentenceIndex
                                  opacity = Math.max(0.3, 1.0 - (fadeIndex * 0.35))
                                }
                                
                                return (
                                  <span
                                    key={sentenceIndex}
                                    onClick={() => !isFadingSentence && handleSentenceClick(sentence.startTime)}
                                    className="cursor-pointer inline"
                                    style={{
                                      color: isActive 
                                        ? (isDarkMode ? '#60a5fa' : '#2563eb')
                                        : (isDarkMode ? '#d1d5db' : '#1f2937'),
                                      backgroundColor: isActive 
                                        ? (isDarkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)')
                                        : 'transparent',
                                      padding: '2px 4px 2px 0',
                                      borderRadius: '4px',
                                      marginRight: '4px',
                                      transition: 'color 0.2s ease, background-color 0.2s ease, opacity 0.3s ease',
                                      opacity: opacity,
                                      pointerEvents: isFadingSentence ? 'none' : 'auto'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isActive && !isFadingSentence) {
                                        e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(243, 244, 246, 0.8)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isActive && !isFadingSentence) {
                                        e.currentTarget.style.backgroundColor = 'transparent'
                                      }
                                    }}
                                  >
                                    <InlineMarkdown text={sentenceText} />
                                  </span>
                                )
                              })}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* 在锁定位置的 section 后显示升级提示卡片 */}
                    {lockPosition && sectionIndex === lockPosition.sectionIndex && (
                      <PremiumContentLock isDarkMode={isDarkMode} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* 右侧目录导航 - 固定定位，仅在 PC 端显示 */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div 
                ref={tocRef}
                className="fixed rounded-lg p-4 transition-colors duration-200 reader-toc"
                style={{ 
                  backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 1)',
                  border: `1px solid ${isDarkMode ? '#1f2937' : '#e5e7eb'}`,
                  top: '100px',
                  width: '256px',
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: isDarkMode ? '#374151 transparent' : '#d1d5db transparent'
                }}
              >
                <h4 
                  className="text-xs font-semibold uppercase tracking-wider mb-4 transition-colors duration-200"
                  style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                >
                  Table of Contents
                </h4>
                <nav className="space-y-1">
                  {transcript.sections.map((section, index) => {
                    if (!section.title) return null
                    const isActive = activeSectionIndex === index
                    
                    return (
                      <button
                        key={index}
                        onClick={() => scrollToSection(index)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200"
                        style={{
                          color: isActive 
                            ? (isDarkMode ? '#60a5fa' : '#2563eb')
                            : (isDarkMode ? '#d1d5db' : '#374151'),
                          backgroundColor: isActive 
                            ? (isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.05)')
                            : 'transparent',
                          fontWeight: isActive ? 600 : 400
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(243, 244, 246, 1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        {section.title}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        ) : (
          // 无 transcript 可用
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center max-w-md px-6">
              <div 
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-colors duration-200"
                style={{ backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}
              >
                <BookOpen 
                  className="w-10 h-10 transition-colors duration-200"
                  style={{ color: isDarkMode ? '#4b5563' : '#9ca3af' }}
                />
              </div>
              <h3 
                className="text-xl font-semibold mb-2 transition-colors duration-200"
                style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}
              >
                No summary available
              </h3>
              <p 
                className="transition-colors duration-200"
                style={{ color: isDarkMode ? '#9ca3af' : '#4b5563' }}
              >
                The summary for this book hasn't been uploaded yet. Check back later!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
