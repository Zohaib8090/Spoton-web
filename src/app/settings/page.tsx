

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
import { BellRing, Video, Music, Wifi, Signal, Youtube, Mail, GitBranch, Play, Speaker, Sliders, Ear, Headphones, Volume2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { EqualiserDialog } from '@/components/equaliser-dialog';

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

  const [playbackQuality, setPlaybackQuality] = useState({
    audio: { wifi: 'automatic', cellular: 'automatic' },
    video: { wifi: 'standard', cellular: 'standard' }
  });

  const [streamingServices, setStreamingServices] = useState({
    youtubeMusic: true,
  });

  const [trackTransitions, setTrackTransitions] = useState({
    gaplessPlayback: true,
    automix: false,
    crossfade: 0,
  });

  const [listeningControls, setListeningControls] = useState({
    autoPlay: true,
    monoAudio: false,
    equaliserEnabled: false,
    volumeNormalization: true,
    balance: 0,
  });

  const [isEqDialogOpen, setIsEqDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (userData?.settings?.notifications) {
      setNotificationPrefs(userData.settings.notifications);
    }
    if (userData?.settings?.playbackQuality) {
      setPlaybackQuality(prev => ({
        audio: { ...prev.audio, ...userData.settings.playbackQuality.audio },
        video: { ...prev.video, ...userData.settings.playbackQuality.video }
      }));
    }
    if (userData?.settings?.streamingServices) {
      setStreamingServices(userData.settings.streamingServices);
    }
    if (userData?.settings?.trackTransitions) {
      setTrackTransitions(userData.settings.trackTransitions);
    }
    if (userData?.settings?.listeningControls) {
      setListeningControls(prev => ({ ...prev, ...userData.settings.listeningControls }));
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

  const handleStreamingServiceChange = (service: 'youtubeMusic', value: boolean) => {
    const newServices = { ...streamingServices, [service]: value };
    setStreamingServices(newServices);
    updateSetting('streamingServices', newServices);
  };

  const handlePlaybackQualityChange = (
    type: 'audio' | 'video',
    connection: 'wifi' | 'cellular',
    value: string
  ) => {
    const newQuality = {
      ...playbackQuality,
      [type]: {
        ...playbackQuality[type],
        [connection]: value,
      },
    };
    setPlaybackQuality(newQuality);
    updateSetting('playbackQuality', newQuality);
  };

  const handleTrackTransitionChange = (pref: 'gaplessPlayback' | 'automix', value: boolean) => {
    const newTransitions = { ...trackTransitions, [pref]: value };
    setTrackTransitions(newTransitions);
    updateSetting('trackTransitions', newTransitions);
  };

  const handleCrossfadeChange = (value: number[]) => {
    const newTransitions = { ...trackTransitions, crossfade: value[0] };
    setTrackTransitions(newTransitions);
    updateSetting('trackTransitions', newTransitions);
  };

  const handleListeningControlChange = (control: keyof Omit<typeof listeningControls, 'balance'>, value: boolean) => {
    const newControls = { ...listeningControls, [control]: value };
    setListeningControls(newControls);
    updateSetting('listeningControls', newControls);
  };

  const handleBalanceChange = (value: number[]) => {
    const newControls = { ...listeningControls, balance: value[0] };
    setListeningControls(newControls);
    updateSetting('listeningControls', newControls);
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
          {[...Array(4)].map((_, i) => (
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
    switch (notificationPermission) {
      case 'granted':
        return 'Permissions granted';
      case 'denied':
        return 'Permissions denied';
      default:
        return 'Enable browser notifications';
    }
  }

  const qualityOptions = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'very-high', label: 'Very High' },
    { value: 'high', label: 'High' },
    { value: 'standard', label: 'Standard' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Streaming Services</CardTitle>
            <CardDescription>Connect and manage your music services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="youtube-music" className="flex items-center gap-3">
                <Youtube className="h-6 w-6 text-[#FF0000]" />
                <div className="flex flex-col space-y-1">
                  <span>YouTube Music</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Sync your library and playlists from YouTube Music.
                  </span>
                </div>
              </Label>
              <Switch
                id="youtube-music"
                checked={streamingServices.youtubeMusic}
                onCheckedChange={(checked) => handleStreamingServiceChange('youtubeMusic', checked)}
              />
            </div>
          </CardContent>
        </Card>

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
            <CardTitle>Listening Controls</CardTitle>
            <CardDescription>Customize your listening experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="auto-play" className="flex flex-col space-y-1">
                <span>Auto Play</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Automatically play similar songs when your music ends.
                </span>
              </Label>
              <Switch
                id="auto-play"
                checked={listeningControls.autoPlay}
                onCheckedChange={(checked) => handleListeningControlChange('autoPlay', checked)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="mono-audio" className="flex flex-col space-y-1">
                <span>Mono Audio</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Makes the left and right speakers play the same audio.
                </span>
              </Label>
              <Switch
                id="mono-audio"
                checked={listeningControls.monoAudio}
                onCheckedChange={(checked) => handleListeningControlChange('monoAudio', checked)}
              />
            </div>
            <div className="space-y-3 rounded-lg border p-4">
              <Label htmlFor="balance" className="flex flex-col space-y-1">
                <span>Audio Balance</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Adjust the audio output between left and right channels.
                </span>
              </Label>
              <div className="relative pt-2">
                <Slider
                  id="balance"
                  min={-1}
                  max={1}
                  step={0.1}
                  value={[listeningControls.balance]}
                  onValueChange={handleBalanceChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span className="w-4 text-center">L</span>
                  <span>Center</span>
                  <span className="w-4 text-center">R</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="equaliser" className="flex flex-col space-y-1">
                <span>Equaliser</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Fine-tune your audio with presets or custom settings.
                </span>
              </Label>
              <Button variant="outline" id="equaliser" onClick={() => setIsEqDialogOpen(true)}>Configure</Button>
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="volume-normalization" className="flex flex-col space-y-1">
                <span>Volume Normalisation</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Set the same volume level for all tracks.
                </span>
              </Label>
              <Switch
                id="volume-normalization"
                checked={listeningControls.volumeNormalization}
                onCheckedChange={(checked) => handleListeningControlChange('volumeNormalization', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Playback</CardTitle>
            <CardDescription>Adjust your streaming quality and transitions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Audio Quality</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wifi size={16} />
                    <span>Wi-Fi Streaming</span>
                  </div>
                  <RadioGroup
                    value={playbackQuality.audio.wifi}
                    onValueChange={(value) => handlePlaybackQualityChange('audio', 'wifi', value)}
                  >
                    {qualityOptions.map(option => (
                      <Label key={`aq-w-${option.value}`} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                        {option.label}
                        <RadioGroupItem value={option.value} id={`aq-w-${option.value}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Signal size={16} />
                    <span>Cellular Streaming</span>
                  </div>
                  <RadioGroup
                    value={playbackQuality.audio.cellular}
                    onValueChange={(value) => handlePlaybackQualityChange('audio', 'cellular', value)}
                  >
                    {qualityOptions.map(option => (
                      <Label key={`aq-c-${option.value}`} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                        {option.label}
                        <RadioGroupItem value={option.value} id={`aq-c-${option.value}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Video Quality</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wifi size={16} />
                    <span>Wi-Fi Streaming</span>
                  </div>
                  <RadioGroup
                    value={playbackQuality.video.wifi}
                    onValueChange={(value) => handlePlaybackQualityChange('video', 'wifi', value)}
                  >
                    {qualityOptions.map(option => (
                      <Label key={`vq-w-${option.value}`} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                        {option.label}
                        <RadioGroupItem value={option.value} id={`vq-w-${option.value}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Signal size={16} />
                    <span>Cellular Streaming</span>
                  </div>
                  <RadioGroup
                    value={playbackQuality.video.cellular}
                    onValueChange={(value) => handlePlaybackQualityChange('video', 'cellular', value)}
                  >
                    {qualityOptions.map(option => (
                      <Label key={`vq-c-${option.value}`} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                        {option.label}
                        <RadioGroupItem value={option.value} id={`vq-c-${option.value}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Track Transitions</h3>
              </div>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <Label htmlFor="gapless-playback" className="flex flex-col space-y-1">
                  <span>Gapless Playback</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Allow gapless playback between songs.
                  </span>
                </Label>
                <Switch
                  id="gapless-playback"
                  checked={trackTransitions.gaplessPlayback}
                  onCheckedChange={(checked) => handleTrackTransitionChange('gaplessPlayback', checked)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <Label htmlFor="automix" className="flex flex-col space-y-1">
                  <span>Automix</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Allow smooth transitions between songs.
                  </span>
                </Label>
                <Switch
                  id="automix"
                  checked={trackTransitions.automix}
                  onCheckedChange={(checked) => handleTrackTransitionChange('automix', checked)}
                />
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="crossfade" className="flex flex-col space-y-1">
                    <span>Crossfade</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      Fade out the current song as the next one fades in.
                    </span>
                  </Label>
                  <span className="text-sm font-bold w-12 text-right">{trackTransitions.crossfade}s</span>
                </div>
                <Slider
                  id="crossfade"
                  min={0}
                  max={12}
                  step={1}
                  value={[trackTransitions.crossfade]}
                  onValueChange={handleCrossfadeChange}
                />
              </div>
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
                onCheckedChange={handleThemeChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Developer Support</CardTitle>
            <CardDescription>
              For any queries or support, please reach out to our developer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <a href="mailto:zohaibbaig144@gmail.com" className="text-sm font-medium text-primary hover:underline">
                zohaibbaig144@gmail.com
              </a>
            </div>
          </CardContent>
        </Card>

      </div>
      <EqualiserDialog isOpen={isEqDialogOpen} onOpenChange={setIsEqDialogOpen} />
    </>
  );
}
