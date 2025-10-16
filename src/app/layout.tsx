import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { PlayerProvider } from '@/context/player-context';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'HarmonyStream',
  description: 'Stream music from all your favorite services in one place.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
        <Toaster />
      </body>
    </html>
  );
}
