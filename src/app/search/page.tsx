"use client";

import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import type { Song } from "@/lib/types";
import { Search, Play, Loader2 } from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/context/player-context";
import { Button } from "@/components/ui/button";
import { searchYoutube } from "@/ai/flows/youtube-search";
import { useToast } from "@/hooks/use-toast";

type YoutubeResult = {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YoutubeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { playSong } = usePlayer();
  const { toast } = useToast();

  const handleYoutubeSearch = async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
          setYoutubeResults([]);
          return;
      }
      setIsSearching(true);
      try {
          const res = await searchYoutube({ query: searchQuery });
          setYoutubeResults(res.results);
      } catch (error) {
          console.error(error);
          toast({
              variant: "destructive",
              title: "YouTube Search Failed",
              description: "Could not fetch results from YouTube. Check if the API key is valid.",
          });
      } finally {
          setIsSearching(false);
      }
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // Debounce search
    const timer = setTimeout(() => {
        handleYoutubeSearch(newQuery);
    }, 300);
    return () => clearTimeout(timer);
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
        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
      </div>
      
      {query && !isSearching && !hasResults && (
        <div className="text-center text-muted-foreground py-12">
            <p>No results found for "{query}" on YouTube.</p>
        </div>
      )}

      {youtubeResults.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">YouTube Results</h2>
          {youtubeResults.map((result) => (
            <div key={result.id} className="flex items-center p-2 rounded-md hover:bg-muted/50 transition-colors group">
              <Image 
                src={result.thumbnail}
                alt={result.title}
                width={40}
                height={40}
                className="rounded-md mr-4"
                unoptimized
              />
              <div className="flex-grow min-w-0">
                <p className="font-semibold truncate">{result.title}</p>
                <p className="text-sm text-muted-foreground truncate">{result.artist}</p>
              </div>
              <div className="text-sm text-muted-foreground mr-4 hidden sm:block">
                {result.duration}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                onClick={() => handlePlayYoutube(result)}
                aria-label={`Play ${result.title}`}
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
