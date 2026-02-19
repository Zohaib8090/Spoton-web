
"use client"

import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { usePlayer } from "@/context/player-context"
import type { Album } from "@/lib/types"
import { HTMLAttributes } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

interface AlbumArtworkProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  album: Album
  isPlaylist?: boolean
  isSelectionMode?: boolean
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
}

export function AlbumArtwork({
  album,
  isPlaylist = false,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  className,
  ...props
}: AlbumArtworkProps) {
  const { playSong } = usePlayer();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (album.songs && album.songs.length > 0) {
      playSong(album.songs[0], album.songs);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(album.id, !isSelected);
    }
  };

  const href = `/playlist/${album.id}`;
  const Wrapper = isSelectionMode ? 'div' : Link;

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Wrapper href={isSelectionMode ? '#' : href} className="block" onClick={handleSelect}>
        <Card className={cn("overflow-hidden relative group", isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background")}>
          <CardContent className="p-0">
            <Image
              src={album.albumArt}
              alt={album.name}
              width={250}
              height={250}
              quality={100}
              className={cn("h-auto w-auto object-cover aspect-square transition-all", !isSelectionMode && "hover:scale-105")}
              data-ai-hint="album cover"
            />
            {isSelectionMode && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Checkbox
                  checked={isSelected}
                  className="h-8 w-8 bg-background/50 border-white/50 data-[state=checked]:bg-primary"
                />
              </div>
            )}
            {!isSelectionMode && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={handlePlay}
                  className="bg-primary p-2.5 rounded-full shadow-lg"
                  aria-label={`Play ${album.name}`}
                  disabled={!album.songs || album.songs.length === 0}
                >
                  <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </Wrapper>
      <div className="space-y-1 text-sm">
        <Link href={href}>
          <h3 className="font-medium leading-none truncate hover:underline">{album.name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
      </div>
    </div>
  )
}


