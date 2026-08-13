"use client"

import Link from "next/link"
import { Headphones } from "lucide-react"
import BookCardWeb from "./book-card-web"
import CollectionCardWeb from "./collection-card-web"
import { formatDurationMinutes, formatRatingsCount } from "@/lib/format-utils"

interface ModuleRendererProps {
  module: {
    id: string
    module_type: string
    title: string
    books?: any[]
    collections?: any[]
  }
}

export default function ModuleRenderer({ module }: ModuleRendererProps) {
  const books = module.books || []
  const collections = module.collections || []

  // Hero 模块 - 纯白色卡片设计，移除边框
  if (module.module_type === "hero" && books.length > 0) {
    const heroBook = books[0]
    return (
      <div className="mb-12 lg:mb-20">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-6 lg:gap-8 p-6 lg:p-8">
            {/* 左侧：书本信息 */}
            <div className="space-y-4 flex flex-col justify-center min-w-0">
              {/* 标签 - 黄橙色系营销感，更舒展 */}
              <div className="inline-block self-start">
                <span className="px-4 py-1.5 bg-yellow-50 text-orange-600 text-sm font-semibold rounded-full border border-yellow-200">
                  Today's Pick
                </span>
              </div>

              {/* 书名 */}
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                <Link
                  href={`/dashboard/book/${heroBook.slug}`}
                  className="text-gray-900 transition-colors hover:text-blue-600"
                >
                  {heroBook.title}
                </Link>
              </h2>

              {/* 作者 */}
              <p className="text-lg text-gray-600">{heroBook.authors}</p>

              {/* 简介 */}
              {heroBook.one_liner && (
                <p className="text-base text-gray-500 leading-relaxed line-clamp-3 lg:line-clamp-none">
                  {heroBook.one_liner}
                </p>
              )}

              {/* 操作按钮和评分 */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href={`/dashboard/book/${heroBook.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0"
                >
                  <Headphones className="w-5 h-5" />
                  <span className="whitespace-nowrap">Start Listening</span>
                  {heroBook.audio_duration > 0 && (
                    <>
                      <span>·</span>
                      <span className="whitespace-nowrap">{formatDurationMinutes(heroBook.audio_duration)}</span>
                    </>
                  )}
                </a>
                {heroBook.rating > 0 && (
                  <div className="flex items-center gap-2 text-gray-700 flex-shrink-0">
                    <span className="text-yellow-400 text-lg">★</span>
                    <span className="font-semibold text-lg">{heroBook.rating.toFixed(1)}</span>
                    {heroBook.ratings_count > 0 && (
                      <span className="text-gray-500 text-sm whitespace-nowrap">({formatRatingsCount(heroBook.ratings_count)} ratings)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：书本封面 */}
            <div className="flex justify-center lg:justify-end items-center lg:self-center">
              <div className="w-48 h-72 lg:w-44 lg:h-64 relative overflow-hidden rounded-xl shadow-lg bg-slate-100">
                <img
                  src={
                    heroBook.cover_image?.startsWith("http")
                      ? heroBook.cover_image
                      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${heroBook.cover_image}`
                  }
                  alt={heroBook.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 横向滚动书本
  if (module.module_type === "horizontal_books" && books.length > 0) {
    return (
      <div className="mb-12 lg:mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{module.title}</h2>
        
        {/* 移动端：2 列网格 */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:hidden">
          {books.map((book, index) => (
            <BookCardWeb key={book.id} book={book} priority={index < 2} />
          ))}
        </div>

        {/* 桌面端：6 列网格 */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-5">
          {books.map((book, index) => (
            <BookCardWeb key={book.id} book={book} priority={index < 6} />
          ))}
        </div>
      </div>
    )
  }

  // Collections 模块 - 固定网格布局，一排显示
  if (module.module_type === "horizontal_collections" && collections.length > 0) {
    return (
      <div className="mb-12 lg:mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{module.title}</h2>
        
        {/* 移动端：1 列网格 */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:hidden">
          {collections.map((collection) => (
            <CollectionCardWeb key={collection.id} collection={collection} />
          ))}
        </div>

        {/* 桌面端：4 列网格（一排最多 4 个 collection）*/}
        <div className="hidden lg:grid lg:grid-cols-4 gap-5">
          {collections.map((collection) => (
            <CollectionCardWeb key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    )
  }

  // 网格布局书本 - 改为 6 列固定布局
  if (module.module_type === "grid_books" && books.length > 0) {
    return (
      <div className="mb-12 lg:mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{module.title}</h2>
        
        {/* 移动端：2 列网格 */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:hidden">
          {books.map((book, index) => (
            <BookCardWeb key={book.id} book={book} priority={index < 2} />
          ))}
        </div>

        {/* 桌面端：6 列网格 */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-5">
          {books.map((book, index) => (
            <BookCardWeb key={book.id} book={book} priority={index < 6} />
          ))}
        </div>
      </div>
    )
  }

  // 列表布局书本 - 改为 2 列网格布局
  if (module.module_type === "list_books" && books.length > 0) {
    return (
      <div className="mb-12 lg:mb-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{module.title}</h2>
        
        {/* 移动端：1 列 */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
          {books.map((book) => (
            <a
              key={book.id}
              href={`/dashboard/book/${book.slug}`}
              className="flex gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              {/* 书本封面 - 2:3 比例 */}
              <div className="flex-shrink-0 w-20 h-30 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={
                    book.cover_image?.startsWith("http")
                      ? book.cover_image
                      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover_image}`
                  }
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 书本信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{book.authors}</p>
                {book.one_liner && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {book.one_liner}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {book.audio_duration && (
                    <span>{formatDurationMinutes(book.audio_duration)}</span>
                  )}
                  {book.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span>{book.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 桌面端：2 列网格 */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-5">
          {books.map((book) => (
            <a
              key={book.id}
              href={`/dashboard/book/${book.slug}`}
              className="flex gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
            >
              {/* 书本封面 - 2:3 比例 */}
              <div className="flex-shrink-0 w-20 h-30 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={
                    book.cover_image?.startsWith("http")
                      ? book.cover_image
                      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover_image}`
                  }
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 书本信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{book.authors}</p>
                {book.one_liner && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {book.one_liner}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {book.audio_duration && (
                    <span>{formatDurationMinutes(book.audio_duration)}</span>
                  )}
                  {book.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span>{book.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return null
}
