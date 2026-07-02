import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {AppState, Platform} from 'react-native';
import AppLockModule from '../native/AppLockModule';
import type {QuestionAttempt, QuestionProgress, UserProgress} from '../types/question';

const EMPTY_PROGRESS: UserProgress = {
  byQuestion: {},
  totalAnswered: 0,
  totalCorrect: 0,
};

type Action =
  | {type: 'RECORD_ATTEMPT'; attempt: QuestionAttempt}
  | {type: 'LOAD'; progress: UserProgress};

function progressReducer(state: UserProgress, action: Action): UserProgress {
  if (action.type === 'LOAD') {
    return action.progress;
  }
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
  isLoaded: boolean;
  recordAttempt: (attempt: QuestionAttempt) => void;
  getQuestionProgress: (questionId: string) => QuestionProgress | undefined;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function parseProgress(json: string | null): UserProgress | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as UserProgress;
  } catch {
    return null;
  }
}

export function ProgressProvider({children}: {children: React.ReactNode}) {
  const [progress, dispatch] = useReducer(progressReducer, EMPTY_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted progress once on mount.
  // AppLockActivity writes directly into examapp_progress with commit(), so any
  // AppLock answers answered before this cold-start are already in the loaded data.
  useEffect(() => {
    AppLockModule.loadProgress()
      .then(json => {
        const saved = parseProgress(json);
        if (saved) dispatch({type: 'LOAD', progress: saved});
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  // Persist to native storage on every change (skip before first load completes).
  useEffect(() => {
    if (!isLoaded) return;
    AppLockModule.saveProgress(JSON.stringify(progress)).catch(() => {});
  }, [progress, isLoaded]);

  // After progress loads, push the answered-question list to native so AppLockActivity
  // can skip already-seen questions when picking its next question.
  useEffect(() => {
    if (!isLoaded || Platform.OS !== 'android') return;
    AppLockModule.syncAnsweredQuestions(Object.keys(progress.byQuestion)).catch(() => {});
  }, [isLoaded, progress.byQuestion]);

  // When the app returns to the foreground, reload progress from disk.
  // AppLockActivity writes AppLock answers directly into examapp_progress with
  // commit() while ExamApp is backgrounded, so a fresh load picks them up.
  useEffect(() => {
    if (!isLoaded) return;
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      AppLockModule.loadProgress()
        .then(json => {
          const saved = parseProgress(json);
          if (saved) dispatch({type: 'LOAD', progress: saved});
        })
        .catch(() => {});
    });
    return () => sub.remove();
  }, [isLoaded]);

  const recordAttempt = useCallback((attempt: QuestionAttempt) => {
    dispatch({type: 'RECORD_ATTEMPT', attempt});
  }, []);

  const getQuestionProgress = useCallback(
    (questionId: string) => progress.byQuestion[questionId],
    [progress.byQuestion],
  );

  const value = useMemo(
    () => ({progress, isLoaded, recordAttempt, getQuestionProgress}),
    [progress, isLoaded, recordAttempt, getQuestionProgress],
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
