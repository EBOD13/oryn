import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { focusSessionsApi } from '../../api/focusSessions';
import { Button } from '../../components/ui/Button';
import { colors } from '../../utils/colors';
import { formatTimer } from '../../utils/formatters';
import { FocusSession, MoodType } from '../../types';

type Phase = 'active' | 'break' | 'reflection' | 'done';

const MOODS: { mood: MoodType; emoji: string; label: string }[] = [
  { mood: 'motivated', emoji: '💪', label: 'Motivated' },
  { mood: 'focused', emoji: '🧠', label: 'Focused' },
  { mood: 'neutral', emoji: '😐', label: 'Neutral' },
  { mood: 'tired', emoji: '😴', label: 'Tired' },
  { mood: 'stressed', emoji: '😰', label: 'Stressed' },
];

export function FocusActiveScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const session: FocusSession = route.params?.session;

  const [phase, setPhase] = useState<Phase>('active');
  const [elapsed, setElapsed] = useState(0); // seconds
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [breaksCount, setBreaksCount] = useState(0);
  const [totalBreakSec, setTotalBreakSec] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reflection state
  const [moodBefore, setMoodBefore] = useState<MoodType | null>(null);
  const [moodAfter, setMoodAfter] = useState<MoodType | null>(null);
  const [whatLearned, setWhatLearned] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [confidence, setConfidence] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      if (phase === 'active') setElapsed((e) => e + 1);
      else if (phase === 'break') setBreakElapsed((b) => b + 1);
    }, 1000);
  }, [phase]);

  useEffect(() => {
    if (phase === 'active' || phase === 'break') startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, startTimer]);

  const targetSec = (session?.target_duration_min ?? 0) * 60;
  const progressRatio = targetSec > 0 ? Math.min(elapsed / targetSec, 1) : 0;

  const handleBreak = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('break');
    setBreakElapsed(0);
  };

  const handleResumeFromBreak = () => {
    setBreaksCount((b) => b + 1);
    setTotalBreakSec((t) => t + breakElapsed);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('active');
  };

  const handleEndSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('reflection');
  };

  const handleAbandon = () => {
    Alert.alert('Abandon Session?', 'Your progress will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: async () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          try {
            await focusSessionsApi.end(session.id);
          } catch {}
          navigation.goBack();
        },
      },
    ]);
  };

  const handleSubmitReflection = async () => {
    setLoading(true);
    try {
      const focusScore = Math.round(
        (elapsed / Math.max(targetSec, elapsed)) * 70 +
        (1 - totalBreakSec / Math.max(elapsed, 1)) * 30
      );
      await focusSessionsApi.end(session.id, Math.min(Math.round(focusScore), 100));
      await focusSessionsApi.addReflection(session.id, {
        what_i_learned: whatLearned || undefined,
        difficulty_rating: difficulty || undefined,
        confidence_rating: confidence || undefined,
        mood_before: moodBefore ?? undefined,
        mood_after: moodAfter ?? undefined,
      });
    } catch {}
    setLoading(false);
    setPhase('done');
  };

  // ── Done screen ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    const earnedPoints = Math.round(elapsed / 60) * 2;
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>Session Complete!</Text>
        <Text style={styles.doneTime}>You focused for {formatTimer(elapsed)}</Text>
        <Text style={styles.donePoints}>+{earnedPoints} Oryn points earned</Text>
        <Button
          label="Back to Home"
          onPress={() => navigation.navigate('Home')}
          style={styles.doneBtn}
          size="lg"
        />
      </View>
    );
  }

  // ── Reflection screen ────────────────────────────────────────────────────
  if (phase === 'reflection') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.reflectionContent}>
        <Text style={styles.reflectionTitle}>How did it go?</Text>
        <Text style={styles.reflectionSub}>
          You studied for <Text style={{ fontWeight: '700' }}>{formatTimer(elapsed)}</Text>
          {breaksCount > 0 ? ` with ${breaksCount} break${breaksCount > 1 ? 's' : ''}` : ''}.
        </Text>

        {/* Mood before */}
        <Text style={styles.reflLabel}>How were you feeling before?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.mood}
              style={[styles.moodChip, moodBefore === m.mood && styles.moodChipActive]}
              onPress={() => setMoodBefore(m.mood)}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, moodBefore === m.mood && styles.moodLabelActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mood after */}
        <Text style={styles.reflLabel}>How do you feel now?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.mood}
              style={[styles.moodChip, moodAfter === m.mood && styles.moodChipActive]}
              onPress={() => setMoodAfter(m.mood)}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, moodAfter === m.mood && styles.moodLabelActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* What I learned */}
        <Text style={styles.reflLabel}>What did you learn or accomplish?</Text>
        <TextInput
          style={styles.reflInput}
          placeholder="e.g. Finished chapter 5, understood recursion..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          value={whatLearned}
          onChangeText={setWhatLearned}
          textAlignVertical="top"
        />

        {/* Difficulty */}
        <Text style={styles.reflLabel}>Difficulty (1-5)</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.ratingBtn, difficulty === n && styles.ratingBtnActive]}
              onPress={() => setDifficulty(n)}
            >
              <Text style={[styles.ratingText, difficulty === n && styles.ratingTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Confidence */}
        <Text style={styles.reflLabel}>Confidence in the material (1-5)</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.ratingBtn, confidence === n && styles.ratingBtnActive]}
              onPress={() => setConfidence(n)}
            >
              <Text style={[styles.ratingText, confidence === n && styles.ratingTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Save & Finish"
          onPress={handleSubmitReflection}
          loading={loading}
          size="lg"
          style={styles.reflBtn}
        />
        <Button
          label="Skip"
          onPress={async () => {
            setLoading(true);
            try { await focusSessionsApi.end(session.id); } catch {}
            setLoading(false);
            setPhase('done');
          }}
          variant="ghost"
          size="md"
          style={styles.skipBtn}
        />
      </ScrollView>
    );
  }

  // ── Break screen ─────────────────────────────────────────────────────────
  if (phase === 'break') {
    return (
      <View style={[styles.root, styles.breakRoot]}>
        <Text style={styles.breakEmoji}>☕</Text>
        <Text style={styles.breakTitle}>Break Time</Text>
        <Text style={styles.breakTimer}>{formatTimer(breakElapsed)}</Text>
        <Text style={styles.breakSub}>Rest your eyes and stretch</Text>
        <Button
          label="Resume Focus"
          onPress={handleResumeFromBreak}
          size="lg"
          style={styles.resumeBtn}
        />
      </View>
    );
  }

  // ── Active session screen ─────────────────────────────────────────────────
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styles.closeBtn} onPress={handleAbandon}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.timerWrapper}>
        {/* Progress ring (SVG-less approximation using View) */}
        <View style={styles.ringOuter}>
          <View style={[styles.ringFill, { opacity: progressRatio }]} />
          <View style={styles.ringInner}>
            <Text style={styles.timerText}>{formatTimer(elapsed)}</Text>
            {targetSec > 0 && (
              <Text style={styles.targetText}>
                / {formatTimer(targetSec)}
              </Text>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.sessionTypeLabel}>
        {SESSION_TYPE_LABELS[session?.session_type] ?? 'Study'} Session
      </Text>

      {breaksCount > 0 && (
        <Text style={styles.breakInfo}>
          {breaksCount} break{breaksCount > 1 ? 's' : ''} taken
        </Text>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleBreak}>
          <Text style={styles.secondaryBtnText}>☕ Break</Text>
        </TouchableOpacity>
        <Button
          label="End Session"
          onPress={handleEndSession}
          size="lg"
          style={styles.endBtn}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  study: '📖 Study',
  exam_prep: '📝 Exam Prep',
  project: '💻 Project',
  reading: '📚 Reading',
  review: '🔍 Review',
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.textPrimary },
  closeBtn: {
    position: 'absolute',
    top: 56,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  closeText: { color: 'rgba(255,255,255,0.5)', fontSize: 20 },

  // Timer
  timerWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ringOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 110,
    backgroundColor: colors.primary,
  },
  ringInner: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: { fontSize: 42, fontWeight: '700', color: colors.textInverse, letterSpacing: -1 },
  targetText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  sessionTypeLabel: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 4 },
  breakInfo: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32 },

  // Controls
  controls: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 48,
    gap: 12,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryBtnText: { color: colors.textInverse, fontWeight: '600', fontSize: 14 },
  endBtn: { flex: 1 },

  // Break
  breakRoot: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  breakEmoji: { fontSize: 64 },
  breakTitle: { fontSize: 26, fontWeight: '800', color: colors.textInverse },
  breakTimer: { fontSize: 32, fontWeight: '700', color: colors.accent },
  breakSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  resumeBtn: { width: 200 },

  // Reflection
  reflectionContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  reflectionTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  reflectionSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
  reflLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  moodChip: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 64,
  },
  moodChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  moodLabelActive: { color: colors.primary },
  reflInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    marginBottom: 20,
  },
  ratingRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  ratingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  ratingBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ratingText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  ratingTextActive: { color: colors.textInverse },
  reflBtn: { width: '100%', marginTop: 8 },
  skipBtn: { width: '100%', marginTop: 10 },

  // Done
  doneContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 },
  doneEmoji: { fontSize: 64, marginBottom: 16 },
  doneTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  doneTime: { fontSize: 16, color: colors.textSecondary, marginBottom: 8 },
  donePoints: { fontSize: 14, color: colors.accent, fontWeight: '600', marginBottom: 32 },
  doneBtn: { width: '100%' },
});
