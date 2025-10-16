"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (user && user.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, isUserLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      await updateProfile(user, { displayName });
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
          <AvatarFallback>
            <UserIcon className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.displayName || 'Welcome'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={isUpdating}
          />
        </div>
        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </div>
  );
}
