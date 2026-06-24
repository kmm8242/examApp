import type { Question, ExamType, Difficulty, QuestionSet } from '../types/question';

import satQuestions from './questions/sat.json';
import greQuestions from './questions/gre.json';
import academicQuestions from './questions/academic.json';

const ALL_SETS: QuestionSet[] = [
  satQuestions as QuestionSet,
  greQuestions as QuestionSet,
  academicQuestions as QuestionSet,
];

export const ALL_QUESTIONS: Question[] = ALL_SETS.flatMap(set => set.questions);

export function getQuestionsByExamType(examType: ExamType): Question[] {
  return ALL_QUESTIONS.filter(q => q.examType === examType);
}

export function getQuestionsBySubject(subject: string): Question[] {
  return ALL_QUESTIONS.filter(
    q => q.subject.toLowerCase() === subject.toLowerCase(),
  );
}

export function getQuestionsByDifficulty(difficulty: Difficulty): Question[] {
  return ALL_QUESTIONS.filter(q => q.difficulty === difficulty);
}

export function getQuestionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find(q => q.id === id);
}

export function getRandomQuestion(filters?: {
  examType?: ExamType;
  subject?: string;
  difficulty?: Difficulty;
  excludeIds?: string[];
}): Question | undefined {
  let pool = ALL_QUESTIONS;

  if (filters?.examType) {
    pool = pool.filter(q => q.examType === filters.examType);
  }
  if (filters?.subject) {
    pool = pool.filter(
      q => q.subject.toLowerCase() === filters.subject!.toLowerCase(),
    );
  }
  if (filters?.difficulty) {
    pool = pool.filter(q => q.difficulty === filters.difficulty);
  }
  if (filters?.excludeIds?.length) {
    pool = pool.filter(q => !filters.excludeIds!.includes(q.id));
  }

  if (pool.length === 0) {
    return undefined;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getAvailableSubjects(examType?: ExamType): string[] {
  const source = examType ? getQuestionsByExamType(examType) : ALL_QUESTIONS;
  return [...new Set(source.map(q => q.subject))].sort();
}

export function getAvailableExamTypes(): ExamType[] {
  return [...new Set(ALL_QUESTIONS.map(q => q.examType))];
}

export function getTotalQuestionCount(examType?: ExamType): number {
  return examType ? getQuestionsByExamType(examType).length : ALL_QUESTIONS.length;
}
