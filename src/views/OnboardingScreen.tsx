import React, { useState } from 'react';
import { ArrowRight, Check, Flame, Star, Trophy, Sparkles } from 'lucide-react';
import { BlazeMascot } from '../components/BlazeMascot';

interface OnboardingScreenProps {
  onComplete: (targetExam: string, targetScore: number) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [selectedExam, setSelectedExam] = useState('jamb');
  const [selectedScore, setSelectedScore] = useState(280);

  const exams = [
    {
      id: 'jamb',
      title: 'JAMB UTME',
      desc: 'CBT examination simulation & authentic past questions',
    },
    {
      id: 'waec',
      title: 'WAEC WASSCE',
      desc: 'Standard secondary school certification questions & solutions',
    },
    {
      id: 'neco',
      title: 'NECO SSCE',
      desc: 'National Examination Council syllabus drills & mock tests',
    },
  ];

  const scores = [250, 280, 300, 320];

  const handleNext = () => {
    if (step < 2) {
      setStep((prev) => prev + 1);
    } else {
      onComplete(selectedExam, selectedScore);
    }
  };

  return (
    <div className="min-h-screen pb-12 pt-6 px-6 max-w-md mx-auto flex flex-col justify-between">
      {/* Top Step Dots */}
      <div className="flex justify-center gap-2 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === i
                ? 'w-8 bg-orange-500'
                : 'w-2 bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="my-auto py-8 text-center space-y-6">
        {step === 0 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex justify-center">
              <BlazeMascot mood="HAPPY" size={130} showGlow={true} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                MEET YOUR STUDY COMPANION
              </span>
              <h1 className="text-3xl font-black text-white mt-1 tracking-tight">
                Meet Blaze 🔥
              </h1>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-xs mx-auto">
                Blaze is your personal academic coach for JAMB, WAEC, and NECO past question mastery.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-2xl glass-card text-xs">
                <Flame className="w-5 h-5 text-orange-400 mb-1" />
                <div className="font-bold text-white">Daily Streaks</div>
                <div className="text-[11px] text-slate-400">7 days unlocks free Premium</div>
              </div>
              <div className="p-3.5 rounded-2xl glass-card text-xs">
                <Sparkles className="w-5 h-5 text-amber-400 mb-1" />
                <div className="font-bold text-white">Smart Recall</div>
                <div className="text-[11px] text-slate-400">Never forget formulas</div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 text-left animate-in fade-in duration-300">
            <div className="text-center">
              <BlazeMascot mood="THINKING" size={80} showGlow={false} />
              <h2 className="text-2xl font-black text-white mt-3">
                Select Target Exam
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Blaze will customize your past question drills and syllabus focus.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {exams.map((ex) => {
                const isSelected = selectedExam === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExam(ex.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500/40'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{ex.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{ex.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 text-center animate-in fade-in duration-300">
            <BlazeMascot mood="CELEBRATING" size={90} showGlow={true} />
            <div>
              <h2 className="text-2xl font-black text-white">
                Set Your Score Ambition
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                Aim high! Top Nigerian universities demand competitive scores.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {scores.map((sc) => {
                const isSelected = selectedScore === sc;
                return (
                  <button
                    key={sc}
                    onClick={() => setSelectedScore(sc)}
                    className={`p-4 rounded-2xl font-black text-lg border transition ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/30 scale-[1.02]'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {sc}+
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 font-medium">
              💡 Complete a 7-day streak to unlock 7 days of Blaze Premium!
            </div>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <button
        onClick={handleNext}
        className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-98 transition text-sm"
      >
        <span>{step === 2 ? 'Start My First Practice Drill' : 'Continue'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
