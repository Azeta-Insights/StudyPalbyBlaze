import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Trash2,
  Info,
  Check,
  Target,
  School,
  AlertTriangle,
  Volume2,
  Vibrate,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Cloud,
  RefreshCw,
  LogOut,
  LogIn,
  User as UserIcon,
} from 'lucide-react';
import { UserStreak } from '../types';
import { StorageService } from '../services/storage';
import { SoundService } from '../services/sound';
import { BlazeMascot } from '../components/BlazeMascot';
import { useFirebase } from '../context/FirebaseContext';

interface SettingsScreenProps {
  userStreak: UserStreak;
  onNavigateBack: () => void;
  onUpdateStreak: (updated: UserStreak) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userStreak,
  onNavigateBack,
  onUpdateStreak,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => SoundService.isSoundEnabled());
  const [hapticsEnabled, setHapticsEnabled] = useState(() => SoundService.isHapticsEnabled());
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const { user, isSyncing, syncStats, signIn, signOut, syncNow } = useFirebase();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or dismissed the login dialog voluntarily
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
        return;
      }
      setAuthError('Could not sign in with Google. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const exams = [
    { id: 'jamb', name: 'JAMB UTME', note: 'Computer-Based Test for Universities' },
    { id: 'waec', name: 'WAEC WASSCE', note: 'Senior School Certificate Examination' },
    { id: 'neco', name: 'NECO SSCE', note: 'National Examination Council Senior School' },
  ];

  const scores = [250, 280, 300, 320];

  const handleSelectExam = (examId: string) => {
    const updated: UserStreak = {
      ...userStreak,
      targetExam: examId,
    };
    StorageService.saveUserStreak(updated);
    onUpdateStreak(updated);
  };

  const handleSelectScore = (score: number) => {
    const updated: UserStreak = {
      ...userStreak,
      targetScore: score,
    };
    StorageService.saveUserStreak(updated);
    onUpdateStreak(updated);
  };

  const handleConfirmReset = () => {
    StorageService.resetAllData();
    const fresh = StorageService.getUserStreak();
    onUpdateStreak(fresh);
    setShowResetDialog(false);
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
        <h2 className="text-base font-bold text-white">Settings & Preferences</h2>
        <div className="w-8" />
      </div>

      {/* Cloud Account & Backup (Firebase) */}
      <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Cloud Study Account</span>
                {user && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {user
                  ? user.email || user.displayName || 'Google Account Connected'
                  : 'Back up your streaks and scores across devices'}
              </div>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={syncNow}
                disabled={isSyncing}
                title="Sync now to cloud"
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-400' : ''}`} />
              </button>
              <button
                onClick={signOut}
                title="Sign out"
                className="p-2 rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95"
            >
              {isSigningIn ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </>
              )}
            </button>
          )}
        </div>

        {user ? (
          <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block font-medium">Status</span>
              <span className="text-xs font-bold text-emerald-400">
                {isSyncing ? 'Syncing...' : 'Fully Synced'}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block font-medium">Quizzes</span>
              <span className="text-xs font-bold text-white">
                {syncStats.quizCount} saved
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 block font-medium">Recall Deck</span>
              <span className="text-xs font-bold text-orange-400">
                {syncStats.spacedCardCount} cards
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>
              Your study streak and quiz history are saved locally. Connect Google to enable seamless cloud backup and multi-device sync.
            </span>
          </div>
        )}

        {authError && (
          <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
            {authError}
          </div>
        )}
      </div>

      {/* Target Exam Selection */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <School className="w-4 h-4 text-orange-400" />
          <span>Target Examination</span>
        </h3>

        <div className="space-y-2">
          {exams.map((ex) => {
            const isSelected = userStreak.targetExam === ex.id;
            return (
              <button
                key={ex.id}
                onClick={() => handleSelectExam(ex.id)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500/40'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-white">{ex.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{ex.note}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Score Selection */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-amber-400" />
          <span>Target Score Goal</span>
        </h3>

        <div className="grid grid-cols-4 gap-2">
          {scores.map((sc) => {
            const isSelected = userStreak.targetScore === sc;
            return (
              <button
                key={sc}
                onClick={() => handleSelectScore(sc)}
                className={`py-3 rounded-2xl font-black text-sm border transition ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sc}+
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Reminders */}
      <div className="p-4 rounded-2xl glass-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Daily Study Reminder</div>
            <div className="text-[11px] text-slate-400">Keep your daily streak alive</div>
          </div>
        </div>

        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className={`w-12 h-6 rounded-full p-1 transition-colors ${
            notificationsEnabled ? 'bg-orange-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Audio Sound Effects Toggle */}
      <div className="p-4 rounded-2xl glass-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Study Audio Feedback</div>
            <div className="text-[11px] text-slate-400">Chimes on correct answers and celebration sounds</div>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            SoundService.setSoundEnabled(next);
            if (next) SoundService.playSuccess();
          }}
          className={`w-12 h-6 rounded-full p-1 transition-colors ${
            soundEnabled ? 'bg-orange-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              soundEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Mobile Vibration / Haptic Toggle */}
      <div className="p-4 rounded-2xl glass-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Vibrate className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Haptic Vibration</div>
            <div className="text-[11px] text-slate-400">Tactile taps on button presses & answers</div>
          </div>
        </div>

        <button
          onClick={() => {
            const next = !hapticsEnabled;
            setHapticsEnabled(next);
            SoundService.setHapticsEnabled(next);
            if (next) SoundService.triggerHaptic(30);
          }}
          className={`w-12 h-6 rounded-full p-1 transition-colors ${
            hapticsEnabled ? 'bg-orange-500' : 'bg-slate-700'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform ${
              hapticsEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Verified Question Provenance Audit */}
      <div className="rounded-2xl glass-card border border-white/10 overflow-hidden text-xs">
        <button
          onClick={() => setShowProvenance(!showProvenance)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Verified Past Questions Library</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-slate-400 text-[11px]">
                1,049 questions truly sourced from official examinations
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              Audited
            </span>
            {showProvenance ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {showProvenance && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5 bg-slate-900/50 text-[11px] text-slate-300">
            <p className="text-slate-400 leading-relaxed">
              Every question in StudyPal is authentic and sourced directly from official past examination papers with verified answers and explanations:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="font-bold text-orange-400 flex items-center justify-between">
                  <span>JAMB UTME</span>
                  <span className="text-white font-mono">599 Qs</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Biology, Commerce, English, Government, Mathematics, Physics
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="font-bold text-blue-400 flex items-center justify-between">
                  <span>WAEC WASSCE</span>
                  <span className="text-white font-mono">259 Qs</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Commerce, English, Government, Mathematics
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="font-bold text-emerald-400 flex items-center justify-between">
                  <span>NECO SSCE</span>
                  <span className="text-white font-mono">118 Qs</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Commerce, Government
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="font-bold text-purple-400 flex items-center justify-between">
                  <span>Post-UTME</span>
                  <span className="text-white font-mono">73 Qs</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Advanced Mathematics
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>
                100% genuine past papers (1988–2025) • Zero generated or simulated questions
              </span>
            </div>
          </div>
        )}
      </div>

      {/* About Blaze */}
      <div className="p-4 rounded-2xl glass-card flex items-center gap-3 text-xs">
        <BlazeMascot mood="HAPPY" size={48} showGlow={false} />
        <div>
          <div className="font-bold text-white">StudyPal by Blaze v1.0.0</div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            Curated for Nigerian secondary students preparing for JAMB, WAEC, and NECO exams.
          </div>
        </div>
      </div>

      {/* Reset Data */}
      <div className="pt-2">
        <button
          onClick={() => setShowResetDialog(true)}
          className="w-full py-3 rounded-2xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition text-xs font-bold flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Reset Study History
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Reset All Study Data?
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              This will reset your current streak, memory reviews, and quiz history. This cannot be undone.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmReset}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetDialog(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-750 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
