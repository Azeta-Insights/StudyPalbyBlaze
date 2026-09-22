import React from 'react';
import { Flame, Star, Sparkles, Clock } from 'lucide-react';
import { UserStreak } from '../types';
import { BlazeCharacter } from '../blaze/BlazeCharacter';
import { StorageService } from '../services/storage';

interface StreakBannerProps {
  userStreak: UserStreak;
  onOpenPremium: () => void;
}

export const StreakBanner: React.FC<StreakBannerProps> = ({
  userStreak,
  onOpenPremium,
}) => {
  const currentStreak = userStreak.currentStreak;
  const isPremium = StorageService.isPremiumActive(userStreak);
  const trialDaysRemaining = StorageService.getDaysRemainingInTrial(userStreak);
  const examDaysRemaining = Math.max(
    1,
    Math.ceil((userStreak.targetExamDate - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const examLabel = userStreak.targetExam.toUpperCase();
  const streakNudge = BlazeCharacter.getStreakBannerNudge(currentStreak);
  const progressRatio = Math.min(1, currentStreak / 7);

  return (
    <div
      onClick={onOpenPremium}
      className="rounded-3xl p-5 relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-orange-950/20 to-slate-900/80 backdrop-blur-xl shadow-lg shadow-orange-500/10"
    >
      {/* Background ambient flame glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/25 border border-orange-400/40 flex items-center justify-center text-orange-400 shadow-inner">
            <Flame className="w-6 h-6 animate-pulse" fill="#FF6321" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">
                {currentStreak}
              </span>
              <span className="text-sm font-bold uppercase tracking-wider text-orange-300">
                {currentStreak === 1 ? 'Day Streak' : 'Days Streak'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Best: {userStreak.bestStreak} days</p>
          </div>
        </div>

        {/* Target Exam Countdown Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200">
          <Clock className="w-3.5 h-3.5 text-orange-400" />
          <span>{examLabel} • {examDaysRemaining}d to exam</span>
        </div>
      </div>

      {/* Streak Progress towards 7-day Premium Unlock */}
      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-medium">
            {isPremium
              ? `🔥 Blaze Premium Active (${trialDaysRemaining} days remaining)`
              : `${currentStreak}/7 Days to Free 7-Day Premium Trial`}
          </span>
          <span className="text-orange-400 font-semibold flex items-center gap-1">
            {isPremium ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Unlocked
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" fill="#F59E0B" />
                {Math.max(0, 7 - currentStreak)} days left
              </span>
            )}
          </span>
        </div>

        {/* 7-Step Progress Segments */}
        <div className="grid grid-cols-7 gap-1.5 h-2.5">
          {Array.from({ length: 7 }).map((_, i) => {
            const isFilled = i < currentStreak;
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                  isFilled
                    ? 'bg-gradient-to-r from-orange-500 to-amber-400 shadow-sm shadow-orange-500/50'
                    : 'bg-slate-800/80 border border-slate-700/50'
                }`}
              />
            );
          })}
        </div>

        <p className="text-xs text-orange-200/80 font-medium pt-1">
          {streakNudge}
        </p>
      </div>
    </div>
  );
};
