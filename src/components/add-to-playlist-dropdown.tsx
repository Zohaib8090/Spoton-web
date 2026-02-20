"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Song, Playlist } from "@/lib/types";
import { useCollection } from "@/firebase/firestore/use-collection";

interface AddToPlaylistDropdownProps {
    currentSong: Song;
    children: React.ReactNode;
}

export function AddToPlaylistDropdown({ currentSong, children }: AddToPlaylistDropdownProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const playlistsQuery = useMemoFirebase(() =>
        user && firestore ? collection(firestore, 'users', user.uid, 'playlists') : null,
        [user, firestore]
    );

    const { data: playlists, isLoading } = useCollection<Playlist>(playlistsQuery as any);

    const handleAddToPlaylist = async (playlist: Playlist) => {
        if (!user || !firestore) return;

        try {
            const playlistRef = doc(firestore, 'users', user.uid, 'playlists', playlist.id);
            await updateDoc(playlistRef, {
                songs: arrayUnion(currentSong),
                trackIds: arrayUnion(currentSong.id) // Legacy support for original trackIds implementation
            });
            toast({
                title: "Added to Playlist",
                description: `"${currentSong.title}" was added to ${playlist.name}`
            });
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "Failed to add song to playlist",
                variant: "destructive"
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto" align="end" sideOffset={10}>
                <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {!user ? (
                    <DropdownMenuItem disabled>Please login to save</DropdownMenuItem>
                ) : isLoading ? (
                    <DropdownMenuItem disabled>Loading playlists...</DropdownMenuItem>
                ) : (!playlists || playlists.length === 0) ? (
                    <DropdownMenuItem disabled>No playlists found</DropdownMenuItem>
                ) : (
                    playlists.map(playlist => (
                        <DropdownMenuItem
                            key={playlist.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddToPlaylist(playlist);
                            }}
                            className="cursor-pointer"
                        >
                            {playlist.name}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
