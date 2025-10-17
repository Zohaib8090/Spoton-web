
"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { usePlayer } from "@/context/player-context";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";

export function HistoryItem({ song }: { song: Song }) {
  const { playSong, currentSong } = usePlayer();

  return (
    <div
      className={cn(
        "flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer",
        currentSong?.id === song.id && "bg-muted"
      )}
      onClick={() => playSong(song)}
    >
      <Image
        src={song.albumArt}
        alt={song.title}
        width={40}
        height={40}
        quality={100}
        className="rounded-md mr-4"
        unoptimized={song.isFromYouTube}
      />
      <div className="flex-grow min-w-0">
        <p className={cn("font-semibold truncate", currentSong?.id === song.id && "text-primary")}>{song.title}</p>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>
      <button className="opacity-0 group-hover:opacity-100 p-2">
        <Play className="h-5 w-5" />
      </button>
    </div>
  );
}
