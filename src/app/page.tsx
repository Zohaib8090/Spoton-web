
"use client";

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AlbumArtwork } from "@/components/album-artwork";
import { PersonalizedRecommendations } from "@/components/personalized-recommendations";
import { albums, playlists } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';

function HomePageContent() {
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
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8 pb-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Personalized Recommendations</h2>
        </div>
        <PersonalizedRecommendations />
      </div>

      <Separator />
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Playlists</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
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

export default function Home() {
  return (
    <Suspense fallback={<div className="space-y-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>}>
      <HomePageContent />
    </Suspense>
  );
}
