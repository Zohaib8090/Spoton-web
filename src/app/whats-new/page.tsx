
"use client";

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Sparkles } from 'lucide-react';

export default function WhatsNewPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const sendUpdateNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Spoton Updates!', {
        body: 'A new feature has just been released. Check it out!',
        icon: '/spoton-logo.svg',
      });
    } else {
        toast({
            variant: "destructive",
            title: "Notifications not enabled",
            description: "Please enable notifications in the settings page to receive updates."
        })
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">What's New</h1>

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
              <strong>Dark Mode:</strong> You can now switch between light and dark themes in the settings page.
            </li>
            <li>
              <strong>Notification Settings:</strong> Control how you receive updates from us.
            </li>
             <li>
              <strong>UI Enhancements:</strong> We've polished the interface for a smoother experience.
            </li>
          </ul>
           <Button onClick={sendUpdateNotification}>
            <Sparkles className="mr-2 h-4 w-4" />
            Send me a notification for this update
          </Button>
        </CardContent>
      </Card>
      
    </div>
  );
}
