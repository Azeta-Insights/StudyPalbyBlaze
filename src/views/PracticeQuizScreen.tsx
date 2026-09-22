import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Lightbulb,
  Lock,
  RefreshCw,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { Question, UserStreak, MilestoneEvent, MascotMood } from '../types';
import { StorageService } from '../services/storage';
import { SoundService } from '../services/sound';
import { BlazeMascot } from '../components/BlazeMascot';
import { BlazeCharacter } from '../blaze/BlazeCharacter';
import { QuestionMediaView } from '../components/QuestionMediaView';
import { MilestoneCelebrationModal } from '../components/MilestoneCelebrationModal';

interface PracticeQuizScreenProps {
  examType: string;
  subject: string;
  topic?: string;
  onNavigateBack: () => void;
  onOpenPremium: () => void;
}

export const PracticeQuizScreen: React.FC<PracticeQuizScreenProps> = ({
  examType,
  subject,
  topic,
  onNavigateBack,
  onOpenPremium,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [blazeFeedback, setBlazeFeedback] = useState('');
  const [blazeMood, setBlazeMood] = useState<MascotMood>('HAPPY');
  const [activeMilestone, setActiveMilestone] = useState<MilestoneEvent | null>(null);
  const [userStreak, setUserStreak] = useState<UserStreak>(() => StorageService.getUserStreak());
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    loadQuestions();
  }, [examType, subject, topic]);

  const loadQuestions = () => {
    const qs = StorageService.getQuestionsForPractice(examType, subject, 15, topic);
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setIsFinished(false);
    setUserStreak(StorageService.getUserStreak());
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optKey: string) => {
    if (isSubmitted) return;
    SoundService.playClick();
    setSelectedOption(optKey);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion || isSubmitted) return;

    const correct = selectedOption.toUpperCase() === currentQuestion.correctAnswer.toUpperCase();
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
      const fb = BlazeCharacter.getCorrectFeedback();
      setBlazeFeedback(fb.text);
      setBlazeMood(fb.mood);
      SoundService.playSuccess();
    } else {
      const fb = BlazeCharacter.getIncorrectFeedback(currentQuestion.subject);
      setBlazeFeedback(fb.text);
      setBlazeMood(fb.mood);
      SoundService.playIncorrect();
    }

    // Record question in active recall memory engine
    const milestone = StorageService.recordQuestionAnswer(currentQuestion, correct);
    if (milestone) {
      setActiveMilestone(milestone);
    }
  };

  const handleNextQuestion = () => {
    SoundService.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      // Completed quiz
      finishSession();
    }
  };

  const finishSession = () => {
    const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    SoundService.playCelebration();
    // Record streak session
    const streakMilestones = StorageService.recordPracticeSession();
    // Record quiz completion
    const quizMilestone = StorageService.recordQuizCompletion(
      examType,
      subject,
      'practice',
      correctCount,
      questions.length,
      duration
    );

    if (streakMilestones.length > 0) {
      setActiveMilestone(streakMilestones[0]);
    } else if (quizMilestone) {
      setActiveMilestone(quizMilestone);
    }

    setUserStreak(StorageService.getUserStreak());
    setIsFinished(true);
  };

  const formattedSubject = subject
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const isPremiumActive = StorageService.isPremiumActive(userStreak);

  if (questions.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <BlazeMascot mood="THINKING" size={96} />
        <h2 className="text-xl font-bold text-white mt-4">
          No questions available
        </h2>
        <p className="text-sm text-slate-400 mt-2 mb-6">
          Authentic past questions for {formattedSubject} are being curated.
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

  // Session Completed View
  if (isFinished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="min-h-screen pb-12 pt-6 px-4 max-w-md mx-auto flex flex-col justify-center items-center text-center">
        <BlazeMascot
          mood={percentage >= 70 ? 'CELEBRATING' : 'HAPPY'}
          size={120}
          showGlow={true}
        />

        <h2 className="text-2xl font-black text-orange-400 mt-4">
          Practice Completed! 🔥
        </h2>

        <p className="text-lg font-bold text-white mt-1">
          You scored {correctCount} out of {questions.length} ({percentage}%)
        </p>

        <p className="text-sm text-slate-300 mt-3 mb-8 leading-relaxed max-w-xs">
          {percentage >= 80
            ? 'Blaze is impressed! Your sharp focus is turning these past questions into pure muscle memory.'
            : 'Every session counts! Blaze noticed where we stumbled and added them to your Smart Recall deck so you master them.'}
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={loadQuestions}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-98 transition"
          >
            <RefreshCw className="w-4 h-4" /> Practice More Questions
          </button>

          <button
            onClick={onNavigateBack}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 flex items-center justify-center gap-2 active:scale-98 transition"
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

  return (
    <div className="min-h-screen pb-28 pt-2 max-w-lg mx-auto px-4 flex flex-col justify-between">
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between py-2 border-b border-white/5 mb-3">
          <button
            onClick={onNavigateBack}
            className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-sm font-bold text-white tracking-tight">
              {formattedSubject}
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">
              Untimed Practice • {examType.toUpperCase()}
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Progress Bar & Verified Question Provenance */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="text-orange-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>
                Official {currentQuestion.examType.toUpperCase()} {currentQuestion.year}
              </span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Reading Passage or Diagram if present */}
        <QuestionMediaView
          imageUrl={currentQuestion.imageUrl}
          passage={currentQuestion.passage}
        />

        {/* Question Text */}
        <div
          className="text-base font-semibold text-slate-100 leading-relaxed mb-5"
          dangerouslySetInnerHTML={{ __html: currentQuestion.text }}
        />

        {/* Options (A, B, C, D) */}
        <div className="space-y-3">
          {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
            const optText = optionsMap[optKey];
            if (!optText) return null;

            const isSelected = selectedOption === optKey;
            const isCorrectAnswer =
              optKey.toUpperCase() === currentQuestion.correctAnswer.toUpperCase();

            let borderStyle = 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80';
            let badgeBg = 'bg-slate-700 text-slate-200';

            if (isSubmitted) {
              if (isCorrectAnswer) {
                borderStyle = 'border-emerald-500 bg-emerald-500/15 shadow-sm shadow-emerald-500/20';
                badgeBg = 'bg-emerald-500 text-white';
              } else if (isSelected && !isCorrectAnswer) {
                borderStyle = 'border-rose-500 bg-rose-500/15';
                badgeBg = 'bg-rose-500 text-white';
              } else {
                borderStyle = 'border-slate-800/40 bg-slate-900/40 opacity-60';
              }
            } else if (isSelected) {
              borderStyle = 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500/50';
              badgeBg = 'bg-orange-500 text-white';
            }

            return (
              <button
                key={optKey}
                disabled={isSubmitted}
                onClick={() => handleSelectOption(optKey)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all duration-200 ${borderStyle}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${badgeBg}`}
                >
                  {isSubmitted && isCorrectAnswer ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isSubmitted && isSelected && !isCorrectAnswer ? (
                    <X className="w-4 h-4 stroke-[3]" />
                  ) : (
                    optKey
                  )}
                </div>

                <div
                  className="text-sm font-medium text-slate-100 flex-1 leading-snug"
                  dangerouslySetInnerHTML={{ __html: optText }}
                />
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback Card on Submit */}
        {isSubmitted && (
          <div className="mt-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                isCorrect
                  ? 'bg-emerald-500/15 border-emerald-500/30'
                  : 'bg-rose-500/15 border-rose-500/30'
              }`}
            >
              <BlazeMascot mood={blazeMood} size={54} showGlow={false} />
              <div className="flex-1">
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isCorrect ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isCorrect ? 'Blaze cheers:' : 'Blaze says:'}
                </div>
                <p className="text-xs font-medium text-slate-100 mt-0.5">
                  {blazeFeedback}
                </p>
              </div>
            </div>

            {/* Explanation card */}
            {isPremiumActive && currentQuestion.explanation ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>Step-by-Step Explanation</span>
                </div>
                <p
                  className="text-xs text-slate-300 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }}
                />
              </div>
            ) : !isPremiumActive ? (
              <div
                onClick={onOpenPremium}
                className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/25 flex items-center gap-3 cursor-pointer hover:bg-orange-500/15 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-orange-300">
                    Step-by-Step Explanations (Blaze Premium)
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Unlock 7-day free trial with a 7-day practice streak!
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-30">
        <div className="max-w-lg mx-auto">
          {!isSubmitted ? (
            <button
              disabled={!selectedOption}
              onClick={handleSubmitAnswer}
              className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 ${
                selectedOption
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-98'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <span>
                {currentIndex + 1 < questions.length
                  ? 'Next Question'
                  : 'Complete Practice'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Milestone Modal */}
      {activeMilestone && (
        <MilestoneCelebrationModal
          event={activeMilestone}
          onDismiss={() => setActiveMilestone(null)}
        />
      )}
    </div>
  );
};
