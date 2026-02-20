
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
  Youtube,
  Share,
  ListPlus
} from "lucide-react";
import { usePlayer } from "@/context/player-context";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AddToPlaylistDropdown } from "@/components/add-to-playlist-dropdown";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
    setYoutubePlayer,
    isYoutubeMode,
    seek,
  } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");
  const progressUpdateRef = useRef<number | undefined>(undefined);
  const { toast } = useToast();

  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const updateProgress = useCallback(() => {
    let newProgress = 0;
    let newCurrentTime = 0;
    let newDuration = 0;

    if (currentSong?.isFromYouTube && youtubePlayer?.getDuration) {
      newCurrentTime = youtubePlayer.getCurrentTime();
      newDuration = youtubePlayer.getDuration();
      if (newDuration > 0) {
        newProgress = (newCurrentTime / newDuration) * 100;
      }
    } else if (audioElement?.duration) {
      newCurrentTime = audioElement.currentTime;
      newDuration = audioElement.duration;
      newProgress = (newCurrentTime / newDuration) * 100;
    }

    setProgress(newProgress);
    setCurrentTime(formatTime(newCurrentTime));
    if (newDuration > 0) {
      setDuration(formatTime(newDuration));
    }

    if (isFullScreenPlayerOpen) {
      progressUpdateRef.current = requestAnimationFrame(updateProgress);
    }
  }, [audioElement, currentSong, youtubePlayer, isFullScreenPlayerOpen]);

  useEffect(() => {
    if (isPlaying && isFullScreenPlayerOpen) {
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
    }
  }, [isPlaying, isFullScreenPlayerOpen, updateProgress]);

  useEffect(() => {
    setProgress(0);
  }, [currentSong]);

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    seek(newProgress);
    setProgress(newProgress);
  };

  const displayDuration = currentSong?.duration !== "0:00" ? currentSong?.duration : duration;

  const onPlayerReady = (event: any) => {
    setYoutubePlayer(event.target);
  };

  const onPlayerEnd = () => {
    playNext();
  };

  const handleShare = async () => {
    if (!currentSong || !currentSong.isFromYouTube) return;

    const videoUrl = `https://www.youtube.com/watch?v=${currentSong.id}`;
    const shareData = {
      title: currentSong.title,
      text: `Check out ${currentSong.title} by ${currentSong.artist}`,
      url: videoUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(videoUrl);
        toast({
          title: "Link Copied!",
          description: "The video link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      try {
        await navigator.clipboard.writeText(videoUrl);
        toast({
          title: "Link Copied!",
          description: "The video link has been copied to your clipboard.",
        });
      } catch (copyError) {
        toast({
          variant: "destructive",
          title: "Share Failed",
          description: "Could not share or copy the link.",
        });
      }
    }
  };


  if (!currentSong) return null;

  const renderPlayerMedia = () => {
    const shouldShowVideo = currentSong.isFromYouTube && (showVideo || isYoutubeMode);

    return (
      <div className={cn("w-full aspect-square relative shadow-2xl overflow-hidden", isDesktop ? "max-w-sm mx-auto rounded-lg" : "rounded-xl mb-8")}>
        {shouldShowVideo ? (
          <YouTube
            videoId={currentSong.id}
            onReady={onPlayerReady}
            onEnd={onPlayerEnd}
            opts={{
              height: '100%',
              width: '100%',
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                start: Math.floor(audioElement?.currentTime || 0),
              },
            }}
            className={cn("w-full h-full", !isDesktop && "absolute inset-0 bg-black")}
            iframeClassName="w-full h-full"
          />
        ) : (
          <Image
            src={currentSong.albumArt}
            alt={currentSong.album}
            fill
            quality={100}
            className="object-cover w-full h-full"
            data-ai-hint="album cover"
            unoptimized={currentSong.isFromYouTube}
            priority
          />
        )}
      </div>
    );
  };

  const renderDesktopLayout = () => (
    <SheetContent side="bottom" className="h-full w-full bg-gradient-to-b from-primary/20 via-background to-background p-4 md:p-6 lg:p-8 flex flex-col">
      <SheetHeader className="relative">
        <Button variant="ghost" size="icon" onClick={toggleFullScreenPlayer} className="absolute left-0 top-0 text-muted-foreground">
          <ChevronDown size={24} />
        </Button>
        <SheetTitle className="text-center text-sm font-normal uppercase tracking-wider text-muted-foreground">Now Playing</SheetTitle>
      </SheetHeader>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 pt-8">
        {renderPlayerMedia()}
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
          <Button variant="ghost" size="icon" onClick={toggleShuffle} className={cn("text-muted-foreground h-14 w-14", shuffle && "text-primary")} aria-label="Toggle shuffle">
            <Shuffle size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={playPrev} disabled={!currentSong} className="text-foreground h-14 w-14">
            <SkipBack size={32} className="fill-current" />
          </Button>
          <Button size="icon" className="w-20 h-20 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={togglePlay} disabled={!currentSong} >
            {isPlaying ? <Pause size={40} className="fill-current" /> : <Play size={40} className="fill-current ml-1" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentSong} className="text-foreground h-14 w-14">
            <SkipForward size={32} className="fill-current" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleLoop} className={cn("text-muted-foreground h-14 w-14", loop !== 'none' && "text-primary")} aria-label="Toggle loop">
            {loop === 'song' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2">
          {currentSong && (
            <AddToPlaylistDropdown currentSong={currentSong}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ListPlus size={18} />
              </Button>
            </AddToPlaylistDropdown>
          )}

          <div className="flex items-center gap-2">
            {currentSong.isFromYouTube && (
              <>
                <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground hover:text-foreground" aria-label="Share video">
                  <Share size={18} />
                </Button>
                {!isYoutubeMode && (
                  <Button variant="ghost" size="icon" onClick={toggleShowVideo} className={cn("text-muted-foreground hover:text-foreground", showVideo && "text-primary")}>
                    <Youtube size={18} />
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={toggleQueue} className="text-muted-foreground hover:text-foreground"><Mic2 size={18} /></Button>
            <Button variant="ghost" size="icon" onClick={toggleQueue} className="text-muted-foreground hover:text-foreground"><ListMusic size={18} /></Button>
          </div>
        </div>
      </div>
    </SheetContent>
  );

  const renderMobileLayout = () => (
    <SheetContent side="bottom" className="h-full w-full bg-gradient-to-b from-primary/10 via-background to-background p-0 flex flex-col">
      <SheetHeader className="relative px-4 pt-4 pb-2 z-10 flex flex-row items-center justify-between">
        <Button variant="ghost" size="icon" onClick={toggleFullScreenPlayer} className="text-muted-foreground shrink-0">
          <ChevronDown size={28} />
        </Button>
        <SheetTitle className="flex-1 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Now Playing</SheetTitle>
        <div className="w-10"></div> {/* Spacer to center the title */}
      </SheetHeader>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        {renderPlayerMedia()}
      </div>

      <div className="flex flex-col gap-6 pb-8 px-6 w-full max-w-md mx-auto">
        {/* Title, Artist, and Top Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight truncate pb-1">{currentSong.title}</h2>
            <p className="text-lg text-muted-foreground truncate">{currentSong.artist}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AddToPlaylistDropdown currentSong={currentSong}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground w-10 h-10 rounded-full" aria-label="Add to Playlist">
                <ListPlus size={22} />
              </Button>
            </AddToPlaylistDropdown>
            {currentSong.isFromYouTube && (
              <>
                <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground hover:text-foreground w-10 h-10 rounded-full" aria-label="Share">
                  <Share size={22} />
                </Button>
                {!isYoutubeMode && (
                  <Button variant="ghost" size="icon" onClick={toggleShowVideo} className={cn("text-muted-foreground hover:text-foreground w-10 h-10 rounded-full", showVideo && "text-primary bg-primary/10")} aria-label="Toggle Video">
                    <Youtube size={24} />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mt-2">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className={cn("w-full h-2 group cursor-pointer", !currentSong && "opacity-50")}
            disabled={!currentSong}
          />
          <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
            <span>{currentTime}</span>
            <span>{displayDuration || "0:00"}</span>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="icon" onClick={toggleShuffle} className={cn("text-muted-foreground w-12 h-12 rounded-full", shuffle && "text-primary")} >
            <Shuffle size={24} />
          </Button>
          <Button variant="ghost" size="icon" onClick={playPrev} disabled={!currentSong} className="text-foreground w-16 h-16 rounded-full hover:bg-muted/50">
            <SkipBack size={36} className="fill-current" />
          </Button>
          <Button size="icon" className="w-[84px] h-[84px] rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-lg" onClick={togglePlay} disabled={!currentSong} >
            {isPlaying ? <Pause size={44} className="fill-current" /> : <Play size={44} className="fill-current ml-1" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext} disabled={!currentSong} className="text-foreground w-16 h-16 rounded-full hover:bg-muted/50">
            <SkipForward size={36} className="fill-current" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleLoop} className={cn("text-muted-foreground w-12 h-12 rounded-full", loop !== 'none' && "text-primary")} >
            {loop === 'song' ? <Repeat1 size={24} /> : <Repeat size={24} />}
          </Button>
        </div>

        {/* Bottom Pills */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button variant="secondary" className="rounded-full px-6 h-10 font-semibold text-sm hover:bg-secondary/80 transition-colors" onClick={toggleQueue}>
            <ListMusic size={18} className="mr-2 opacity-70" /> Up Next
          </Button>
          <Button variant="secondary" className="rounded-full px-6 h-10 font-semibold text-sm hover:bg-secondary/80 transition-colors" onClick={toggleQueue}>
            <Mic2 size={18} className="mr-2 opacity-70" /> Lyrics
          </Button>
        </div>

      </div>
    </SheetContent>
  );

  return (
    <Sheet open={isFullScreenPlayerOpen} onOpenChange={toggleFullScreenPlayer}>
      {isMounted ? (isDesktop ? renderDesktopLayout() : renderMobileLayout()) : null}
    </Sheet>
  );
}
