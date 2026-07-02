import React, {useState} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
};

export default function HomeScreen({navigation}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {progress, isLoaded} = useProgress();
  const [query, setQuery] = useState('');

  const examTypes = getAvailableExamTypes();

  const filteredExams = query.trim()
    ? examTypes.filter(type => {
        const q = query.toLowerCase();
        const meta = EXAM_META[type];
        return (
          meta.label.toLowerCase().includes(q) ||
          meta.description.toLowerCase().includes(q)
        );
      })
    : examTypes;

  const accuracy =
    progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : null;

  return (
    <View style={styles.container}>
      <View style={[styles.hero, {paddingTop: insets.top + 16}]}>
        <Text style={styles.heroEyebrow}>EXAM PREP</Text>
        <Text style={styles.heroTitle}>Study Mode</Text>
        <Text style={styles.heroSub}>Pick an exam to start practicing</Text>
      </View>

      <FlatList
        data={filteredExams}
        keyExtractor={item => item}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: insets.bottom + 32},
        ]}
        ListHeaderComponent={
          <>
            {isLoaded && progress.totalAnswered > 0 && (
              <View style={styles.statsRow}>
                <StatBox label="Answered" value={String(progress.totalAnswered)} />
                <View style={styles.statDivider} />
                <StatBox label="Correct" value={String(progress.totalCorrect)} />
                <View style={styles.statDivider} />
                <StatBox label="Accuracy" value={`${accuracy}%`} accent />
              </View>
            )}

            <Text style={styles.sectionLabel}>SETTINGS</Text>
            <View style={styles.settingsCard}>
              <Pressable
                style={({pressed}) => [
                  styles.settingsRow,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => navigation.navigate('Stats')}>
                <View style={[styles.cardIcon, styles.statsIconBg]}>
                  <Text style={styles.cardEmoji}>📊</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>Stats & History</Text>
                  <Text style={styles.cardDesc}>
                    View your accuracy and recent answers
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>

              <View style={styles.rowDivider} />

              <Pressable
                style={({pressed}) => [
                  styles.settingsRow,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => navigation.navigate('AppLock')}>
                <View style={[styles.cardIcon, styles.appLockIconBg]}>
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

            <Text style={[styles.sectionLabel, styles.sectionLabelSpacedTop]}>
              AVAILABLE EXAMS
            </Text>

            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search exams or subjects…"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Text style={styles.searchClear}>✕</Text>
                </Pressable>
              )}
            </View>
          </>
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔎</Text>
            <Text style={styles.emptyTitle}>No exams found</Text>
            <Text style={styles.emptyDesc}>
              Try searching for a subject like "Math" or "Verbal"
            </Text>
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
    paddingTop: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
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

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.9,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionLabelSpacedTop: {
    marginTop: 24,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  searchClear: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
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

  // Settings
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
  appLockIconBg: {
    backgroundColor: '#F3E8FF',
  },
  statsIconBg: {
    backgroundColor: '#F0FDF4',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginLeft: 80,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
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
  },
});
