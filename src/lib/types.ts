
export interface Song {
  id: string;
  artist: string;
  title: string;
  duration: string;
  album: string;
  albumId: string;
  albumArt: string;
  audioSrc: string; // This will be a placeholder or a blob URL for local files
  isFromYouTube?: boolean; // Flag to identify YouTube tracks
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  songs: Song[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: Song[];
  coverArt: string;
  userId?: string;
  trackIds?: string[];
}

export interface HistoryItem {
    id: string;
    artist: string;
    title: string;
    albumArt: string;
    duration: string;
    isFromYouTube: boolean;
    playedAt: any; // Firestore ServerTimestamp
    // Optional fields for reconstruction
    album?: string;
    albumId?: string;
    audioSrc?: string;
}
