
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { AlbumArtwork } from '@/components/album-artwork';
import { Skeleton } from '@/components/ui/skeleton';
import { Pin } from 'lucide-react';
import type { Album } from '@/lib/types';


interface PinnedItem {
    id: string;
    itemId: string;
    type: 'song' | 'playlist' | 'album';
    name: string;
    artist: string;
    albumArt: string;
}

export function MyPins() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const pinsQuery = useMemoFirebase(() => 
        user && firestore ? query(collection(firestore, 'users', user.uid, 'pins'), orderBy('pinnedAt', 'desc')) : null,
        [user, firestore]
    );

    const { data: pinnedItems, isLoading: pinsLoading } = useCollection<PinnedItem>(pinsQuery);

    if (isUserLoading || pinsLoading) {
        return (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
        )
    }

    if (!pinnedItems || pinnedItems.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4 border-2 border-dashed rounded-lg">
                <Pin className="h-12 w-12" />
                <h3 className="text-lg font-semibold">Your Pinned Items</h3>
                <p className="max-w-md">Pin your favorite songs, albums, and playlists to see them here for quick access.</p>
            </div>
        );
    }
    
    const allPins = pinnedItems.map(pin => ({
        id: pin.itemId,
        name: pin.name,
        artist: pin.artist,
        albumArt: pin.albumArt,
        songs: [], // Placeholder, as we don't have song data here
    } as Album));

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allPins.map((pin) => (
                <AlbumArtwork
                    key={pin.id}
                    album={pin}
                    isPlaylist={true} // Treat all pins like playlists for routing
                />
            ))}
        </div>
    );
}
