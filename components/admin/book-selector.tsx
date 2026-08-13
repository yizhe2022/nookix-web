"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Search } from "lucide-react"
import Image from "next/image"
import pb from "@/lib/pocketbase"
import { getAuthorName } from "@/lib/author-utils"

interface Book {
  id: string
  title: string
  author: any  // 关系字段，可能是 ID 数组或扩展后的对象数组
  expand?: {
    author?: Array<{ id: string; name: string }>
  }
  cover_image: string
}

/**
 * 书本选择器工具
 * 帮助在series content中插入书本引用
 */
export default function BookSelector() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const result = await pb.collection('books').getList(1, 100, {
          sort: '-created',
          expand: 'author',  // 扩展作者字段
        })

        const transformedBooks = result.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          author: item,  // 保留完整对象以便使用 getAuthorName
          expand: item.expand,
          cover_image: item.cover_image ? pb.files.getURL(item, item.cover_image) : "/placeholder.svg",
        }))

        setBooks(transformedBooks)
        setFilteredBooks(transformedBooks)
      } catch (error) {
        console.error('Failed to fetch books:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  useEffect(() => {
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAuthorName(book.author).toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredBooks(filtered)
  }, [searchTerm, books])

  const copyBookReference = async (bookId: string) => {
    const reference = `[book:${bookId}]`
    try {
      await navigator.clipboard.writeText(reference)
      setCopiedId(bookId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>书本选择器</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>书本选择器</CardTitle>
        <p className="text-sm text-gray-600">
          选择书本来获取引用代码，然后复制到series的content字段中
        </p>
      </CardHeader>
      <CardContent>
        {/* 搜索框 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索书本标题或作者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 使用说明 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">使用方法：</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. 在下方找到要关联的书本</li>
            <li>2. 点击"复制引用"按钮</li>
            <li>3. 在PocketBase的series content字段中粘贴引用代码</li>
            <li>4. 引用格式: <code className="bg-blue-100 px-1 rounded">[book:书本ID]</code></li>
          </ol>
        </div>

        {/* 书本列表 */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredBooks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm ? "没有找到匹配的书本" : "没有可用的书本"}
            </p>
          ) : (
            filteredBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50"
              >
                <Image
                  src={book.cover_image}
                  alt={book.title}
                  width={48}
                  height={72}
                  className="object-cover rounded shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {book.title}
                  </h4>
                  <p className="text-sm text-gray-600 truncate">
                    {getAuthorName(book.author)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ID: {book.id}
                  </p>
                </div>
                <Button
                  variant={copiedId === book.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => copyBookReference(book.id)}
                  className="flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>
                    {copiedId === book.id ? "已复制!" : "复制引用"}
                  </span>
                </Button>
              </div>
            ))
          )}
        </div>

        {/* 示例 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Content字段示例：</h3>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
            {`<p>欢迎来到个人发展系列...</p>

[book:u7km232a3e17zgy]

<h2>深入学习</h2>
<p>继续探索更多内容...</p>

[book:另一个书本ID]`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
} 