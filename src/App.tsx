import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  NavigationTab,
  UserStreak,
  QuizAttempt,
  TopicStat,
} from './types';
import { StorageService } from './services/storage';
import { BottomNav } from './components/BottomNav';
import { BlazeMascot } from './components/BlazeMascot';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Code-split dynamic routes for fast initial paint
const HomeScreen = lazy(() =>
  import('./views/HomeScreen').then((m) => ({ default: m.HomeScreen }))
);
const PracticeQuizScreen = lazy(() =>
  import('./views/PracticeQuizScreen').then((m) => ({ default: m.PracticeQuizScreen }))
);
const MockExamScreen = lazy(() =>
  import('./views/MockExamScreen').then((m) => ({ default: m.MockExamScreen }))
);
const SpacedReviewScreen = lazy(() =>
  import('./views/SpacedReviewScreen').then((m) => ({ default: m.SpacedReviewScreen }))
);
const ProgressDashboardScreen = lazy(() =>
  import('./views/ProgressDashboardScreen').then((m) => ({ default: m.ProgressDashboardScreen }))
);
const PremiumPaywallScreen = lazy(() =>
  import('./views/PremiumPaywallScreen').then((m) => ({ default: m.PremiumPaywallScreen }))
);
const SettingsScreen = lazy(() =>
  import('./views/SettingsScreen').then((m) => ({ default: m.SettingsScreen }))
);
const OnboardingScreen = lazy(() =>
  import('./views/OnboardingScreen').then((m) => ({ default: m.OnboardingScreen }))
);

type ActiveScreen =
  | { type: 'tabs'; tab: NavigationTab }
  | { type: 'practice'; examType: string; subject: string; topic?: string }
  | { type: 'mock'; examType: string; subject: string }
  | { type: 'premium' };

// Branded loading fallback
const ScreenLoadingFallback: React.FC = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative animate-pulse">
      <BlazeMascot mood="HAPPY" size={80} showGlow={true} />
    </div>
    <div className="mt-4 text-xs font-bold uppercase tracking-widest text-orange-400">
      Loading StudyPal...
    </div>
  </div>
);

export const App: React.FC = () => {
  const [userStreak, setUserStreak] = useState<UserStreak>(() => StorageService.getUserStreak());
  const [topicStats, setTopicStats] = useState<Record<string, TopicStat>>(() => StorageService.getTopicStats());
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>(() => StorageService.getQuizAttempts());
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>({
    type: 'tabs',
    tab: 'home',
  });

  const refreshData = () => {
    setUserStreak(StorageService.getUserStreak());
    setTopicStats(StorageService.getTopicStats());
    setRecentAttempts(StorageService.getQuizAttempts());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOnboardingComplete = (targetExam: string, targetScore: number) => {
    const updated: UserStreak = {
      ...userStreak,
      hasSeenOnboarding: true,
      targetExam,
      targetScore,
    };
    StorageService.saveUserStreak(updated);
    setUserStreak(updated);
  };

  // If user hasn't seen onboarding, display onboarding screen
  if (!userStreak.hasSeenOnboarding) {
    return (
      <main className="min-h-screen frosted-bg text-slate-100 flex flex-col justify-center">
        <Suspense fallback={<ScreenLoadingFallback />}>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        </Suspense>
      </main>
    );
  }

  // Active Screen Routing
  let content: React.ReactNode = null;

  if (currentScreen.type === 'practice') {
    content = (
      <PracticeQuizScreen
        examType={currentScreen.examType}
        subject={currentScreen.subject}
        topic={currentScreen.topic}
        onNavigateBack={() => {
          refreshData();
          setCurrentScreen({ type: 'tabs', tab: 'home' });
        }}
        onOpenPremium={() => setCurrentScreen({ type: 'premium' })}
      />
    );
  } else if (currentScreen.type === 'mock') {
    content = (
      <MockExamScreen
        examType={currentScreen.examType}
        subject={currentScreen.subject}
        onNavigateBack={() => {
          refreshData();
          setCurrentScreen({ type: 'tabs', tab: 'home' });
        }}
      />
    );
  } else if (currentScreen.type === 'premium') {
    content = (
      <PremiumPaywallScreen
        userStreak={userStreak}
        onNavigateBack={() => {
          refreshData();
          setCurrentScreen({ type: 'tabs', tab: 'home' });
        }}
        onRefreshStreak={refreshData}
      />
    );
  } else {
    // Primary Tab screens
    switch (currentScreen.tab) {
      case 'home':
        content = (
          <HomeScreen
            userStreak={userStreak}
            topicStats={topicStats}
            recentAttempts={recentAttempts}
            onStartPractice={(examType, subject, topic) =>
              setCurrentScreen({ type: 'practice', examType, subject, topic })
            }
            onStartMock={(examType, subject) =>
              setCurrentScreen({ type: 'mock', examType, subject })
            }
            onOpenSpacedReview={() =>
              setCurrentScreen({ type: 'tabs', tab: 'review' })
            }
            onOpenProgress={() =>
              setCurrentScreen({ type: 'tabs', tab: 'progress' })
            }
            onOpenPremium={() => setCurrentScreen({ type: 'premium' })}
          />
        );
        break;

      case 'review':
        content = (
          <SpacedReviewScreen
            onNavigateBack={() =>
              setCurrentScreen({ type: 'tabs', tab: 'home' })
            }
            onOpenPremium={() => setCurrentScreen({ type: 'premium' })}
          />
        );
        break;

      case 'progress':
        content = (
          <ProgressDashboardScreen
            userStreak={userStreak}
            topicStats={topicStats}
            recentAttempts={recentAttempts}
            onNavigateBack={() =>
              setCurrentScreen({ type: 'tabs', tab: 'home' })
            }
            onOpenSpacedReview={() =>
              setCurrentScreen({ type: 'tabs', tab: 'review' })
            }
          />
        );
        break;

      case 'settings':
        content = (
          <SettingsScreen
            userStreak={userStreak}
            onNavigateBack={() =>
              setCurrentScreen({ type: 'tabs', tab: 'home' })
            }
            onUpdateStreak={(updated) => setUserStreak(updated)}
          />
        );
        break;
    }
  }

  const showBottomNav = currentScreen.type === 'tabs';

  return (
    <div className="min-h-screen frosted-bg text-slate-100 flex flex-col justify-between selection:bg-orange-500/30 selection:text-orange-200">
      <main className="flex-1 w-full">
        <Suspense fallback={<ScreenLoadingFallback />}>
          {content}
        </Suspense>
      </main>

      {/* PWA Install Banner for offline mobile study */}
      <PWAInstallBanner />

      {showBottomNav && (
        <BottomNav
          currentTab={currentScreen.tab}
          onTabSelect={(tab) => setCurrentScreen({ type: 'tabs', tab })}
        />
      )}
    </div>
  );
};

export default App;
