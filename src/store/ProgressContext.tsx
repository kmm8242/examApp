import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import type {QuestionAttempt, QuestionProgress, UserProgress} from '../types/question';

const EMPTY_PROGRESS: UserProgress = {
  byQuestion: {},
  totalAnswered: 0,
  totalCorrect: 0,
};

type Action = {type: 'RECORD_ATTEMPT'; attempt: QuestionAttempt};

function progressReducer(state: UserProgress, action: Action): UserProgress {
  if (action.type === 'RECORD_ATTEMPT') {
    const {questionId, isCorrect} = action.attempt;
    const existing: QuestionProgress = state.byQuestion[questionId] ?? {
      questionId,
      totalAttempts: 0,
      correctAttempts: 0,
      lastAttemptedAt: '',
    };

    const updated: QuestionProgress = {
      questionId,
      totalAttempts: existing.totalAttempts + 1,
      correctAttempts: existing.correctAttempts + (isCorrect ? 1 : 0),
      lastAttemptedAt: action.attempt.attemptedAt,
    };

    return {
      byQuestion: {...state.byQuestion, [questionId]: updated},
      totalAnswered: state.totalAnswered + 1,
      totalCorrect: state.totalCorrect + (isCorrect ? 1 : 0),
    };
  }
  return state;
}

interface ProgressContextValue {
  progress: UserProgress;
  recordAttempt: (attempt: QuestionAttempt) => void;
  getQuestionProgress: (questionId: string) => QuestionProgress | undefined;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({children}: {children: React.ReactNode}) {
  const [progress, dispatch] = useReducer(progressReducer, EMPTY_PROGRESS);

  const recordAttempt = useCallback((attempt: QuestionAttempt) => {
    dispatch({type: 'RECORD_ATTEMPT', attempt});
  }, []);

  const getQuestionProgress = useCallback(
    (questionId: string) => progress.byQuestion[questionId],
    [progress.byQuestion],
  );

  const value = useMemo(
    () => ({progress, recordAttempt, getQuestionProgress}),
    [progress, recordAttempt, getQuestionProgress],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used inside ProgressProvider');
  }
  return ctx;
}
