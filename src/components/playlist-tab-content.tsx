
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { AlbumArtwork } from '@/components/album-artwork';

export function PlaylistTabContent() {
  const { user } = useUser();
  const firestore = useFirestore();

  const playlistsQuery = useMemoFirebase(() => 
    user && firestore ? collection(firestore, 'users', user.uid, 'playlists') : null,
    [user, firestore]
  );
  const { data: playlists } = useCollection(playlistsQuery);

  if (!playlists || playlists.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>You haven&apos;t created any playlists yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
      {playlists.map((playlist) => (
        <AlbumArtwork
          key={playlist.id}
          album={{
            id: playlist.id,
            name: playlist.name,
            artist: playlist.description || 'Playlist',
            albumArt: playlist.coverArt,
            songs: [], // Songs would be fetched separately
          }}
          isPlaylist
        />
      ))}
    </div>
  );
}
