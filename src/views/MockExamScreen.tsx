import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Bookmark,
  CheckCircle,
  LayoutGrid,
  AlertTriangle,
  RotateCcw,
  Home,
  Check,
  X,
  Lightbulb,
  Keyboard,
} from 'lucide-react';
import { Question, MilestoneEvent } from '../types';
import { StorageService } from '../services/storage';
import { SoundService } from '../services/sound';
import { BlazeMascot } from '../components/BlazeMascot';
import { QuestionMediaView } from '../components/QuestionMediaView';
import { MilestoneCelebrationModal } from '../components/MilestoneCelebrationModal';

interface MockExamScreenProps {
  examType: string;
  subject: string;
  durationMinutes?: number;
  questionCount?: number;
  onNavigateBack: () => void;
}

export const MockExamScreen: React.FC<MockExamScreenProps> = ({
  examType,
  subject,
  durationMinutes = 20,
  questionCount = 20,
  onNavigateBack,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> option
  const [flagged, setFlagged] = useState<Record<string, boolean>>({}); // questionId -> boolean
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneEvent | null>(null);
  const [startTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const qs = StorageService.getQuestionsForMock(examType, subject, questionCount);
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswers({});
    setFlagged({});
    setTimeLeft(durationMinutes * 60);
    setIsExamCompleted(false);
  }, [examType, subject, durationMinutes, questionCount]);

  // Countdown timer
  useEffect(() => {
    if (isExamCompleted || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamCompleted, questions]);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optKey: string) => {
    if (!currentQuestion || isExamCompleted) return;
    SoundService.playClick();
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optKey,
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    SoundService.playClick();
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  // Authentic JAMB CBT 8-Key Keyboard Shortcuts (A, B, C, D, N, P, F, S, R)
  useEffect(() => {
    if (isExamCompleted || !currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(key)) {
        e.preventDefault();
        handleSelectOption(key);
      } else if (key === 'N' || key === 'ARROWDOWN' || key === 'ARROWRIGHT') {
        e.preventDefault();
        SoundService.playClick();
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else if (key === 'P' || key === 'ARROWUP' || key === 'ARROWLEFT') {
        e.preventDefault();
        SoundService.playClick();
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      } else if (key === 'F' || key === 'B') {
        e.preventDefault();
        handleToggleFlag();
      } else if (key === 'S') {
        e.preventDefault();
        SoundService.playClick();
        setShowSubmitModal(true);
      } else if (key === 'R') {
        e.preventDefault();
        SoundService.playClick();
        setShowGridModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExamCompleted, currentQuestion, currentIndex, questions.length]);

  const handleSubmitExam = () => {
    setShowSubmitModal(false);
    const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    setElapsedSeconds(duration);
    SoundService.playCelebration();

    // Calculate score
    let score = 0;
    questions.forEach((q) => {
      const selected = answers[q.id];
      const isCorrect = selected && selected.toUpperCase() === q.correctAnswer.toUpperCase();
      if (isCorrect) score += 1;

      // Update spaced active recall for all answered questions
      if (selected) {
        StorageService.recordQuestionAnswer(q, Boolean(isCorrect));
      }
    });

    // Record streak session
    const streakMilestones = StorageService.recordPracticeSession();
    // Record mock attempt
    const quizMilestone = StorageService.recordQuizCompletion(
      examType,
      subject,
      'mock',
      score,
      questions.length,
      duration
    );

    if (streakMilestones.length > 0) {
      setActiveMilestone(streakMilestones[0]);
    } else if (quizMilestone) {
      setActiveMilestone(quizMilestone);
    }

    setIsExamCompleted(true);
  };

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const formattedSubject = subject
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (questions.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <BlazeMascot mood="THINKING" size={96} />
        <h2 className="text-xl font-bold text-white mt-4">No Mock Questions</h2>
        <p className="text-sm text-slate-400 mt-2 mb-6">
          Authentic exam questions for {formattedSubject} are being loaded.
        </p>
        <button
          onClick={onNavigateBack}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Results View
  if (isExamCompleted) {
    let finalScore = 0;
    questions.forEach((q) => {
      if (answers[q.id]?.toUpperCase() === q.correctAnswer.toUpperCase()) {
        finalScore += 1;
      }
    });

    const percentage = Math.round((finalScore / questions.length) * 100);

    return (
      <div className="min-h-screen pb-16 pt-4 px-4 max-w-lg mx-auto space-y-6">
        {/* Top Header */}
        <div className="text-center pt-2">
          <BlazeMascot
            mood={percentage >= 70 ? 'CELEBRATING' : 'HAPPY'}
            size={100}
            showGlow={true}
          />
          <h2 className="text-2xl font-black text-white mt-3">
            CBT Mock Exam Completed! 🎯
          </h2>
          <p className="text-sm text-slate-400">
            {formattedSubject} • {examType.toUpperCase()} Simulation
          </p>
        </div>

        {/* Score Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl text-center space-y-4">
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            {finalScore} / {questions.length}
          </div>

          <div className="text-lg font-bold text-slate-200">
            Accuracy: <span className="text-orange-400">{percentage}%</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-800/60">
              <span className="text-slate-400 block mb-0.5">Time Spent</span>
              <span className="font-bold text-white">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-slate-400 block mb-0.5">Correct</span>
              <span className="font-bold text-emerald-400">{finalScore}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-slate-400 block mb-0.5">Incorrect</span>
              <span className="font-bold text-rose-400">
                {questions.length - finalScore}
              </span>
            </div>
          </div>
        </div>

        {/* Blaze Review Feedback */}
        <div className="p-4 rounded-2xl glass-card-orange border border-orange-500/30 flex items-center gap-3.5">
          <BlazeMascot
            mood={percentage >= 75 ? 'CELEBRATING' : 'EMPATHETIC'}
            size={56}
            showGlow={false}
          />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block">
              Blaze Exam Analysis:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed mt-0.5">
              {percentage >= 80
                ? 'Outstanding performance! You kept your composure and nailed the CBT timing. Blaze is thrilled!'
                : percentage >= 50
                ? 'Solid effort! You demonstrated strong foundational grasp. Review the questions missed below to secure that 280+ score.'
                : 'Every mock exam makes you sharper! Blaze added your missed questions to your Smart Recall deck so you master them.'}
            </p>
          </div>
        </div>

        {/* Question Review List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Question-by-Question Review
          </h3>

          {questions.map((q, idx) => {
            const chosen = answers[q.id];
            const isCorrect = chosen?.toUpperCase() === q.correctAnswer.toUpperCase();
            const optionsMap: Record<string, string> = {
              A: q.optionA,
              B: q.optionB,
              C: q.optionC,
              D: q.optionD,
            };

            return (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">
                      Question {idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                      {q.examType.toUpperCase()} {q.year}
                    </span>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      isCorrect
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isCorrect ? 'Correct' : chosen ? 'Incorrect' : 'Skipped'}
                  </span>
                </div>

                <div
                  className="text-sm text-slate-100 font-medium"
                  dangerouslySetInnerHTML={{ __html: q.text }}
                />

                <div className="space-y-1.5 text-xs">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const text = optionsMap[key];
                    if (!text) return null;
                    const isAns = key.toUpperCase() === q.correctAnswer.toUpperCase();
                    const isUserPick = chosen === key;

                    let rowClass = 'text-slate-400';
                    if (isAns) {
                      rowClass = 'text-emerald-300 font-bold bg-emerald-500/10 p-2 rounded-lg';
                    } else if (isUserPick && !isAns) {
                      rowClass = 'text-rose-300 font-bold bg-rose-500/10 p-2 rounded-lg line-through';
                    }

                    return (
                      <div key={key} className={`flex items-start gap-2 ${rowClass}`}>
                        <span className="font-mono font-bold shrink-0">{key}.</span>
                        <span dangerouslySetInnerHTML={{ __html: text }} />
                        {isAns && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="pt-2 border-t border-white/5 text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-amber-400 flex items-center gap-1 mb-1">
                      <Lightbulb className="w-3 h-3" /> Explanation:
                    </span>
                    <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onNavigateBack}
            className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>

        {activeMilestone && (
          <MilestoneCelebrationModal
            event={activeMilestone}
            onDismiss={() => setActiveMilestone(null)}
          />
        )}
      </div>
    );
  }

  const optionsMap: Record<string, string> = {
    A: currentQuestion.optionA,
    B: currentQuestion.optionB,
    C: currentQuestion.optionC,
    D: currentQuestion.optionD,
  };

  const isCurrentFlagged = flagged[currentQuestion.id] ?? false;
  const isTimeCritical = timeLeft < 180; // less than 3 minutes

  return (
    <div className="min-h-screen pb-28 pt-2 max-w-lg mx-auto px-4 flex flex-col justify-between">
      {/* CBT Exam Top Bar */}
      <div>
        <div className="flex items-center justify-between py-2 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              End Exam
            </button>
            <span className="text-xs font-bold text-slate-200">
              {formattedSubject}
            </span>
          </div>

          {/* Ticking Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold border transition-colors ${
              isTimeCritical
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-orange-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Question Grid Modal Trigger */}
          <button
            onClick={() => setShowGridModal(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition"
            title="Question Palette"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Question Header & Flag Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>
                Official {currentQuestion.examType.toUpperCase()} {currentQuestion.year}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleFlag}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
              isCurrentFlagged
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isCurrentFlagged ? '#F59E0B' : 'none'} />
            <span>{isCurrentFlagged ? 'Flagged' : 'Flag Question'}</span>
          </button>
        </div>

        {/* Passage / Diagram */}
        <QuestionMediaView
          imageUrl={currentQuestion.imageUrl}
          passage={currentQuestion.passage}
        />

        {/* Question Text */}
        <div
          className="text-base font-semibold text-slate-100 leading-relaxed mb-5"
          dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
        />

        {/* Options */}
        <div className="space-y-3">
          {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
            const optText = optionsMap[optKey];
            if (!optText) return null;

            const isSelected = answers[currentQuestion.id] === optKey;

            return (
              <button
                key={optKey}
                onClick={() => handleSelectOption(optKey)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all duration-200 ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500/50'
                    : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {optKey}
                </div>

                <div
                  className="text-sm font-medium text-slate-100 flex-1 leading-snug"
                  dangerouslySetInnerHTML={{ __html: optText }}
                />
              </button>
            );
          })}
        </div>

        {/* JAMB CBT 8-Key Shortcuts Helper Bar */}
        <div className="mt-4 p-2.5 rounded-2xl bg-slate-900/90 border border-white/5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Keyboard className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>JAMB Keypad Mode:</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-orange-300 font-bold">A/B/C/D</span>
            <span className="text-[10px] text-slate-400">Pick</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-orange-300 font-bold">N</span>
            <span className="text-[10px] text-slate-400">Next</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-orange-300 font-bold">P</span>
            <span className="text-[10px] text-slate-400">Prev</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-orange-300 font-bold">F</span>
            <span className="text-[10px] text-slate-400">Flag</span>
          </div>
        </div>
      </div>

      {/* CBT Nav Controls */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button
            disabled={currentIndex === 0}
            onClick={() => {
              SoundService.playClick();
              setCurrentIndex((prev) => Math.max(0, prev - 1));
            }}
            className="py-3 px-4 rounded-xl font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Prev
          </button>

          <button
            onClick={() => {
              SoundService.playClick();
              setShowSubmitModal(true);
            }}
            className="py-3 px-5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-98 transition"
          >
            Submit Exam
          </button>

          <button
            disabled={currentIndex === questions.length - 1}
            onClick={() => {
              SoundService.playClick();
              setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
            }}
            className="py-3 px-4 rounded-xl font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Palette Grid Modal */}
      {showGridModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-sm w-full p-5 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Question Palette</h3>
              <button
                onClick={() => setShowGridModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-around text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Answered
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Flagged
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-800 inline-block border border-slate-600" /> Skipped
              </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAns = Boolean(answers[q.id]);
                const isFlg = Boolean(flagged[q.id]);
                const isCurr = currentIndex === idx;

                let btnBg = 'bg-slate-800 text-slate-400 border-slate-700';
                if (isAns) btnBg = 'bg-orange-500 text-white border-orange-400';
                else if (isFlg) btnBg = 'bg-amber-500/80 text-white border-amber-400';

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowGridModal(false);
                    }}
                    className={`h-10 rounded-xl font-bold text-xs border flex items-center justify-center transition ${btnBg} ${
                      isCurr ? 'ring-2 ring-white scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowGridModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-750 transition"
            >
              Close Palette
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 mx-auto flex items-center justify-center border border-orange-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Ready to Submit Exam?
            </h3>

            <div className="grid grid-cols-3 gap-2 text-xs py-2">
              <div className="p-2 rounded-xl bg-slate-800">
                <span className="font-bold text-orange-400 block text-base">{answeredCount}</span>
                <span className="text-slate-400 text-[10px]">Answered</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800">
                <span className="font-bold text-amber-400 block text-base">{flaggedCount}</span>
                <span className="text-slate-400 text-[10px]">Flagged</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800">
                <span className="font-bold text-slate-300 block text-base">{unansweredCount}</span>
                <span className="text-slate-400 text-[10px]">Unanswered</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Once submitted, your final score and step-by-step solutions will be generated.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSubmitExam}
                className="w-full py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition shadow-lg shadow-orange-500/20"
              >
                Yes, Submit Now
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-750 transition"
              >
                Continue Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
