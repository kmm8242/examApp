import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExamType } from '../types/question';
import {
  getAvailableExamTypes,
  getTotalQuestionCount,
} from '../data/questionLoader';
import { useProgress } from '../store/ProgressContext';
import type { HomeScreenProps } from '../navigation/types';

const EXAM_META: Record<
  ExamType,
  { label: string; color: string; description: string }
> = {
  SAT: {
    label: 'SAT',
    color: '#4F46E5',
    description: 'Math · Reading & Writing',
  },
  GRE: {
    label: 'GRE',
    color: '#0891B2',
    description: 'Verbal · Quantitative',
  },
  Academic: {
    label: 'Academic',
    color: '#059669',
    description: 'Biology · Chemistry · Physics · History · Math',
  },
  Custom: {
    label: 'Custom',
    color: '#D97706',
    description: 'Your own question sets',
  },
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { progress } = useProgress();
  const examTypes = getAvailableExamTypes();

  const accuracy =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Mode</Text>
        <Text style={styles.subtitle}>Pick an exam to start practicing</Text>
      </View>

      {progress.totalAnswered > 0 && (
        <View style={styles.statsBar}>
          <Stat label="Answered" value={String(progress.totalAnswered)} />
          <View style={styles.statDivider} />
          <Stat label="Correct" value={String(progress.totalCorrect)} />
          <View style={styles.statDivider} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
        </View>
      )}

      <FlatList
        data={examTypes}
        keyExtractor={item => item}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const meta = EXAM_META[item];
          const count = getTotalQuestionCount(item);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                navigation.navigate('ExamList', { examType: item })
              }
            >
              <View
                style={[styles.cardAccent, { backgroundColor: meta.color }]}
              />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{meta.label}</Text>
                <Text style={styles.cardDesc}>{meta.description}</Text>
                <Text style={styles.cardCount}>{count} questions</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 25,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardAccent: {
    width: 5,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  cardCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
    paddingRight: 16,
  },
});
