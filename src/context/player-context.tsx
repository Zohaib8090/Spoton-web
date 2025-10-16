

"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import type { Song } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import YouTube from 'react-youtube';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type LoopMode = 'none' | 'playlist' | 'song';
export type Quality = 'automatic' | 'high' | 'standard' | 'low' | 'very-high';
export type ConnectionType = 'wifi' | 'cellular' | 'unknown';
export type PlaybackQualitySettings = {
    audio: Record<'wifi' | 'cellular', Quality>;
    video: Record<'wifi' | 'cellular', Quality>;
};


// Define the shape of a single lyric line
export type LyricLine = {
  start: string;
  dur: string;
  text: string;
};

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playlist: Song[];
  listeningHistory: string[];
  isFullScreenPlayerOpen: boolean;
  isQueueOpen: boolean;
  shuffle: boolean;
  loop: LoopMode;
  lyrics: LyricLine[];
  isLyricsLoading: boolean;
  showVideo: boolean;
  audioElement: HTMLAudioElement | null;
  youtubePlayer: any | null; // YouTube player instance
  setLyrics: Dispatch<SetStateAction<LyricLine[]>>;
  setIsLyricsLoading: Dispatch<SetStateAction<boolean>>;
  setYoutubePlayer: Dispatch<SetStateAction<any | null>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  toggleShowVideo: () => void;
  toggleFullScreenPlayer: () => void;
  toggleQueue: () => void;
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
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState<LoopMode>('none');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const [connectionType, setConnectionType] = useState<ConnectionType>('unknown');
  
  const playbackQualitySettings: PlaybackQualitySettings = userData?.settings?.playbackQuality || {
    audio: { wifi: 'automatic', cellular: 'standard' },
    video: { wifi: 'standard', cellular: 'standard' },
  };

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

  useEffect(() => {
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection.type === 'wifi') {
          setConnectionType('wifi');
        } else if (connection.type === 'cellular') {
          setConnectionType('cellular');
        } else {
          setConnectionType('unknown');
        }
      }
    };
    updateConnectionType();
    if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.addEventListener('change', updateConnectionType);
        return () => connection.removeEventListener('change', updateConnectionType);
    }
  }, []);

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
    if (youtubePlayer && typeof youtubePlayer.getIframe === 'function' && youtubePlayer.getIframe()) {
      const isVideo = showVideo; // or some other logic to determine if it's video
      const qualitySetting = isVideo ? playbackQualitySettings.video[connectionType] : playbackQualitySettings.audio[connectionType];
      
      let quality: string;
      switch(qualitySetting) {
          case 'very-high': quality = 'highres'; break;
          case 'high': quality = 'hd1080'; break;
          case 'standard': quality = 'hd720'; break;
          case 'low': quality = 'large'; break;
          default: quality = 'default';
      }
      youtubePlayer.setPlaybackQuality(quality);
    }
  }, [playbackQualitySettings, youtubePlayer, showVideo, connectionType]);

  useEffect(() => {
    if (currentSong?.isFromYouTube) {
        if (audioElement) audioElement.pause();
        if (youtubePlayer && youtubePlayer.playVideo) {
            if (isPlaying) {
                youtubePlayer.playVideo();
            } else {
                youtubePlayer.pauseVideo();
            }
        }
    } else {
        if (youtubePlayer && youtubePlayer.stopVideo) youtubePlayer.stopVideo();
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
        setIsFullScreenPlayerOpen(prev => {
            if (!prev) setShowVideo(false); // Reset to album art view when opening
            return !prev;
        });
    }
  }, [currentSong]);

  const toggleQueue = useCallback(() => {
    setIsQueueOpen(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop(currentLoop => {
        if (currentLoop === 'none') return 'playlist';
        if (currentLoop === 'playlist') return 'song';
        return 'none';
    });
  }, []);
  
  useEffect(() => {
    if (playlist.length === 0) return;

    const handleShuffleToast = () => {
      toast({ description: shuffle ? "Shuffle enabled" : "Shuffle disabled" });
    }
    handleShuffleToast();

  }, [shuffle, playlist.length, toast])

  useEffect(() => {
    if (playlist.length === 0) return;

    const handleLoopToast = () => {
      let description = "";
      if (loop === 'playlist') {
          description = "Looping playlist";
      } else if (loop === 'song') {
          description = "Looping song";
      } else {
          description = "Looping disabled";
      }
      toast({ description });
    }
    handleLoopToast();
  }, [loop, playlist.length, toast]);

  const toggleShowVideo = useCallback(() => {
      let time = 0;
      if (currentSong?.isFromYouTube && youtubePlayer) {
          time = youtubePlayer.getCurrentTime();
      } else if (audioElement) {
          time = audioElement.currentTime;
      }
      setCurrentTime(time);
      setShowVideo(prev => !prev);
  }, [currentSong, youtubePlayer, audioElement]);
  
  const onPlayerReady = (event: any) => {
    setYoutubePlayer(event.target);
    if (showVideo && currentTime > 0) {
      event.target.seekTo(currentTime, true);
    }
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
    isQueueOpen,
    toggleQueue,
    shuffle,
    loop,
    toggleShuffle,
    toggleLoop,
    lyrics,
    setLyrics,
    isLyricsLoading,
    setIsLyricsLoading,
    showVideo,
    toggleShowVideo,
    setYoutubePlayer,
    setCurrentTime,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div className={cn('hidden', currentSong?.isFromYouTube && !showVideo && 'block')}>
        <YouTube 
          videoId={currentSong?.isFromYouTube ? currentSong.id : undefined}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          opts={{
            height: '0',
            width: '0',
            playerVars: {
              autoplay: 1,
              start: currentTime,
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

    