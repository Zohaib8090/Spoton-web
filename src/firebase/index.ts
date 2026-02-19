'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // If automatic initialization fails, attempt to use the config object
      try {
        firebaseApp = initializeApp(firebaseConfig);
      } catch (configError) {
        // Build-time safeguard: if initialization fails (e.g. missing API keys during Vercel build),
        // we log a warning but don't crash the process if we're in a build/SSR environment.
        console.warn('Firebase initialization failed. If this is a build environment, ensure environment variables are set in your dashboard.', configError);

        // Return dummy SDKs that won't crash the build but will fail gracefully at runtime
        return {
          firebaseApp: null as any,
          auth: null as any,
          firestore: null as any,
        };
      }
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
