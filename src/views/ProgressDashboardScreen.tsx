import React from 'react';
import {
  ArrowLeft,
  Trophy,
  Flame,
  TrendingUp,
  BrainCircuit,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { UserStreak, QuizAttempt, TopicStat } from '../types';
import { BlazeMascot } from '../components/BlazeMascot';
import { FrostedGlassCard } from '../components/FrostedGlassCard';

interface ProgressDashboardScreenProps {
  userStreak: UserStreak;
  topicStats: Record<string, TopicStat>;
  recentAttempts: QuizAttempt[];
  onNavigateBack: () => void;
  onOpenSpacedReview: () => void;
}

export const ProgressDashboardScreen: React.FC<ProgressDashboardScreenProps> = ({
  userStreak,
  topicStats,
  recentAttempts,
  onNavigateBack,
  onOpenSpacedReview,
}) => {
  const topics = Object.values(topicStats);
  const masteredTopics = topics.filter((t) => t.status === 'mastered');
  const buildingTopics = topics.filter((t) => t.status !== 'mastered');

  const totalAttempted = recentAttempts.reduce((acc, a) => acc + a.totalQuestions, 0);
  const totalCorrect = recentAttempts.reduce((acc, a) => acc + a.score, 0);
  const overallAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

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
        <h2 className="text-base font-bold text-white">
          Progress & Mastery Dashboard
        </h2>
        <div className="w-8" />
      </div>

      {/* Hero Overview */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-orange-500/20 via-slate-900 to-slate-900 border border-orange-500/30 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block mb-1">
              Overall Academic Standing
            </span>
            <div className="text-3xl font-black text-white">
              {overallAccuracy}%
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {totalCorrect} correct of {totalAttempted} answered questions
            </p>
          </div>
          <BlazeMascot
            mood={overallAccuracy >= 70 ? 'CELEBRATING' : 'HAPPY'}
            size={76}
            showGlow={false}
          />
        </div>

        {/* 3 mini stats */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-white/10 text-center">
          <div className="p-2 rounded-xl bg-slate-800/60">
            <span className="text-xs font-black text-orange-400 block">
              {userStreak.currentStreak} Days
            </span>
            <span className="text-[10px] text-slate-400">Current Streak</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/60">
            <span className="text-xs font-black text-amber-400 block">
              {userStreak.bestStreak} Days
            </span>
            <span className="text-[10px] text-slate-400">Best Streak</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/60">
            <span className="text-xs font-black text-emerald-400 block">
              {masteredTopics.length}
            </span>
            <span className="text-[10px] text-slate-400">Mastered Topics</span>
          </div>
        </div>
      </div>

      {/* Mastered Topics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Mastered Topics ({masteredTopics.length})</span>
          </h3>
        </div>

        {masteredTopics.length === 0 ? (
          <div className="p-4 rounded-2xl glass-card text-center text-xs text-slate-400">
            Keep practicing! Reach 75% accuracy with 3+ attempts to conquer a topic.
          </div>
        ) : (
          <div className="space-y-2">
            {masteredTopics.map((top) => {
              const pct = Math.round((top.totalCorrect / top.totalAttempted) * 100);
              const formattedName = top.topicName
                .replace(/-/g, ' ')
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

              return (
                <div
                  key={top.topicKey}
                  className="p-3.5 rounded-2xl glass-card flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{formattedName}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {top.subject} • {top.totalCorrect}/{top.totalAttempted} correct
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-1 rounded-md bg-emerald-500/10">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Building Strength Topics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span>Topics in Progress ({buildingTopics.length})</span>
          </h3>
          <button
            onClick={onOpenSpacedReview}
            className="text-[11px] font-bold text-orange-400 hover:text-orange-300"
          >
            Smart Memory Review →
          </button>
        </div>

        {buildingTopics.length === 0 ? (
          <div className="p-4 rounded-2xl glass-card text-center text-xs text-slate-400">
            No pending topics. Take a quick practice quiz to start tracking.
          </div>
        ) : (
          <div className="space-y-2">
            {buildingTopics.map((top) => {
              const pct =
                top.totalAttempted > 0
                  ? Math.round((top.totalCorrect / top.totalAttempted) * 100)
                  : 0;
              const formattedName = top.topicName
                .replace(/-/g, ' ')
                .split(' ')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');

              return (
                <div
                  key={top.topicKey}
                  className="p-3.5 rounded-2xl glass-card flex items-center justify-between"
                >
                  <div className="flex-1 mr-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">
                        {formattedName}
                      </span>
                      <span className="text-xs font-semibold text-orange-400">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Recent Sessions</span>
        </h3>

        {recentAttempts.length === 0 ? (
          <div className="p-4 rounded-2xl glass-card text-center text-xs text-slate-400">
            No quiz attempts recorded yet. Start practicing!
          </div>
        ) : (
          <div className="space-y-2">
            {recentAttempts.slice(0, 10).map((att) => {
              const pct = Math.round((att.score / att.totalQuestions) * 100);
              const dateStr = new Date(att.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={att.id}
                  className="p-3 rounded-2xl glass-card flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        pct >= 70
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {pct}%
                    </div>
                    <div>
                      <div className="font-bold text-white capitalize">
                        {att.subject.replace(/-/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {att.mode === 'mock' ? 'CBT Mock' : 'Practice Drill'} • {att.examType.toUpperCase()} • {dateStr}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-300">
                    {att.score}/{att.totalQuestions}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
