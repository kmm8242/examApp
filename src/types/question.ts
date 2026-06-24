export type ExamType = 'SAT' | 'GRE' | 'Academic' | 'Custom';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionFormat = 'multiple-choice' | 'true-false';

export interface Option {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  id: string;
  examType: ExamType;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  format: QuestionFormat;
  text: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
}

export interface QuestionSet {
  examType: ExamType;
  version: string;
  questions: Question[];
}

// Progress tracking

export interface QuestionAttempt {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  attemptedAt: string; // ISO date string
}

export interface QuestionProgress {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptedAt: string;
}

export interface UserProgress {
  byQuestion: Record<string, QuestionProgress>;
  totalAnswered: number;
  totalCorrect: number;
}
