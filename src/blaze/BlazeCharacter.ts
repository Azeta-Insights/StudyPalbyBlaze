import { MascotMood, QuizAttempt } from '../types';

export enum FeedbackTone {
  ENCOURAGING,
  PLAYFUL,
  EMPATHETIC,
}

// Correct Answer Responses
const correctEncouraging = [
  "Nice work — you’re on a roll!",
  "Spot on! Keep that streak alive.",
  "You’re mastering this step by step.",
  "Strong answer — keep building momentum.",
  "That’s the kind of focus Blaze loves."
];

const correctPlayful = [
  "Boom! You nailed it.",
  "That question didn’t stand a chance.",
  "Blaze is doing a victory dance!",
  "You crushed it — smooth like butter.",
  "That was too easy for you!"
];

const correctEmpathetic = [
  "Yes! All that practice is paying off.",
  "You’ve got this — confidence shows.",
  "Every right answer builds your strength.",
  "See? Your effort is shining through.",
  "Blaze knew you could handle that one."
];

// Incorrect Answer Responses
const incorrectEncouraging = [
  "Not quite, but you’re learning — let’s keep going.",
  "Close! You’ll get it next time.",
  "Every mistake is a step forward.",
  "Keep at it — progress comes with practice.",
  "Blaze believes you’ll crack this soon."
];

const incorrectPlayful = [
  "Math threw a curveball there — shake it off!",
  "That one was sneaky. Ready for the next?",
  "Oops — Blaze just tripped too!",
  "That question was tricky — let’s outsmart the next one.",
  "Blaze says: plot twist! Try again."
];

const incorrectEmpathetic = [
  "It’s okay, mistakes are part of progress.",
  "Don’t worry — Blaze’s got your back.",
  "Learning means stumbling sometimes — keep moving.",
  "You’re still building strength, one answer at a time.",
  "Blaze knows effort matters more than perfection."
];

// Streak Celebrations
const streakCelebrations = [
  "7 days straight! Blaze is proud of you.",
  "Consistency is your superpower — keep shining.",
  "You’ve unlocked Premium! Blaze knew you could do it.",
  "Your streak is blazing — unstoppable energy!",
  "Daily dedication is paying off — Blaze salutes you."
];

// Perfect Quiz Celebrations
const perfectScoreCelebrations = [
  "Flawless victory! Blaze is cheering loud.",
  "Every answer correct — that’s mastery in action.",
  "You just aced it — Blaze is throwing confetti!",
  "Perfect score! Proof your hard work is shining.",
  "Blaze says: that’s champion level focus."
];

// Missed Day Nudges
const missedDayNudges = [
  "We missed you yesterday — let’s get back on track.",
  "No worries, streaks reset, but progress continues.",
  "Blaze is waiting — one quiz today keeps the momentum alive.",
  "Yesterday slipped by — today’s a fresh chance.",
  "Blaze says: let’s rebuild that streak together."
];

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export const BlazeCharacter = {
  getCorrectFeedback(): { text: string; mood: MascotMood } {
    const tone = pickRandom([FeedbackTone.ENCOURAGING, FeedbackTone.PLAYFUL, FeedbackTone.EMPATHETIC]);
    let text = "";
    switch (tone) {
      case FeedbackTone.ENCOURAGING:
        text = pickRandom(correctEncouraging);
        break;
      case FeedbackTone.PLAYFUL:
        text = pickRandom(correctPlayful);
        break;
      case FeedbackTone.EMPATHETIC:
        text = pickRandom(correctEmpathetic);
        break;
    }
    return { text, mood: 'HAPPY' };
  },

  getIncorrectFeedback(subject: string = "quiz"): { text: string; mood: MascotMood } {
    const tone = pickRandom([FeedbackTone.ENCOURAGING, FeedbackTone.PLAYFUL, FeedbackTone.EMPATHETIC]);
    let text = "";
    switch (tone) {
      case FeedbackTone.ENCOURAGING:
        text = pickRandom(incorrectEncouraging);
        break;
      case FeedbackTone.PLAYFUL:
        text = pickRandom(incorrectPlayful);
        break;
      case FeedbackTone.EMPATHETIC:
        text = pickRandom(incorrectEmpathetic);
        break;
    }

    if (subject.toLowerCase() !== "mathematics" && text.includes("Math")) {
      const formattedSubj = subject.charAt(0).toUpperCase() + subject.slice(1);
      text = text.replace("Math", formattedSubj);
    }
    return { text, mood: 'EMPATHETIC' };
  },

  getStreakCelebration(_streakDays: number): string {
    return pickRandom(streakCelebrations);
  },

  getPerfectScoreCelebration(): string {
    return pickRandom(perfectScoreCelebrations);
  },

  getTopicMasteryCelebration(topicName: string): string {
    const templates = [
      `You’ve mastered ${topicName} — Blaze is impressed.`,
      `${topicName} is now your strength.`,
      `Topic ${topicName} conquered! Blaze says: onward to the next challenge.`,
      `Look at you! ${topicName} mastered — Blaze salutes your progress.`
    ];
    return pickRandom(templates);
  },

  getMissedDayNudge(): string {
    return pickRandom(missedDayNudges);
  },

  getStreakBannerNudge(currentStreak: number): string {
    if (currentStreak === 0) {
      return "Start your streak today — 7 days unlocks 7 days of Premium!";
    }
    if (currentStreak < 6) {
      return `${7 - currentStreak} more days to unlock Premium trial with Blaze!`;
    }
    if (currentStreak === 6) {
      return "Tomorrow is the big day! 1 more quiz to unlock your Premium reward!";
    }
    return "Your streak is blazing! Keep your momentum going strong!";
  },

  getContentGapMessage(subjectTitle: string, examTitle: string): string {
    return `More ${subjectTitle} questions for ${examTitle} are on the way! Blaze and the team are actively curating authentic past questions for you.`;
  },

  /**
   * Generates dynamic, strictly grounded dialogue based entirely on real user state.
   * Never fabricates streaks, past sessions, or events that did not occur.
   */
  getHomeDialogue(
    currentStreak: number,
    recentAttempts: QuizAttempt[],
    examDisplayName: string
  ): { text: string; mood: MascotMood } {
    // Case 1: Brand new user - zero previous attempts and zero streak
    if (recentAttempts.length === 0 && currentStreak === 0) {
      return {
        text: `Welcome to StudyPal! Blaze is here to guide your ${examDisplayName} preparation. Start your first practice drill today to light your study streak!`,
        mood: 'HAPPY'
      };
    }

    // Case 2: Has recorded sessions - reference real latest attempt
    if (recentAttempts.length > 0) {
      const last = recentAttempts[0];
      const subjectName = last.subject
        .replace(/-/g, " ")
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const total = Math.max(1, last.totalQuestions);
      const pct = Math.round((last.score * 100) / total);

      if (pct >= 80) {
        return {
          text: `Great focus! You scored ${last.score}/${total} (${pct}%) in ${subjectName}. Ready to build on that momentum with another ${examDisplayName} drill?`,
          mood: 'CELEBRATING'
        };
      } else if (pct >= 50) {
        return {
          text: `Solid progress! You scored ${last.score}/${total} in ${subjectName}. Blaze is ready to help you push for an even higher score today!`,
          mood: 'HAPPY'
        };
      } else {
        return {
          text: `Every quiz teaches you something new. Let's do a targeted drill in ${subjectName} to turn those tricky spots into strengths!`,
          mood: 'EMPATHETIC'
        };
      }
    }

    // Case 3: Active streak with no recent attempts in the history list yet
    if (currentStreak === 1) {
      return {
        text: `You've ignited a 1-day study streak! Practice daily to reach 7 days and unlock your 7-day Premium trial.`,
        mood: 'HAPPY'
      };
    } else {
      return {
        text: `You're on an active ${currentStreak}-day streak! One quick drill today keeps your ${examDisplayName} momentum burning strong.`,
        mood: 'HAPPY'
      };
    }
  }
};
