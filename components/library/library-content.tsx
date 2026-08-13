// 路径: Nookix-web/components/library/library-content.tsx

"use client"

import React, { useState, useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, X, ChevronRight } from "lucide-react";
import BookGrid from "@/components/library/book-grid";
import Pagination from "@/components/library/pagination";
import type { LibraryBook } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserLibrary, getReadingHistory, removeFromLibrary, deleteReadingHistory } from "@/lib/library-service";
import { useAudioPlayer } from "@/contexts/audio-player-context";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/utils/supabase/client";
import { getFromCache, setToCache, clearCache, CACHE_KEYS, CACHE_DURATION } from "@/lib/cache-utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 6. 将每页最多展示记录数修改为 50
const ITEMS_PER_PAGE = 50;

const LibrarySkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: 15 }).map((_, index) => (
            <div key={index} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
            </div>
        ))}
    </div>
);

const LibraryContent = forwardRef(function LibraryContent(props, ref) {
    const { toast } = useToast();
    const router = useRouter();
    const { currentBook, currentTime } = useAudioPlayer();
    const { user, isLoading: isAuthLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [isRecentLoading, setIsRecentLoading] = useState(false);
    const [myLibraryBooks, setMyLibraryBooks] = useState<LibraryBook[]>([]);
    const [recentBooks, setRecentBooks] = useState<LibraryBook[]>([]);
    const [activeTab, setActiveTab] = useState("library");
    const [libraryPage, setLibraryPage] = useState(1);
    const [recentPage, setRecentPage] = useState(1);
    
    // 删除确认弹窗状态
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);

    // 获取访问令牌
    const getAccessToken = async (): Promise<string | null> => {
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            return session?.access_token || null
        } catch (error) {
            console.error('[LibraryContent] Failed to get access token:', error)
            return null
        }
    }

    // 1. 将 fetchLibraryBooks 提升到 useEffect 之外
    const fetchLibraryBooks = async (silent = false) => {
        if (!silent) setIsLoading(true);
        if (!user) {
            console.log('[LibraryContent] No user, skipping fetch')
            setIsLoading(false);
            return;
        }

        try {
            // 尝试从缓存获取（仅在非静默模式下）
            if (!silent) {
                const cached = getFromCache<LibraryBook[]>(CACHE_KEYS.LIBRARY_BOOKS)
                if (cached && cached.every(book => book.added_at || book.created_at)) {
                    console.log('[LibraryContent] Using cached library data')
                    setMyLibraryBooks(cached)
                    setIsLoading(false)
                    
                    // 后台静默刷新（如果缓存超过2分钟）
                    const cacheAge = Date.now() - (JSON.parse(sessionStorage.getItem(CACHE_KEYS.LIBRARY_BOOKS) || '{}').timestamp || 0)
                    if (cacheAge > 2 * 60 * 1000) {
                        console.log('[LibraryContent] Cache is stale, refreshing in background')
                        fetchLibraryBooksFromServer(true)
                    }
                    return
                }
            }

            // 缓存未命中或强制刷新，从服务器获取
            await fetchLibraryBooksFromServer(silent)
        } catch (error) {
            console.error("[LibraryContent] Failed to fetch library books:", error);
            if (!silent) {
                toast({ 
                    title: "Error", 
                    description: "Could not load your library.", 
                    variant: "destructive" 
                })
            }
            if (!silent) setIsLoading(false);
        }
    };

    const fetchLibraryBooksFromServer = async (silent: boolean) => {
        try {
            console.log('[LibraryContent] Fetching library from server for user:', user?.id)
            const accessToken = await getAccessToken()
            if (!accessToken) {
                console.error('[LibraryContent] No access token available')
                throw new Error('No access token')
            }

            console.log('[LibraryContent] Calling getUserLibrary...')
            const result = await getUserLibrary(user!.id, accessToken)
            console.log('[LibraryContent] getUserLibrary result:', result)
            
            if (result.success) {
                console.log('[LibraryContent] Successfully loaded', result.data.length, 'books')
                setMyLibraryBooks(result.data)
                
                // 存入缓存（5分钟）
                setToCache(CACHE_KEYS.LIBRARY_BOOKS, result.data, CACHE_DURATION.SHORT)
                console.log('[LibraryContent] Cached library data')
            } else {
                console.error('[LibraryContent] Failed to load library:', result.message)
                if (!silent) {
                    toast({ 
                        title: "Error", 
                        description: result.message || "Could not load your library.", 
                        variant: "destructive" 
                    })
                }
            }
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    // 4. 暴露 refreshLibraryBooks 方法
    useImperativeHandle(ref, () => ({
        refreshLibraryBooks: (silent = true) => {
            fetchLibraryBooks(silent);
        }
    }));

    useEffect(() => {
        // 等待认证状态加载完成
        if (isAuthLoading) {
            return;
        }

        // 认证加载完成后，如果没有用户，则重定向到首页
        if (!user) {
            router.push('/');
            return;
        }
        
        // 直接调用提升后的 fetchLibraryBooks
        fetchLibraryBooks();

        const fetchRecentBooks = async () => {
            setIsRecentLoading(true);
            try {
                const accessToken = await getAccessToken()
                if (!accessToken) {
                    throw new Error('No access token')
                }

                const result = await getReadingHistory(user.id, accessToken, 100)
                
                if (result.success) {
                    setRecentBooks(result.data)
                } else {
                    console.error("Failed to fetch reading history:", result.message)
                }
            } catch (error) {
                console.error("Failed to fetch reading history:", error);
            } finally {
                setIsRecentLoading(false);
            }
        };

        fetchRecentBooks();
    }, [user, isAuthLoading, router, toast]);

    // 监听播放状态变化，定期刷新进度
    useEffect(() => {
        if (currentBook && currentTime > 0 && user) {
            // 每30秒刷新一次Library页面的进度显示
            const interval = setInterval(() => {
                // 只刷新Library书籍的进度，不刷新Recently Read
                const refreshLibraryProgress = async () => {
                    try {
                        const accessToken = await getAccessToken()
                        if (!accessToken) return

                        const result = await getReadingHistory(user.id, accessToken, 1000)
                        
                        if (result.success) {
                            const progressMap = new Map(
                                result.data.map(book => [book.id, book.progress])
                            )

                            setMyLibraryBooks(prevBooks =>
                                prevBooks.map(book => ({
                                    ...book,
                                    progress: progressMap.get(book.id) || book.progress
                                }))
                            )
                        }
                    } catch (error) {
                        console.error("Failed to refresh progress:", error);
                    }
                };

                refreshLibraryProgress();
            }, 30000); // 30秒刷新一次

            return () => clearInterval(interval);
        }
    }, [currentBook, currentTime, user]);

    const handleDeleteFromLibrary = async (libraryItemId: string, bookTitle: string) => {
        const originalBooks = [...myLibraryBooks];
        setMyLibraryBooks(originalBooks.filter((book) => book.libraryItemId !== libraryItemId));
        
        try {
            const accessToken = await getAccessToken()
            if (!accessToken) {
                throw new Error('No access token')
            }

            const result = await removeFromLibrary(libraryItemId, accessToken)
            
            if (result.success) {
                // 清除缓存，下次访问时重新获取
                clearCache(CACHE_KEYS.LIBRARY_BOOKS)
                toast({ title: "Removed", description: `"${bookTitle}" removed from your library.` })
            } else {
                throw new Error(result.message)
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove book.", variant: "destructive" });
            setMyLibraryBooks(originalBooks);
        }
    };

    const handleDeleteFromRecent = async (recordId: string, bookTitle: string) => {
        const originalBooks = [...recentBooks];
        setRecentBooks(originalBooks.filter((book) => book.libraryItemId !== recordId));
        
        try {
            const accessToken = await getAccessToken()
            if (!accessToken) {
                throw new Error('No access token')
            }

            const result = await deleteReadingHistory(recordId, accessToken)
            
            if (result.success) {
                toast({ title: "Removed", description: `"${bookTitle}" removed from reading history.` })
            } else {
                throw new Error(result.message)
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove from reading history.", variant: "destructive" });
            setRecentBooks(originalBooks);
        } finally {
            setDeleteConfirmOpen(false);
            setBookToDelete(null);
        }
    };

    const handleDeleteClick = (recordId: string, bookTitle: string) => {
        setBookToDelete({ id: recordId, title: bookTitle });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (bookToDelete) {
            handleDeleteFromRecent(bookToDelete.id, bookToDelete.title);
        }
    };

    const sortedLibraryBooks = useMemo(() => {
        return [...myLibraryBooks].sort((a, b) => {
            const aTime = a.added_at || a.created_at || 0
            const bTime = b.added_at || b.created_at || 0
            return new Date(bTime).getTime() - new Date(aTime).getTime()
        })
    }, [myLibraryBooks]);

    const recentPreviewBooks = useMemo(() => recentBooks.slice(0, 3), [recentBooks]);

    const paginatedLibraryBooks = useMemo(() => sortedLibraryBooks.slice((libraryPage - 1) * ITEMS_PER_PAGE, libraryPage * ITEMS_PER_PAGE), [sortedLibraryBooks, libraryPage]);
    const paginatedRecentBooks = useMemo(() => recentBooks.slice((recentPage - 1) * ITEMS_PER_PAGE, recentPage * ITEMS_PER_PAGE), [recentBooks, recentPage]);

    const totalLibraryPages = Math.ceil(myLibraryBooks.length / ITEMS_PER_PAGE);
    const totalRecentPages = Math.ceil(recentBooks.length / ITEMS_PER_PAGE);

    const handleLibraryPageChange = (page: number) => { setLibraryPage(page); window.scrollTo({ top: 0, behavior: "auto" }); };
    const handleRecentPageChange = (page: number) => { setRecentPage(page); window.scrollTo({ top: 0, behavior: "auto" }); };

    return (
        <>
            {/* 改为左对齐 */}
            <div className="w-full">
                {/* 如果认证正在加载，显示骨架屏 */}
                {isAuthLoading ? (
                    <div className="w-full">
                        <div className="mb-8">
                            <Skeleton className="h-10 w-[400px]" />
                        </div>
                        <LibrarySkeleton />
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* 传统的左对齐 tab 样式 */}
                    <div className="border-b border-gray-200 mb-8">
                        <TabsList className="h-auto p-0 bg-transparent border-0 gap-8">
                            <TabsTrigger 
                                value="library" 
                                className="flex items-center gap-2 px-0 pb-3 pt-0 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none bg-transparent text-gray-600 hover:text-gray-900"
                            >
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium">My Library</span>
                                <span className="text-sm">({myLibraryBooks.length})</span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="recent" 
                                className="flex items-center gap-2 px-0 pb-3 pt-0 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none bg-transparent text-gray-600 hover:text-gray-900"
                            >
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">Recently Read</span>
                                <span className="text-sm">({recentBooks.length})</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="library" className="mt-0">
                        {isLoading ? (
                            <LibrarySkeleton />
                        ) : (
                            <>
                                {recentPreviewBooks.length > 0 && (
                                    <div className="mb-12">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-xl font-bold text-gray-900">Recently Reading</h3>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab("recent")}
                                                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                <span>View all</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            {recentPreviewBooks.map((book) => (
                                                <div
                                                    key={book.id}
                                                    className="flex bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                                >
                                                    <Link
                                                        href={`/dashboard/book/${book.slug}`}
                                                        className="relative flex-shrink-0 w-24 bg-gray-100 hover:opacity-90 transition-opacity"
                                                        style={{ aspectRatio: '2/3' }}
                                                    >
                                                        <Image
                                                            src={
                                                                book.cover?.startsWith("http")
                                                                    ? book.cover
                                                                    : book.cover
                                                                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover}`
                                                                    : "/placeholder.svg"
                                                            }
                                                            alt={book.title}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                        />
                                                    </Link>

                                                    <div className="flex-1 min-w-0 flex flex-col p-3">
                                                        <Link
                                                            href={`/dashboard/book/${book.slug}`}
                                                            className="hover:text-blue-600 transition-colors"
                                                        >
                                                            <h4 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                                                                {book.title}
                                                            </h4>
                                                        </Link>
                                                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{book.author}</p>
                                                        <Link
                                                            href={`/dashboard/book/${book.slug}`}
                                                            className="mt-auto inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors self-start"
                                                        >
                                                            Continue
                                                            {book.progress !== undefined && book.progress !== null && (
                                                                <span className="ml-1">· {Math.round(book.progress)}%</span>
                                                            )}
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">My Library</h3>
                                    {myLibraryBooks.length > 0 ? (
                                        <>
                                            <BookGrid
                                                books={paginatedLibraryBooks}
                                                onDelete={handleDeleteFromLibrary}
                                                showProgress
                                            />
                                            {totalLibraryPages > 1 && (
                                                <div className="mt-16">
                                                    <Pagination currentPage={libraryPage} totalPages={totalLibraryPages} onPageChange={handleLibraryPageChange} />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-16">
                                            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-4 text-lg font-medium text-gray-900">Your library is empty</h3>
                                            <p className="mt-2 text-sm text-gray-500">Start exploring and add books to your library.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="recent" className="mt-0">
                        {isRecentLoading ? (
                            <LibrarySkeleton />
                        ) : recentBooks.length > 0 ? (
                            <>
                                {/* 一排一本书的列表布局 */}
                                <div className="space-y-4 pb-20">
                                    {paginatedRecentBooks.map((book) => (
                                        <div
                                            key={book.id}
                                            className="relative flex gap-4 py-4 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            {/* 删除按钮 - 右上角 */}
                                            <button
                                                onClick={() => handleDeleteClick(book.libraryItemId, book.title)}
                                                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                aria-label="Remove from history"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>

                                            {/* 书本封面 - 2:3 比例 */}
                                            <div className="relative flex-shrink-0 w-32 bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '2/3' }}>
                                                <Image
                                                    src={
                                                        book.cover?.startsWith("http")
                                                            ? book.cover
                                                            : book.cover
                                                            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover}`
                                                            : "/placeholder.svg"
                                                    }
                                                    alt={book.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* 书本信息 */}
                                            <div className="flex-1 min-w-0 flex flex-col pr-8">
                                                <h4 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                                                    {book.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                                                    {book.rating > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-yellow-400">★</span>
                                                            <span>{book.rating.toFixed(1)}</span>
                                                        </div>
                                                    )}
                                                    {book.duration && book.duration !== 'Unknown' && (
                                                        <span>{book.duration}</span>
                                                    )}
                                                </div>
                                                {/* Continue Reading 按钮 */}
                                                <Link
                                                    href={`/dashboard/book/${book.slug}`}
                                                    className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors self-start"
                                                >
                                                    Continue Reading
                                                    {book.progress !== undefined && book.progress !== null && (
                                                        <span className="ml-1">· {Math.round(book.progress)}%</span>
                                                    )}
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalRecentPages > 1 && (
                                    <div className="mt-16">
                                        <Pagination currentPage={recentPage} totalPages={totalRecentPages} onPageChange={handleRecentPageChange} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-lg font-medium text-gray-900">No recent books</h3>
                                <p className="text-sm text-gray-500">Books you've recently read will appear here.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
        
        {/* 删除确认对话框 */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove from Reading History?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove "{bookToDelete?.title}" from your reading history? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setBookToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                        Remove
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
});

export default LibraryContent;

// 格式化时长函数
const formatDuration = (audioDuration: number): string => {
    if (!audioDuration || audioDuration <= 0) {
        return 'Unknown'
    }

    const totalMinutes = Math.ceil(audioDuration / 60)
    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        if (minutes > 0) {
            return `${hours}h ${minutes}min`
        } else {
            return `${hours}h`
        }
    } else {
        return `${totalMinutes}min`
    }
}