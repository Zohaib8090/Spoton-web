
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AlbumArtwork } from "@/components/album-artwork";
import { MadeForYou } from "@/components/made-for-you";
import { albums, playlists } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  
  const featuredAlbums = albums.slice(0, 6);
  const featuredPlaylists = playlists.slice(0, 4);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Made for You</h2>
        </div>
        <MadeForYou />
      </div>

      <Separator />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Recommendations</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {featuredAlbums.map((album) => (
            <AlbumArtwork key={album.id} album={album} />
          ))}
        </div>
      </div>
      
      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Featured Playlists</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {featuredPlaylists.map((playlist) => (
            <AlbumArtwork 
              key={playlist.id} 
              album={{
                id: playlist.id,
                name: playlist.name,
                artist: playlist.description || "Various Artists",
                albumArt: playlist.coverArt,
                songs: playlist.songs
              }}
              isPlaylist={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
