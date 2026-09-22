export type ExamType = 'jamb' | 'waec' | 'neco' | 'post_utme';

export interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D'
  examType: string;
  subject: string;
  year: number;
  imageUrl: string | null;
  explanation: string | null;
  topic: string | null;
  subtopic: string | null;
  difficultyScore: number | null;
  tags: string;
  contentType: string;
  hasPassage: number | boolean;
  passage: string | null;
}

export interface UserStreak {
  id: number;
  currentStreak: number;
  bestStreak: number;
  lastPracticeDate: string; // 'YYYY-MM-DD'
  isTrialUnlocked: boolean;
  trialStartDate: number;
  trialEndDate: number;
  isSubscribed: boolean;
  hasSeenOnboarding: boolean;
  targetExam: string;
  targetExamDate: number;
  targetScore: number;
  perfectScoreAchieved: boolean;
}

export interface SpacedItem {
  questionId: string;
  subject: string;
  topic: string | null;
  repetition: number;
  intervalDays: number;
  easinessFactor: number;
  nextReviewTimestamp: number;
  lastReviewedTimestamp: number;
  reviewCount: number;
  correctCount: number;
}

export interface QuizAttempt {
  id: number;
  examType: string;
  subject: string;
  mode: 'practice' | 'mock' | 'spaced_review';
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  timestamp: number;
  isPerfectScore: boolean;
}

export interface TopicStat {
  topicKey: string;
  subject: string;
  topicName: string;
  totalAttempted: number;
  totalCorrect: number;
  status: 'learning' | 'needs_work' | 'mastered';
  lastUpdated: number;
}

export type MascotMood = 'HAPPY' | 'CELEBRATING' | 'THINKING' | 'EMPATHETIC' | 'SALUTING';

export type MilestoneEvent =
  | { type: 'seven_day_streak'; currentStreak: number }
  | { type: 'trial_unlocked'; daysUnlocked: number }
  | { type: 'perfect_score' }
  | { type: 'topic_mastered'; topicName: string };

export interface SubjectInfo {
  id: string;
  name: string;
  examType: string;
  questionCount: number;
  isAvailable: boolean;
  note: string;
}

export type NavigationTab = 'home' | 'review' | 'progress' | 'settings';
