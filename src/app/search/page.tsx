
"use client";

import { useState, ChangeEvent, useCallback, useTransition, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { Song } from "@/lib/types";
import { Search, Play, Loader2, MoreVertical } from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/context/player-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { searchYoutubeAction, type YoutubeResult } from "./actions";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';


function SearchPageComponent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [youtubeResults, setYoutubeResults] = useState<YoutubeResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const { playSong, currentSong } = usePlayer();
  const { toast } = useToast();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() =>
    user && firestore ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userData } = useDoc(userDocRef);

  const searchType = userData?.settings?.streamingServices?.youtube === true ? 'youtube' : 'youtubeMusic';

  const handleYoutubeSearch = useCallback((searchQuery: string, currentSearchType: 'youtube' | 'youtubeMusic') => {
    if (searchQuery.trim().length < 2) {
      setYoutubeResults([]);
      return;
    }
    startTransition(async () => {
      const res = await searchYoutubeAction(searchQuery, currentSearchType);
      if (res.error) {
        console.error(res.error);
        toast({
          variant: "destructive",
          title: "YouTube Search Failed",
          description: res.error,
        });
        setYoutubeResults([]);
      } else {
        setYoutubeResults(res.results || []);
      }
    });
  }, [toast]);

  useEffect(() => {
    if (initialQuery) {
      handleYoutubeSearch(initialQuery, searchType);
    }
  }, [initialQuery, handleYoutubeSearch, searchType]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      handleYoutubeSearch(newQuery, searchType);
    }, 500); // 500ms debounce

    setDebounceTimer(timer);
  }

  const handlePlayYoutube = (ytResult: YoutubeResult) => {
    const song: Song = {
      id: ytResult.id,
      title: ytResult.title,
      artist: ytResult.artist,
      album: "YouTube",
      albumId: "youtube",
      albumArt: ytResult.thumbnail,
      duration: ytResult.duration,
      audioSrc: `youtube:${ytResult.id}`,
      isFromYouTube: true,
    };
    const playlist = youtubeResults.map(yr => ({
      id: yr.id,
      title: yr.title,
      artist: yr.artist,
      album: "YouTube",
      albumId: "youtube",
      albumArt: yr.thumbnail,
      duration: yr.duration,
      audioSrc: `youtube:${yr.id}`,
      isFromYouTube: true,
    }));
    playSong(song, playlist);
  };


  const hasResults = youtubeResults.length > 0;

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          placeholder="What do you want to listen to?"
          className="pl-10 text-lg py-6"
          value={query}
          onChange={handleInputChange}
          aria-label="Search for music on YouTube"
        />
        {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
      </div>

      {query && !isPending && !hasResults && (
        <div className="text-center text-muted-foreground py-12">
          <p>No results found for "{query}" on YouTube.</p>
        </div>
      )}

      {youtubeResults.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">YouTube Results</h2>
          {youtubeResults.map((result) => {
            const isActive = currentSong?.id === result.id;
            return (
              <div
                key={result.id}
                className={cn(
                  "flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer",
                  isActive && "bg-muted"
                )}
                onClick={() => handlePlayYoutube(result)}
              >
                <Image
                  src={result.thumbnail}
                  alt={result.title}
                  width={40}
                  height={40}
                  className="rounded-md mr-4"
                  unoptimized
                />
                <div className="flex-grow min-w-0 pr-2 py-1">
                  <p className={cn("font-semibold leading-snug break-words", isActive && "text-primary")}>
                    {result.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5 break-words">
                    {result.artist}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="text-sm text-muted-foreground mr-2 hidden sm:block">
                    {result.duration}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                    aria-label={`Play ${result.title}`}
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent playing the song when clicking "more"
                      // Future: Open a dropdown or modal for more options
                    }}
                    aria-label={`More options for ${result.title}`}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchPageComponent />
    </Suspense>
  )
}
