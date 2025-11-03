"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import type { Song } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import YouTube from 'react-youtube';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { generatePersonalizedRecommendations } from '@/ai/flows/personalized-recommendations';
import { searchYoutubeAction, type YoutubeResult } from '@/app/search/actions';

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

const BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const DEFAULT_EQ_SETTINGS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playlist: Song[];
  listeningHistory: Song[];
  isFullScreenPlayerOpen: boolean;
  isQueueOpen: boolean;
  shuffle: boolean;
  loop: LoopMode;
  lyrics: LyricLine[];
  isLyricsLoading: boolean;
  showVideo: boolean;
  audioElement: HTMLAudioElement | null;
  youtubePlayer: any | null; // YouTube player instance
  isEqEnabled: boolean;
  equaliserSettings: number[];
  setLyrics: Dispatch<SetStateAction<LyricLine[]>>;
  setIsLyricsLoading: Dispatch<SetStateAction<boolean>>;
  setYoutubePlayer: Dispatch<SetStateAction<any | null>>;
  setEqualiserSettings: (settings: number[]) => void;
  toggleEq: () => void;
  toggleShowVideo: () => void;
  toggleFullScreenPlayer: () => void;
  toggleQueue: () => void;
  playSong: (song: Song, newPlaylist?: Song[], isAutoplay?: boolean) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  closePlayer: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  handleCreatePlaylist: () => void;
  seek: (percentage: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  const [listeningHistory, setListeningHistory] = useState<Song[]>([]);
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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const eqNodesRef = useRef<BiquadFilterNode[]>([]);

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userData } = useDoc(userDocRef);

  const [connectionType, setConnectionType] = useState<ConnectionType>('unknown');
  
  const playbackQualitySettings: PlaybackQualitySettings = userData?.settings?.playbackQuality || {
    audio: { wifi: 'automatic', cellular: 'standard' },
    video: { wifi: 'standard', cellular: 'standard' },
  };
  
  const listeningControls = userData?.settings?.listeningControls || {
      volumeNormalization: true,
      autoPlay: true,
      monoAudio: false,
      equaliserEnabled: false,
      balance: 0,
  };
  const trackTransitions = userData?.settings?.trackTransitions || { gaplessPlayback: true, automix: false, crossfade: 0 };
  
  const [equaliserSettings, _setEqualiserSettings] = useState<number[]>(userData?.settings?.equaliser || DEFAULT_EQ_SETTINGS);
  const [isEqEnabled, setIsEqEnabled] = useState(listeningControls.equaliserEnabled);

  const { toast } = useToast();

  const currentSongRef = useRef(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const playNextRef = useRef<() => void>(() => {});
  const nextSongTriggeredRef = useRef(false);

  // Load listening history from local storage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('listeningHistory');
      if (savedHistory) {
        setListeningHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Could not load listening history from localStorage", error);
    }
  }, []);

  // Save listening history to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('listeningHistory', JSON.stringify(listeningHistory));
    } catch (error) {
      console.error("Could not save listening history to localStorage", error);
    }
  }, [listeningHistory]);

  const handleSongEnd = useCallback(() => {
    if (!nextSongTriggeredRef.current) {
        playNextRef.current();
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    setAudioElement(audio);
    audio.addEventListener('ended', handleSongEnd);

    return () => {
      audio.removeEventListener('ended', handleSongEnd);
    };
  }, [handleSongEnd]);

  const setupAudioContext = useCallback(() => {
    if (!audioElement || typeof window === 'undefined') return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    
    if (!audioSourceRef.current || audioSourceRef.current.mediaElement !== audioElement) {
        try {
          audioSourceRef.current = audioContext.createMediaElementSource(audioElement);
        } catch(e) {
            return; // Already connected or other error
        }
    }
    let lastNode: AudioNode = audioSourceRef.current;

    // Disconnect previous nodes to rebuild the chain
    try {
      lastNode.disconnect();
    } catch(e) { /* ignore */ }

    // Equaliser setup
    if (isEqEnabled) {
      const currentEqSettings = equaliserSettings || DEFAULT_EQ_SETTINGS;
      if (eqNodesRef.current.length === 0) {
        eqNodesRef.current = BANDS.map((frequency, i) => {
          const filter = audioContext.createBiquadFilter();
          filter.type = i === 0 ? 'lowshelf' : (i === BANDS.length - 1 ? 'highshelf' : 'peaking');
          filter.frequency.value = frequency;
          filter.gain.value = currentEqSettings[i];
          filter.Q.value = 1.41;
          return filter;
        });
      } else {
         eqNodesRef.current.forEach((filter, i) => {
             filter.gain.value = currentEqSettings[i];
         });
      }
      eqNodesRef.current.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
    }
    
    // Panner setup for both mono and balance
    if (!pannerNodeRef.current) {
        pannerNodeRef.current = audioContext.createStereoPanner();
    }
    const balance = listeningControls.balance;
    pannerNodeRef.current.pan.value = typeof balance === 'number' && isFinite(balance) ? balance : 0;
    lastNode.connect(pannerNodeRef.current);
    lastNode = pannerNodeRef.current;
    
    lastNode.connect(audioContext.destination);

  }, [audioElement, isEqEnabled, listeningControls, equaliserSettings]);

  useEffect(() => {
    setupAudioContext();
  }, [setupAudioContext]);
  
  useEffect(() => {
    setIsEqEnabled(listeningControls.equaliserEnabled);
  }, [listeningControls.equaliserEnabled]);
  
  useEffect(() => {
      _setEqualiserSettings(userData?.settings?.equaliser || DEFAULT_EQ_SETTINGS);
  }, [userData?.settings?.equaliser]);

  const setEqualiserSettings = (settings: number[]) => {
    _setEqualiserSettings(settings);
    if(userDocRef) {
      setDoc(userDocRef, { settings: { equaliser: settings } }, { merge: true });
    }
    eqNodesRef.current.forEach((filter, i) => {
      if(filter) filter.gain.value = settings[i];
    });
  };

  const toggleEq = () => {
    const newEqState = !isEqEnabled;
    setIsEqEnabled(newEqState);
    if(userDocRef) {
      setDoc(userDocRef, { settings: { listeningControls: { equaliserEnabled: newEqState } } }, { merge: true });
    }
    setupAudioContext();
  };

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

  const playSong = useCallback((song: Song, newPlaylist?: Song[], isAutoplay: boolean = false) => {
    if (youtubePlayer && typeof youtubePlayer.stopVideo === 'function' && youtubePlayer.getIframe?.()?.src) {
        youtubePlayer.stopVideo();
    }
    if (audioElement) {
        audioElement.pause();
    }

    if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
    }

    if (audioElement && audioElement.src && audioElement.src.startsWith('blob:')) {
      URL.revokeObjectURL(audioElement.src);
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
      setListeningHistory(prev => {
        const newHistory = [song, ...prev.filter(s => s.id !== song.id)];
        return newHistory.slice(0, 20);
      });
    }
    
    if (!isAutoplay) {
        toast({
            title: "Now Playing",
            description: `${song.title} by ${song.artist}`,
        });
    }
    
    nextSongTriggeredRef.current = false;

  }, [toast, shuffle, playlist, audioElement, youtubePlayer]);

  const findAndPlaySong = async (query: string) => {
    try {
      const { results, error } = await searchYoutubeAction(query);
      if (error) {
        throw new Error(error);
      }
      if (results && results.length > 0) {
        const ytResult = results[0];
        const nextSong: Song = {
          id: ytResult.id,
          title: ytResult.title,
          artist: ytResult.artist,
          album: "YouTube",
          albumId: "youtube",
          albumArt: ytResult.thumbnail,
          duration: ytResult.duration,
          audioSrc: `youtube:${ytResult.id}`,
          isFromYouTube: true,
        };
        playSong(nextSong, [nextSong], true);
      }
    } catch (e) {
      console.error("Failed to find and play song", e);
    }
  };

  const playNext = useCallback(async () => {
    const activePlaylist = shuffle ? shuffledPlaylist : playlist;
    if (!currentSong || activePlaylist.length === 0) return;

    if (loop === 'song') {
      if (currentSong.isFromYouTube && youtubePlayer && typeof youtubePlayer.seekTo === 'function' && typeof youtubePlayer.playVideo === 'function' && youtubePlayer.getIframe?.()) {
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
          playSong(activePlaylist[nextIndex], playlist);
        } else if (listeningControls.autoPlay) {
            toast({ title: 'Autoplay', description: 'Playing a recommended song.' });
            try {
              const history = listeningHistory.map(s => `${s.title} - ${s.artist}`);
              const result = await generatePersonalizedRecommendations({ listeningHistory: history });
              if (result.recommendations.length > 0) {
                await findAndPlaySong(result.recommendations[0]);
              } else {
                setIsPlaying(false);
              }
            } catch (error) {
              console.error("Failed to get recommendations for autoplay:", error);
              setIsPlaying(false);
            }
        } else {
          setIsPlaying(false);
        }
        return; 
      }
       if (trackTransitions.gaplessPlayback || trackTransitions.automix) {
           playSong(activePlaylist[nextIndex], playlist);
       } else {
          setTimeout(() => playSong(activePlaylist[nextIndex], playlist), 1000);
       }
    }
  }, [currentSong, playlist, shuffledPlaylist, shuffle, loop, playSong, audioElement, youtubePlayer, listeningControls.autoPlay, listeningHistory, toast, trackTransitions]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

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
  
  const seek = (percentage: number) => {
    if (currentSong?.isFromYouTube && youtubePlayer?.getDuration) {
      const newTime = (percentage / 100) * youtubePlayer.getDuration();
      youtubePlayer.seekTo(newTime, true);
    } else if (audioElement?.duration) {
      audioElement.currentTime = (percentage / 100) * audioElement.duration;
    }
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong?.title,
        artist: currentSong?.artist,
        album: currentSong?.album,
        artwork: [
          { src: currentSong?.albumArt || '', sizes: '512x512', type: 'image/png' },
        ]
      });
  
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current());
    }
  }, [currentSong, togglePlay, playPrev, playNext]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioElement) {
      audioElement.loop = loop === 'song';
    }
  }, [loop, audioElement]);

  useEffect(() => {
    if (youtubePlayer && typeof youtubePlayer.getIframe === 'function' && youtubePlayer.getIframe()) {
      const isVideo = showVideo;
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
    if (fadeIntervalRef.current) return;

    const baseVolume = listeningControls.volumeNormalization ? 0.8 : 1;
    if (audioElement) audioElement.volume = baseVolume;
    if (youtubePlayer && typeof youtubePlayer.setVolume === 'function' && youtubePlayer.getIframe?.()) {
      youtubePlayer.setVolume(baseVolume * 100);
    }
    
  }, [listeningControls.volumeNormalization, audioElement, youtubePlayer, currentSong]);

  const updateProgress = useCallback(() => {
    if (!audioElement || !currentSong) return;

    if (trackTransitions.automix && trackTransitions.crossfade > 0 && !currentSong.isFromYouTube) {
        const timeLeft = audioElement.duration - audioElement.currentTime;
        const baseVolume = listeningControls.volumeNormalization ? 0.8 : 1;

        if (timeLeft <= trackTransitions.crossfade) {
            const volume = (timeLeft / trackTransitions.crossfade) * baseVolume;
            audioElement.volume = Math.max(0, volume);

            if (!nextSongTriggeredRef.current) {
                const activePlaylist = shuffle ? shuffledPlaylist : playlist;
                const currentIndex = activePlaylist.findIndex(s => s.id === currentSong.id);
                const nextIndex = (currentIndex + 1) % activePlaylist.length;
                if (currentIndex !== -1 && (nextIndex !== 0 || loop === 'playlist')) {
                    playNextRef.current();
                    nextSongTriggeredRef.current = true;
                }
            }
        }
    }
  }, [audioElement, currentSong, trackTransitions, listeningControls.volumeNormalization, shuffle, shuffledPlaylist, playlist, loop]);

  useEffect(() => {
    if (currentSong?.isFromYouTube) {
        if (audioElement) audioElement.pause();
        if (youtubePlayer && typeof youtubePlayer.playVideo === 'function' && youtubePlayer.getIframe?.()) {
            if (isPlaying) {
                youtubePlayer.playVideo();
            } else {
                youtubePlayer.pauseVideo();
            }
        }
    } else {
        if (youtubePlayer && typeof youtubePlayer.stopVideo === 'function' && youtubePlayer.getIframe?.()) {
            youtubePlayer.stopVideo();
        }
        if (audioElement && currentSong) {
            const isNewSong = audioElement.src !== currentSong.audioSrc;
            if (isNewSong) {
                if (audioElement.src && audioElement.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioElement.src);
                }
                audioElement.src = currentSong.audioSrc;
            }

            if (isPlaying) {
                if (audioContextRef.current?.state === 'suspended') {
                    audioContextRef.current.resume();
                }
                const playPromise = audioElement.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.error("Playback failed", e));
                }

                if (isNewSong && nextSongTriggeredRef.current && trackTransitions.automix && trackTransitions.crossfade > 0) {
                   const baseVolume = listeningControls.volumeNormalization ? 0.8 : 1;
                   audioElement.volume = 0;
                   const fadeDuration = trackTransitions.crossfade * 1000;
                   const steps = 50;
                   const stepDuration = fadeDuration / steps;
                   let currentStep = 0;

                   if(fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                   
                   fadeIntervalRef.current = setInterval(() => {
                        if(currentStep < steps) {
                            currentStep++;
                            audioElement.volume = (currentStep / steps) * baseVolume;
                        } else {
                            if(fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
                            fadeIntervalRef.current = null;
                        }
                   }, stepDuration);
                }

            } else {
                audioElement.pause();
            }
        } else if (audioElement && !currentSong) {
            audioElement.pause();
            audioElement.src = '';
        }
    }
  }, [currentSong, isPlaying, audioElement, youtubePlayer, trackTransitions.automix, trackTransitions.crossfade, listeningControls.volumeNormalization]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isPlaying) {
      progressInterval = setInterval(updateProgress, 100);
    }
    return () => clearInterval(progressInterval);
  }, [isPlaying, updateProgress]);

  
  const closePlayer = useCallback(() => {
    if (audioElement) {
        audioElement.pause();
        if (audioElement.src && audioElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(audioElement.src);
        }
        audioElement.src = '';
    }
    if (youtubePlayer && typeof youtubePlayer.stopVideo === 'function' && youtubePlayer.getIframe?.()) {
      youtubePlayer.stopVideo();
    }
    
    setCurrentSong(null);
    setIsPlaying(false);
    setIsFullScreenPlayerOpen(false);
  }, [audioElement, youtubePlayer]);

  const toggleFullScreenPlayer = useCallback(() => {
    if (currentSong) {
        setIsFullScreenPlayerOpen(prev => {
            if (!prev) setShowVideo(false);
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
    if (event.data === 0) {
        handleSongEnd();
    }
  };
  
  const handleCreatePlaylist = () => {
    if (!user || !firestore) return;
    
    const randomCover = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl;

    const newPlaylistData = {
      name: 'My New Playlist',
      description: 'A collection of my favorite tracks.',
      trackIds: [],
      createdAt: serverTimestamp(),
      coverArt: randomCover,
      userId: user.uid,
    };

    const playlistsCollection = collection(firestore, 'users', user.uid, 'playlists');

    addDoc(playlistsCollection, newPlaylistData)
      .then(() => {
          toast({
            title: 'Playlist created!',
            description: 'Your new playlist has been added to your library.',
          });
      })
      .catch((serverError) => {
          const permissionError = new FirestorePermissionError({
              path: playlistsCollection.path,
              operation: 'create',
              requestResourceData: newPlaylistData,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  };

  const value: PlayerContextType = {
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
    setEqualiserSettings,
    isEqEnabled,
    toggleEq,
    handleCreatePlaylist,
    seek,
    equaliserSettings
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
