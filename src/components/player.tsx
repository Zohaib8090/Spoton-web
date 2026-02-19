

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Mic2,
  ListMusic,
  Laptop2,
  Volume2,
  Maximize2,
} from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Player() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    playNext,
    playPrev,
    closePlayer,
    audioElement,
    youtubePlayer,
    toggleFullScreenPlayer,
    toggleQueue,
    seek,
  } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");

  const [touchStartY, setTouchStartY] = useState(0);
  const [touchDeltaY, setTouchDeltaY] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressUpdateRef = useRef<number | undefined>(undefined);


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
    progressUpdateRef.current = requestAnimationFrame(updateProgress);
  }, [audioElement, currentSong, youtubePlayer]);

  useEffect(() => {
    if (isPlaying) {
      progressUpdateRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (progressUpdateRef.current) {
        cancelAnimationFrame(progressUpdateRef.current);
      }
    }
    return () => {
      if (progressUpdateRef.current) {
        cancelAnimationFrame(progressUpdateRef.current);
      }
    };
  }, [isPlaying, updateProgress]);


  useEffect(() => {
    setProgress(0);
    setTouchDeltaY(0);
  }, [currentSong]);


  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    seek(newProgress);
    setProgress(newProgress);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.targetTouches[0].clientY - touchStartY;
    if (deltaY > 0) { // Only track downward movement
      setTouchDeltaY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaY > 20) { // Threshold to close
      closePlayer();
    }
    // Reset positions
    setTouchStartY(0);
    setTouchDeltaY(0);
  };

  const displayDuration = currentSong?.duration !== "0:00" ? currentSong?.duration : duration;

  return (
    <div
      ref={playerRef}
      className="w-full bg-black border-t border-border px-4 py-3 text-foreground transition-transform duration-200 ease-out"
      style={{ transform: `translateY(${touchDeltaY}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <div
          className="flex items-center gap-3 w-64 min-w-0 cursor-pointer"
          onClick={toggleFullScreenPlayer}
        >
          {currentSong ? (
            <>
              <Image
                src={currentSong.albumArt}
                alt={currentSong.album}
                width={56}
                height={56}
                quality={100}
                className="rounded-md h-12 w-12 sm:h-14 sm:w-14"
                data-ai-hint="album cover"
                unoptimized={currentSong.isFromYouTube}
              />
              <div className="truncate">
                <p className="font-semibold text-xs sm:text-sm truncate hover:underline cursor-pointer">{currentSong.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate hover:underline cursor-pointer">{currentSong.artist}</p>
              </div>
              <Button variant="ghost" size="icon" className="hidden lg:inline-flex text-accent">
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </>
          ) : (
            <div className="h-[56px] flex items-center text-muted-foreground"></div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-1 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-1 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={playPrev} disabled={!currentSong} className="text-muted-foreground hover:text-foreground">
              <SkipBack size={18} className="fill-current" />
            </Button>
            <Button
              size="icon"
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-foreground text-background hover:bg-white/90 shrink-0"
              onClick={togglePlay}
              disabled={!currentSong}
            >
              {isPlaying ? (
                <Pause size={20} className="sm:size-16 fill-current" />
              ) : (
                <Play size={20} className="sm:size-16 fill-current ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentSong} className="text-muted-foreground hover:text-foreground">
              <SkipForward size={18} className="fill-current" />
            </Button>
          </div>
          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{currentTime}</span>
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={1}
              className={cn("w-full h-1 group", !currentSong && "opacity-50")}
              disabled={!currentSong}
            />
            <span className="text-xs text-muted-foreground">{displayDuration || "0:00"}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2 w-auto sm:w-64">
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex text-muted-foreground hover:text-foreground" onClick={toggleQueue}><Mic2 size={18} /></Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground" onClick={toggleQueue}><ListMusic size={18} /></Button>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"><Laptop2 size={18} /></Button>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex text-muted-foreground hover:text-foreground"><Volume2 size={18} /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={toggleFullScreenPlayer}><Maximize2 size={18} /></Button>
        </div>
      </div>
    </div>
  );
}



