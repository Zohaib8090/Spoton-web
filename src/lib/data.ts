import { PlaceHolderImages } from './placeholder-images';
import type { Song, Album, Playlist } from './types';

const getImage = (id: string) => PlaceHolderImages.find((img) => img.id === id)?.imageUrl || '';

const songsData: Omit<Song, 'album' | 'albumId' | 'albumArt'>[] = [
  { id: 's1', artist: 'Stellar Fusion', title: 'Cosmic Drift', duration: '3:45', audioSrc: '' },
  { id: 's2', artist: 'Stellar Fusion', title: 'Nebula Dreams', duration: '4:12', audioSrc: '' },
  { id: 's3', artist: 'Stellar Fusion', title: 'Zero Gravity', duration: '2:58', audioSrc: '' },
  { id: 's4', artist: 'Stellar Fusion', title: 'Orion\'s Belt', duration: '5:02', audioSrc: '' },
  { id: 's5', artist: 'Luna Whisper', title: 'Midnight Bloom', duration: '3:30', audioSrc: '' },
  { id: 's6', artist: 'Luna Whisper', title: 'Echoes in Rain', duration: '4:05', audioSrc: '' },
  { id: 's7', artist: 'Luna Whisper', title: 'Silent Reverie', duration: '2:45', audioSrc: '' },
  { id: 's8', artist: 'Urban Vibe', title: 'City Lights', duration: '3:15', audioSrc: '' },
  { id: 's9', artist: 'Urban Vibe', title: 'Asphalt Groove', duration: '2:55', audioSrc: '' },
  { id: 's10', artist: 'Helios Creed', title: 'Sunbeam', duration: '4:20', audioSrc: '' },
  { id: 's11', artist: 'Helios Creed', title: 'Dawn Chorus', duration: '3:50', audioSrc: '' },
  { id: 's12', artist: 'Terraformer', title: 'Geode', duration: '5:10', audioSrc: '' },
  { id: 's13', artist: 'Terraformer', title: 'Fractal Forest', duration: '4:44', audioSrc: '' },
  { id: 's14', artist: 'The Grid', title: 'Cyber-Funk', duration: '3:21', audioSrc: '' },
  { id: 's15', artist: 'The Grid', title: 'Neon Pulse', duration: '4:01', audioSrc: '' },
];

export const albums: Album[] = [
  {
    id: 'album-1', name: 'Galaxy Glider', artist: 'Stellar Fusion', albumArt: getImage('album-1'),
    songs: [
      { ...songsData[0], album: 'Galaxy Glider', albumId: 'album-1', albumArt: getImage('album-1') },
      { ...songsData[1], album: 'Galaxy Glider', albumId: 'album-1', albumArt: getImage('album-1') },
      { ...songsData[2], album: 'Galaxy Glider', albumId: 'album-1', albumArt: getImage('album-1') },
      { ...songsData[3], album: 'Galaxy Glider', albumId: 'album-1', albumArt: getImage('album-1') },
    ]
  },
  {
    id: 'album-2', name: 'Nightfall', artist: 'Luna Whisper', albumArt: getImage('album-2'),
    songs: [
      { ...songsData[4], album: 'Nightfall', albumId: 'album-2', albumArt: getImage('album-2') },
      { ...songsData[5], album: 'Nightfall', albumId: 'album-2', albumArt: getImage('album-2') },
      { ...songsData[6], album: 'Nightfall', albumId: 'album-2', albumArt: getImage('album-2') },
    ]
  },
  {
    id: 'album-3', name: 'Metropolis', artist: 'Urban Vibe', albumArt: getImage('album-3'),
    songs: [
      { ...songsData[7], album: 'Metropolis', albumId: 'album-3', albumArt: getImage('album-3') },
      { ...songsData[8], album: 'Metropolis', albumId: 'album-3', albumArt: getImage('album-3') },
    ]
  },
  {
    id: 'album-4', name: 'Eos', artist: 'Helios Creed', albumArt: getImage('album-4'),
    songs: [
      { ...songsData[9], album: 'Eos', albumId: 'album-4', albumArt: getImage('album-4') },
      { ...songsData[10], album: 'Eos', albumId: 'album-4', albumArt: getImage('album-4') },
    ]
  },
  {
    id: 'album-5', name: 'Crystalline', artist: 'Terraformer', albumArt: getImage('album-5'),
    songs: [
      { ...songsData[11], album: 'Crystalline', albumId: 'album-5', albumArt: getImage('album-5') },
      { ...songsData[12], album: 'Crystalline', albumId: 'album-5', albumArt: getImage('album-5') },
    ]
  },
  {
    id: 'album-6', name: 'Digital Dreams', artist: 'The Grid', albumArt: getImage('album-6'),
    songs: [
      { ...songsData[13], album: 'Digital Dreams', albumId: 'album-6', albumArt: getImage('album-6') },
      { ...songsData[14], album: 'Digital Dreams', albumId: 'album-6', albumArt: getImage('album-6') },
    ]
  },
];

export const allSongs: Song[] = albums.flatMap(album => album.songs);

export const playlists: Playlist[] = [
  {
    id: 'playlist-1', name: 'Chill Vibes', description: 'Relax and unwind with these mellow tracks.', coverArt: getImage('playlist-1'),
    songs: [allSongs[4], allSongs[6], allSongs[1], allSongs[10]]
  },
  {
    id: 'playlist-2', name: 'Workout Beats', description: 'High-energy tracks to power your workout.', coverArt: getImage('playlist-2'),
    songs: [allSongs[7], allSongs[8], allSongs[13], allSongs[0]]
  },
  {
    id: 'playlist-3', name: 'Deep Focus', description: 'Instrumental tracks for concentration.', coverArt: getImage('playlist-3'),
    songs: [allSongs[2], allSongs[9], allSongs[11], allSongs[5]]
  },
];
