
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { PlayerProvider } from '@/context/player-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/context/theme-provider';
import { PlaybackQueue } from '@/components/playback-queue';
import { useState, useEffect } from 'react';
import { IntroLoader } from '@/components/intro-loader';

export default function RootLayout({
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
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
      </body>
    </html>
  );
}
