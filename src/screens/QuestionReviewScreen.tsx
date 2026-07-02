import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useProgress} from '../store/ProgressContext';
import {getQuestionById} from '../data/questionLoader';
import type {QuestionReviewScreenProps} from '../navigation/types';
import type {ExamType, Option} from '../types/question';

const EXAM_META: Record<ExamType, {color: string; bg: string}> = {
  SAT:      {color: '#6366F1', bg: '#EEF2FF'},
  GRE:      {color: '#0891B2', bg: '#E0F2FE'},
  Academic: {color: '#059669', bg: '#ECFDF5'},
};

export default function QuestionReviewScreen({route}: QuestionReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const {getQuestionProgress, recordAttempt} = useProgress();
  const {questionId} = route.params;

  const question = getQuestionById(questionId);
  const qp = getQuestionProgress(questionId);

  // Practice mode state — null means review mode (answer revealed)
  const [selected, setSelected] = useState<string | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);

  if (!question) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Question not found.</Text>
      </View>
    );
  }

  const meta = EXAM_META[question.examType];
  const answered = selected !== null;

  function handlePracticeAnswer(opt: Option) {
    if (answered) return;
    setSelected(opt.id);
    recordAttempt({
      questionId: question!.id,
      selectedOptionId: opt.id,
      isCorrect: opt.id === question!.correctOptionId,
      attemptedAt: new Date().toISOString(),
    });
  }

  function optionStyle(optId: string) {
    if (!isPracticing) {
      // Review mode — always show correct highlighted, others neutral
      return optId === question!.correctOptionId
        ? [styles.option, styles.optionCorrect]
        : [styles.option, styles.optionNeutral];
    }
    if (!answered) return [styles.option, styles.optionNeutral];
    if (optId === question!.correctOptionId) return [styles.option, styles.optionCorrect];
    if (optId === selected) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionNeutral];
  }

  function optionTextStyle(optId: string) {
    if (!isPracticing) {
      return optId === question!.correctOptionId ? styles.optTextCorrect : styles.optTextNeutral;
    }
    if (!answered) return styles.optTextNeutral;
    if (optId === question!.correctOptionId) return styles.optTextCorrect;
    if (optId === selected) return styles.optTextWrong;
    return styles.optTextNeutral;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, {paddingBottom: insets.bottom + 32}]}
      showsVerticalScrollIndicator={false}>

      {/* Tags */}
      <View style={styles.tags}>
        <View style={[styles.tag, {backgroundColor: meta.bg}]}>
          <Text style={[styles.tagText, {color: meta.color}]}>{question.examType}</Text>
        </View>
        <View style={[styles.tag, {backgroundColor: meta.bg}]}>
          <Text style={[styles.tagText, {color: meta.color}]}>{question.subject}</Text>
        </View>
        <View style={styles.tagDifficulty}>
          <Text style={styles.tagDifficultyText}>{question.difficulty}</Text>
        </View>
      </View>

      {/* Question */}
      <Text style={styles.questionText}>{question.text}</Text>

      {/* Options */}
      <View style={styles.options}>
        {question.options.map(opt => (
          <Pressable
            key={opt.id}
            style={optionStyle(opt.id)}
            onPress={() => isPracticing && handlePracticeAnswer(opt)}
            disabled={!isPracticing || answered}>
            <Text style={styles.optId}>{opt.id}</Text>
            <Text style={optionTextStyle(opt.id)}>{opt.text}</Text>
          </Pressable>
        ))}
      </View>

      {/* Explanation — shown in review mode or after practice answer */}
      {(!isPracticing || answered) && (
        <View style={styles.explanationCard}>
          <Text style={styles.explanationLabel}>EXPLANATION</Text>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}

      {/* Practice again / back to review toggle */}
      {isPracticing && answered ? (
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            setSelected(null);
            setIsPracticing(false);
          }}>
          <Text style={styles.actionBtnText}>Back to Review</Text>
        </Pressable>
      ) : !isPracticing ? (
        <Pressable
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => {
            setSelected(null);
            setIsPracticing(true);
          }}>
          <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
            Practice This Question
          </Text>
        </Pressable>
      ) : null}

      {/* History card */}
      {qp && (
        <View style={styles.historyCard}>
          <Text style={styles.historyLabel}>YOUR HISTORY</Text>
          <View style={styles.historyRow}>
            <HistoryStat label="Attempts" value={qp.totalAttempts} />
            <View style={styles.historyDivider} />
            <HistoryStat label="Correct" value={qp.correctAttempts} color="#059669" />
            <View style={styles.historyDivider} />
            <HistoryStat
              label="Wrong"
              value={qp.totalAttempts - qp.correctAttempts}
              color="#DC2626"
            />
            <View style={styles.historyDivider} />
            <HistoryStat
              label="Accuracy"
              value={`${Math.round((qp.correctAttempts / qp.totalAttempts) * 100)}%`}
              color="#4F46E5"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function HistoryStat({
  label,
  value,
  color = '#111827',
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <View style={styles.historyStatBox}>
      <Text style={[styles.historyValue, {color}]}>{value}</Text>
      <Text style={styles.historyStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
  },

  // Tags
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagDifficulty: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tagDifficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'capitalize',
  },

  // Question
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 26,
    marginBottom: 20,
  },

  // Options
  options: {
    gap: 10,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  optionNeutral: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionCorrect: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  optId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9CA3AF',
    width: 18,
    marginTop: 1,
  },
  optTextNeutral: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  optTextCorrect: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
    lineHeight: 20,
  },
  optTextWrong: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },

  // Explanation
  explanationCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  explanationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 21,
  },

  // Action buttons
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  actionBtnPrimary: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  actionBtnTextPrimary: {
    color: '#FFFFFF',
  },

  // History
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    shadowColor: '#4F46E5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
  },
  historyStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  historyValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  historyStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 3,
    fontWeight: '500',
  },
  historyDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
});
