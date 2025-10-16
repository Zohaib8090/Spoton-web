"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Plus } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { Player } from "@/components/player";
import { playlists } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { HarmonyStreamLogo } from "@/components/harmony-stream-logo";
import { usePlayer } from "@/context/player-context";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentSong } = usePlayer();
  
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarContent className="p-0">
            <div className="bg-card rounded-lg m-2 p-2">
              <div className="flex items-center gap-2 mb-2 px-2">
                <HarmonyStreamLogo className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold">HarmonyStream</h1>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/')} className="hover:text-foreground">
                    <Link href="/"><Home /> Home</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/search')} className="hover:text-foreground">
                    <Link href="/search"><Search /> Search</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            <div className="bg-card rounded-lg m-2 mt-0 p-2 flex-1">
              <SidebarGroup>
                <div className="flex justify-between items-center mb-2 px-2">
                  <SidebarMenuButton asChild className="hover:text-foreground">
                    <Link href="#"><Library /> Your Library</Link>
                  </SidebarMenuButton>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus size={16}/>
                  </Button>
                </div>
                <SidebarMenu className="overflow-y-auto">
                  {playlists.map((playlist) => (
                    <SidebarMenuItem key={playlist.id}>
                      <SidebarMenuButton 
                        size="lg" 
                        asChild 
                        isActive={isActive(`/playlist/${playlist.id}`)}
                        className="items-start gap-3 h-auto"
                      >
                        <Link href={`/playlist/${playlist.id}`}>
                          <img src={playlist.coverArt} alt={playlist.name} className="w-12 h-12 rounded-sm" />
                          <div className="flex flex-col">
                            <span>{playlist.name}</span>
                            <span className="text-xs text-sidebar-foreground">Playlist</span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <div className="flex flex-col h-full">
            <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 lg:p-8", {
              "pb-28": currentSong,
            })}>
              <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-primary/40 to-background -z-10" />
              {children}
            </main>
            {currentSong && <Player />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
