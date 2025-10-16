
"use client";

import { Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs, serverTimestamp, getCountFromServer } from 'firebase/firestore';

interface PinButtonProps {
    item: {
        id: string;
        type: 'song' | 'playlist' | 'album';
        name: string;
        artist: string;
        albumArt: string;
    };
    isPinned: boolean;
    onPinChange: (isPinned: boolean) => void;
    className?: string;
}

export function PinButton({ item, isPinned, onPinChange, className }: PinButtonProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handlePinToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'You must be logged in to pin items.' });
            return;
        }

        const pinsCollection = collection(firestore, 'users', user.uid, 'pins');

        if (isPinned) {
            // Unpin
            try {
                const q = query(pinsCollection, where('itemId', '==', item.id));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    deleteDoc(doc.ref);
                });
                onPinChange(false);
                toast({ title: 'Unpinned from your library' });
            } catch (error) {
                console.error("Error unpinning item: ", error);
                toast({ variant: 'destructive', title: 'Failed to unpin item' });
            }
        } else {
            // Pin
            try {
                const snapshot = await getCountFromServer(pinsCollection);
                if (snapshot.data().count >= 9) {
                    toast({
                        variant: 'destructive',
                        title: 'Pin limit reached',
                        description: 'You can only pin up to 9 items. Please unpin an item to add a new one.',
                    });
                    return;
                }

                await addDoc(pinsCollection, {
                    itemId: item.id,
                    type: item.type,
                    name: item.name,
                    artist: item.artist,
                    albumArt: item.albumArt,
                    pinnedAt: serverTimestamp(),
                });
                onPinChange(true);
                toast({ title: 'Pinned to your library' });
            } catch (error) {
                console.error("Error pinning item: ", error);
                toast({ variant: 'destructive', title: 'Failed to pin item' });
            }
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handlePinToggle}
            className={cn("text-muted-foreground hover:text-primary", isPinned && "text-primary", className)}
            aria-label={isPinned ? 'Unpin item' : 'Pin item'}
        >
            {isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
        </Button>
    );
}
