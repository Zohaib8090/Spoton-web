
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Song } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playlist: Song[];
  listeningHistory: string[];
  isFullScreenPlayerOpen: boolean;
  toggleFullScreenPlayer: () => void;
  playSong: (song: Song, playlist?: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  closePlayer: () => void;
  audioElement: HTMLAudioElement | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [listeningHistory, setListeningHistory] = useState<string[]>([]);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const { toast } = useToast();
  
  const currentSongRef = useRef(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    const audio = new Audio();
    setAudioElement(audio);

    const handleEnded = () => playNext();
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      // Use the ref here to get the latest value of currentSong in the cleanup function
      if (currentSongRef.current?.audioSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(currentSongRef.current.audioSrc);
      }
      audio.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioElement && currentSong) {
      if (audioElement.src !== currentSong.audioSrc) {
        // Clean up old blob URL if it exists
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
  }, [currentSong, isPlaying, audioElement]);


  const playSong = useCallback((song: Song, newPlaylist: Song[] = []) => {
    setCurrentSong(song);
    setIsPlaying(true);
    if (newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
    } else {
      setPlaylist([song]);
    }
    if (song.audioSrc && !song.audioSrc.startsWith('blob:')) {
        setListeningHistory(prev => [...new Set([`${song.title} - ${song.artist}`, ...prev])].slice(0, 20));
    }
    
    toast({
      title: "Now Playing",
      description: `${song.title} by ${song.artist}`,
    });
  }, [toast]);

  const togglePlay = useCallback(() => {
    if (currentSong) {
      setIsPlaying(prev => !prev);
    }
  }, [currentSong]);

  const playNext = useCallback(() => {
    if (!currentSong) return;
    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      playSong(playlist[nextIndex], playlist);
    }
  }, [currentSong, playlist, playSong]);

  const playPrev = useCallback(() => {
    if (!currentSong) return;
    const currentIndex = playlist.findIndex(song => song.id === currentSong.id);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
      playSong(playlist[prevIndex], playlist);
    }
  }, [currentSong, playlist, playSong]);
  
  const closePlayer = useCallback(() => {
    if (audioElement) {
        audioElement.pause();
        if (currentSong?.audioSrc && currentSong.audioSrc.startsWith('blob:')) {
           URL.revokeObjectURL(currentSong.audioSrc);
        }
    }
    setCurrentSong(null);
    setIsPlaying(false);
    setIsFullScreenPlayerOpen(false);
  }, [audioElement, currentSong]);

  const toggleFullScreenPlayer = useCallback(() => {
    if (currentSong) {
        setIsFullScreenPlayerOpen(prev => !prev);
    }
  }, [currentSong]);

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
    isFullScreenPlayerOpen,
    toggleFullScreenPlayer
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
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
