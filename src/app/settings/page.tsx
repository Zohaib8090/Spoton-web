
"use client";

import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from "next-themes";
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const userDocRef = useMemoFirebase(() => 
    user && firestore ? doc(firestore, 'users', user.uid) : null,
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    newReleases: true,
    playlistUpdates: false,
  });

  const [playbackQuality, setPlaybackQuality] = useState('standard');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (userData?.settings?.notifications) {
      setNotificationPrefs(userData.settings.notifications);
    }
    if (userData?.settings?.playbackQuality) {
      setPlaybackQuality(userData.settings.playbackQuality);
    }
  }, [user, isUserLoading, router, userData]);

  const updateSetting = useCallback((key: string, value: any) => {
    if (!userDocRef) return;
    const settingsUpdate = { settings: { [key]: value } };
    setDoc(userDocRef, settingsUpdate, { merge: true })
      .catch(() => {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: settingsUpdate,
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save your settings.",
          });
      });
  }, [userDocRef, toast]);
  
  const handleThemeChange = (isDarkMode: boolean) => {
    const newTheme = isDarkMode ? 'dark' : 'light';
    setTheme(newTheme);
    updateSetting('theme', newTheme);
  };

  const handleNotificationPrefChange = (pref: 'newReleases' | 'playlistUpdates', value: boolean) => {
    const newPrefs = { ...notificationPrefs, [pref]: value };
    setNotificationPrefs(newPrefs);
    updateSetting('notifications', newPrefs);
  };
  
  const handlePlaybackQualityChange = (value: string) => {
    setPlaybackQuality(value);
    updateSetting('playbackQuality', value);
  };


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
    } else {
      toast({
        variant: "destructive",
        title: "Permissions Denied",
        description: "You have disabled notifications. You can enable them in your browser settings.",
      });
    }
  };

  if (isUserLoading || !user || isUserDataLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
             <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-24" />
                           <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                </CardContent>
             </Card>
          ))}
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
            <Switch 
              id="new-releases" 
              checked={notificationPrefs.newReleases}
              onCheckedChange={(checked) => handleNotificationPrefChange('newReleases', checked)}
              disabled={notificationPermission !== 'granted'} 
            />
          </div>
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <Label htmlFor="playlist-updates" className="flex flex-col space-y-1">
              <span>Playlist Updates</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get notified when playlists you follow are updated.
              </span>
            </Label>
            <Switch 
              id="playlist-updates" 
              checked={notificationPrefs.playlistUpdates}
              onCheckedChange={(checked) => handleNotificationPrefChange('playlistUpdates', checked)}
              disabled={notificationPermission !== 'granted'} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Playback</CardTitle>
          <CardDescription>Adjust your audio streaming quality.</CardDescription>
        </CardHeader>
        <CardContent>
            <RadioGroup 
              value={playbackQuality} 
              onValueChange={handlePlaybackQualityChange} 
              className="grid gap-4"
            >
              <Label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer has-[:checked]:border-primary">
                <div className="flex flex-col space-y-1">
                    <span>High</span>
                    <span className="font-normal leading-snug text-muted-foreground">Best audio quality, uses more data.</span>
                </div>
                <RadioGroupItem value="high" id="q-high" />
              </Label>
              <Label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer has-[:checked]:border-primary">
                 <div className="flex flex-col space-y-1">
                    <span>Standard</span>
                    <span className="font-normal leading-snug text-muted-foreground">Good balance of quality and data usage.</span>
                </div>
                <RadioGroupItem value="standard" id="q-standard" />
              </Label>
              <Label className="flex items-center justify-between rounded-lg border p-4 cursor-pointer has-[:checked]:border-primary">
                <div className="flex flex-col space-y-1">
                    <span>Low</span>
                    <span className="font-normal leading-snug text-muted-foreground">Saves data with slightly lower quality.</span>
                </div>
                <RadioGroupItem value="low" id="q-low" />
              </Label>
            </RadioGroup>
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
              onCheckedChange={handleThemeChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    