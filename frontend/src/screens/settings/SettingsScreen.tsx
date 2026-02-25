import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Shield, Link, User, Bell, BarChart2, LogOut } from 'lucide-react-native';
import { usersApi } from '../../api/users';
import { useAuth } from '../../auth/AuthContext';
import { useTheme } from '../../ThemeContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { UserProfile, UserPreferences } from '../../types';

export function SettingsScreen() {
  const { signOut, user } = useAuth();
  const { theme, university } = useTheme();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [breakAllowed, setBreakAllowed] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, pr] = await Promise.all([usersApi.getProfile(), usersApi.getPreferences()]);
      setProfile(p);
      setPrefs(pr);
      setBreakAllowed(pr.focus_break_allowed ?? true);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      const updated = await usersApi.updatePreferences({ focus_break_allowed: breakAllowed });
      setPrefs(updated);
    } catch {}
    setSavingPrefs(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>

      {/* Profile card */}
      <SectionLabel label="Profile" theme={theme} />
      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.textOnPrimary }]}>
            {profile?.display_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: theme.textPrimary }]}>{profile?.display_name ?? '—'}</Text>
          <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{profile?.email ?? user?.email ?? '—'}</Text>
          {profile?.major && (
            <Text style={[styles.profileDetail, { color: theme.textMuted }]}>
              {profile.major}{profile.institution ? ` · ${profile.institution}` : ''}
            </Text>
          )}
        </View>
      </Card>

      {/* School theme */}
      {university && (
        <>
          <SectionLabel label="School Theme" theme={theme} />
          <Card style={[styles.schoolCard, { backgroundColor: university.primaryColor }]}>
            <View style={[styles.schoolSwatch, { backgroundColor: university.secondaryColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.schoolName, { color: university.textOnPrimary }]}>{university.shortName}</Text>
              <Text style={[styles.schoolFull, { color: university.textOnPrimary, opacity: 0.75 }]} numberOfLines={1}>
                {university.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Onboarding')}
              style={[styles.changeBtn, { borderColor: university.textOnPrimary + '44' }]}
            >
              <Text style={[styles.changeBtnText, { color: university.textOnPrimary }]}>Change</Text>
            </TouchableOpacity>
          </Card>
        </>
      )}

      {/* Canvas */}
      <SectionLabel label="Canvas Integration" theme={theme} />
      <Card style={styles.card}>
        <SettingRow
          icon={<Link color={theme.primary} size={18} strokeWidth={2} />}
          label="Connect Canvas"
          desc={university?.canvasDomain ? `${university.canvasDomain}` : 'Not connected'}
          theme={theme}
          onPress={() =>
            navigation.navigate('CanvasConnect', {
              canvasDomain: university?.canvasDomain ?? '',
            })
          }
        />
      </Card>

      {/* Study Preferences */}
      <SectionLabel label="Study Preferences" theme={theme} />
      <Card style={styles.card}>
        {prefs && (
          <>
            <SettingRow
              icon={<Bell color={theme.primary} size={18} strokeWidth={2} />}
              label="Daily Study Goal"
              desc={`${prefs.daily_study_goal_minutes / 60}h / day`}
              theme={theme}
            />
            <View style={styles.divider} />
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>Allow breaks</Text>
              <Switch
                value={breakAllowed}
                onValueChange={setBreakAllowed}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>
            <Button
              label="Save"
              onPress={handleSavePrefs}
              loading={savingPrefs}
              variant="secondary"
              size="sm"
              style={{ marginTop: 10, alignSelf: 'flex-end' }}
            />
          </>
        )}
      </Card>

      {/* App Blocking (iOS only) */}
      {Platform.OS === 'ios' && (
        <>
          <SectionLabel label="App Blocking" theme={theme} />
          <Card style={styles.card}>
            <SettingRow
              icon={<Shield color={theme.primary} size={18} strokeWidth={2} />}
              label="Block Distracting Apps"
              desc="Powered by Apple Screen Time"
              theme={theme}
              onPress={() => navigation.navigate('AppBlocking')}
              chevron
            />
          </Card>
        </>
      )}

      {/* About */}
      <SectionLabel label="About" theme={theme} />
      <Card style={styles.card}>
        <SettingRow icon={<BarChart2 color={theme.textMuted} size={18} strokeWidth={2} />} label="Version" desc="0.1.0 — Hackathon Build" theme={theme} />
      </Card>

      {/* Sign out */}
      <TouchableOpacity style={[styles.signOutBtn, { borderColor: theme.border }]} onPress={handleSignOut}>
        <LogOut color={theme.danger} size={18} strokeWidth={2} />
        <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionLabel({ label, theme }: { label: string; theme: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
  );
}

function SettingRow({
  icon, label, desc, theme, onPress, chevron,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  theme: any;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const content = (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{label}</Text>
        {desc && <Text style={[styles.settingDesc, { color: theme.textMuted }]}>{desc}</Text>}
      </View>
      {chevron && <ChevronRight color={theme.textMuted} size={16} strokeWidth={2} />}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 20, paddingTop: 60, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  card: { marginBottom: 4 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileDetail: { fontSize: 12, marginTop: 2 },
  schoolCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginBottom: 4 },
  schoolSwatch: { width: 24, height: 24, borderRadius: 12 },
  schoolName: { fontSize: 16, fontWeight: '800' },
  schoolFull: { fontSize: 12, marginTop: 2 },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  changeBtnText: { fontSize: 13, fontWeight: '600' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  settingIcon: { width: 32, alignItems: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0EFF8', marginVertical: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  switchLabel: { fontSize: 15, fontWeight: '500' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 32, padding: 16, borderRadius: 12, borderWidth: 1.5,
  },
  signOutText: { fontSize: 15, fontWeight: '600' },
});
