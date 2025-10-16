"use client";

import { useEffect, useState } from "react";
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
  Maximize2
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
    <footer className="w-full bg-black border-t border-border px-4 py-3 text-foreground">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <div className="flex items-center gap-3 w-64 min-w-0">
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
                <p className="font-semibold text-sm truncate hover:underline cursor-pointer">{currentSong.title}</p>
                <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer">{currentSong.artist}</p>
              </div>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-accent">
                <Heart className="h-4 w-4 fill-current" />
              </Button>
            </>
          ) : (
             <div className="h-[56px] flex items-center text-muted-foreground"></div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-1 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={playPrev} disabled={!currentSong} className="text-muted-foreground hover:text-foreground">
              <SkipBack size={20} className="fill-current" />
            </Button>
            <Button
              size="icon"
              className="w-8 h-8 rounded-full bg-foreground text-background hover:bg-white/90"
              onClick={togglePlay}
              disabled={!currentSong}
            >
              {isPlaying ? (
                <Pause size={16} className="fill-current" />
              ) : (
                <Play size={16} className="fill-current ml-0.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentSong} className="text-muted-foreground hover:text-foreground">
              <SkipForward size={20} className="fill-current" />
            </Button>
          </div>
          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={100}
              step={1}
              className={cn("w-full h-1 group", !currentSong && "opacity-50")}
              disabled={!currentSong}
            />
            <span className="text-xs text-muted-foreground">{currentSong?.duration || "0:00"}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 w-64">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Mic2 size={18}/></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ListMusic size={18}/></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Laptop2 size={18}/></Button>
          <div className="flex items-center gap-2 w-32">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Volume2 size={18}/></Button>
            <Slider defaultValue={[100]} max={100} step={1} className="h-1" />
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Maximize2 size={18}/></Button>
        </div>
      </div>
    </footer>
  );
}
