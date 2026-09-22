import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logOut,
  subscribeToAuth,
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
} from '../services/firebase';
import { StorageService } from '../services/storage';
import { UserStreak } from '../types';

interface FirebaseContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isSyncing: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  isSyncing: false,
  signIn: async () => {},
  signOut: async () => {},
  syncNow: async () => {},
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncNow = useCallback(async () => {
    if (!auth.currentUser) return;
    setIsSyncing(true);
    try {
      const currentLocal = StorageService.getUserStreak();
      await syncUserProfileToFirestore(currentLocal, auth.currentUser);
    } catch (e) {
      console.warn('Sync warning:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        setIsSyncing(true);
        try {
          // Check if remote profile exists
          const remoteProfile = await fetchUserProfileFromFirestore(firebaseUser.uid);
          const localStreak = StorageService.getUserStreak();

          if (remoteProfile) {
            // Merge smart streak: keep highest streak and active trial
            const mergedStreak: UserStreak = {
              ...localStreak,
              currentStreak: Math.max(localStreak.currentStreak, remoteProfile.currentStreak || 0),
              bestStreak: Math.max(localStreak.bestStreak, remoteProfile.bestStreak || 0),
              targetExam: remoteProfile.targetExam || localStreak.targetExam,
              targetScore: remoteProfile.targetScore || localStreak.targetScore,
              isTrialUnlocked: localStreak.isTrialUnlocked || Boolean(remoteProfile.isTrialUnlocked),
              isSubscribed: localStreak.isSubscribed || Boolean(remoteProfile.isSubscribed),
              trialEndDate: Math.max(localStreak.trialEndDate || 0, remoteProfile.trialEndDate || 0),
            };
            StorageService.saveUserStreak(mergedStreak);
            await syncUserProfileToFirestore(mergedStreak, firebaseUser);
          } else {
            // First time login - upload local profile to cloud
            await syncUserProfileToFirestore(localStreak, firebaseUser);
          }
        } catch (err) {
          console.warn('Initial cloud profile sync notice:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      console.error('Sign-in failed:', err);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Sign-out failed:', err);
      throw err;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        isSyncing,
        signIn: handleSignIn,
        signOut: handleSignOut,
        syncNow,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
