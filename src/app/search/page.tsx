"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { allSongs } from "@/lib/data";
import type { Song } from "@/lib/types";
import { Search, Play } from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/context/player-context";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { playSong } = usePlayer();

  const results = useMemo(() => {
    if (query.trim() === "") {
      return [];
    }
    const lowercasedQuery = query.toLowerCase();
    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowercasedQuery) ||
        song.artist.toLowerCase().includes(lowercasedQuery) ||
        song.album.toLowerCase().includes(lowercasedQuery)
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          placeholder="What do you want to listen to?"
          className="pl-10 text-lg py-6"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search for music"
        />
      </div>
      
      {query && results.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
            <p>No results found for "{query}".</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Top Results</h2>
          {results.map((song) => (
            <div key={song.id} className="flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors group">
              <Image 
                src={song.albumArt}
                alt={song.album}
                width={40}
                height={40}
                className="rounded-md mr-4"
                data-ai-hint="album cover"
              />
              <div className="flex-grow min-w-0">
                <p className="font-semibold truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              </div>
              <div className="text-sm text-muted-foreground mr-4 hidden sm:block">
                {song.duration}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                onClick={() => playSong(song, results)}
                aria-label={`Play ${song.title}`}
              >
                <Play className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
