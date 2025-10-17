
"use client"

import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { usePlayer } from "@/context/player-context"
import type { Album } from "@/lib/types"
import { PinButton } from "./pin-button"
import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

interface AlbumArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
  album: Album
  isPlaylist?: boolean
}

export function AlbumArtwork({ album, isPlaylist = false, className, ...props }: AlbumArtworkProps) {
  const { playSong } = usePlayer();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isPinned, setIsPinned] = useState(false);

  const pinsQuery = useMemoFirebase(() =>
    user && firestore ? query(collection(firestore, 'users', user.uid, 'pins'), where('itemId', '==', album.id)) : null,
    [user, firestore, album.id]
  );
  const { data: pins } = useCollection(pinsQuery);

  useEffect(() => {
    setIsPinned(!!pins && pins.length > 0);
  }, [pins]);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(album.songs && album.songs.length > 0) {
        playSong(album.songs[0], album.songs);
    }
  };
  
  const href = `/playlist/${album.id}`;

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Link href={href} className="overflow-hidden rounded-md relative group block">
          <Image
            src={album.albumArt}
            alt={album.name}
            width={250}
            height={250}
            quality={100}
            className="h-auto w-auto object-cover aspect-square transition-all hover:scale-105"
            data-ai-hint="album cover"
          />
        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
            {user && (
                 <PinButton
                    item={{
                        id: album.id,
                        type: isPlaylist ? 'playlist' : 'album',
                        name: album.name,
                        artist: album.artist,
                        albumArt: album.albumArt
                    }}
                    isPinned={isPinned}
                    onPinChange={setIsPinned}
                    className="bg-background/70 hover:bg-background/90 p-2 h-auto w-auto rounded-full shadow-lg"
                 />
            )}
            <button
                onClick={handlePlay}
                className="bg-primary p-2.5 rounded-full shadow-lg"
                aria-label={`Play ${album.name}`}
                disabled={!album.songs || album.songs.length === 0}
            >
                <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
            </button>
        </div>
      </Link>
      <div className="space-y-1 text-sm">
        <Link href={href}>
          <h3 className="font-medium leading-none truncate hover:underline">{album.name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
      </div>
    </div>
  )
}
