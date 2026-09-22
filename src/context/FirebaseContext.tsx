import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logOut,
  subscribeToAuth,
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  syncQuizAttemptToFirestore,
  fetchQuizAttemptsFromFirestore,
  syncSpacedItemToFirestore,
  fetchSpacedItemsFromFirestore,
} from '../services/firebase';
import { StorageService } from '../services/storage';
import { UserStreak, QuizAttempt, SpacedItem } from '../types';

export interface SyncStats {
  quizCount: number;
  spacedCardCount: number;
  lastSyncedAt: number | null;
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isSyncing: boolean;
  syncStats: SyncStats;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  isSyncing: false,
  syncStats: { quizCount: 0, spacedCardCount: 0, lastSyncedAt: null },
  signIn: async () => {},
  signOut: async () => {},
  syncNow: async () => {},
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats>(() => {
    const attempts = StorageService.getQuizAttempts();
    const spaced = Object.keys(StorageService.getSpacedItems()).length;
    return {
      quizCount: attempts.length,
      spacedCardCount: spaced,
      lastSyncedAt: null,
    };
  });

  const performFullSync = useCallback(async (firebaseUser: FirebaseUser) => {
    setIsSyncing(true);
    try {
      // 1. Sync User Profile & Streak
      const remoteProfile = await fetchUserProfileFromFirestore(firebaseUser.uid);
      const localStreak = StorageService.getUserStreak();

      let mergedStreak: UserStreak = localStreak;
      if (remoteProfile) {
        mergedStreak = {
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
      }
      await syncUserProfileToFirestore(mergedStreak, firebaseUser);

      // 2. Sync Quiz & Mock Attempts (Bidirectional)
      const remoteAttempts = await fetchQuizAttemptsFromFirestore(firebaseUser.uid);
      const localAttempts = StorageService.getQuizAttempts();
      const localAttemptMap = new Map<number, QuizAttempt>();
      localAttempts.forEach((a) => localAttemptMap.set(a.timestamp, a));

      // Add remote attempts to local if missing
      remoteAttempts.forEach((ra) => {
        if (!localAttemptMap.has(ra.timestamp)) {
          localAttemptMap.set(ra.timestamp, ra);
        }
      });

      const mergedAttempts = Array.from(localAttemptMap.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );
      StorageService.saveQuizAttempts(mergedAttempts.slice(0, 50));

      // Push any local attempts to remote that weren't in Firestore yet
      const remoteTimestamps = new Set(remoteAttempts.map((ra) => ra.timestamp));
      for (const la of localAttempts) {
        if (!remoteTimestamps.has(la.timestamp)) {
          await syncQuizAttemptToFirestore(la, firebaseUser);
        }
      }

      // 3. Sync Active Recall Spaced Memory Cards
      const remoteSpaced = await fetchSpacedItemsFromFirestore(firebaseUser.uid);
      const localSpaced = StorageService.getSpacedItems();
      const mergedSpaced: Record<string, SpacedItem> = { ...localSpaced };

      for (const [qId, remoteItem] of Object.entries(remoteSpaced)) {
        const localItem = mergedSpaced[qId];
        if (!localItem) {
          mergedSpaced[qId] = remoteItem;
        } else {
          // Keep the record with higher repetition
          if ((remoteItem.repetition || 0) > (localItem.repetition || 0)) {
            mergedSpaced[qId] = remoteItem;
          }
        }
      }
      StorageService.saveSpacedItems(mergedSpaced);

      // Push local items to remote that are ahead or new
      for (const [qId, item] of Object.entries(mergedSpaced)) {
        const r = remoteSpaced[qId];
        if (!r || (item.repetition || 0) > (r.repetition || 0)) {
          await syncSpacedItemToFirestore(item, firebaseUser);
        }
      }

      setSyncStats({
        quizCount: mergedAttempts.length,
        spacedCardCount: Object.keys(mergedSpaced).length,
        lastSyncedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Full sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!auth.currentUser) return;
    await performFullSync(auth.currentUser);
  }, [performFullSync]);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        await performFullSync(firebaseUser);
      }
    });

    return () => unsubscribe();
  }, [performFullSync]);

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
        syncStats,
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
