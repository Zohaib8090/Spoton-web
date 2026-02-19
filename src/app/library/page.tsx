
"use client";

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { PlusCircle, Music, FolderUp, History, Trash2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaylistContent } from '@/components/playlist-content';
import type { Song } from '@/lib/types';
import { usePlayer } from '@/context/player-context';
import { PlaylistTabContent } from '@/components/playlist-tab-content';
import { HistoryTabContent } from '@/components/history-tab-content';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

function LocalFilesTabContent() {
    const { toast } = useToast();
    const [localSongs, setLocalSongs] = useState<Song[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    return (
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
    );
}


export default function LibraryPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { handleCreatePlaylist, deletePlaylists } = usePlayer();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedPlaylists([]);
  }

  const handlePlaylistSelect = (playlistId: string, isSelected: boolean) => {
    setSelectedPlaylists(prev => 
      isSelected ? [...prev, playlistId] : prev.filter(id => id !== playlistId)
    );
  }

  const handleDeleteSelected = async () => {
    if (selectedPlaylists.length === 0) {
      toast({
        variant: "destructive",
        title: "No playlists selected",
        description: "Please select at least one playlist to delete.",
      });
      return;
    }
    
    await deletePlaylists(selectedPlaylists);
    toast({
      title: "Playlists Deleted",
      description: `${selectedPlaylists.length} playlist(s) have been removed.`,
    });
    setIsSelectionMode(false);
    setSelectedPlaylists([]);
  };

  if (isUserLoading || !user) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Library</h1>
            <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Library</h1>
             <div className="flex flex-wrap gap-2">
                {isSelectionMode ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleToggleSelectionMode}>
                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={selectedPlaylists.length === 0}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedPlaylists.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete {selectedPlaylists.length} playlist(s).
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteSelected}>
                                  Delete
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleToggleSelectionMode}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Playlist
                    </Button>
                    <Button size="sm" onClick={handleCreatePlaylist}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Playlist
                    </Button>
                  </>
                )}
            </div>
        </div>
      
      <Tabs defaultValue="playlists" className="space-y-6">
        <div className="w-full overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <TabsList className="w-max min-w-full justify-start">
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="liked">Liked Songs</TabsTrigger>
            <TabsTrigger value="local">Local Files</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="playlists">
          <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>}>
            <PlaylistTabContent 
              isSelectionMode={isSelectionMode}
              selectedPlaylists={selectedPlaylists}
              onPlaylistSelect={handlePlaylistSelect}
            />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="history">
          <Suspense fallback={<div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>}>
            <HistoryTabContent />
          </Suspense>
        </TabsContent>

        <TabsContent value="local">
           <LocalFilesTabContent />
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

    
