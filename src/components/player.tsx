"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Shuffle,
  Repeat,
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
  } = usePlayer();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [currentSong]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            playNext();
            return 0;
          }
          const durationParts = currentSong.duration.split(':').map(Number);
          const totalSeconds = durationParts[0] * 60 + durationParts[1];
          const increment = 100 / totalSeconds;
          return prev + increment;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong, playNext]);

  const formatTime = (percentage: number) => {
    if (!currentSong) return "0:00";
    const durationParts = currentSong.duration.split(':').map(Number);
    const totalSeconds = durationParts[0] * 60 + durationParts[1];
    const currentSeconds = Math.floor((totalSeconds * percentage) / 100);
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <footer className="w-full bg-card border-t border-border px-4 py-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center gap-4 w-full min-w-0">
          {currentSong ? (
            <>
              <Image
                src={currentSong.albumArt}
                alt={currentSong.album}
                width={56}
                height={56}
                className="rounded-md"
                data-ai-hint="album cover"
              />
              <div className="truncate">
                <p className="font-semibold truncate">{currentSong.title}</p>
                <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-2 hidden sm:inline-flex">
                <Heart className="h-5 w-5" />
              </Button>
            </>
          ) : (
             <div className="h-[56px] flex items-center text-muted-foreground">Select a song to play</div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" disabled={!currentSong} className="hidden sm:inline-flex">
              <Shuffle className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={playPrev} disabled={!currentSong}>
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={togglePlay}
              disabled={!currentSong}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 fill-current" />
              ) : (
                <Play className="h-7 w-7 fill-current ml-1" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentSong}>
              <SkipForward className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" disabled={!currentSong} className="hidden sm:inline-flex">
              <Repeat className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <div className="w-full max-w-md hidden md:flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={1}
              className={cn("w-full", !currentSong && "opacity-50")}
              disabled={!currentSong}
            />
            <span className="text-xs text-muted-foreground">{currentSong?.duration || "0:00"}</span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          {/* Volume controls could go here */}
        </div>
      </div>
    </footer>
  );
}
