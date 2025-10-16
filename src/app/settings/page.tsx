"use client";

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from "next-themes"
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { theme, setTheme } = useTheme()
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: "Unsupported Browser",
        description: "This browser does not support desktop notifications.",
      });
      return;
    }

    if (notificationPermission === 'granted') {
       toast({
        title: "Permissions",
        description: "You have already enabled notifications.",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      toast({
        title: "Notifications Enabled!",
        description: "You will now receive notifications from Spoton.",
      });
      // You can now send notifications
      new Notification("Welcome to Spoton!", {
        body: "You're all set to receive updates.",
        icon: "/spoton-logo.svg",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Permissions Denied",
        description: "You have disabled notifications. You can enable them in your browser settings.",
      });
    }
  };


  if (isUserLoading || !user) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </div>
    );
  }

  const getPermissionStatusText = () => {
    switch(notificationPermission) {
      case 'granted':
        return 'Permissions granted';
      case 'denied':
        return 'Permissions denied';
      default:
        return 'Enable browser notifications';
    }
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="browser-notifications" className="flex flex-col space-y-1">
              <span>Browser Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                {getPermissionStatusText()}
              </span>
            </Label>
            <Button 
              id="browser-notifications"
              onClick={handleNotificationPermission}
              disabled={notificationPermission === 'granted'}
            >
              <BellRing className="mr-2 h-4 w-4" />
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="new-releases" className="flex flex-col space-y-1">
              <span>New Releases</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get notified about new music from artists you follow.
              </span>
            </Label>
            <Switch id="new-releases" defaultChecked disabled={notificationPermission !== 'granted'} />
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="playlist-updates" className="flex flex-col space-y-1">
              <span>Playlist Updates</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get notified when playlists you follow are updated.
              </span>
            </Label>
            <Switch id="playlist-updates" disabled={notificationPermission !== 'granted'} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Dark Mode</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Enjoy the app in a darker theme.
              </span>
            </Label>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
