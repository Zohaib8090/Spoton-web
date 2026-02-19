
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { PlaylistContent } from "@/components/playlist-content";
import { Clock, ChevronLeft, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Playlist, Album, Song } from "@/lib/types";
import { albums } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");

  const playlistDocRef = useMemoFirebase(() =>
    user && firestore ? doc(firestore, 'users', user.uid, 'playlists', id) : null,
    [user, firestore, id]
  );

  const { data: playlistData, isLoading: isPlaylistLoading, error: playlistError } = useDoc<Playlist>(playlistDocRef);

  // Fallback to local album data if playlist is not found or loading
  const albumData = albums.find((a) => a.id === id);

  useEffect(() => {
    if (playlistData) {
      setNewPlaylistName(playlistData.name);
      setNewPlaylistDescription(playlistData.description || "");
    }
  }, [playlistData]);

  let content: Playlist | Album | undefined;
  let isPlaylist = false;

  if (playlistData) {
    content = {
      ...playlistData,
      songs: (playlistData.trackIds || []).map(id => ({ // Mock song data for now
        id: id, title: `Track ${id}`, artist: 'Unknown', duration: '3:00', album: 'Various', albumId: 'various', albumArt: 'https://picsum.photos/seed/track/400/400', audioSrc: ""
      }))
    };
    isPlaylist = true;
  } else if (albumData) {
    content = albumData;
    isPlaylist = false;
  }

  const handleDeletePlaylist = async () => {
    if (!playlistDocRef) return;
    try {
      await deleteDoc(playlistDocRef);
      toast({ title: "Playlist deleted" });
      router.push('/library');
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not delete playlist." });
    }
  };

  const handleRenamePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistDocRef || !newPlaylistName) return;
    try {
      await updateDoc(playlistDocRef, {
        name: newPlaylistName,
        description: newPlaylistDescription,
      });
      toast({ title: "Playlist updated" });
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Error renaming playlist:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not update playlist." });
    }
  };


  // Handle loading state
  // We wait for auth to load. Once auth is done, we wait for the playlist data.
  // We check playlistDocRef because useDoc's isLoading might be false for one frame while docRef initializes.
  const isActualLoading = isAuthLoading || (playlistDocRef && !playlistData && !playlistError && !albumData);

  if (isActualLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-10 w-24 mb-4" />
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Skeleton className="rounded-lg shadow-lg w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    );
  }

  // Handle errors (e.g. Firebase connection blocked or permission denied)
  if (playlistError && !albumData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">Unable to load playlist</h2>
        <p className="text-muted-foreground text-center max-w-md">
          There was an error connecting to the database. If you have an ad-blocker enabled (like uBlock Origin or Adblock Plus), please try disabling it for this site and refresh.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Handle not found case after all loading and error checks are done
  if (!content && !isAuthLoading && !isPlaylistLoading) {
    notFound();
  }

  // If content is null, which it shouldn't be if notFound() hasn't been called
  if (!content) return null;

  const name = content.name;
  const description = isPlaylist ? (content as Playlist).description : (content as Album).artist;
  const coverArt = isPlaylist ? (content as Playlist).coverArt : (content as Album).albumArt;
  const songs = content.songs || [];

  const totalDuration = songs.reduce((acc, song) => {
    const parts = song.duration.split(':');
    if (parts.length !== 2) return acc;
    const [minutes, seconds] = parts.map(Number);
    if (isNaN(minutes) || isNaN(seconds)) return acc;
    return acc + minutes * 60 + seconds;
  }, 0);

  const totalMinutes = Math.floor(totalDuration / 60);

  return (
    <>
      <div className="space-y-6 pb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Image
            src={coverArt}
            alt={name}
            width={200}
            height={200}
            quality={100}
            className="rounded-lg shadow-lg w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0"
            data-ai-hint="album cover playlist"
          />
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isPlaylist ? "Playlist" : "Album"}</h2>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">{name}</h1>
              {isPlaylist && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 mt-2">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setIsRenameDialogOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                          <span className="text-red-500">Delete</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the playlist '{name}'.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeletePlaylist} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-muted-foreground">{description}</p>
            <p className="text-sm text-muted-foreground">
              {songs.length} songs, about {totalMinutes} min
            </p>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-[2rem_1fr_1fr_auto] items-center gap-4 px-4 py-2 text-muted-foreground text-sm border-b border-muted/50">
          <div className="text-center">#</div>
          <div>Title</div>
          <div>Album</div>
          <div className="justify-self-end"><Clock size={16} /></div>
        </div>
        <PlaylistContent songs={songs} />
      </div>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Playlist</DialogTitle>
            <DialogDescription>
              Give your playlist a new name and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenamePlaylist}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="playlist-name">Name</Label>
                <Input
                  id="playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="playlist-description">Description</Label>
                <Input
                  id="playlist-description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="A short description..."
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


