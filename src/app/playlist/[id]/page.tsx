
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { PlaylistContent } from "@/components/playlist-content";
import { Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from 'firebase/firestore';
import type { Playlist, Album, Song } from "@/lib/types";
import { albums } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const playlistDocRef = useMemoFirebase(() => 
    user && firestore ? doc(firestore, 'users', user.uid, 'playlists', params.id) : null,
    [user, firestore, params.id]
  );
  
  const { data: playlistData, isLoading: isPlaylistLoading } = useDoc<Playlist>(playlistDocRef);

  // Fallback to local album data if playlist is not found or loading
  const albumData = albums.find((a) => a.id === params.id);

  let content: Playlist | Album | undefined;
  let isPlaylist = false;
  
  if (playlistData) {
      content = {
          ...playlistData,
          songs: (playlistData.trackIds || []).map(id => ({ // Mock song data for now
              id: id, title: `Track ${id}`, artist: 'Unknown', duration: '3:00', album: 'Various', albumId: 'various', albumArt: 'https://picsum.photos/seed/track/400/400'
          }))
      };
      isPlaylist = true;
  } else if (albumData) {
      content = albumData;
      isPlaylist = false;
  }

  // Handle loading state
  if (isPlaylistLoading) {
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

  // Handle not found case after loading
  if (!content && !isPlaylistLoading) {
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
    if(isNaN(minutes) || isNaN(seconds)) return acc;
    return acc + minutes * 60 + seconds;
  }, 0);

  const totalMinutes = Math.floor(totalDuration / 60);

  return (
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
          className="rounded-lg shadow-lg w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0"
          data-ai-hint="album cover playlist"
        />
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{isPlaylist ? "Playlist" : "Album"}</h2>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">{name}</h1>
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
  );
}
