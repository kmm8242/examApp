import React, {useMemo} from 'react';
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
import type {StatsScreenProps} from '../navigation/types';
import type {ExamType} from '../types/question';

const EXAM_META: Record<ExamType, {color: string; bg: string; icon: string}> = {
  SAT:      {color: '#6366F1', bg: '#EEF2FF', icon: '📐'},
  GRE:      {color: '#0891B2', bg: '#E0F2FE', icon: '📚'},
  Academic: {color: '#059669', bg: '#ECFDF5', icon: '🔬'},
};

export default function StatsScreen({navigation}: StatsScreenProps) {
  const insets = useSafeAreaInsets();
  const {progress} = useProgress();

  const totalWrong = progress.totalAnswered - progress.totalCorrect;
  const accuracy =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : 0;

  // Group unique questions by exam type
  const examBreakdown = useMemo(() => {
    const map: Record<string, {attempted: number; correct: number}> = {};
    for (const qp of Object.values(progress.byQuestion)) {
      const question = getQuestionById(qp.questionId);
      if (!question) continue;
      const key = question.examType;
      if (!map[key]) map[key] = {attempted: 0, correct: 0};
      map[key].attempted += 1;
      if (qp.correctAttempts > 0) map[key].correct += 1;
    }
    return map;
  }, [progress.byQuestion]);

  // Recent activity sorted newest-first
  const recentActivity = useMemo(() => {
    return Object.values(progress.byQuestion)
      .filter(qp => qp.lastAttemptedAt)
      .sort((a, b) => b.lastAttemptedAt.localeCompare(a.lastAttemptedAt))
      .slice(0, 30)
      .map(qp => ({qp, question: getQuestionById(qp.questionId)}))
      .filter(({question}) => question != null);
  }, [progress.byQuestion]);

  const hasData = progress.totalAnswered > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {paddingBottom: insets.bottom + 32},
      ]}
      showsVerticalScrollIndicator={false}>

      {/* Overall summary */}
      <Text style={styles.sectionLabel}>OVERALL</Text>
      <View style={styles.overallCard}>
        <OverallStat label="Answered" value={progress.totalAnswered} color="#111827" />
        <View style={styles.divider} />
        <OverallStat label="Correct" value={progress.totalCorrect} color="#059669" />
        <View style={styles.divider} />
        <OverallStat label="Wrong" value={totalWrong} color="#DC2626" />
        <View style={styles.divider} />
        <OverallStat label="Accuracy" value={`${accuracy}%`} color="#4F46E5" />
      </View>

      {/* Per-exam breakdown */}
      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>BY EXAM</Text>
      {(Object.keys(EXAM_META) as ExamType[]).map(type => {
        const meta = EXAM_META[type];
        const data = examBreakdown[type];
        const examAccuracy =
          data && data.attempted > 0
            ? Math.round((data.correct / data.attempted) * 100)
            : null;

        return (
          <View key={type} style={styles.examCard}>
            <View style={[styles.examIcon, {backgroundColor: meta.bg}]}>
              <Text style={styles.examEmoji}>{meta.icon}</Text>
            </View>
            <View style={styles.examBody}>
              <Text style={styles.examName}>{type}</Text>
              {data ? (
                <Text style={styles.examSub}>
                  {data.attempted} question{data.attempted !== 1 ? 's' : ''} attempted
                </Text>
              ) : (
                <Text style={styles.examSub}>Not started yet</Text>
              )}
            </View>
            {examAccuracy !== null ? (
              <View style={styles.examAccuracyBadge}>
                <Text style={[styles.examAccuracyText, {color: meta.color}]}>
                  {examAccuracy}%
                </Text>
                <Text style={styles.examAccuracyLabel}>accuracy</Text>
              </View>
            ) : (
              <Text style={styles.examNotStarted}>—</Text>
            )}
          </View>
        );
      })}

      {/* Recent activity */}
      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>RECENT ACTIVITY</Text>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyDesc}>
            Start answering questions and your history will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.activityCard}>
          {recentActivity.map(({qp, question}, index) => {
            const mastered = qp.correctAttempts > 0;
            const isLast = index === recentActivity.length - 1;
            return (
              <Pressable
                key={qp.questionId}
                style={({pressed}) => [
                  styles.activityRow,
                  !isLast && styles.activityRowBorder,
                  pressed && styles.activityRowPressed,
                ]}
                onPress={() =>
                  navigation.navigate('QuestionReview', {questionId: qp.questionId})
                }>
                <View
                  style={[
                    styles.resultDot,
                    mastered ? styles.resultDotCorrect : styles.resultDotWrong,
                  ]}
                />
                <View style={styles.activityBody}>
                  <Text style={styles.activityQuestion} numberOfLines={2}>
                    {question!.text}
                  </Text>
                  <View style={styles.activityMeta}>
                    <View
                      style={[
                        styles.subjectTag,
                        {backgroundColor: EXAM_META[question!.examType].bg},
                      ]}>
                      <Text
                        style={[
                          styles.subjectTagText,
                          {color: EXAM_META[question!.examType].color},
                        ]}>
                        {question!.subject}
                      </Text>
                    </View>
                    <Text style={styles.attemptsText}>
                      {qp.totalAttempts} attempt{qp.totalAttempts !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={mastered ? styles.tickCorrect : styles.tickWrong}>
                  {mastered ? '✓' : '✗'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function OverallStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <View style={styles.overallStatBox}>
      <Text style={[styles.overallValue, {color}]}>{value}</Text>
      <Text style={styles.overallLabel}>{label}</Text>
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

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.9,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionSpacing: {
    marginTop: 24,
  },

  // Overall card
  overallCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    shadowColor: '#4F46E5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  overallStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  overallValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  overallLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 3,
    fontWeight: '600',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },

  // Exam breakdown
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  examIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  examEmoji: {
    fontSize: 20,
  },
  examBody: {
    flex: 1,
  },
  examName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  examSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  examAccuracyBadge: {
    alignItems: 'center',
  },
  examAccuracyText: {
    fontSize: 18,
    fontWeight: '800',
  },
  examAccuracyLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  examNotStarted: {
    fontSize: 18,
    color: '#D1D5DB',
    fontWeight: '700',
  },

  // Recent activity
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activityRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  activityRowPressed: {
    backgroundColor: '#F9FAFB',
  },
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  resultDotCorrect: {
    backgroundColor: '#10B981',
  },
  resultDotWrong: {
    backgroundColor: '#EF4444',
  },
  activityBody: {
    flex: 1,
    marginRight: 8,
  },
  activityQuestion: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 18,
    fontWeight: '500',
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 8,
  },
  subjectTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  attemptsText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  tickCorrect: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  tickWrong: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 32,
  },
});
