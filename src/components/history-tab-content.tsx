
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { HistoryItem as HistoryItemType } from '@/lib/types';
import { HistoryItem } from '@/components/history-item';
import { History } from 'lucide-react';

export function HistoryTabContent() {
  const { user } = useUser();
  const firestore = useFirestore();

  const historyQuery = useMemoFirebase(() => 
    user && firestore ? query(collection(firestore, 'users', user.uid, 'history'), orderBy('playedAt', 'desc'), limit(50)) : null,
    [user, firestore]
  );
  const { data: listeningHistory } = useCollection<HistoryItemType>(historyQuery);

  if (!listeningHistory || listeningHistory.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4">
        <History className="h-12 w-12" />
        <h3 className="text-lg font-semibold">No Listening History</h3>
        <p>Songs you play will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {listeningHistory.map((song) => (
        <HistoryItem key={`${song.id}-${song.playedAt?.seconds || ''}`} song={song} />
      ))}
    </div>
  );
}
