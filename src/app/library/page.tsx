"use client";

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { playlists } from '@/lib/data';
import { AlbumArtwork } from '@/components/album-artwork';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LibraryPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }
  
  // For now, we'll just use the mock data
  const userPlaylists = playlists;
  const likedSongsAlbum = {
    id: 'liked-songs',
    name: 'Liked Songs',
    artist: 'Your favorite tracks',
    albumArt: 'https://picsum.photos/seed/liked/400/400',
    songs: [], // In a real app, this would be populated with liked songs
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Library</h1>
      
      <Tabs defaultValue="playlists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="liked">Liked Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {userPlaylists.map((playlist) => (
              <AlbumArtwork
                key={playlist.id}
                album={{
                  id: playlist.id,
                  name: playlist.name,
                  artist: playlist.description || 'Playlist',
                  albumArt: playlist.coverArt,
                  songs: playlist.songs,
                }}
                isPlaylist
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="liked">
            <p className="text-muted-foreground">Liked songs will appear here. For now, this is just a placeholder.</p>
        </TabsContent>
        <TabsContent value="albums">
            <p className="text-muted-foreground">Saved albums will appear here. For now, this is just a placeholder.</p>
        </TabsContent>
        <TabsContent value="artists">
            <p className="text-muted-foreground">Followed artists will appear here. For now, this is just a placeholder.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
