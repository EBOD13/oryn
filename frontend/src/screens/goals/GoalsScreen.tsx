import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { goalsApi } from '../../api/goals';
import { Goal, GoalCategory } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../utils/colors';

const CATEGORY_ICONS: Record<GoalCategory, string> = {
  academic: '📚',
  fitness: '💪',
  personal: '🌱',
  career: '💼',
  financial: '💰',
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  academic: colors.primary,
  fitness: '#10B981',
  personal: '#8B5CF6',
  career: '#F59E0B',
  financial: '#06B6D4',
};

const CATEGORIES: GoalCategory[] = ['academic', 'fitness', 'personal', 'career', 'financial'];

export function GoalsScreen() {
  const navigation = useNavigation<any>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<GoalCategory | 'all'>('all');

  const loadGoals = useCallback(async () => {
    try {
      const data = await goalsApi.list();
      setGoals(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const handleLog = async (goal: Goal) => {
    try {
      await goalsApi.log({ goal_id: goal.id, value: 1 });
      loadGoals();
    } catch {}
  };

  const filtered = filter === 'all' ? goals : goals.filter((g) => g.category === filter);
  const activeGoals = filtered.filter((g) => g.is_active);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadGoals(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Goals</Text>
            <Text style={styles.subtitle}>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddGoal', { onGoalAdded: loadGoals })}
          >
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Streak summary */}
        {goals.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.streakScroll}>
            {goals.filter((g) => g.current_streak > 0).slice(0, 5).map((g) => (
              <View key={g.id} style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>{CATEGORY_ICONS[g.category]}</Text>
                <Text style={styles.streakCount}>🔥 {g.current_streak}</Text>
                <Text style={styles.streakTitle} numberOfLines={1}>{g.title}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.filterChip, filter === c && styles.filterChipActive]}
              onPress={() => setFilter(c)}
            >
              <Text style={styles.filterEmoji}>{CATEGORY_ICONS[c]}</Text>
              <Text style={[styles.filterText, filter === c && styles.filterTextActive]}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Goals list */}
        {activeGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>Set a goal to start tracking your progress</Text>
            <Button
              label="Add Your First Goal"
              onPress={() => navigation.navigate('AddGoal', { onGoalAdded: loadGoals })}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onLog={() => handleLog(goal)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function GoalCard({ goal, onLog }: { goal: Goal; onLog: () => void }) {
  const color = CATEGORY_COLORS[goal.category];

  return (
    <Card style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={[styles.categoryDot, { backgroundColor: color }]}>
          <Text style={styles.categoryEmoji}>{CATEGORY_ICONS[goal.category]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          {goal.description && (
            <Text style={styles.goalDesc} numberOfLines={1}>{goal.description}</Text>
          )}
        </View>
        {goal.current_streak > 0 && (
          <View style={styles.streakPill}>
            <Text style={styles.streakPillText}>🔥 {goal.current_streak}</Text>
          </View>
        )}
      </View>

      <View style={styles.goalMeta}>
        <Text style={styles.goalMetaText}>
          {goal.recurrence.charAt(0).toUpperCase() + goal.recurrence.slice(1)}
          {goal.target_value ? ` · ${goal.target_value} ${goal.target_unit ?? ''}` : ''}
        </Text>
        <Text style={styles.goalType}>{goal.goal_type}</Text>
      </View>

      {goal.goal_type === 'habit' && (
        <TouchableOpacity style={styles.logBtn} onPress={onLog}>
          <Text style={styles.logBtnText}>✓ Mark Done</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addBtnText: { color: colors.textInverse, fontWeight: '600', fontSize: 14 },

  // Streaks
  streakScroll: { marginBottom: 16 },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  streakEmoji: { fontSize: 20 },
  streakCount: { fontSize: 13, fontWeight: '700', color: '#92400E', marginTop: 2 },
  streakTitle: { fontSize: 11, color: '#92400E', marginTop: 2, maxWidth: 80, textAlign: 'center' },

  // Filters
  filterScroll: { marginBottom: 20 },
  filterRow: { gap: 8, paddingRight: 20 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterEmoji: { fontSize: 14 },
  filterText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  filterTextActive: { color: colors.textInverse },

  // Goal card
  goalCard: { marginBottom: 12 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  categoryDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  categoryEmoji: { fontSize: 18 },
  goalTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  goalDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  streakPill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  streakPillText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  goalMetaText: { fontSize: 12, color: colors.textMuted },
  goalType: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  logBtn: {
    backgroundColor: colors.successMuted,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  logBtnText: { color: colors.success, fontWeight: '600', fontSize: 13 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
