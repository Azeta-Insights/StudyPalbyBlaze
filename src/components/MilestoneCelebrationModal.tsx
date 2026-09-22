import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Award, Flame, X } from 'lucide-react';
import { MilestoneEvent } from '../types';
import { BlazeMascot } from './BlazeMascot';

interface MilestoneCelebrationModalProps {
  event: MilestoneEvent;
  onDismiss: () => void;
}

export const MilestoneCelebrationModal: React.FC<MilestoneCelebrationModalProps> = ({
  event,
  onDismiss,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6321', '#F59E0B', '#3B82F6', '#10B981'],
      });
    } catch {
      // ignore
    }
  }, []);

  let title = 'Congratulations!';
  let description = 'Keep blazing through your prep!';
  let icon = <Trophy className="w-8 h-8 text-amber-400" />;

  switch (event.type) {
    case 'seven_day_streak':
      title = '7-Day Streak Achieved! 🔥';
      description =
        'Consistency is your superpower! Blaze is proud of your hard work. You just unlocked your 7-Day Free Premium Trial!';
      icon = <Flame className="w-8 h-8 text-orange-500" fill="#FF6321" />;
      break;
    case 'trial_unlocked':
      title = 'Blaze Premium Unlocked! ⭐';
      description =
        'Enjoy 7 full days of comprehensive step-by-step past question solutions, unlimited timed CBT mock tests, and smart memory reviews.';
      icon = <Sparkles className="w-8 h-8 text-amber-400" />;
      break;
    case 'perfect_score':
      title = 'Flawless Victory! 💯';
      description =
        '100% accuracy! Proof that your focused practice is building genuine mastery. Blaze is cheering loud for you!';
      icon = <Award className="w-8 h-8 text-emerald-400" />;
      break;
    case 'topic_mastered':
      title = `Mastery Conquered! 🎓`;
      description = `You’ve conquered ${event.topicName} with over 75% accuracy. Blaze salutes your academic dedication!`;
      icon = <Trophy className="w-8 h-8 text-amber-400" />;
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-orange-500/40 shadow-2xl text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot Center Stage */}
        <div className="flex justify-center mb-4 pt-2">
          <BlazeMascot mood="CELEBRATING" size={110} showGlow={true} />
        </div>

        <div className="inline-flex items-center justify-center p-3 mb-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
          {icon}
        </div>

        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          {title}
        </h3>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {description}
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 transition-all transform active:scale-98"
        >
          Keep Blazing, Blaze! 🔥
        </button>
      </div>
    </div>
  );
};
