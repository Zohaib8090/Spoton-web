

"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/context/player-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getYoutubeLyrics } from '@/ai/flows/youtube-lyrics';
import type { YoutubeLyricsOutput } from '@/ai/flows/youtube-lyrics';
import { cn } from '@/lib/utils';
import { Loader2, Music2 } from 'lucide-react';

type LyricLine = YoutubeLyricsOutput['lyrics'][0];

export function PlaybackQueue() {
  const {
    isQueueOpen,
    toggleQueue,
    playlist,
    currentSong,
    playSong,
    youtubePlayer,
    audioElement,
    lyrics,
    setLyrics,
    isLyricsLoading,
    setIsLyricsLoading,
  } = usePlayer();

  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricLinesRef = useRef<(HTMLParagraphElement | null)[]>([]);

  const currentTime = useMemo(() => {
    if (currentSong?.isFromYouTube && youtubePlayer) {
      return youtubePlayer.getCurrentTime();
    }
    if (audioElement) {
      return audioElement.currentTime;
    }
    return 0;
  }, [currentSong, youtubePlayer, audioElement, isQueueOpen]); // Reruns when queue opens to get latest time

  useEffect(() => {
    let animationFrameId: number;

    const updateActiveLyric = () => {
      if (!lyrics || lyrics.length === 0 || !isQueueOpen) {
        animationFrameId = requestAnimationFrame(updateActiveLyric);
        return;
      }
      
      const latestTime = currentSong?.isFromYouTube 
        ? youtubePlayer?.getCurrentTime() ?? 0
        : audioElement?.currentTime ?? 0;
      
      let newIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (parseFloat(lyrics[i].start) <= latestTime) {
          newIndex = i;
          break;
        }
      }

      setActiveLyricIndex(newIndex);
      animationFrameId = requestAnimationFrame(updateActiveLyric);
    };

    if (isQueueOpen) {
      animationFrameId = requestAnimationFrame(updateActiveLyric);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [lyrics, isQueueOpen, currentSong, youtubePlayer, audioElement]);

  useEffect(() => {
    if (activeLyricIndex !== -1 && lyricLinesRef.current[activeLyricIndex]) {
      lyricLinesRef.current[activeLyricIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex]);

  useEffect(() => {
    if (currentSong?.isFromYouTube && isQueueOpen) {
      setIsLyricsLoading(true);
      setLyrics([]);
      getYoutubeLyrics({ videoId: currentSong.id })
        .then(result => {
          setLyrics(result.lyrics);
        })
        .catch(console.error)
        .finally(() => {
          setIsLyricsLoading(false);
        });
    } else {
      setLyrics([]);
    }
  }, [currentSong, isQueueOpen, setLyrics, setIsLyricsLoading]);

  return (
    <Sheet open={isQueueOpen} onOpenChange={toggleQueue}>
      <SheetContent className="w-full md:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Up Next</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 flex-shrink-0 border-b">
          <Button variant="ghost" className="rounded-none border-b-2 border-primary">Queue</Button>
          <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={() => {
              if(lyrics.length > 0) {
                  toggleQueue();
                  // A bit of a hack to show the lyrics sheet
                  setTimeout(toggleQueue, 50);
              }
          }}>Lyrics</Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {playlist.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer',
                  currentSong?.id === song.id ? 'bg-muted' : 'hover:bg-muted/50'
                )}
                onClick={() => playSong(song)}
              >
                <Image src={song.albumArt} alt={song.album} width={40} height={40} quality={100} className="rounded" />
                <div className="truncate">
                  <p className={cn("font-medium text-sm truncate", currentSong?.id === song.id && "text-primary")}>{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
       
        {lyrics.length > 0 && (
             <Sheet open={isQueueOpen} onOpenChange={toggleQueue}>
                 <SheetContent className="w-full md:max-w-md p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Lyrics</SheetTitle>
                        <SheetDescription>{currentSong?.title} by {currentSong?.artist}</SheetDescription>
                    </SheetHeader>
                     <div className="grid grid-cols-2 flex-shrink-0 border-b">
                        <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={toggleQueue}>Queue</Button>
                        <Button variant="ghost" className="rounded-none border-b-2 border-primary">Lyrics</Button>
                    </div>
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-4">
                            {lyrics.map((line, index) => (
                                <p 
                                    key={index} 
                                    ref={el => lyricLinesRef.current[index] = el}
                                    className={cn(
                                        "text-muted-foreground transition-all duration-300 text-2xl font-semibold",
                                        activeLyricIndex === index ? "text-primary scale-105" : "opacity-50"
                                    )}
                                >
                                    {line.text}
                                </p>
                            ))}
                        </div>
                    </ScrollArea>
                 </SheetContent>
             </Sheet>
        )}
        {isLyricsLoading && (
             <Sheet open={isQueueOpen} onOpenChange={toggleQueue}>
                 <SheetContent className="w-full md:max-w-md p-0 flex flex-col">
                     <SheetHeader className="p-4 border-b">
                        <SheetTitle>Lyrics</SheetTitle>
                    </SheetHeader>
                     <div className="grid grid-cols-2 flex-shrink-0 border-b">
                        <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={toggleQueue}>Queue</Button>
                        <Button variant="ghost" className="rounded-none border-b-2 border-primary">Lyrics</Button>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading lyrics...</span>
                        </div>
                    </div>
                 </SheetContent>
            </Sheet>
        )}
         {currentSong?.isFromYouTube && lyrics.length === 0 && !isLyricsLoading && (
             <Sheet open={isQueueOpen} onOpenChange={toggleQueue}>
                 <SheetContent className="w-full md:max-w-md p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Lyrics</SheetTitle>
                    </SheetHeader>
                     <div className="grid grid-cols-2 flex-shrink-0 border-b">
                        <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={toggleQueue}>Queue</Button>
                        <Button variant="ghost" className="rounded-none border-b-2 border-primary">Lyrics</Button>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <Music2 className="h-10 w-10 mx-auto mb-2" />
                            <p>No lyrics available for this song.</p>
                        </div>
                    </div>
                 </SheetContent>
             </Sheet>
         )}

      </SheetContent>
    </Sheet>
  );
}

    
