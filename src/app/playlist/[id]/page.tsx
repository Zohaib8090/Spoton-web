import Image from "next/image";
import { playlists, albums } from "@/lib/data";
import { notFound } from "next/navigation";
import type { Playlist, Album } from "@/lib/types";
import { PlaylistContent } from "@/components/playlist-content";
import { Clock } from "lucide-react";

export default function PlaylistPage({ params }: { params: { id: string } }) {
  let content: Playlist | Album | undefined;
  let isPlaylist = true;

  content = playlists.find((p) => p.id === params.id);
  if (!content) {
    content = albums.find((a) => a.id === params.id);
    isPlaylist = false;
  }

  if (!content) {
    notFound();
  }

  const name = isPlaylist ? (content as Playlist).name : (content as Album).name;
  const description = isPlaylist ? (content as Playlist).description : (content as Album).artist;
  const coverArt = isPlaylist ? (content as Playlist).coverArt : (content as Album).albumArt;
  const songs = content.songs;
  const totalDuration = songs.reduce((acc, song) => {
    const [minutes, seconds] = song.duration.split(':').map(Number);
    return acc + minutes * 60 + seconds;
  }, 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  return (
    <div className="space-y-6 pb-8">
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
