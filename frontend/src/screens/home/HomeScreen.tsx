import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usersApi } from '../../api/users';
import { canvasApi } from '../../api/canvas';
import { gamificationApi } from '../../api/gamification';
import { focusSessionsApi } from '../../api/focusSessions';
import { UserProfile, CanvasAssignment, UserStats, FocusSession } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../utils/colors';
import { greetingByTime, formatRelativeDate, formatDuration } from '../../utils/formatters';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [upcoming, setUpcoming] = useState<CanvasAssignment[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [prof, userStats, assignments, session] = await Promise.allSettled([
        usersApi.getProfile(),
        gamificationApi.getStats(),
        canvasApi.getUpcomingAssignments(14),
        focusSessionsApi.getActive(),
      ]);

      if (prof.status === 'fulfilled') setProfile(prof.value);
      if (userStats.status === 'fulfilled') setStats(userStats.value);
      if (assignments.status === 'fulfilled') setUpcoming(assignments.value);
      if (session.status === 'fulfilled') setActiveSession(session.value);

      // Redirect to onboarding if not completed
      if (prof.status === 'fulfilled' && !prof.value.onboarding_completed) {
        navigation.navigate('Onboarding');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const dailyGoalMin = 180; // from prefs
  const todayMin = stats?.total_focus_minutes ?? 0; // ideally today's only; using total for now
  const dailyProgress = Math.min(todayMin / dailyGoalMin, 1);

  const urgentAssignments = upcoming
    .filter((a) => !a.is_submitted && a.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 5);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greetingByTime()},</Text>
          <Text style={styles.name}>{profile?.display_name?.split(' ')[0] ?? 'there'} 👋</Text>
        </View>
        {stats && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{stats.current_daily_streak}</Text>
          </View>
        )}
      </View>

      {/* Active Session Banner */}
      {activeSession && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() => navigation.navigate('Focus', { screen: 'FocusActive', params: { session: activeSession } })}
        >
          <Text style={styles.activeBannerIcon}>⏱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBannerTitle}>Session in progress</Text>
            <Text style={styles.activeBannerSub}>Tap to return to your focus session</Text>
          </View>
          <Text style={styles.activeBannerArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Oryn Call — Daily Progress */}
      <Card style={styles.orynCallCard} variant="elevated">
        <View style={styles.orynCallHeader}>
          <Text style={styles.orynCallTitle}>Oryn Call</Text>
          <Text style={styles.orynCallPoints}>⭐ {stats?.oryn_points ?? 0} pts</Text>
        </View>
        <Text style={styles.orynCallSub}>Daily study goal</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${dailyProgress * 100}%` }]} />
        </View>
        <View style={styles.orynCallFooter}>
          <Text style={styles.orynCallTime}>{formatDuration(todayMin)} studied</Text>
          <Text style={styles.orynCallGoal}>Goal: {formatDuration(dailyGoalMin)}</Text>
        </View>
        {dailyProgress >= 1 && (
          <View style={styles.goalMetBadge}>
            <Text style={styles.goalMetText}>🎉 Daily goal reached!</Text>
          </View>
        )}
      </Card>

      {/* Quick Start */}
      {!activeSession && (
        <View style={styles.quickStart}>
          <Button
            label="▶  Start Focus Session"
            onPress={() => navigation.navigate('Focus')}
            size="lg"
            style={styles.startBtn}
          />
        </View>
      )}

      {/* Upcoming Deadlines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
        {urgentAssignments.length === 0 ? (
          <Card variant="muted" style={styles.emptyCard}>
            <Text style={styles.emptyText}>🎊 No upcoming assignments! You're all caught up.</Text>
          </Card>
        ) : (
          urgentAssignments.map((a) => (
            <AssignmentRow key={a.id} assignment={a} />
          ))
        )}
        {upcoming.length === 0 && (
          <Text style={styles.canvasHint}>Connect Canvas in Settings to see your assignments.</Text>
        )}
      </View>

      {/* Stats Row */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <StatTile emoji="📚" value={stats.total_sessions.toString()} label="Sessions" />
            <StatTile emoji="⏰" value={formatDuration(stats.total_focus_minutes)} label="Focus time" />
            <StatTile emoji="🏆" value={`Lv ${stats.level}`} label="Level" />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function AssignmentRow({ assignment }: { assignment: CanvasAssignment }) {
  const dueLabel = assignment.due_at ? formatRelativeDate(assignment.due_at) : 'No due date';
  const isUrgent = assignment.due_at
    ? new Date(assignment.due_at).getTime() - Date.now() < 48 * 60 * 60 * 1000
    : false;

  return (
    <Card style={styles.assignmentCard}>
      <View style={styles.assignmentRow}>
        <View style={[styles.urgentDot, isUrgent && styles.urgentDotRed]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.assignmentTitle} numberOfLines={1}>{assignment.title}</Text>
          <Text style={[styles.dueLabel, isUrgent && styles.dueLabelUrgent]}>{dueLabel}</Text>
        </View>
        {assignment.points_possible && (
          <Text style={styles.points}>{assignment.points_possible}pts</Text>
        )}
      </View>
    </Card>
  );
}

function StatTile({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <Card style={styles.statTile} variant="muted">
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingTop: 60, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  name: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  streakEmoji: { fontSize: 16 },
  streakCount: { fontSize: 16, fontWeight: '700', color: '#92400E' },

  // Active session banner
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  activeBannerIcon: { fontSize: 22 },
  activeBannerTitle: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },
  activeBannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  activeBannerArrow: { color: colors.textInverse, fontSize: 22, fontWeight: '300' },

  // Oryn Call card
  orynCallCard: { marginBottom: 16 },
  orynCallHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orynCallTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  orynCallPoints: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  orynCallSub: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    minWidth: 4,
  },
  orynCallFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  orynCallTime: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  orynCallGoal: { fontSize: 12, color: colors.textMuted },
  goalMetBadge: {
    backgroundColor: colors.successMuted,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  goalMetText: { color: colors.success, fontWeight: '600', fontSize: 13 },

  // Quick start
  quickStart: { marginBottom: 24 },
  startBtn: { width: '100%' },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },

  // Assignments
  assignmentCard: { marginBottom: 8, padding: 12 },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  urgentDotRed: { backgroundColor: colors.danger },
  assignmentTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  dueLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  dueLabelUrgent: { color: colors.danger },
  points: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // Empty states
  emptyCard: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  canvasHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
