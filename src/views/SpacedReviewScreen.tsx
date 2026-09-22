import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Check,
  X,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Question, SpacedItem, MascotMood } from '../types';
import { StorageService } from '../services/storage';
import { BlazeMascot } from '../components/BlazeMascot';
import { BlazeCharacter } from '../blaze/BlazeCharacter';
import { QuestionMediaView } from '../components/QuestionMediaView';

interface SpacedReviewScreenProps {
  onNavigateBack: () => void;
  onOpenPremium: () => void;
}

export const SpacedReviewScreen: React.FC<SpacedReviewScreenProps> = ({
  onNavigateBack,
  onOpenPremium,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [blazeFeedback, setBlazeFeedback] = useState('');
  const [blazeMood, setBlazeMood] = useState<MascotMood>('HAPPY');
  const [spacedStats, setSpacedStats] = useState<Record<string, SpacedItem>>({});

  useEffect(() => {
    loadReviewQueue();
  }, [selectedSubject]);

  const loadReviewQueue = () => {
    const subj = selectedSubject === 'all' ? undefined : selectedSubject;
    const qs = StorageService.getDueReviewQuestions(subj, 15);
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setSpacedStats(StorageService.getSpacedItems());
  };

  const currentQuestion = questions[currentIndex];
  const itemMeta = currentQuestion ? spacedStats[currentQuestion.id] : null;

  const handleSelectOption = (optKey: string) => {
    if (isSubmitted) return;
    setSelectedOption(optKey);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !currentQuestion || isSubmitted) return;

    const correct = selectedOption.toUpperCase() === currentQuestion.correctAnswer.toUpperCase();
    setIsCorrect(correct);
    setIsSubmitted(true);
    setReviewedCount((prev) => prev + 1);

    if (correct) {
      const fb = BlazeCharacter.getCorrectFeedback();
      setBlazeFeedback(fb.text);
      setBlazeMood(fb.mood);
    } else {
      const fb = BlazeCharacter.getIncorrectFeedback(currentQuestion.subject);
      setBlazeFeedback(fb.text);
      setBlazeMood(fb.mood);
    }

    // Update memory retention schedule
    StorageService.recordQuestionAnswer(currentQuestion, correct);
    setSpacedStats(StorageService.getSpacedItems());
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      loadReviewQueue();
    }
  };

  const subjectPills = [
    { id: 'all', label: 'All Subjects' },
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'english-language', label: 'English' },
    { id: 'biology', label: 'Biology' },
    { id: 'government', label: 'Government' },
    { id: 'commerce', label: 'Commerce' },
  ];

  const optionsMap: Record<string, string> = currentQuestion
    ? {
        A: currentQuestion.optionA,
        B: currentQuestion.optionB,
        C: currentQuestion.optionC,
        D: currentQuestion.optionD,
      }
    : {};

  return (
    <div className="min-h-screen pb-28 pt-2 max-w-lg mx-auto px-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between py-2 border-b border-white/5 mb-3">
          <button
            onClick={onNavigateBack}
            className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 justify-center">
              <BrainCircuit className="w-4 h-4 text-orange-400" />
              <span>Smart Memory Review Deck</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">
              Timed active recall for long-term memory
            </span>
          </div>
          <div className="w-8" />
        </div>

        {/* Subject Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
          {subjectPills.map((p) => {
            const isActive = selectedSubject === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedSubject(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {questions.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
            <BlazeMascot mood="CELEBRATING" size={100} showGlow={true} />
            <h3 className="text-lg font-bold text-white mt-4">
              All caught up! 🎉
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed mb-6">
              No questions are currently due for spaced review. Blaze is keeping your memory sharp!
            </p>
            <button
              onClick={() => setSelectedSubject('all')}
              className="py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-orange-500 hover:bg-orange-600 transition"
            >
              Check All Subjects
            </button>
          </div>
        ) : (
          <div>
            {/* Memory Stage Pill & Verified Provenance */}
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold text-orange-400">
                Item {currentIndex + 1} of {questions.length}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium">
                  Official {currentQuestion.examType.toUpperCase()} {currentQuestion.year}
                </span>

                {itemMeta ? (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                    Mastery {Math.min(5, (itemMeta.repetition || 0) + 1)}/5
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px]">
                    New Card
                  </span>
                )}
              </div>
            </div>

            {/* Media View */}
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

                const isSelected = selectedOption === optKey;
                const isCorrectAnswer =
                  optKey.toUpperCase() === currentQuestion.correctAnswer.toUpperCase();

                let borderStyle = 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80';
                let badgeBg = 'bg-slate-700 text-slate-200';

                if (isSubmitted) {
                  if (isCorrectAnswer) {
                    borderStyle = 'border-emerald-500 bg-emerald-500/15';
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
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${badgeBg}`}
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

            {/* Immediate Feedback Card */}
            {isSubmitted && (
              <div className="mt-5 space-y-3 animate-in fade-in duration-300">
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                    isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : 'bg-rose-500/15 border-rose-500/30'
                  }`}
                >
                  <BlazeMascot mood={blazeMood} size={54} showGlow={false} />
                  <div className="flex-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isCorrect ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isCorrect ? 'Memory Strengthened! Spaced for Later' : 'Scheduled for Quick Refresh'}
                    </span>
                    <p className="text-xs font-medium text-slate-100 mt-0.5">
                      {blazeFeedback}
                    </p>
                  </div>
                </div>

                {currentQuestion.explanation && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                      <Lightbulb className="w-4 h-4" />
                      <span>Step-by-Step Explanation</span>
                    </div>
                    <div
                      className="text-xs text-slate-300 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: currentQuestion.explanation }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      {questions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-30">
          <div className="max-w-lg mx-auto">
            {!isSubmitted ? (
              <button
                disabled={!selectedOption}
                onClick={handleSubmitAnswer}
                className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${
                  selectedOption
                    ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Verify Recall
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <span>
                  {currentIndex + 1 < questions.length
                    ? 'Next Review Card'
                    : 'Complete Queue'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
