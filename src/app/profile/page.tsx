
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, useAuth } from '@/firebase';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, { message: "Old password is required." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [reauthError, setReauthError] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user, isUserLoading, router]);
  
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsUpdating(true);

    // Update Auth profile
    updateProfile(user, { 
      displayName: displayName || '',
      photoURL: photoURL || '' 
    }).then(() => {
        // Update Firestore document
        const userDocRef = doc(firestore, 'users', user.uid);
        const userData = { 
            username: displayName,
            photoURL: photoURL
        };

        setDoc(userDocRef, userData, { merge: true }).then(async () => {
            toast({
                title: 'Profile Updated',
                description: 'Your profile has been successfully updated.',
            });
            // Force a reload of the user object to see changes
            await user.reload();
        }).catch(() => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

    }).catch((error: any) => {
      toast({
        variant: 'destructive',
        title: 'Auth Update Failed',
        description: error.message,
      });
    }).finally(() => {
        setIsUpdating(false);
    });
  };

  const handleChangePassword = async (data: ChangePasswordFormValues) => {
    if (!user || !user.email) return;
    setIsUpdating(true);
    setReauthError(false);
    
    const credential = EmailAuthProvider.credential(user.email, data.oldPassword);

    reauthenticateWithCredential(user, credential).then(() => {
        // User re-authenticated. Now, update the password.
        updatePassword(user, data.newPassword).then(() => {
            toast({
                title: 'Password Updated',
                description: 'Your password has been changed successfully.',
            });
            setIsChangePasswordOpen(false);
            resetPasswordForm();
        }).catch((error) => {
             toast({
                variant: 'destructive',
                title: 'Password Update Failed',
                description: error.message,
            });
        });
    }).catch((error) => {
        // An error occurred.
        setReauthError(true);
        toast({
            variant: 'destructive',
            title: 'Authentication Failed',
            description: "The old password you entered is incorrect.",
        });
    }).finally(() => {
        setIsUpdating(false);
    });
  }

  const handleForgotPassword = async () => {
      if (!user?.email) return;
      try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
          title: 'Password reset email sent',
          description: 'Please check your inbox to reset your password.',
        });
        setIsChangePasswordOpen(false);
        resetPasswordForm();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error sending email',
          description: error.message,
        });
      }
  }


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
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback>
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="h-12 w-12 text-muted-foreground" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.displayName || 'Welcome'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
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
          <div className="space-y-2">
            <Label htmlFor="photoURL">Avatar URL</Label>
            <Input
              id="photoURL"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://example.com/avatar.png"
              disabled={isUpdating}
            />
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setIsChangePasswordOpen(true); setReauthError(false); resetPasswordForm(); }}>
              Change Password
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your old password and a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPassword(handleChangePassword)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="oldPassword">Old Password</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  {...registerPassword('oldPassword')}
                  disabled={isUpdating}
                />
                {passwordErrors.oldPassword && <p className="text-sm text-destructive">{passwordErrors.oldPassword.message}</p>}
              </div>
               <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword')}
                  disabled={isUpdating}
                />
                 {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
              </div>
               <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword')}
                  disabled={isUpdating}
                />
                 {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
              </div>
              {reauthError && (
                <Button variant="link" type="button" onClick={handleForgotPassword} className="px-0 h-auto text-sm text-primary justify-start">
                    Forgot your password?
                </Button>
              )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={isUpdating}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Change Password'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
