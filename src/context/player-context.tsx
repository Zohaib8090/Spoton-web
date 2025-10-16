
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Song } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import YouTube from 'react-youtube';

type LoopMode = 'none' | 'playlist' | 'song';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playlist: Song[];
  listeningHistory: string[];
  isFullScreenPlayerOpen: boolean;
  shuffle: boolean;
  loop: LoopMode;
  audioElement: HTMLAudioElement | null;
  youtubePlayer: any | null; // YouTube player instance
  toggleFullScreenPlayer: () => void;
  playSong: (song: Song, playlist?: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  closePlayer: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  const [listeningHistory, setListeningHistory] = useState<string[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [youtubePlayer, setYoutubePlayer] = useState<any | null>(null);
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState<LoopMode>('none');
  const { toast } = useToast();

  const currentSongRef = useRef(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const playNextRef = useRef<() => void>(() => {});

  const handleSongEnd = useCallback(() => {
    playNextRef.current();
  }, []);

  useEffect(() => {
    const audio = new Audio();
    setAudioElement(audio);
    audio.addEventListener('ended', handleSongEnd);

    return () => {
      audio.removeEventListener('ended', handleSongEnd);
      if (currentSongRef.current?.audioSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(currentSongRef.current.audioSrc);
      }
      audio.pause();
    };
  }, [handleSongEnd]);

  const playSong = useCallback((song: Song, newPlaylist?: Song[]) => {
    if (currentSong?.isFromYouTube && youtubePlayer) {
      youtubePlayer.stopVideo();
    } else if (audioElement) {
      audioElement.pause();
    }
    
    setCurrentSong(song);
    setIsPlaying(true);
    
    if (newPlaylist && newPlaylist.length > 0) {
      const isDifferentPlaylist = JSON.stringify(newPlaylist) !== JSON.stringify(playlist);
      if (isDifferentPlaylist) {
        setPlaylist(newPlaylist);
        if (shuffle) {
          const shuffled = [...newPlaylist].sort(() => Math.random() - 0.5);
          setShuffledPlaylist(shuffled);
        }
      }
    } else if (!newPlaylist || newPlaylist.length === 0) {
        setPlaylist([song]);
        setShuffledPlaylist([song]);
    }

    if (song.audioSrc && !song.audioSrc.startsWith('blob:')) {
        setListeningHistory(prev => [...new Set([`${song.title} - ${song.artist}`, ...prev])].slice(0, 20));
    }
    
    toast({
      title: "Now Playing",
      description: `${song.title} by ${song.artist}`,
    });
  }, [toast, shuffle, playlist, audioElement, youtubePlayer, currentSong]);

  const playNext = useCallback(() => {
    const activePlaylist = shuffle ? shuffledPlaylist : playlist;
    if (!currentSong || activePlaylist.length === 0) return;

    if (loop === 'song') {
      if (currentSong.isFromYouTube && youtubePlayer) {
          youtubePlayer.seekTo(0);
          youtubePlayer.playVideo();
      } else if (audioElement) {
          audioElement.currentTime = 0;
          audioElement.play();
      }
      return;
    }
      
    const currentIndex = activePlaylist.findIndex(song => song.id === currentSong.id);

    if (currentIndex !== -1) {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= activePlaylist.length) {
        if (loop === 'playlist') {
          nextIndex = 0;
        } else {
          setIsPlaying(false);
          return; 
        }
      }
      playSong(activePlaylist[nextIndex], playlist);
    }
  }, [currentSong, playlist, shuffledPlaylist, shuffle, loop, playSong, audioElement, youtubePlayer]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    if (audioElement) {
      audioElement.loop = loop === 'song';
    }
  }, [loop, audioElement]);

  useEffect(() => {
    if (currentSong?.isFromYouTube) {
        if (audioElement) audioElement.pause();
        if (youtubePlayer) {
            if (isPlaying) {
                youtubePlayer.playVideo();
            } else {
                youtubePlayer.pauseVideo();
            }
        }
    } else {
        if (youtubePlayer) youtubePlayer.stopVideo();
        if (audioElement && currentSong) {
            if (audioElement.src !== currentSong.audioSrc) {
                if (audioElement.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioElement.src);
                }
                audioElement.src = currentSong.audioSrc;
            }
            if (isPlaying) {
                audioElement.play().catch(e => console.error("Playback failed", e));
            } else {
                audioElement.pause();
            }
        } else if (audioElement && !currentSong) {
            audioElement.pause();
            audioElement.src = '';
        }
    }
  }, [currentSong, isPlaying, audioElement, youtubePlayer]);

  const togglePlay = useCallback(() => {
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong]);

  const playPrev = useCallback(() => {
    const activePlaylist = shuffle ? shuffledPlaylist : playlist;
    if (!currentSong || activePlaylist.length === 0) return;

    const currentIndex = activePlaylist.findIndex(song => song.id === currentSong.id);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + activePlaylist.length) % activePlaylist.length;
      playSong(activePlaylist[prevIndex], playlist);
    }
  }, [currentSong, playlist, shuffledPlaylist, playSong, shuffle]);
  
  const closePlayer = useCallback(() => {
    if (audioElement) audioElement.pause();
    if (youtubePlayer) youtubePlayer.stopVideo();
    if (currentSong?.audioSrc && currentSong.audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(currentSong.audioSrc);
    }
    setCurrentSong(null);
    setIsPlaying(false);
    setIsFullScreenPlayerOpen(false);
  }, [audioElement, youtubePlayer, currentSong]);

  const toggleFullScreenPlayer = useCallback(() => {
    if (currentSong) {
        setIsFullScreenPlayerOpen(prev => !prev);
    }
  }, [currentSong]);

  const toggleShuffle = () => {
    const newShuffleState = !shuffle;
    setShuffle(newShuffleState);
    if (newShuffleState) {
        setShuffledPlaylist([...playlist].sort(() => Math.random() - 0.5));
        toast({ description: "Shuffle enabled" });
    } else {
        toast({ description: "Shuffle disabled" });
    }
  };

  const toggleLoop = () => {
    let newLoopMode: LoopMode;
    let description = "";
    
    if (loop === 'none') {
        newLoopMode = 'playlist';
        description = "Looping playlist";
    } else if (loop === 'playlist') {
        newLoopMode = 'song';
        description = "Looping song";
    } else {
        newLoopMode = 'none';
        description = "Looping disabled";
    }
    
    setLoop(newLoopMode);
    toast({ description });
  };
  
  const onPlayerReady = (event: any) => {
    setYoutubePlayer(event.target);
  };
  
  const onPlayerStateChange = (event: any) => {
    // 0 = ended
    if (event.data === 0) {
      handleSongEnd();
    }
  };

  const value = {
    currentSong,
    isPlaying,
    playlist,
    listeningHistory,
    playSong,
    togglePlay,
    playNext,
    playPrev,
    closePlayer,
    audioElement,
    youtubePlayer,
    isFullScreenPlayerOpen,
    toggleFullScreenPlayer,
    shuffle,
    loop,
    toggleShuffle,
    toggleLoop,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div className="hidden">
        <YouTube 
          videoId={currentSong?.isFromYouTube ? currentSong.id : undefined}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          opts={{
            height: '0',
            width: '0',
            playerVars: {
              autoplay: 1,
            },
          }}
        />
      </div>
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
