
"use client";

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Sparkles, Moon } from 'lucide-react';

export default function WhatsNewPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const sendUpdateNotification = (title: string, body: string) => {
    if (!('Notification' in window)) {
        toast({
            variant: "destructive",
            title: "Notifications not supported",
            description: "This browser does not support desktop notifications."
        });
        return;
    }

    if (Notification.permission === 'granted') {
      // This is a workaround for the "Illegal constructor" error.
      // By wrapping it in a timeout, we move the execution to a different context,
      // which browsers are often more lenient with for direct Notification construction.
      setTimeout(() => {
        new Notification(title, {
          body: body,
          icon: '/spoton-logo.svg',
        });
      }, 0);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                 setTimeout(() => {
                    new Notification(title, {
                        body: body,
                        icon: '/spoton-logo.svg',
                    });
                }, 0);
            } else {
                 toast({
                    variant: "destructive",
                    title: "Notifications not enabled",
                    description: "You have denied notification permissions."
                });
            }
        });
    } else {
        toast({
            variant: "destructive",
            title: "Notifications not enabled",
            description: "Please enable notifications in your browser settings to receive updates."
        });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">What's New</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-6 w-6" />
            <span>Dark Theme is Here!</span>
          </CardTitle>
          <CardDescription>July 2, 2024</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>You can now enjoy Spoton in a beautiful new dark theme. Perfect for late-night listening sessions!</p>
          <p>Go to the <a href="/settings" className="underline text-primary">Settings</a> page to switch between light and dark modes.</p>
           <Button onClick={() => sendUpdateNotification('Dark Theme Added!', 'You can now enable dark mode in settings.')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Notify me about this update
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            <span>App Version 1.1 Released!</span>
          </CardTitle>
          <CardDescription>June 24, 2024</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>We're constantly working to improve your Spoton experience. Here are the latest features and bug fixes:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>AI Recommendations:</strong> Get personalized song suggestions based on your listening history on the home page.
            </li>
            <li>
              <strong>Notification Settings:</strong> Control how you receive updates from us.
            </li>
             <li>
              <strong>UI Enhancements:</strong> We've polished the interface for a smoother experience.
            </li>
          </ul>
           <Button onClick={() => sendUpdateNotification('Spoton Updates!', 'A new feature has just been released. Check it out!')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Notify me about this update
          </Button>
        </CardContent>
      </Card>
      
    </div>
  );
}
