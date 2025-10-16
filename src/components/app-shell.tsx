"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Plus, User, Bell, Settings } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarGroup,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Player } from "@/components/player";
import { playlists } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { SpotonLogo } from "@/components/spoton-logo";
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
    <SidebarProvider defaultOpen={false}>
      <div className="relative flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarRail />
          <SidebarContent className="p-0">
            <div className="bg-card rounded-lg m-2 p-2">
              <div className="flex items-center gap-2 mb-2 px-2">
                <SpotonLogo className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold">spoton</h1>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/')} className="hover:text-foreground">
                    <Link href="/"><Home /> <span>Home</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/search')} className="hover:text-foreground">
                    <Link href="/search"><Search /> <span>Search</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/profile')} className="hover:text-foreground">
                    <Link href="#"><User /> <span>View Profile</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/whats-new')} className="hover:text-foreground">
                    <Link href="#"><Bell /> <span>What's new</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive('/settings')} className="hover:text-foreground">
                    <Link href="#"><Settings /> <span>Settings</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            <div className="bg-card rounded-lg m-2 mt-0 p-2 flex-1">
              <SidebarGroup>
                <div className="flex justify-between items-center mb-2 px-2">
                  <SidebarMenuButton asChild className="hover:text-foreground">
                    <Link href="#"><Library /> <span>Your Library</span></Link>
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
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-primary/40 to-background -z-10" />
              </div>
              {children}
            </main>
            {currentSong && <Player />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
