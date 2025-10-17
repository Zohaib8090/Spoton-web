
"use client"

import Image from "next/image"
import { Play, Pause, Pin } from "lucide-react"
import { usePlayer } from "@/context/player-context"
import type { Song } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from "firebase/firestore"
import { PinButton } from "./pin-button"
import { useState, useEffect } from "react"

function SongRow({ song, index, onPlay, isCurrentlyPlaying, songs }: { song: Song, index: number, onPlay: (song: Song) => void, isCurrentlyPlaying: boolean, songs: Song[] }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isPinned, setIsPinned] = useState(false);

    const pinsQuery = useMemoFirebase(() =>
        user && firestore ? query(collection(firestore, 'users', user.uid, 'pins'), where('itemId', '==', song.id)) : null,
        [user, firestore, song.id]
    );
    const { data: pins } = useCollection(pinsQuery);

    useEffect(() => {
        setIsPinned(!!pins && pins.length > 0);
    }, [pins]);

    return (
        <div
            className={cn(
              "grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_1fr_auto_2rem] items-center gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors group",
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

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                {user && (
                    <PinButton
                        item={{
                            id: song.id,
                            type: 'song',
                            name: song.title,
                            artist: song.artist,
                            albumArt: song.albumArt
                        }}
                        isPinned={isPinned}
                        onPinChange={setIsPinned}
                    />
                )}
            </div>
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
            songs={songs}
          />
        )
      })}
    </div>
  )
}
