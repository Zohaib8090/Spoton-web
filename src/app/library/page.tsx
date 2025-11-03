
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlbumArtwork } from '@/components/album-artwork';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle, Music, FolderUp, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaylistContent } from '@/components/playlist-content';
import type { Song, HistoryItem as HistoryItemType } from '@/lib/types';
import { usePlayer } from '@/context/player-context';
import { HistoryItem } from '@/components/history-item';

export default function LibraryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { handleCreatePlaylist } = usePlayer();
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playlistsQuery = useMemoFirebase(() => 
    user && firestore ? collection(firestore, 'users', user.uid, 'playlists') : null,
    [user, firestore]
  );
  const { data: playlists, isLoading: playlistsLoading } = useCollection(playlistsQuery);
  
  const historyQuery = useMemoFirebase(() => 
    user && firestore ? query(collection(firestore, 'users', user.uid, 'history'), orderBy('playedAt', 'desc'), limit(50)) : null,
    [user, firestore]
  );
  const { data: listeningHistory, isLoading: historyLoading } = useCollection<HistoryItemType>(historyQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newSongs = Array.from(files)
      .filter(file => file.type.startsWith('audio/') || file.type.startsWith('video/'))
      .map((file, index) => {
        return {
          id: `local-${file.name}-${index}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Unknown Artist",
          album: "Local Files",
          albumId: "local",
          albumArt: "https://picsum.photos/seed/local-default/400/400",
          duration: "N/A",
          audioSrc: URL.createObjectURL(file),
        };
      });

    setLocalSongs(currentSongs => [...currentSongs, ...newSongs]);
    toast({
        title: `${newSongs.length} file(s) added`,
        description: "These files are available for this session only.",
    });
  };

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
  };


  if (isUserLoading || !user || playlistsLoading || historyLoading) {
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
          <TabsTrigger value="history">History</TabsTrigger>
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
         <TabsContent value="history">
          <div className="flex flex-col gap-2">
            {listeningHistory && listeningHistory.length > 0 ? (
              listeningHistory.map((song) => (
                <HistoryItem key={`${song.id}-${song.playedAt}`} song={song} />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4">
                  <History className="h-12 w-12" />
                  <h3 className="text-lg font-semibold">No Listening History</h3>
                  <p>Songs you play will appear here.</p>
              </div>
            )}
          </div>
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
