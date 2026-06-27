import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {ExamType} from '../types/question';
import {getAvailableExamTypes, getTotalQuestionCount} from '../data/questionLoader';
import {useProgress} from '../store/ProgressContext';
import type {HomeScreenProps} from '../navigation/types';

const EXAM_META: Record<
  ExamType,
  {label: string; color: string; bg: string; icon: string; description: string}
> = {
  SAT: {
    label: 'SAT',
    color: '#6366F1',
    bg: '#EEF2FF',
    icon: '📐',
    description: 'Math · Reading & Writing',
  },
  GRE: {
    label: 'GRE',
    color: '#0891B2',
    bg: '#E0F2FE',
    icon: '📚',
    description: 'Verbal · Quantitative',
  },
  Academic: {
    label: 'Academic',
    color: '#059669',
    bg: '#ECFDF5',
    icon: '🔬',
    description: 'Biology · Chemistry · Physics · History · Math',
  },
  Custom: {
    label: 'Custom',
    color: '#D97706',
    bg: '#FFFBEB',
    icon: '✏️',
    description: 'Your own question sets',
  },
};

export default function HomeScreen({navigation}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {progress} = useProgress();
  const examTypes = getAvailableExamTypes();

  const accuracy =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : null;

  return (
    <View style={styles.container}>
      {/* Dark hero header */}
      <View style={[styles.hero, {paddingTop: insets.top + 16}]}>
        <Text style={styles.heroEyebrow}>EXAM PREP</Text>
        <Text style={styles.heroTitle}>Study Mode</Text>
        <Text style={styles.heroSub}>Pick an exam to start practicing</Text>
      </View>

      <FlatList
        data={examTypes}
        keyExtractor={item => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: insets.bottom + 32},
        ]}
        ListHeaderComponent={
          progress.totalAnswered > 0 ? (
            <View style={styles.statsRow}>
              <StatBox label="Answered" value={String(progress.totalAnswered)} />
              <View style={styles.statDivider} />
              <StatBox label="Correct" value={String(progress.totalCorrect)} />
              <View style={styles.statDivider} />
              <StatBox label="Accuracy" value={`${accuracy}%`} accent />
            </View>
          ) : null
        }
        renderItem={({item}) => {
          const meta = EXAM_META[item];
          const count = getTotalQuestionCount(item);
          return (
            <Pressable
              style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('ExamList', {examType: item})}>
              <View style={[styles.cardIcon, {backgroundColor: meta.bg}]}>
                <Text style={styles.cardEmoji}>{meta.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{meta.label}</Text>
                <Text style={styles.cardDesc}>{meta.description}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardCount, {color: meta.color}]}>
                  {count}
                </Text>
                <Text style={styles.cardCountLabel}>questions</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={styles.settingsSection}>
            <Text style={styles.sectionLabel}>SETTINGS</Text>
            <View style={styles.settingsCard}>
              <Pressable
                style={({pressed}) => [
                  styles.settingsRow,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => navigation.navigate('AppLock')}>
                <View style={[styles.cardIcon, {backgroundColor: '#F3E8FF'}]}>
                  <Text style={styles.cardEmoji}>🔒</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>App Lock</Text>
                  <Text style={styles.cardDesc}>
                    Lock any app behind a quiz question
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </View>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },

  // Hero
  hero: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: '#A5B4FC',
    marginTop: 4,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 16,
    shadowColor: '#4F46E5',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  statValueAccent: {
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 17,
  },
  cardRight: {
    alignItems: 'center',
    marginRight: 10,
  },
  cardCount: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardCountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    color: '#D1D5DB',
  },

  // Settings section
  settingsSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.9,
    marginBottom: 10,
    marginLeft: 2,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
});
