import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { getFromCache, setToCache, CACHE_KEYS, CACHE_DURATION } from "@/lib/cache-utils"

export function usePageModules(pageType: "home" | "explore") {
  const [modules, setModules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchModules()
  }, [pageType])

  const fetchModules = async (skipCache = false) => {
    try {
      setIsLoading(true)
      setError(null)

      // 确定缓存键
      const cacheKey = pageType === "home" ? CACHE_KEYS.FOR_YOU_MODULES : CACHE_KEYS.EXPLORE_MODULES

      // 尝试从缓存获取
      if (!skipCache) {
        const cached = getFromCache<any[]>(cacheKey)
        if (cached) {
          console.log(`[usePageModules] Using cached data for ${pageType}`)
          setModules(cached)
          setIsLoading(false)
          
          // 后台静默刷新（5分钟后）
          const cacheAge = Date.now() - (JSON.parse(sessionStorage.getItem(cacheKey) || '{}').timestamp || 0)
          if (cacheAge > 5 * 60 * 1000) {
            console.log(`[usePageModules] Cache is stale, refreshing in background for ${pageType}`)
            fetchModulesFromServer(cacheKey, true)
          }
          return
        }
      }

      // 缓存未命中，从服务器获取
      await fetchModulesFromServer(cacheKey, false)
    } catch (err) {
      console.error("Failed to fetch modules:", err)
      setError("Failed to load content. Please try again later.")
      setIsLoading(false)
    }
  }

  const fetchModulesFromServer = async (cacheKey: string, silent: boolean) => {
    try {
      if (!silent) setIsLoading(true)
      
      const supabase = createClient()

      // Step 1: 获取页面的模块
      const { data: modulesData, error: modulesError } = await supabase
        .from("app_page_modules")
        .select("*")
        .eq("page_type", pageType)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(50)

      if (modulesError) throw modulesError
      if (!modulesData || modulesData.length === 0) {
        setModules([])
        if (!silent) setIsLoading(false)
        return
      }

      // Step 2: 批量加载关联数据
      const modulesWithRelations = await loadModuleRelations(modulesData)
      
      // 存入缓存（30分钟）
      setToCache(cacheKey, modulesWithRelations, CACHE_DURATION.MEDIUM)
      console.log(`[usePageModules] Cached data for ${pageType}`)
      
      setModules(modulesWithRelations)
      if (!silent) setIsLoading(false)
    } catch (err) {
      console.error("Failed to fetch modules from server:", err)
      if (!silent) {
        setError("Failed to load content. Please try again later.")
        setIsLoading(false)
      }
    }
  }

  const loadModuleRelations = async (modules: any[]) => {
    const supabase = createClient()

    // 分离书本模块和 collection 模块
    const bookModuleIds = modules
      .filter((m) => m.module_type?.includes("books") || m.module_type === "hero")
      .map((m) => m.id)

    const collectionModuleIds = modules
      .filter((m) => m.module_type?.includes("collections"))
      .map((m) => m.id)

    // 批量查询书本
    let booksByModule = new Map()
    if (bookModuleIds.length > 0) {
      const { data: moduleBooksData, error: booksError } = await supabase
        .from("app_page_modules_books")
        .select(
          `
          module_id,
          book_id,
          sort_order,
          books!inner (
            id, title, authors, cover_image, rating, ratings_count, status,
            audio_duration, one_liner, description, slug
          )
        `
        )
        .in("module_id", bookModuleIds)
        .eq("books.status", "published")
        .order("sort_order", { ascending: true })

      if (!booksError && moduleBooksData) {
        for (const mb of moduleBooksData) {
          if (!booksByModule.has(mb.module_id)) {
            booksByModule.set(mb.module_id, [])
          }
          booksByModule.get(mb.module_id).push(mb.books)
        }
      }
    }

    // 批量查询 collections
    let collectionsByModule = new Map()
    if (collectionModuleIds.length > 0) {
      const { data: moduleCollectionsData, error: collectionsError } = await supabase
        .from("app_page_modules_collections")
        .select(
          `
          module_id,
          collection_id,
          sort_order,
          collections!inner (
            id, title, slug, is_enabled, collection_cover_url
          )
        `
        )
        .in("module_id", collectionModuleIds)
        .eq("collections.is_enabled", true)
        .order("sort_order", { ascending: true })

      if (!collectionsError && moduleCollectionsData) {
        // 获取所有 collection IDs 以批量查询书本数量
        const collectionIds = [...new Set(moduleCollectionsData.map((mc) => mc.collection_id))]

        // 批量查询书本数量
        const { data: bookCountsData } = await supabase
          .from("collection_books")
          .select("collection_id")
          .in("collection_id", collectionIds)

        const bookCountsByCollection = new Map()
        if (bookCountsData) {
          for (const cb of bookCountsData) {
            const currentCount = bookCountsByCollection.get(cb.collection_id) || 0
            bookCountsByCollection.set(cb.collection_id, currentCount + 1)
          }
        }

        // 组装 collections 数据
        for (const mc of moduleCollectionsData) {
          if (!collectionsByModule.has(mc.module_id)) {
            collectionsByModule.set(mc.module_id, [])
          }
          const collectionWithCount = {
            ...mc.collections,
            book_count: bookCountsByCollection.get(mc.collection_id) || 0,
          }
          collectionsByModule.get(mc.module_id).push(collectionWithCount)
        }
      }
    }

    // 组装最终数据
    return modules.map((module) => ({
      ...module,
      books: booksByModule.get(module.id) || [],
      collections: collectionsByModule.get(module.id) || [],
    }))
  }

  return {
    modules,
    isLoading,
    error,
    refetch: () => fetchModules(true), // 强制跳过缓存
  }
}
