import React, { useState } from 'react';
import {
  Star,
  Play,
  Timer,
  BrainCircuit,
  ChevronRight,
  Sparkles,
  AlertCircle,
  X,
  Search,
  Cloud,
} from 'lucide-react';
import { UserStreak, QuizAttempt, TopicStat, SubjectInfo } from '../types';
import { BlazeMascot } from '../components/BlazeMascot';
import { BlazeCharacter } from '../blaze/BlazeCharacter';
import { StreakBanner } from '../components/StreakBanner';
import { FrostedGlassCard } from '../components/FrostedGlassCard';
import { StorageService } from '../services/storage';
import { SoundService } from '../services/sound';
import { useFirebase } from '../context/FirebaseContext';

interface HomeScreenProps {
  userStreak: UserStreak;
  topicStats: Record<string, TopicStat>;
  recentAttempts: QuizAttempt[];
  onStartPractice: (examType: string, subject: string, topic?: string) => void;
  onStartMock: (examType: string, subject: string) => void;
  onOpenSpacedReview: () => void;
  onOpenProgress: () => void;
  onOpenPremium: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userStreak,
  topicStats,
  recentAttempts,
  onStartPractice,
  onStartMock,
  onOpenSpacedReview,
  onOpenProgress,
  onOpenPremium,
}) => {
  const { user, isSyncing } = useFirebase();
  const [comingSoonSubject, setComingSoonSubject] = useState<SubjectInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const targetExam = userStreak.targetExam || 'jamb';
  const examDisplayName =
    targetExam === 'jamb'
      ? 'JAMB UTME'
      : targetExam === 'waec'
      ? 'WAEC WASSCE'
      : 'NECO SSCE';

  const subjects = StorageService.getSubjectsForExam(targetExam);
  const searchResults = searchQuery.trim() ? StorageService.searchTopics(searchQuery, targetExam) : [];

  // Grounded contextual Blaze dialogue based strictly on real state
  const blazeSpeech = BlazeCharacter.getHomeDialogue(
    userStreak.currentStreak,
    recentAttempts,
    examDisplayName
  );

  // Analytics stats
  const topicList = Object.values(topicStats);
  const masteredCount = topicList.filter((t) => t.status === 'mastered').length;
  const totalAttempts = recentAttempts.length;
  const avgAccuracy =
    recentAttempts.length > 0
      ? Math.round(
          (recentAttempts.reduce((acc, a) => acc + a.score, 0) /
            recentAttempts.reduce((acc, a) => acc + a.totalQuestions, 0)) *
            100
        )
      : 0;

  const getSubjectColor = (id: string) => {
    switch (id.toLowerCase()) {
      case 'mathematics':
        return 'bg-orange-500';
      case 'english-language':
        return 'bg-blue-500';
      case 'biology':
        return 'bg-emerald-500';
      case 'government':
        return 'bg-purple-500';
      case 'physics':
        return 'bg-indigo-500';
      case 'commerce':
        return 'bg-amber-500';
      case 'chemistry':
        return 'bg-cyan-500';
      default:
        return 'bg-rose-500';
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto px-4 pt-3">
      {/* 1. Frosted Glass Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              STUDYPAL BY BLAZE
            </span>
            {user && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                <Cloud className="w-2.5 h-2.5" />
                <span>{isSyncing ? 'Syncing...' : 'Cloud Synced'}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Hello, Scholar! 👋
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPremium}
            className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition active:scale-95"
            title="Blaze Premium"
          >
            <Star className="w-5 h-5" fill="#F59E0B" />
          </button>

          <button
            onClick={onOpenProgress}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-0.5 border border-white/20 shadow-md hover:scale-105 active:scale-95 transition flex items-center justify-center overflow-hidden"
            title="Blaze Progress"
          >
            <BlazeMascot
              mood={StorageService.isPremiumActive(userStreak) ? 'CELEBRATING' : 'HAPPY'}
              size={40}
              showGlow={false}
            />
          </button>
        </div>
      </div>

      {/* 2. Frosted Streak Banner */}
      <StreakBanner userStreak={userStreak} onOpenPremium={onOpenPremium} />

      {/* 3. Quick Action Frosted Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Quick Practice */}
        <button
          onClick={() => onStartPractice(targetExam, 'mathematics')}
          className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between h-32 hover:border-blue-500/40 hover:bg-blue-500/10 transition active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/20 group-hover:scale-110 transition">
            <Play className="w-5 h-5 ml-0.5" fill="#60A5FA" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Quick Practice</div>
            <div className="text-[10px] text-slate-400">Untimed drill</div>
          </div>
        </button>

        {/* Timed Mock */}
        <button
          onClick={() => onStartMock(targetExam, 'mathematics')}
          className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between h-32 hover:border-purple-500/40 hover:bg-purple-500/10 transition active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/20 group-hover:scale-110 transition">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Timed Mock</div>
            <div className="text-[10px] text-slate-400">CBT standard</div>
          </div>
        </button>

        {/* Smart Active Recall */}
        <button
          onClick={onOpenSpacedReview}
          className="p-3.5 rounded-2xl glass-card text-left flex flex-col justify-between h-32 hover:border-orange-500/40 hover:bg-orange-500/10 transition active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-400/20 group-hover:scale-110 transition">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white leading-tight">Smart Recall</div>
            <div className="text-[10px] text-slate-400">Memory drill</div>
          </div>
        </button>
      </div>

      {/* 4. Blaze Coaching Banner */}
      <FrostedGlassCard variant="orange" className="p-4 border-orange-500/30">
        <div className="flex items-center gap-3.5">
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
              Blaze says:
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed italic">
              "{blazeSpeech.text}"
            </p>
          </div>
          <div className="shrink-0">
            <BlazeMascot mood={blazeSpeech.mood} size={64} showGlow={false} />
          </div>
        </div>
      </FrostedGlassCard>

      {/* 5. Topic Search & Syllabus Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic: Algebra, Cell, Concord, Trade..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown/List */}
        {searchQuery.trim() && (
          <div className="p-3 rounded-2xl glass-card border-orange-500/30 space-y-2 animate-in fade-in duration-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center justify-between">
              <span>Matching Syllabus Topics ({searchResults.length})</span>
              <span className="text-[10px] text-slate-400">Click to practice</span>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">
                No specific topics matched "{searchQuery}". Try "algebra", "cell", "trade", or "grammar".
              </p>
            ) : (
              <div className="space-y-1.5">
                {searchResults.map((res) => {
                  const formattedTopic = res.topic
                    .replace(/-/g, ' ')
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
                  const formattedSub = res.subject.replace(/-/g, ' ');

                  return (
                    <button
                      key={`${res.subject}::${res.topic}`}
                      onClick={() => {
                        SoundService.playClick();
                        onStartPractice(targetExam, res.subject, res.topic);
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-800/70 hover:bg-orange-500/20 border border-white/5 hover:border-orange-500/40 text-left flex items-center justify-between transition group"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-300">
                          {formattedTopic}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {formattedSub} • {res.count} Questions
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Subject Mastery Header */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Subject Mastery
        </h2>
        <span className="text-xs text-slate-400">
          {examDisplayName} Syllabus
        </span>
      </div>

      {/* 7. Subject Cards */}
      <div className="space-y-2.5">
        {subjects.map((sub) => {
          const initials = sub.name.slice(0, 2).toUpperCase();
          const colorClass = getSubjectColor(sub.id);

          return (
            <div
              key={sub.id}
              onClick={() => {
                if (sub.isAvailable) {
                  onStartPractice(targetExam, sub.id);
                } else {
                  setComingSoonSubject(sub);
                }
              }}
              className={`p-3.5 rounded-2xl glass-card flex items-center gap-3.5 transition-all duration-200 cursor-pointer ${
                sub.isAvailable
                  ? 'hover:border-white/20 hover:scale-[1.01]'
                  : 'opacity-70 hover:opacity-90'
              }`}
            >
              {/* Badge */}
              <div
                className={`w-11 h-11 rounded-xl ${colorClass} text-white font-black text-sm flex items-center justify-center shadow-md shrink-0`}
              >
                {initials}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-white truncate">
                    {sub.name}
                  </h3>
                  {sub.isAvailable ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {sub.questionCount} Qs
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${
                      sub.isAvailable ? colorClass : 'bg-slate-700'
                    }`}
                    style={{ width: sub.isAvailable ? '60%' : '0%' }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 truncate">
                  {sub.note}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* 7. Study Stats Summary Card */}
      <FrostedGlassCard
        onClick={onOpenProgress}
        className="p-4 border-white/10 hover:border-orange-500/30 transition cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            STUDY ANALYTICS
          </span>
          <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
            Full Report <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-800/40">
            <div className="text-lg font-black text-orange-400">
              {totalAttempts}
            </div>
            <div className="text-[11px] text-slate-400">Quizzes Taken</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40">
            <div className="text-lg font-black text-emerald-400">
              {totalAttempts > 0 ? `${avgAccuracy}%` : '—'}
            </div>
            <div className="text-[11px] text-slate-400">Avg Accuracy</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/40">
            <div className="text-lg font-black text-amber-400">
              {masteredCount}
            </div>
            <div className="text-[11px] text-slate-400">Mastered</div>
          </div>
        </div>
      </FrostedGlassCard>

      {/* Coming Soon Dialog */}
      {comingSoonSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              <BlazeMascot mood="THINKING" size={72} showGlow={false} />
            </div>
            <h3 className="text-lg font-bold text-white">
              {comingSoonSubject.name} Curation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {BlazeCharacter.getContentGapMessage(comingSoonSubject.name, examDisplayName)}
            </p>
            <button
              onClick={() => setComingSoonSubject(null)}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              Got it, Blaze! 🔥
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
