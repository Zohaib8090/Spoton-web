"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlbumArtwork } from '@/components/album-artwork';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LibraryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const playlistsQuery = useMemoFirebase(() => 
    user && firestore ? collection(firestore, 'users', user.uid, 'playlists') : null,
    [user, firestore]
  );
  const { data: playlists, isLoading: playlistsLoading } = useCollection(playlistsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleCreatePlaylist = async () => {
    if (!user || !firestore) return;
    
    const randomCover = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl;

    try {
      await addDoc(collection(firestore, 'users', user.uid, 'playlists'), {
        name: 'My New Playlist',
        description: 'A collection of my favorite tracks.',
        trackIds: [],
        createdAt: serverTimestamp(),
        coverArt: randomCover,
        userId: user.uid,
      });
      toast({
        title: 'Playlist created!',
        description: 'Your new playlist has been added to your library.',
      });
    } catch (error) {
        console.error("Error creating playlist:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not create playlist."
        });
    }
  };


  if (isUserLoading || !user || playlistsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Library</h1>
            <Button onClick={handleCreatePlaylist}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Playlist
            </Button>
        </div>
      
      <Tabs defaultValue="playlists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="liked">Liked Songs</TabsTrigger>
        </TabsList>

        <TabsContent value="playlists">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {playlists && playlists.map((playlist) => (
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
            {(!playlists || playlists.length === 0) && (
                <div className="text-center text-muted-foreground py-12">
                    <p>You haven&apos;t created any playlists yet.</p>
                </div>
            )}
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
