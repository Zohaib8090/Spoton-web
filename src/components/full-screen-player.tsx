
"use client";

import { useEffect, useState, useCallback } from "react";
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
  ChevronDown
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
    isFullScreenPlayerOpen,
    toggleFullScreenPlayer
  } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const onTimeUpdate = useCallback(() => {
    if (audioElement) {
      setProgress((audioElement.currentTime / audioElement.duration) * 100);
      setCurrentTime(formatTime(audioElement.currentTime));
    }
  }, [audioElement]);

  const onLoadedData = useCallback(() => {
    if (audioElement) {
        setDuration(formatTime(audioElement.duration));
    }
  }, [audioElement]);

  useEffect(() => {
    if (audioElement) {
      audioElement.addEventListener("timeupdate", onTimeUpdate);
      audioElement.addEventListener("loadedmetadata", onLoadedData);
      audioElement.addEventListener("durationchange", onLoadedData);
      return () => {
        audioElement.removeEventListener("timeupdate", onTimeUpdate);
        audioElement.removeEventListener("loadedmetadata", onLoadedData);
        audioElement.removeEventListener("durationchange", onLoadedData);
      };
    }
  }, [audioElement, onTimeUpdate, onLoadedData]);

  useEffect(() => {
    setProgress(0);
  }, [currentSong]);

  const handleProgressChange = (value: number[]) => {
    if (audioElement) {
      const newTime = (value[0] / 100) * audioElement.duration;
      audioElement.currentTime = newTime;
      setProgress(value[0]);
    }
  };
  
  const displayDuration = currentSong?.duration === "N/A" ? duration : currentSong?.duration;

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
                 <Image
                    src={currentSong.albumArt}
                    alt={currentSong.album}
                    width={500}
                    height={500}
                    className="rounded-lg shadow-2xl aspect-square object-cover w-full max-w-sm"
                    data-ai-hint="album cover"
                />

                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">{currentSong.title}</h2>
                    <p className="text-base text-muted-foreground">{currentSong.artist}</p>
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

                <div className="flex items-center justify-center gap-6">
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
                </div>

                 <div className="flex items-center justify-between gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Laptop2 size={18}/></Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ListMusic size={18}/></Button>
                </div>
            </div>

        </SheetContent>
    </Sheet>
  );
}
