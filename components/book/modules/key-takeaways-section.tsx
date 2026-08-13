'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface KeyTakeawaysSectionProps {
  content: any // JSON 数据
}

export default function KeyTakeawaysSection({ 
  content
}: KeyTakeawaysSectionProps) {
  if (!content) return null

  // 解析 JSON 内容
  const parseContent = () => {
    if (typeof content === 'string') {
      try {
        return JSON.parse(content)
      } catch {
        return content
      }
    }
    return content
  }

  const parsedContent = parseContent()

  // 如果是数组格式
  if (Array.isArray(parsedContent)) {
    return (
      <Card id="key-takeaways" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
        <CardHeader className="px-0 pt-0 pb-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
            Key Takeaways
          </h2>
        </CardHeader>
        <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
          <div className="space-y-4">
            {/* 渲染所有内容 */}
            {parsedContent.map((item: any, index: number) => {
              const title = typeof item === 'object' ? (item.title || '') : ''
              const text = typeof item === 'string' 
                ? item 
                : (item.explanation || item.content || item.text || '')
              
              return (
                <div 
                  key={index} 
                  className="flex gap-3 items-start"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    {title && (
                      <h3 className="font-semibold text-gray-900 mb-1 text-base">{title}</h3>
                    )}
                    <p className="text-gray-700 leading-relaxed text-base">{text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 如果是字符串格式
  return (
    <Card id="key-takeaways" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
      <CardHeader className="px-0 pt-0 pb-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          Key Takeaways
        </h2>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
        {/* 渲染完整内容 */}
        <div className="prose max-w-none text-gray-700 leading-relaxed text-base">
          {typeof parsedContent === 'string' ? parsedContent : ''}
        </div>
      </CardContent>
    </Card>
  )
}
