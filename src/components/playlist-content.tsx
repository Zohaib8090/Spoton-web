
"use client"

import Image from "next/image"
import { Play, Pause } from "lucide-react"
import { usePlayer } from "@/context/player-context"
import type { Song } from "@/lib/types"
import { cn } from "@/lib/utils"

function SongRow({ song, index, onPlay, isCurrentlyPlaying }: { song: Song, index: number, onPlay: (song: Song) => void, isCurrentlyPlaying: boolean }) {
    return (
        <div
            className={cn(
              "grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_1fr_auto] items-center gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors group",
              isCurrentlyPlaying && "bg-muted/50"
            )}
            onDoubleClick={() => onPlay(song)}
          >
            <div className="flex items-center justify-center h-4 w-4">
                <div className={cn("w-4 h-4 text-center text-muted-foreground group-hover:hidden", isCurrentlyPlaying && "text-primary")}>
                    {isCurrentlyPlaying ? <Pause size={16} className="fill-current"/> : index + 1}
                </div>
                <button
                    onClick={() => onPlay(song)}
                    className="hidden group-hover:block"
                    aria-label={`Play ${song.title}`}
                >
                    {isCurrentlyPlaying ? <Pause size={16} className="text-foreground fill-foreground"/> : <Play size={16} className="text-foreground fill-foreground"/>}
                </button>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              <Image 
                src={song.albumArt} 
                alt={song.album} 
                width={40} 
                height={40} 
                quality={100}
                className="rounded-sm flex-shrink-0"
                data-ai-hint="album cover"
              />
              <div className="truncate">
                <p className={cn("font-medium truncate", isCurrentlyPlaying && "text-primary")}>{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              </div>
            </div>

            <div className="hidden sm:block text-muted-foreground truncate">{song.album}</div>
            
            <div className="hidden sm:block text-muted-foreground justify-self-end">{song.duration}</div>
          </div>
    )
}

export function PlaylistContent({ songs }: { songs: Song[] }) {
  const { playSong, togglePlay, currentSong, isPlaying } = usePlayer()

  const handlePlayClick = (song: Song) => {
    if (song.id === currentSong?.id) {
        togglePlay();
    } else {
        playSong(song, songs);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {songs.map((song, index) => {
        const isActive = song.id === currentSong?.id;
        const isCurrentlyPlaying = isActive && isPlaying;
        return (
          <SongRow 
            key={song.id} 
            song={song} 
            index={index}
            onPlay={handlePlayClick} 
            isCurrentlyPlaying={isCurrentlyPlaying}
          />
        )
      })}
    </div>
  )
}
