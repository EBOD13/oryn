import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { goalsApi } from '../../api/goals';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../utils/colors';
import { GoalCategory, GoalType, GoalRecurrence } from '../../types';

const CATEGORIES: { value: GoalCategory; emoji: string; label: string }[] = [
  { value: 'academic', emoji: '📚', label: 'Academic' },
  { value: 'fitness', emoji: '💪', label: 'Fitness' },
  { value: 'personal', emoji: '🌱', label: 'Personal' },
  { value: 'career', emoji: '💼', label: 'Career' },
  { value: 'financial', emoji: '💰', label: 'Financial' },
];

const GOAL_TYPES: { value: GoalType; emoji: string; label: string; desc: string }[] = [
  { value: 'habit', emoji: '🔁', label: 'Habit', desc: 'Do it every day / week' },
  { value: 'milestone', emoji: '🏁', label: 'Milestone', desc: 'Reach a specific achievement' },
  { value: 'metric', emoji: '📊', label: 'Metric', desc: 'Track a measurable value' },
];

const RECURRENCES: { value: GoalRecurrence; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function AddGoalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onGoalAdded = route.params?.onGoalAdded;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('academic');
  const [goalType, setGoalType] = useState<GoalType>('habit');
  const [recurrence, setRecurrence] = useState<GoalRecurrence>('daily');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a goal title.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await goalsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        goal_type: goalType,
        recurrence,
        target_value: targetValue ? parseFloat(targetValue) : undefined,
        target_unit: targetUnit.trim() || undefined,
      });
      onGoalAdded?.();
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create goal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Handle */}
        <View style={styles.handle} />
        <Text style={styles.title}>New Goal</Text>

        <Input
          label="Goal Title"
          placeholder="e.g. Study 2 hours daily"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Description (optional)"
          placeholder="What does success look like?"
          value={description}
          onChangeText={setDescription}
        />

        {/* Category */}
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, category === c.value && styles.chipActive]}
              onPress={() => setCategory(c.value)}
            >
              <Text style={styles.chipEmoji}>{c.emoji}</Text>
              <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type */}
        <Text style={styles.sectionLabel}>Goal Type</Text>
        <View style={styles.typeGrid}>
          {GOAL_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeCard, goalType === t.value && styles.typeCardActive]}
              onPress={() => setGoalType(t.value)}
            >
              <Text style={styles.typeEmoji}>{t.emoji}</Text>
              <Text style={[styles.typeLabel, goalType === t.value && styles.typeLabelActive]}>
                {t.label}
              </Text>
              <Text style={styles.typeDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recurrence */}
        <Text style={styles.sectionLabel}>Recurrence</Text>
        <View style={styles.chipRow}>
          {RECURRENCES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.chip, recurrence === r.value && styles.chipActive]}
              onPress={() => setRecurrence(r.value)}
            >
              <Text style={[styles.chipText, recurrence === r.value && styles.chipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target (for metric goals) */}
        {goalType === 'metric' && (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Target Value"
                placeholder="e.g. 10000"
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Unit"
                placeholder="steps, pages, min…"
                value={targetUnit}
                onChangeText={setTargetUnit}
              />
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Create Goal"
          onPress={handleCreate}
          loading={loading}
          size="lg"
          style={styles.createBtn}
        />
        <Button
          label="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="md"
          style={styles.cancelBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  typeGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  typeEmoji: { fontSize: 20, marginBottom: 6 },
  typeLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  typeLabelActive: { color: colors.primary },
  typeDesc: { fontSize: 11, color: colors.textMuted, lineHeight: 14 },
  row: { flexDirection: 'row', gap: 12 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  createBtn: { width: '100%', marginBottom: 10 },
  cancelBtn: { width: '100%' },
});
