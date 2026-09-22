import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserStreak, QuizAttempt, SpacedItem } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection to Firestore on initialization
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Standardized Operation Types & Error Reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      // User cancelled or closed the sign-in popup - benign action, not a system failure
      return null;
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

// User Profile & Study Streak Cloud Sync
export async function syncUserProfileToFirestore(
  streak: UserStreak,
  user?: FirebaseUser | null
): Promise<void> {
  const currentUser = user || auth.currentUser;
  if (!currentUser) return;

  const userDocRef = doc(db, 'users', currentUser.uid);
  const payload = {
    id: currentUser.uid,
    email: currentUser.email || '',
    displayName: currentUser.displayName || 'Student',
    targetExam: streak.targetExam || 'jamb',
    targetScore: Number(streak.targetScore) || 280,
    currentStreak: Number(streak.currentStreak) || 0,
    bestStreak: Number(streak.bestStreak) || 0,
    lastPracticeDate: streak.lastPracticeDate || '',
    isTrialUnlocked: Boolean(streak.isTrialUnlocked),
    trialStartDate: Number(streak.trialStartDate) || 0,
    trialEndDate: Number(streak.trialEndDate) || 0,
    isSubscribed: Boolean(streak.isSubscribed),
    hasSeenOnboarding: Boolean(streak.hasSeenOnboarding),
  };

  try {
    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
  }
}

export async function fetchUserProfileFromFirestore(
  uid: string
): Promise<Partial<UserStreak> | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as Partial<UserStreak>;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Sync Quiz Attempt History
export async function syncQuizAttemptToFirestore(
  attempt: QuizAttempt,
  user?: FirebaseUser | null
): Promise<void> {
  const currentUser = user || auth.currentUser;
  if (!currentUser) return;

  const attemptId = `attempt_${attempt.id || Date.now()}`;
  const path = `users/${currentUser.uid}/quizAttempts/${attemptId}`;
  const payload = {
    id: attemptId,
    userId: currentUser.uid,
    examType: attempt.examType,
    subject: attempt.subject,
    mode: attempt.mode,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    durationSeconds: attempt.durationSeconds,
    timestamp: attempt.timestamp,
    isPerfectScore: attempt.isPerfectScore,
  };

  try {
    await setDoc(doc(db, 'users', currentUser.uid, 'quizAttempts', attemptId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Sync Spaced Recall Memory Item
export async function syncSpacedItemToFirestore(
  item: SpacedItem,
  user?: FirebaseUser | null
): Promise<void> {
  const currentUser = user || auth.currentUser;
  if (!currentUser) return;

  // Sanitize question ID for Firestore doc ID
  const docId = item.questionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `users/${currentUser.uid}/spacedItems/${docId}`;
  const payload = {
    questionId: docId,
    userId: currentUser.uid,
    subject: item.subject,
    topic: item.topic || null,
    repetition: item.repetition,
    intervalDays: item.intervalDays,
    easinessFactor: item.easinessFactor,
    nextReviewTimestamp: item.nextReviewTimestamp,
    lastReviewedTimestamp: item.lastReviewedTimestamp,
    reviewCount: item.reviewCount,
    correctCount: item.correctCount,
  };

  try {
    await setDoc(doc(db, 'users', currentUser.uid, 'spacedItems', docId), payload, {
      merge: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Listen to Firestore auth state changes
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
