
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Library, Plus, User, Bell, Settings, LogOut } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Player } from "@/components/player";
import { FullScreenPlayer } from "@/components/full-screen-player";
import { Button } from "@/components/ui/button";
import { SpotonLogo } from "@/components/spoton-logo";
import { usePlayer } from "@/context/player-context";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentSong, handleCreatePlaylist } = usePlayer();
  const { user } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const prefetch = (href: string) => {
    router.prefetch(href);
  };

  if (pathname === '/login' || pathname === '/signup') {
    return <>{children}</>;
  }

  const showBottomNav = true;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="relative flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarRail />
          <SidebarContent className="p-0">
            <div className="bg-card rounded-lg m-2 p-2">
              <div className="flex items-center gap-2 mb-2 px-2">
                <SpotonLogo className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold">Spoton</h1>
              </div>
              <SidebarMenu>
                <SidebarMenuItem onMouseEnter={() => prefetch('/')}>
                  <SidebarMenuButton asChild isActive={isActive('/')} className="hover:text-foreground">
                    <Link href="/"><Home /> <span>Home</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user && (
                  <>
                    <SidebarMenuItem onMouseEnter={() => prefetch('/profile')}>
                      <SidebarMenuButton asChild isActive={isActive('/profile')} className="hover:text-foreground">
                        <Link href="/profile"><User /> <span>View Profile</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem onMouseEnter={() => prefetch('/whats-new')}>
                      <SidebarMenuButton asChild isActive={isActive('/whats-new')} className="hover:text-foreground">
                        <Link href="/whats-new"><Bell /> <span>What's new</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem onMouseEnter={() => prefetch('/settings')}>
                      <SidebarMenuButton asChild isActive={isActive('/settings')} className="hover:text-foreground">
                        <Link href="/settings"><Settings /> <span>Settings</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleLogout} className="hover:text-foreground">
                        <LogOut /> <span>Logout</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <div className="flex flex-col h-full">
            <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 lg:p-8", {
              "pb-40": currentSong,
              "pb-24": !currentSong,
              "md:pb-36": currentSong,
              "md:pb-20": !currentSong,
            })}>
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-primary/40 to-background -z-10" />
              </div>
              {children}
            </main>
            <div className="fixed bottom-0 left-0 right-0 z-50 md:left-[var(--sidebar-width-icon)]">
              {currentSong && <Player />}
              {showBottomNav && (
                <nav className="bg-black/80 backdrop-blur-lg border-t border-border flex justify-around items-center h-16 text-muted-foreground px-2">
                  <Link href="/" onMouseEnter={() => prefetch('/')} className={cn("flex flex-col items-center gap-1 p-2 rounded-md transition-colors", isActive('/') ? "text-foreground" : "hover:text-foreground")}>
                    <Home size={20} />
                    <span className="text-[10px] sm:text-xs font-medium">Home</span>
                  </Link>
                  <Link href="/search" onMouseEnter={() => prefetch('/search')} className={cn("flex flex-col items-center gap-1 p-2 rounded-md transition-colors", isActive('/search') ? "text-foreground" : "hover:text-foreground")}>
                    <Search size={20} />
                    <span className="text-[10px] sm:text-xs font-medium">Search</span>
                  </Link>
                  <Link href="/library" onMouseEnter={() => prefetch('/library')} className={cn("flex flex-col items-center gap-1 p-2 rounded-md transition-colors", isActive('/library') ? "text-foreground" : "hover:text-foreground")}>
                    <Library size={20} />
                    <span className="text-[10px] sm:text-xs font-medium">Library</span>
                  </Link>
                  <Button variant="ghost" onClick={handleCreatePlaylist} className="flex flex-col items-center gap-1 h-auto p-2 hover:text-foreground">
                    <Plus size={20} />
                    <span className="text-[10px] sm:text-xs font-medium">Create Playlist</span>
                  </Button>
                </nav>
              )}
            </div>
            {currentSong && <FullScreenPlayer />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
