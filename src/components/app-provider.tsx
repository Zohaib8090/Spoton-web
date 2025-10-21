
"use client";

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { PlayerProvider } from '@/context/player-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/context/theme-provider';
import { PlaybackQueue } from '@/components/playback-queue';
import { IntroLoader } from '@/components/intro-loader';

export function AppProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide the loader after a short delay to ensure content has started rendering.
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show intro for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <IntroLoader loading={isLoading} />
      {!isLoading && (
        <FirebaseClientProvider>
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
        </FirebaseClientProvider>
      )}
    </>
  );
}
