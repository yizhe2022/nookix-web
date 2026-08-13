"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ListMusic, Play, Pause, AudioLines } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface PlaylistSheetProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export default function PlaylistSheet({ isOpen, onOpenChange }: PlaylistSheetProps) {
    const { currentBook, isPlaying, togglePlay, playlist, playFromPlaylist, clearPlaylist } = useAudioPlayer()
    const router = useRouter()

    const handleItemClick = (index: number) => {
        const item = playlist[index]
        console.log('[PlaylistSheet] Clicked item:', item, 'index:', index)
        
        // 如果是当前正在播放的书，切换播放/暂停
        if (currentBook?.id === item.id) {
            togglePlay()
            return
        }

        // 播放列表中的指定书籍
        playFromPlaylist(index)
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
            <SheetContent
                side="right"
                hideOverlay
                className="w-full sm:w-[400px] p-0 flex flex-col bg-[#181818] border-l border-[#2a2a2a] text-white !h-[calc(100%-80px)] !bottom-auto shadow-none outline-none"
            >
                <SheetHeader className="p-4 border-b border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <SheetTitle className="text-white">Up Next</SheetTitle>
                            <p className="text-xs text-gray-400 mt-1">Continuous playback queue.</p>
                        </div>
                        {playlist.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearPlaylist}
                                className="text-gray-400 hover:text-white hover:bg-[#252525] text-sm font-medium"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    {playlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <ListMusic className="h-12 w-12 mb-2 opacity-20" />
                            <p>Your playlist is empty</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {playlist.map((item, index) => {
                                const isCurrent = currentBook?.id === item.id
                                const isPlayingItem = isCurrent && isPlaying

                                return (
                                    <div
                                        key={`${item.id}-${index}`}
                                        className={`flex items-center gap-4 p-4 hover:bg-[#252525] transition-colors border-b border-[#2a2a2a] group ${isCurrent ? 'bg-[#252525]' : ''}`}
                                    >
                                        <div
                                            className="relative w-12 h-16 flex-shrink-0 bg-[#2a2a2a] rounded overflow-hidden cursor-pointer"
                                            onClick={() => {
                                                const bookSlug = item.slug
                                                router.push(`/book/${bookSlug}`)
                                                onOpenChange(false)
                                            }}
                                        >
                                            <Image
                                                src={item.cover}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                            {isPlayingItem && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <AudioLines className="w-5 h-5 text-blue-400 animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => {
                                                const bookSlug = item.slug
                                                router.push(`/book/${bookSlug}`)
                                                onOpenChange(false)
                                            }}
                                        >
                                            <h4 className={`text-sm font-medium line-clamp-1 ${isCurrent ? 'text-blue-400' : 'text-gray-100'}`}>
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-gray-400 line-clamp-1 mt-1">
                                                {item.author}
                                            </p>
                                        </div>

                                        {/* Play Toggle Button */}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleItemClick(index)
                                            }}
                                        >
                                            {isPlayingItem ? (
                                                <Pause className="h-5 w-5 text-blue-400" />
                                            ) : (
                                                <Play className={`h-5 w-5 ${isCurrent ? 'text-blue-400' : 'text-gray-300'}`} />
                                            )}
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
