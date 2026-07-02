import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {ExamType} from '../types/question';

export type RootStackParamList = {
  Home: undefined;
  ExamList: {examType: ExamType};
  Quiz: {examType?: ExamType; subject?: string};
  AppLock: undefined;
  Stats: undefined;
  QuestionReview: {questionId: string};
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ExamListScreenProps = NativeStackScreenProps<RootStackParamList, 'ExamList'>;
export type QuizScreenProps = NativeStackScreenProps<RootStackParamList, 'Quiz'>;
export type AppLockScreenProps = NativeStackScreenProps<RootStackParamList, 'AppLock'>;
export type StatsScreenProps = NativeStackScreenProps<RootStackParamList, 'Stats'>;
export type QuestionReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'QuestionReview'>;
