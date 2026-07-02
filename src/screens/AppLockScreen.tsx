import React, {useState, useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AppLockModule, {InstalledApp} from '../native/AppLockModule';

// Topic keys: "ExamType|Subject" keeps SAT Math distinct from Academic Math
const SUBJECTS_BY_EXAM: {
  examType: string;
  color: string;
  bg: string;
  subjects: string[];
}[] = [
  {
    examType: 'SAT',
    color: '#6366F1',
    bg: '#EEF2FF',
    subjects: ['Math', 'Reading & Writing'],
  },
  {
    examType: 'GRE',
    color: '#0891B2',
    bg: '#E0F2FE',
    subjects: ['Verbal', 'Quantitative'],
  },
  {
    examType: 'Academic',
    color: '#059669',
    bg: '#ECFDF5',
    subjects: ['Biology', 'Chemistry', 'Physics', 'History', 'Math'],
  },
];

const subjectKey = (examType: string, subject: string) =>
  `${examType}|${subject}`;

// Deterministic avatar color based on app name
const AVATAR_COLORS = [
  '#6366F1', '#0891B2', '#059669', '#D97706',
  '#7C3AED', '#DC2626', '#0D9488', '#9333EA',
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.toUpperCase().charCodeAt(0) % AVATAR_COLORS.length];

export default function AppLockScreen() {
  const [loading, setLoading] = useState(true);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [lockedApps, setLockedApps] = useState<Set<string>>(new Set());
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(),
  );
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, []),
  );

  async function loadAll() {
    setLoading(true);
    try {
      const [apps, locked, subjects, enabled] = await Promise.all([
        AppLockModule.getInstalledApps(),
        AppLockModule.getLockedApps(),
        AppLockModule.getSelectedSubjects(),
        AppLockModule.isAccessibilityServiceEnabled(),
      ]);
      setInstalledApps(apps);
      setLockedApps(new Set(locked));
      setSelectedSubjects(new Set(subjects));
      setServiceEnabled(enabled);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnableService() {
    if (Platform.OS !== 'android') {
      Alert.alert('Android only', 'App Lock is only available on Android.');
      return;
    }
    Alert.alert(
      'Enable Accessibility Service',
      'In the list, find "ExamApp" and switch it on. This lets ExamApp show a question whenever a locked app is opened.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Open Settings',
          onPress: () => AppLockModule.openAccessibilitySettings(),
        },
      ],
    );
  }

  async function toggleSubject(key: string) {
    const next = new Set(selectedSubjects);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelectedSubjects(next);
    await AppLockModule.setSelectedSubjects([...next]);
  }

  async function toggleApp(packageName: string) {
    const next = new Set(lockedApps);
    next.has(packageName) ? next.delete(packageName) : next.add(packageName);
    setLockedApps(next);
    await AppLockModule.setLockedApps([...next]);
  }

  const filteredApps = query
    ? installedApps.filter(
        a =>
          a.appName.toLowerCase().includes(query.toLowerCase()) ||
          a.packageName.toLowerCase().includes(query.toLowerCase()),
      )
    : installedApps;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading installed apps…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredApps}
      keyExtractor={item => item.packageName}
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          {/* ── Service status card ── */}
          <View style={serviceEnabled ? styles.serviceCardOn : styles.serviceCardOff}>
            <Text style={styles.serviceEmoji}>
              {serviceEnabled ? '🛡️' : '⚠️'}
            </Text>
            <View style={styles.serviceBody}>
              <Text
                style={[
                  styles.serviceTitle,
                  serviceEnabled
                    ? styles.serviceTitleOn
                    : styles.serviceTitleOff,
                ]}>
                {serviceEnabled ? 'Protection Active' : 'Service Disabled'}
              </Text>
              <Text
                style={[
                  styles.serviceSub,
                  serviceEnabled
                    ? styles.serviceSubOn
                    : styles.serviceSubOff,
                ]}>
                {serviceEnabled
                  ? 'ExamApp intercepts locked apps with a quiz question'
                  : 'Enable accessibility so ExamApp can detect app launches'}
              </Text>
            </View>
            {!serviceEnabled && (
              <Pressable
                style={styles.enableBtn}
                onPress={handleEnableService}>
                <Text style={styles.enableBtnText}>Enable →</Text>
              </Pressable>
            )}
          </View>

          {/* ── Topic selection ── */}
          <View style={styles.topicSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Question Topics</Text>
              {selectedSubjects.size > 0 && (
                <Text style={styles.sectionBadge}>
                  {selectedSubjects.size} selected
                </Text>
              )}
            </View>
            <Text style={styles.sectionHint}>
              Leave all unselected to draw from any topic.
            </Text>

            {SUBJECTS_BY_EXAM.map(({examType, color, bg, subjects}) => (
              <View key={examType} style={styles.examGroup}>
                <View style={[styles.examBadge, {backgroundColor: bg}]}>
                  <Text style={[styles.examBadgeText, {color}]}>
                    {examType}
                  </Text>
                </View>
                <View style={styles.chipRow}>
                  {subjects.map(subject => {
                    const key = subjectKey(examType, subject);
                    const sel = selectedSubjects.has(key);
                    return (
                      <Pressable
                        key={key}
                        style={[
                          styles.chip,
                          sel && {
                            backgroundColor: bg,
                            borderColor: color,
                          },
                        ]}
                        onPress={() => toggleSubject(key)}>
                        {sel && (
                          <Text style={[styles.chipCheck, {color}]}>✓ </Text>
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            sel && styles.chipTextSelected,
                            sel && {color},
                          ]}>
                          {subject}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* ── App list header ── */}
          <View style={styles.appsHeader}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Apps to Lock</Text>
              {lockedApps.size > 0 && (
                <View style={styles.lockedCountBadge}>
                  <Text style={styles.lockedCountText}>
                    {lockedApps.size} locked
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search apps…"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
              />
            </View>
          </View>
        </View>
      }
      renderItem={({item, index}) => (
        <AppRow
          app={item}
          locked={lockedApps.has(item.packageName)}
          onToggle={() => toggleApp(item.packageName)}
          isFirst={index === 0}
          isLast={index === filteredApps.length - 1}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📱</Text>
          <Text style={styles.emptyText}>
            {query ? 'No apps match your search.' : 'No installed apps found.'}
          </Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
    />
  );
}

function AppRow({
  app,
  locked,
  onToggle,
  isFirst,
  isLast,
}: {
  app: InstalledApp;
  locked: boolean;
  onToggle: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const color = avatarColor(app.appName);
  return (
    <View
      style={[
        styles.appRow,
        isFirst && styles.appRowFirst,
        isLast && styles.appRowLast,
        locked && styles.appRowLocked,
      ]}>
      {/* Colored letter avatar */}
      <View style={[styles.avatar, {backgroundColor: color}]}>
        <Text style={styles.avatarText}>{app.appName[0].toUpperCase()}</Text>
      </View>

      <View style={styles.appInfo}>
        <View style={styles.appNameRow}>
          <Text style={styles.appName} numberOfLines={1}>
            {app.appName}
          </Text>
          {locked && (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeText}>LOCKED</Text>
            </View>
          )}
        </View>
        <Text style={styles.appPkg} numberOfLines={1}>
          {app.packageName}
        </Text>
      </View>

      <Switch
        value={locked}
        onValueChange={onToggle}
        trackColor={{false: '#E5E7EB', true: '#A5B4FC'}}
        thumbColor={locked ? '#4F46E5' : '#D1D5DB'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  listContent: {
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },

  // Service card
  serviceCardOff: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#1E1B4B',
    gap: 12,
  },
  serviceCardOn: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
  },
  serviceEmoji: {
    fontSize: 30,
  },
  serviceBody: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  serviceTitleOn: {
    color: '#065F46',
  },
  serviceTitleOff: {
    color: '#FFFFFF',
  },
  serviceSub: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  serviceSubOn: {
    color: '#047857',
  },
  serviceSubOff: {
    color: '#A5B4FC',
  },
  enableBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  enableBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Topics
  topicSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  sectionBadge: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  sectionHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 14,
  },
  examGroup: {
    marginBottom: 12,
  },
  examBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  examBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipCheck: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
  },
  chipTextSelected: {
    fontWeight: '600',
  },

  // Apps header
  appsHeader: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  lockedCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  lockedCountText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },

  // App rows
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  appRowFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  appRowLast: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderBottomWidth: 0,
  },
  appRowLocked: {
    backgroundColor: '#FAFAFE',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appInfo: {
    flex: 1,
    marginRight: 10,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  lockedBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.4,
  },
  appPkg: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
