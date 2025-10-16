
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlbumArtwork } from '@/components/album-artwork';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, addDoc, serverTimestamp }from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, Music, FolderUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { PlaylistContent } from '@/components/playlist-content';
import type { Song } from '@/lib/types';

export default function LibraryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newSongs: Song[] = Array.from(files)
      .filter(file => file.type.startsWith('audio/') || file.type.startsWith('video/'))
      .map((file, index) => {
        const audioSrc = URL.createObjectURL(file);
        return {
          id: `local-${file.name}-${index}`,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          artist: "Unknown Artist",
          album: "Local Files",
          albumId: "local",
          albumArt: "https://picsum.photos/seed/local-default/400/400", // Generic image
          duration: "N/A", // Can't easily get duration without more complex logic
          audioSrc: audioSrc,
        };
      });

    setLocalSongs(currentSongs => [...currentSongs, ...newSongs]);
    toast({
        title: `${newSongs.length} file(s) added`,
        description: "These files are available for this session only.",
    })
  };

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
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
          <TabsTrigger value="local">Local Files</TabsTrigger>
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
        <TabsContent value="local">
           <div className="space-y-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="audio/*,video/*"
                    className="hidden"
                />
                {localSongs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4">
                        <Music className="h-12 w-12" />
                        <h3 className="text-lg font-semibold">Play from your device</h3>
                        <p className="max-w-md">Select local audio and video files to play them in the app. These files are only available for your current session and won&apos;t be saved.</p>
                        <Button onClick={handleSelectFilesClick}>
                            <FolderUp className="mr-2 h-4 w-4" />
                            Select Files
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-bold">Your Local Files ({localSongs.length})</h3>
                             <Button onClick={handleSelectFilesClick} variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add More Files
                            </Button>
                        </div>
                        <PlaylistContent songs={localSongs} />
                    </div>
                )}
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
