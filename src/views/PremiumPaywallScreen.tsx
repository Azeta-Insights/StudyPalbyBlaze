import React from 'react';
import {
  ArrowLeft,
  Star,
  Check,
  Flame,
  Sparkles,
  BookOpen,
  Timer,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';
import { UserStreak } from '../types';
import { StorageService } from '../services/storage';
import { BlazeMascot } from '../components/BlazeMascot';

interface PremiumPaywallScreenProps {
  userStreak: UserStreak;
  onNavigateBack: () => void;
  onRefreshStreak: () => void;
}

export const PremiumPaywallScreen: React.FC<PremiumPaywallScreenProps> = ({
  userStreak,
  onNavigateBack,
  onRefreshStreak,
}) => {
  const isPremium = StorageService.isPremiumActive(userStreak);
  const trialDaysRemaining = StorageService.getDaysRemainingInTrial(userStreak);
  const streak = userStreak.currentStreak;
  const progressRatio = Math.min(1, streak / 7);

  const handleSimulateTrialUnlock = () => {
    const updated: UserStreak = {
      ...userStreak,
      isTrialUnlocked: true,
      trialStartDate: Date.now(),
      trialEndDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    StorageService.saveUserStreak(updated);
    onRefreshStreak();
  };

  return (
    <div className="min-h-screen pb-24 pt-3 max-w-lg mx-auto px-4 space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-1 border-b border-white/5">
        <button
          onClick={onNavigateBack}
          className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-white flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-400" fill="#F59E0B" />
          <span>Blaze Premium</span>
        </h2>
        <div className="w-8" />
      </div>

      {/* Hero Badge */}
      <div className="text-center pt-2">
        <BlazeMascot mood={isPremium ? 'CELEBRATING' : 'HAPPY'} size={100} showGlow={true} />
        <h1 className="text-2xl font-black text-white mt-3 tracking-tight">
          Supercharge Your Exam Prep
        </h1>
        <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1 leading-relaxed">
          Master JAMB, WAEC, and NECO with in-depth step-by-step solutions and personalized CBT simulations.
        </p>
      </div>

      {/* 7-Day Streak Reward Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-orange-500/20 via-slate-900 to-slate-900 border border-orange-500/40 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Flame className="w-6 h-6 animate-pulse" fill="#FF6321" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              7-Day Streak Reward
            </h3>
            <p className="text-[11px] text-slate-400">
              Practice 7 consecutive days to unlock 7 days free!
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-orange-300">{streak} of 7 days completed</span>
            <span className="text-slate-400">
              {isPremium ? 'Unlocked' : `${Math.max(0, 7 - streak)} days left`}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>

        {isPremium ? (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              Premium Active! You have {trialDaysRemaining} days remaining in your free trial.
            </span>
          </div>
        ) : (
          <button
            onClick={handleSimulateTrialUnlock}
            className="w-full py-2 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-xs font-bold text-orange-300 transition"
          >
            Instant Test: Activate 7-Day Free Trial
          </button>
        )}
      </div>

      {/* Feature List */}
      <div className="p-5 rounded-3xl glass-card space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          What’s Included in Blaze Premium
        </h3>

        {[
          {
            icon: <BookOpen className="w-4 h-4 text-orange-400" />,
            title: 'Complete Step-by-Step Solutions',
            desc: 'Every past question includes rigorous calculations, grammar rules, and textbook references.',
          },
          {
            icon: <Timer className="w-4 h-4 text-purple-400" />,
            title: 'Unlimited Timed CBT Mocks',
            desc: 'Simulate the exact real JAMB 2-hour and WAEC exam conditions with instant grading.',
          },
          {
            icon: <BrainCircuit className="w-4 h-4 text-blue-400" />,
            title: 'Smart Active Recall Memory Booster',
            desc: 'Never forget tricky formulas with scientifically timed active recall review drills.',
          },
          {
            icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
            title: '100% Offline-First Access',
            desc: 'Study anywhere across Nigeria without exhausting your mobile data bundles.',
          },
        ].map((feat, idx) => (
          <div key={idx} className="flex items-start gap-3 text-xs">
            <div className="p-2 rounded-xl bg-slate-800/80 shrink-0 mt-0.5">
              {feat.icon}
            </div>
            <div>
              <div className="font-bold text-white mb-0.5">{feat.title}</div>
              <div className="text-slate-400 leading-relaxed">{feat.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Choose a Plan
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Monthly */}
          <div className="p-4 rounded-2xl glass-card border-white/10 hover:border-orange-500/40 transition text-center space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">Monthly</span>
            <div className="text-xl font-black text-white">₦1,500</div>
            <span className="text-[10px] text-slate-400 block">Billed monthly</span>
            <button className="w-full py-2 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-750 transition">
              Get Started
            </button>
          </div>

          {/* Full Term */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-orange-500/20 to-slate-900 border border-orange-500/40 text-center space-y-2 relative overflow-hidden">
            <span className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
              BEST VALUE
            </span>
            <span className="text-[11px] font-bold text-orange-300 block">Exam Term</span>
            <div className="text-xl font-black text-white">₦3,500</div>
            <span className="text-[10px] text-slate-400 block">3 full months</span>
            <button className="w-full py-2 rounded-xl font-bold text-xs text-white bg-orange-500 hover:bg-orange-600 transition shadow-md shadow-orange-500/20">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
