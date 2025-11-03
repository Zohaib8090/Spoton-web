"use client";

import { AppShell } from '@/components/app-shell';
import { PlayerProvider } from '@/context/player-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { ThemeProvider } from '@/context/theme-provider';
import { PlaybackQueue } from '@/components/playback-queue';
import { IntroLoader } from '@/components/intro-loader';

function AppContent({ children }: { children: React.ReactNode }) {
  const { isUserLoading } = useUser();

  // This component will only be rendered once Firebase is initialized.
  // We use the isUserLoading state to keep the splash screen until the user state is resolved.
  return (
    <>
      <IntroLoader loading={isUserLoading} />
      {!isUserLoading && (
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PlayerProvider>
            <AppShell>{children}</AppShell>
            <PlaybackQueue />
          </PlayerProvider>
          <Toaster />
        </ThemeProvider>
      )}
    </>
  );
}


export function AppProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <AppContent>{children}</AppContent>
    </FirebaseClientProvider>
  );
}
