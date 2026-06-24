import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getAvailableSubjects,
  getQuestionsByExamType,
} from '../data/questionLoader';
import { useProgress } from '../store/ProgressContext';
import type { ExamListScreenProps } from '../navigation/types';

export default function ExamListScreen({
  route,
  navigation,
}: ExamListScreenProps) {
  const { examType } = route.params;
  const { progress } = useProgress();
  const subjects = getAvailableSubjects(examType);
  const allQuestions = getQuestionsByExamType(examType);

  const answeredInExam = allQuestions.filter(
    q => progress.byQuestion[q.id],
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {answeredInExam} / {allQuestions.length} questions answered
        </Text>
        <Pressable
          style={styles.practiceAllBtn}
          onPress={() => navigation.navigate('Quiz', { examType })}
        >
          <Text style={styles.practiceAllText}>Practice All</Text>
        </Pressable>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={item => item}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionHeader}>Subjects</Text>}
        renderItem={({ item: subject }) => {
          const subjectQuestions = allQuestions.filter(
            q => q.subject === subject,
          );
          const answeredCount = subjectQuestions.filter(
            q => progress.byQuestion[q.id],
          ).length;
          const correctCount = subjectQuestions.filter(
            q => progress.byQuestion[q.id]?.correctAttempts > 0,
          ).length;

          const pct =
            subjectQuestions.length > 0
              ? answeredCount / subjectQuestions.length
              : 0;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
              onPress={() => navigation.navigate('Quiz', { examType, subject })}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle}>{subject}</Text>
                <Text style={styles.rowMeta}>
                  {subjectQuestions.length} questions · {correctCount} correct
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { flex: pct }]} />
                  <View style={[styles.progressEmpty, { flex: 1 - pct }]} />
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  practiceAllBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  practiceAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  rowPressed: {
    backgroundColor: '#F9FAFB',
  },
  rowLeft: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowMeta: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 3,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressEmpty: {
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 12,
  },
});
