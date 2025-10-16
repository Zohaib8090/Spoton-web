"use client"

import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { usePlayer } from "@/context/player-context"
import type { Album } from "@/lib/types"

interface AlbumArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
  album: Album
  isPlaylist?: boolean
}

export function AlbumArtwork({ album, isPlaylist = false, className, ...props }: AlbumArtworkProps) {
  const { playSong } = usePlayer();

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    playSong(album.songs[0], album.songs);
  };
  
  const href = `/playlist/${album.id}`;

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="overflow-hidden rounded-md relative group">
        <Link href={href}>
          <Image
            src={album.albumArt}
            alt={album.name}
            width={250}
            height={250}
            className="h-auto w-auto object-cover aspect-square transition-all hover:scale-105"
            data-ai-hint="album cover"
          />
        </Link>
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 bg-primary p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0"
          aria-label={`Play ${album.name}`}
        >
          <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
        </button>
      </div>
      <div className="space-y-1 text-sm">
        <Link href={href}>
          <h3 className="font-medium leading-none truncate hover:underline">{album.name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
      </div>
    </div>
  )
}
