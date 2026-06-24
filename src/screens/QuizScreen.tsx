import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {Question} from '../types/question';
import {getRandomQuestion} from '../data/questionLoader';
import {useProgress} from '../store/ProgressContext';
import type {QuizScreenProps} from '../navigation/types';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export default function QuizScreen({route, navigation}: QuizScreenProps) {
  const {examType, subject} = route.params;
  const {recordAttempt} = useProgress();

  const [question, setQuestion] = useState<Question | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [usedIds, setUsedIds] = useState<string[]>([]);

  const loadNext = useCallback(() => {
    const next = getRandomQuestion({examType, subject, excludeIds: usedIds});
    if (next) {
      setQuestion(next);
      setSelectedId(null);
      setAnswerState('unanswered');
      setUsedIds(prev => [...prev, next.id]);
    } else {
      // All questions in this set exhausted — restart
      setUsedIds([]);
      const restarted = getRandomQuestion({examType, subject});
      if (restarted) {
        setQuestion(restarted);
        setSelectedId(null);
        setAnswerState('unanswered');
        setUsedIds([restarted.id]);
      }
    }
  }, [examType, subject, usedIds]);

  useEffect(() => {
    loadNext();
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (answerState !== 'unanswered' || !question) {
        return;
      }
      const isCorrect = optionId === question.correctOptionId;
      setSelectedId(optionId);
      setAnswerState(isCorrect ? 'correct' : 'incorrect');
      setSessionTotal(t => t + 1);
      if (isCorrect) {
        setSessionCorrect(c => c + 1);
      }
      recordAttempt({
        questionId: question.id,
        selectedOptionId: optionId,
        isCorrect,
        attemptedAt: new Date().toISOString(),
      });
    },
    [answerState, question, recordAttempt],
  );

  const difficultyColor = useMemo(() => {
    if (!question) {return '#9CA3AF';}
    return {easy: '#059669', medium: '#D97706', hard: '#DC2626'}[question.difficulty];
  }, [question]);

  if (!question) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No questions available.</Text>
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Session progress bar */}
      <View style={styles.topBar}>
        <Text style={styles.sessionScore}>
          {sessionCorrect}/{sessionTotal} this session
        </Text>
        <View style={[styles.difficultyBadge, {backgroundColor: difficultyColor + '22'}]}>
          <Text style={[styles.difficultyText, {color: difficultyColor}]}>
            {question.difficulty}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Subject tag */}
        <Text style={styles.subjectTag}>{question.subject} · {question.topic}</Text>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.text}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {question.options.map(option => {
            const isSelected = selectedId === option.id;
            const isCorrect = option.id === question.correctOptionId;
            const revealed = answerState !== 'unanswered';

            return (
              <Pressable
                key={option.id}
                style={({pressed}) => [
                  styles.option,
                  !revealed && isSelected && styles.optionSelected,
                  !revealed && pressed && styles.optionPressed,
                  revealed && isCorrect && styles.optionCorrect,
                  revealed && isSelected && !isCorrect && styles.optionWrong,
                ]}
                onPress={() => handleSelect(option.id)}>
                <View
                  style={[
                    styles.optionLabel,
                    !revealed && isSelected && styles.optionLabelSelected,
                    revealed && isCorrect && styles.optionLabelCorrect,
                    revealed && isSelected && !isCorrect && styles.optionLabelWrong,
                  ]}>
                  <Text style={styles.optionLabelText}>{option.id}</Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    (isSelected || (revealed && isCorrect)) &&
                      styles.optionTextSelected,
                  ]}
                  numberOfLines={3}>
                  {option.text}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation */}
        {answerState !== 'unanswered' && (
          <View style={[
            styles.explanation,
            answerState === 'correct' ? styles.explanationCorrect : styles.explanationWrong,
          ]}>
            <Text style={styles.explanationHeader}>
              {answerState === 'correct' ? '✓ Correct' : '✗ Incorrect'}
            </Text>
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.footer}>
        {answerState === 'unanswered' ? (
          <Text style={styles.hintText}>Tap an answer to respond</Text>
        ) : (
          <Pressable style={styles.btn} onPress={loadNext}>
            <Text style={styles.btnText}>Next Question →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  sessionScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  difficultyBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  subjectTag: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#111827',
    fontWeight: '500',
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 12,
  },
  optionPressed: {
    backgroundColor: '#F5F3FF',
    borderColor: '#C4B5FD',
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  optionCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLabelSelected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLabelCorrect: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLabelWrong: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#111827',
    fontWeight: '500',
  },
  explanation: {
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
  },
  explanationCorrect: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  explanationWrong: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  explanationHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
  },
  btn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
