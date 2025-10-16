
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { SpotonLogo } from '@/components/spoton-logo';
import { FcGoogle } from 'react-icons/fc';

const signupSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.'}),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const createUserDocument = async (user: any, username?: string) => {
      if (!firestore) return;
      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        id: user.uid,
        email: user.email,
        username: username || user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        settings: {
          theme: 'dark',
          playbackQuality: {
            audio: 'standard',
            video: 'standard'
          },
          notifications: {
            newReleases: true,
            playlistUpdates: true,
          }
        }
      };
      await setDoc(userDocRef, userData);
  }

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.username });
      await createUserDocument(userCredential.user, data.username);
      
      toast({ title: 'Account created successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign-up failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      toast({ title: 'Account created successfully!' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-up failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
            <SpotonLogo className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-3xl font-bold tracking-tight">Create your Spoton account</h1>
            <p className="text-muted-foreground">Get started for free</p>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
          <FcGoogle className="mr-2 h-5 w-5" />
          Sign up with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Your username"
              {...register('username')}
              disabled={isLoading}
            />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} disabled={isLoading} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
