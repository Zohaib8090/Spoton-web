
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import YouTube from "react-youtube";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic2,
  ListMusic,
  Laptop2,
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  Youtube
} from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function FullScreenPlayer() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrev,
    audioElement,
    youtubePlayer,
    isFullScreenPlayerOpen,
    toggleFullScreenPlayer,
    shuffle,
    toggleShuffle,
    loop,
    toggleLoop,
    toggleQueue,
    showVideo,
    toggleShowVideo,
    setYoutubePlayer
  } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");
  const progressUpdateRef = useRef<number>();

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const updateProgress = useCallback(() => {
    if (currentSong?.isFromYouTube && youtubePlayer?.getDuration) {
      const ytCurrentTime = youtubePlayer.getCurrentTime();
      const ytDuration = youtubePlayer.getDuration();
      if (ytDuration > 0) {
        setProgress((ytCurrentTime / ytDuration) * 100);
        setCurrentTime(formatTime(ytCurrentTime));
        setDuration(formatTime(ytDuration));
      }
    } else if (audioElement?.duration) {
      setProgress((audioElement.currentTime / audioElement.duration) * 100);
      setCurrentTime(formatTime(audioElement.currentTime));
      setDuration(formatTime(audioElement.duration));
    }
    if (isFullScreenPlayerOpen) {
      progressUpdateRef.current = requestAnimationFrame(updateProgress);
    }
  }, [audioElement, currentSong, youtubePlayer, isFullScreenPlayerOpen]);
  
  useEffect(() => {
    if (isPlaying && isFullScreenPlayerOpen) {
        progressUpdateRef.current = requestAnimationFrame(updateProgress);
    } else {
        if(progressUpdateRef.current) {
            cancelAnimationFrame(progressUpdateRef.current);
        }
    }

    return () => {
        if(progressUpdateRef.current) {
            cancelAnimationFrame(progressUpdateRef.current);
        }
    }
  }, [isPlaying, isFullScreenPlayerOpen, updateProgress]);

  useEffect(() => {
    setProgress(0);
  }, [currentSong]);

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    if (currentSong?.isFromYouTube && youtubePlayer) {
      const newTime = (newProgress / 100) * youtubePlayer.getDuration();
      youtubePlayer.seekTo(newTime, true);
    } else if (audioElement) {
      const newTime = (newProgress / 100) * audioElement.duration;
      audioElement.currentTime = newTime;
    }
    setProgress(newProgress);
  };
  
  const displayDuration = currentSong?.duration !== "0:00" ? currentSong?.duration : duration;

  const onPlayerReady = (event: any) => {
    setYoutubePlayer(event.target);
  };

  const onPlayerEnd = () => {
    playNext();
  };

  if (!currentSong) return null;

  return (
    <Sheet open={isFullScreenPlayerOpen} onOpenChange={toggleFullScreenPlayer}>
        <SheetContent side="bottom" className="h-full w-full bg-gradient-to-b from-primary/20 via-background to-background p-4 md:p-6 lg:p-8 flex flex-col">
            <SheetHeader className="relative">
                <Button variant="ghost" size="icon" onClick={toggleFullScreenPlayer} className="absolute left-0 top-0 text-muted-foreground">
                    <ChevronDown size={24} />
                </Button>
                <SheetTitle className="text-center text-sm font-normal uppercase tracking-wider text-muted-foreground">Now Playing</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 flex flex-col items-center justify-center gap-8 pt-8">
                 <div className="w-full max-w-sm aspect-square">
                    {currentSong.isFromYouTube && showVideo ? (
                        <YouTube
                            videoId={currentSong.id}
                            onReady={onPlayerReady}
                            onEnd={onPlayerEnd}
                            opts={{
                                height: '100%',
                                width: '100%',
                                playerVars: {
                                autoplay: 1,
                                },
                            }}
                            className="w-full h-full rounded-lg shadow-2xl overflow-hidden"
                        />
                    ) : (
                        <Image
                            src={currentSong.albumArt}
                            alt={currentSong.album}
                            width={500}
                            height={500}
                            className="rounded-lg shadow-2xl aspect-square object-cover w-full h-full"
                            data-ai-hint="album cover"
                            unoptimized={currentSong.isFromYouTube}
                        />
                    )}
                </div>

                <div className="text-center">
                    <h2 className="text-xl font-bold tracking-tight">{currentSong.title}</h2>
                    <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 pb-4">
                <div className="w-full">
                     <Slider
                        value={[progress]}
                        onValueChange={handleProgressChange}
                        max={100}
                        step={1}
                        className={cn("w-full h-2 group", !currentSong && "opacity-50")}
                        disabled={!currentSong}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{currentTime}</span>
                        <span>{displayDuration || "0:00"}</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleShuffle} 
                        className={cn("text-muted-foreground h-14 w-14", shuffle && "text-primary")}
                        aria-label="Toggle shuffle"
                    >
                        <Shuffle size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={playPrev} disabled={!currentSong} className="text-foreground h-14 w-14">
                        <SkipBack size={32} className="fill-current" />
                    </Button>
                    <Button
                        size="icon"
                        className="w-20 h-20 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={togglePlay}
                        disabled={!currentSong}
                    >
                    {isPlaying ? (
                        <Pause size={40} className="fill-current" />
                    ) : (
                        <Play size={40} className="fill-current ml-1" />
                    )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentSong} className="text-foreground h-14 w-14">
                        <SkipForward size={32} className="fill-current" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleLoop} 
                        className={cn("text-muted-foreground h-14 w-14", loop !== 'none' && "text-primary")}
                        aria-label="Toggle loop"
                    >
                        {loop === 'song' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </Button>
                </div>

                 <div className="flex items-center justify-between gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Laptop2 size={18}/></Button>
                    <div className="flex items-center gap-2">
                        {currentSong.isFromYouTube && (
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={toggleShowVideo}
                                className={cn("text-muted-foreground hover:text-foreground", showVideo && "text-primary")}
                            >
                                <Youtube size={18}/>
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={toggleQueue} className="text-muted-foreground hover:text-foreground"><Mic2 size={18}/></Button>
                        <Button variant="ghost" size="icon" onClick={toggleQueue} className="text-muted-foreground hover:text-foreground"><ListMusic size={18}/></Button>
                    </div>
                </div>
            </div>

        </SheetContent>
    </Sheet>
  );
}
