import questionsData from '../data/questions.json';
import {
  Question,
  UserStreak,
  SpacedItem,
  QuizAttempt,
  TopicStat,
  MilestoneEvent,
  SubjectInfo,
} from '../types';
import {
  syncUserProfileToFirestore,
  syncQuizAttemptToFirestore,
  syncSpacedItemToFirestore,
} from './firebase';

const STORAGE_KEYS = {
  USER_STREAK: 'studypal_user_streak',
  SPACED_ITEMS: 'studypal_spaced_items',
  QUIZ_ATTEMPTS: 'studypal_quiz_attempts',
  TOPIC_STATS: 'studypal_topic_stats',
};

const allQuestions: Question[] = questionsData as Question[];

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeExamType(exam: string): string {
  return exam.toLowerCase().trim();
}

function normalizeSubject(subject: string): string {
  const s = subject.toLowerCase().trim();
  if (s === 'english' || s === 'english language') return 'english-language';
  if (s === 'math' || s === 'maths') return 'mathematics';
  if (s === 'govt') return 'government';
  if (s === 'bio') return 'biology';
  return s;
}

export const StorageService = {
  getAllQuestions(): Question[] {
    return allQuestions;
  },

  getUserStreak(): UserStreak {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_STREAK);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return parsed;
      } catch (e) {
        console.error('Failed to parse user streak', e);
      }
    }

    const defaultStreak: UserStreak = {
      id: 1,
      currentStreak: 0,
      bestStreak: 0,
      lastPracticeDate: '',
      isTrialUnlocked: false,
      trialStartDate: 0,
      trialEndDate: 0,
      isSubscribed: false,
      hasSeenOnboarding: false,
      targetExam: 'jamb',
      targetExamDate: Date.now() + 48 * 24 * 60 * 60 * 1000,
      targetScore: 280,
      perfectScoreAchieved: false,
    };
    this.saveUserStreak(defaultStreak);
    return defaultStreak;
  },

  saveUserStreak(streak: UserStreak): void {
    localStorage.setItem(STORAGE_KEYS.USER_STREAK, JSON.stringify(streak));
    syncUserProfileToFirestore(streak).catch(err => {
      console.warn('Background Firestore streak sync:', err);
    });
  },

  isPremiumActive(streak: UserStreak): boolean {
    if (streak.isSubscribed) return true;
    if (streak.isTrialUnlocked) {
      return streak.trialEndDate > Date.now();
    }
    return false;
  },

  getDaysRemainingInTrial(streak: UserStreak): number {
    if (!streak.isTrialUnlocked) return 0;
    const remaining = streak.trialEndDate - Date.now();
    return remaining > 0 ? Math.ceil(remaining / (1000 * 60 * 60 * 24)) : 0;
  },

  getSpacedItems(): Record<string, SpacedItem> {
    const raw = localStorage.getItem(STORAGE_KEYS.SPACED_ITEMS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  saveSpacedItems(items: Record<string, SpacedItem>): void {
    localStorage.setItem(STORAGE_KEYS.SPACED_ITEMS, JSON.stringify(items));
  },

  getQuizAttempts(): QuizAttempt[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveQuizAttempts(attempts: QuizAttempt[]): void {
    localStorage.setItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(attempts));
  },

  getTopicStats(): Record<string, TopicStat> {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPIC_STATS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  saveTopicStats(stats: Record<string, TopicStat>): void {
    localStorage.setItem(STORAGE_KEYS.TOPIC_STATS, JSON.stringify(stats));
  },

  // Available subjects per exam type based on 1049 real database questions
  getSubjectsForExam(examType: string): SubjectInfo[] {
    const normExam = normalizeExamType(examType);
    const standardSubjects = [
      { id: 'mathematics', name: 'Mathematics', note: 'Algebra, Geometry, Calculus, Statistics' },
      { id: 'english-language', name: 'English Language', note: 'Comprehension, Lexis, Structure & Oral' },
      { id: 'biology', name: 'Biology', note: 'Ecology, Genetics, Cell Biology & Physiology' },
      { id: 'government', name: 'Government', note: 'Political Systems, Constitution & History' },
      { id: 'commerce', name: 'Commerce', note: 'Trade, Banking, Insurance & Management' },
      { id: 'physics', name: 'Physics', note: 'Mechanics, Optics, Electricity & Modern Physics' },
      { id: 'chemistry', name: 'Chemistry', note: 'Atomic structure, Stoichiometry, Organic' },
      { id: 'economics', name: 'Economics', note: 'Microeconomics, Macroeconomics & Public Finance' },
    ];

    return standardSubjects.map(sub => {
      const count = allQuestions.filter(
        q => normalizeExamType(q.examType) === normExam && normalizeSubject(q.subject) === sub.id
      ).length;

      return {
        id: sub.id,
        name: sub.name,
        examType: normExam,
        questionCount: count,
        isAvailable: count > 0,
        note: count > 0 ? `${count} past questions available` : 'Curating authentic past questions',
      };
    });
  },

  getQuestionsForPractice(examType: string, subject: string, limit: number = 20, topic?: string): Question[] {
    const normExam = normalizeExamType(examType);
    const normSubj = normalizeSubject(subject);

    let matching = allQuestions.filter(
      q => normalizeExamType(q.examType) === normExam && normalizeSubject(q.subject) === normSubj
    );

    if (topic) {
      const topicNorm = topic.toLowerCase().trim();
      const topicMatches = matching.filter(
        q => q.topic && q.topic.toLowerCase().includes(topicNorm)
      );
      if (topicMatches.length > 0) {
        matching = topicMatches;
      }
    }

    // Fallback if none for that exact exam type:
    if (matching.length === 0) {
      matching = allQuestions.filter(q => normalizeSubject(q.subject) === normSubj);
      if (topic) {
        const topicNorm = topic.toLowerCase().trim();
        const topicMatches = matching.filter(
          q => q.topic && q.topic.toLowerCase().includes(topicNorm)
        );
        if (topicMatches.length > 0) {
          matching = topicMatches;
        }
      }
    }

    if (matching.length === 0) return [];

    // Shuffle
    const shuffled = [...matching].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  },

  searchTopics(query: string, examType?: string): Array<{ topic: string; subject: string; count: number }> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const map = new Map<string, { topic: string; subject: string; count: number }>();
    allQuestions.forEach((item) => {
      if (examType && normalizeExamType(item.examType) !== normalizeExamType(examType)) return;
      if (!item.topic) return;
      const topicName = item.topic.replace(/-/g, ' ');
      if (
        topicName.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
      ) {
        const key = `${item.subject}::${item.topic}`;
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { topic: item.topic, subject: item.subject, count: 1 });
        }
      }
    });

    return Array.from(map.values()).slice(0, 8);
  },

  getQuestionsForMock(examType: string, subject: string, limit: number = 20): Question[] {
    return this.getQuestionsForPractice(examType, subject, limit);
  },

  getDueReviewQuestions(subject?: string, limit: number = 15): Question[] {
    const now = Date.now();
    const spacedMap = this.getSpacedItems();
    const items = Object.values(spacedMap);

    let dueItems = items.filter(it => it.nextReviewTimestamp <= now);
    if (subject) {
      const normSubj = normalizeSubject(subject);
      dueItems = dueItems.filter(it => normalizeSubject(it.subject) === normSubj);
    }

    dueItems.sort((a, b) => a.nextReviewTimestamp - b.nextReviewTimestamp);

    const questionIds = dueItems.map(it => it.questionId);
    let matched = allQuestions.filter(q => questionIds.includes(q.id));

    // If review pool is small or empty, add questions that have been attempted before or random
    if (matched.length < limit) {
      const needed = limit - matched.length;
      const currentExam = this.getUserStreak().targetExam || 'jamb';
      const additional = this.getQuestionsForPractice(currentExam, subject || 'mathematics', needed);
      const existingIds = new Set(matched.map(m => m.id));
      for (const q of additional) {
        if (!existingIds.has(q.id)) {
          matched.push(q);
          existingIds.add(q.id);
        }
      }
    }

    return matched.slice(0, limit);
  },

  /**
   * Records daily practice session and evaluates streak milestones
   */
  recordPracticeSession(): MilestoneEvent[] {
    const milestones: MilestoneEvent[] = [];
    const current = this.getUserStreak();

    const todayStr = getTodayString();
    const yesterdayStr = getYesterdayString();

    let newStreak = current.currentStreak;
    const lastDate = current.lastPracticeDate;

    if (lastDate === todayStr) {
      // Already practiced today, keep current streak
    } else if (lastDate === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const bestStreak = Math.max(current.bestStreak, newStreak);
    let isTrialUnlocked = current.isTrialUnlocked;
    let trialStart = current.trialStartDate;
    let trialEnd = current.trialEndDate;

    // 7-day streak milestone check
    if (newStreak >= 7 && !current.isTrialUnlocked) {
      isTrialUnlocked = true;
      trialStart = Date.now();
      trialEnd = trialStart + 7 * 24 * 60 * 60 * 1000; // 7 days free trial
      milestones.push({ type: 'seven_day_streak', currentStreak: newStreak });
      milestones.push({ type: 'trial_unlocked', daysUnlocked: 7 });
    } else if (newStreak === 7 && lastDate !== todayStr) {
      milestones.push({ type: 'seven_day_streak', currentStreak: newStreak });
    }

    const updated: UserStreak = {
      ...current,
      currentStreak: newStreak,
      bestStreak,
      lastPracticeDate: todayStr,
      isTrialUnlocked,
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
    };

    this.saveUserStreak(updated);
    return milestones;
  },

  /**
   * SM-2 Spaced Repetition answer recording
   */
  recordQuestionAnswer(question: Question, isCorrect: boolean): MilestoneEvent | null {
    // 1. Spaced Repetition (SM-2)
    const spacedMap = this.getSpacedItems();
    const existing = spacedMap[question.id];

    const repetition = existing?.repetition ?? 0;
    const prevInterval = existing?.intervalDays ?? 1;
    const prevEf = existing?.easinessFactor ?? 2.5;

    // Quality: 5 for correct, 2 for incorrect
    const quality = isCorrect ? 5 : 2;

    let nextRepetition: number;
    let nextInterval: number;

    if (quality >= 3) {
      nextRepetition = repetition + 1;
      if (repetition === 0) {
        nextInterval = 1;
      } else if (repetition === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.ceil(prevInterval * prevEf);
      }
    } else {
      nextRepetition = 0;
      nextInterval = 1;
    }

    const newEf = Math.max(
      1.3,
      prevEf + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
    const nextTimestamp = Date.now() + nextInterval * 24 * 60 * 60 * 1000;

    spacedMap[question.id] = {
      questionId: question.id,
      subject: question.subject,
      topic: question.topic,
      repetition: nextRepetition,
      intervalDays: nextInterval,
      easinessFactor: newEf,
      nextReviewTimestamp: nextTimestamp,
      lastReviewedTimestamp: Date.now(),
      reviewCount: (existing?.reviewCount ?? 0) + 1,
      correctCount: (existing?.correctCount ?? 0) + (isCorrect ? 1 : 0),
    };
    this.saveSpacedItems(spacedMap);
    syncSpacedItemToFirestore(spacedMap[question.id]).catch(err => {
      console.warn('Background Firestore spaced item sync:', err);
    });

    // 2. Topic Stats & Mastery tracking
    let milestone: MilestoneEvent | null = null;
    const topicKey = `${question.subject}:${question.topic || 'general-review'}`;
    const topicMap = this.getTopicStats();
    const existingStat = topicMap[topicKey];

    const totalAttempted = (existingStat?.totalAttempted ?? 0) + 1;
    const totalCorrect = (existingStat?.totalCorrect ?? 0) + (isCorrect ? 1 : 0);
    const prevStatus = existingStat?.status ?? 'learning';
    const accuracy = totalCorrect / totalAttempted;

    let newStatus: 'learning' | 'needs_work' | 'mastered';
    if (totalAttempted < 3) {
      newStatus = 'learning';
    } else if (accuracy >= 0.75) {
      newStatus = 'mastered';
    } else {
      newStatus = 'needs_work';
    }

    if (prevStatus !== 'mastered' && newStatus === 'mastered') {
      const topicTitle = (question.topic || 'General Review')
        .replace(/-/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      milestone = { type: 'topic_mastered', topicName: topicTitle };
    }

    topicMap[topicKey] = {
      topicKey,
      subject: question.subject,
      topicName: question.topic || 'general-review',
      totalAttempted,
      totalCorrect,
      status: newStatus,
      lastUpdated: Date.now(),
    };
    this.saveTopicStats(topicMap);

    return milestone;
  },

  /**
   * Records completed quiz or mock exam attempt
   */
  recordQuizCompletion(
    examType: string,
    subject: string,
    mode: 'practice' | 'mock' | 'spaced_review',
    score: number,
    totalQuestions: number,
    durationSeconds: number
  ): MilestoneEvent | null {
    const isPerfect = score === totalQuestions && totalQuestions >= 4;
    const attempt: QuizAttempt = {
      id: Date.now(),
      examType,
      subject,
      mode,
      score,
      totalQuestions,
      durationSeconds,
      timestamp: Date.now(),
      isPerfectScore: isPerfect,
    };

    const attempts = this.getQuizAttempts();
    attempts.unshift(attempt); // latest first
    this.saveQuizAttempts(attempts.slice(0, 50)); // keep last 50
    syncQuizAttemptToFirestore(attempt).catch(err => {
      console.warn('Background Firestore attempt sync:', err);
    });

    let milestone: MilestoneEvent | null = null;
    if (isPerfect) {
      const streak = this.getUserStreak();
      if (!streak.perfectScoreAchieved) {
        this.saveUserStreak({ ...streak, perfectScoreAchieved: true });
        milestone = { type: 'perfect_score' };
      }
    }

    return milestone;
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_STREAK);
    localStorage.removeItem(STORAGE_KEYS.SPACED_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.TOPIC_STATS);
  },
};
