export interface Song {
  id: string;
  artist: string;
  title: string;
  duration: string;
  album: string;
  albumId: string;
  albumArt: string;
  audioSrc: string; // This will be a placeholder
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
}
