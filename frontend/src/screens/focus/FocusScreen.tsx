import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { focusSessionsApi } from '../../api/focusSessions';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../utils/colors';
import { SessionType } from '../../types';

const SESSION_TYPES: { type: SessionType; emoji: string; label: string; desc: string }[] = [
  { type: 'study', emoji: '📖', label: 'Study', desc: 'General studying & reading' },
  { type: 'exam_prep', emoji: '📝', label: 'Exam Prep', desc: 'Focused exam preparation' },
  { type: 'project', emoji: '💻', label: 'Project', desc: 'Working on a project or assignment' },
  { type: 'review', emoji: '🔍', label: 'Review', desc: 'Reviewing past material' },
];

const DURATIONS = [
  { label: '25 min', value: 25 },
  { label: '50 min', value: 50 },
  { label: '90 min', value: 90 },
  { label: 'Open', value: 0 },
];

export function FocusScreen() {
  const navigation = useNavigation<any>();
  const [sessionType, setSessionType] = useState<SessionType>('study');
  const [duration, setDuration] = useState(50);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const session = await focusSessionsApi.start({
        session_type: sessionType,
        target_duration_min: duration > 0 ? duration : undefined,
      });
      navigation.navigate('FocusActive', { session });
    } catch (e) {
      // Show error - for now just navigate anyway (offline mode)
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Focus Mode</Text>
      <Text style={styles.subtitle}>Choose what you're working on and let's get started</Text>

      {/* Session type */}
      <Text style={styles.sectionLabel}>What are you working on?</Text>
      <View style={styles.typeGrid}>
        {SESSION_TYPES.map((t) => (
          <TouchableOpacity
            key={t.type}
            style={[styles.typeCard, sessionType === t.type && styles.typeCardActive]}
            onPress={() => setSessionType(t.type)}
          >
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text style={[styles.typeLabel, sessionType === t.type && styles.typeLabelActive]}>
              {t.label}
            </Text>
            <Text style={[styles.typeDesc, sessionType === t.type && styles.typeDescActive]}>
              {t.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duration */}
      <Text style={styles.sectionLabel}>Session length</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.durationChip, duration === d.value && styles.durationChipActive]}
            onPress={() => setDuration(d.value)}
          >
            <Text style={[styles.durationText, duration === d.value && styles.durationTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card variant="muted" style={styles.tipCard}>
        <Text style={styles.tipText}>
          💡 Tip: The{' '}
          <Text style={{ fontWeight: '700' }}>Pomodoro technique</Text> (25 min focus + 5 min break)
          improves concentration and reduces mental fatigue.
        </Text>
      </Card>

      <Button
        label="Start Session 🎯"
        onPress={handleStart}
        loading={loading}
        size="lg"
        style={styles.startBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4, marginBottom: 28, lineHeight: 22 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  typeCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  typeEmoji: { fontSize: 26, marginBottom: 8 },
  typeLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  typeLabelActive: { color: colors.primary },
  typeDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  typeDescActive: { color: colors.primary },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  durationChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  durationTextActive: { color: colors.textInverse },
  tipCard: { marginBottom: 28 },
  tipText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  startBtn: { width: '100%' },
});
