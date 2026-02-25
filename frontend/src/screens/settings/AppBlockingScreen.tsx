import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Shield, ShieldOff, Smartphone, Clock, AlertCircle } from 'lucide-react-native';
import { ScreenTime } from '../../modules/screenTime';
import { useTheme } from '../../ThemeContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type AuthStatus = 'approved' | 'denied' | 'notDetermined' | 'unsupported' | 'loading';

export function AppBlockingScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [shieldActive, setShieldActive] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [focusIntervalMin, setFocusIntervalMin] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!ScreenTime.isSupported) {
      setAuthStatus('unsupported');
      return;
    }
    ScreenTime.getAuthorizationStatus().then((s) => setAuthStatus(s as AuthStatus));
  }, []);

  const handleRequestAuth = async () => {
    setActionLoading(true);
    try {
      await ScreenTime.requestAuthorization();
      const status = await ScreenTime.getAuthorizationStatus();
      setAuthStatus(status as AuthStatus);
    } catch (e: any) {
      Alert.alert('Permission Denied', e.message);
      setAuthStatus('denied');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectApps = async () => {
    try {
      await ScreenTime.presentAppPicker();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggleShield = async (value: boolean) => {
    setActionLoading(true);
    try {
      await ScreenTime.applyShield(value);
      setShieldActive(value);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMonitoring = async (value: boolean) => {
    setActionLoading(true);
    try {
      if (value) {
        await ScreenTime.startMonitoring({
          intervalMinutes: focusIntervalMin,
          activityName: 'oryn.focus.monitor',
        });
      } else {
        await ScreenTime.stopMonitoring('oryn.focus.monitor');
      }
      setMonitoringActive(value);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const INTERVALS = [15, 30, 45, 60];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.textPrimary }]}>App Blocking</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Block distracting apps during focus sessions using Apple Screen Time
      </Text>

      {/* iOS-only notice */}
      {Platform.OS !== 'ios' && (
        <Card style={[styles.alertCard, { backgroundColor: theme.dangerMuted, borderColor: theme.danger + '44' }]}>
          <AlertCircle color={theme.danger} size={18} strokeWidth={2} />
          <Text style={[styles.alertText, { color: theme.danger }]}>
            App blocking is only available on iOS using Apple's Screen Time API.
          </Text>
        </Card>
      )}

      {/* Auth status */}
      {authStatus === 'loading' && (
        <Text style={[styles.statusText, { color: theme.textMuted }]}>Checking permissions…</Text>
      )}

      {authStatus === 'notDetermined' && (
        <Card style={styles.authCard}>
          <Shield color={theme.primary} size={32} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <Text style={[styles.authTitle, { color: theme.textPrimary }]}>Enable App Blocking</Text>
          <Text style={[styles.authDesc, { color: theme.textSecondary }]}>
            Oryn uses Apple's Family Controls framework to detect when you open distracting apps and
            show a focus reminder overlay — just like Opal.
          </Text>
          <Button
            label="Grant Permission"
            onPress={handleRequestAuth}
            loading={actionLoading}
            size="lg"
            style={{ marginTop: 16, width: '100%' }}
          />
        </Card>
      )}

      {authStatus === 'denied' && (
        <Card style={[styles.authCard, { borderColor: theme.danger + '44' }]}>
          <ShieldOff color={theme.danger} size={32} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <Text style={[styles.authTitle, { color: theme.textPrimary }]}>Permission Denied</Text>
          <Text style={[styles.authDesc, { color: theme.textSecondary }]}>
            Open Settings → Screen Time → {'\n'}Oryn → Allow to enable app blocking.
          </Text>
        </Card>
      )}

      {authStatus === 'approved' && (
        <>
          {/* Select Apps */}
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Blocked Apps</Text>
          <Card style={styles.card}>
            <View style={styles.rowIcon}>
              <Smartphone color={theme.primary} size={20} strokeWidth={2} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Choose Apps to Block</Text>
                <Text style={[styles.rowDesc, { color: theme.textMuted }]}>
                  Pick apps that distract you during study sessions
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleSelectApps}
                style={[styles.editBtn, { borderColor: theme.primary }]}
              >
                <Text style={[styles.editBtnText, { color: theme.primary }]}>Edit</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Shield toggle */}
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Focus Shield</Text>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Shield color={shieldActive ? theme.primary : theme.textMuted} size={20} strokeWidth={2} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Active Shield</Text>
                <Text style={[styles.rowDesc, { color: theme.textMuted }]}>
                  Show a focus reminder when blocked apps are opened
                </Text>
              </View>
              <Switch
                value={shieldActive}
                onValueChange={handleToggleShield}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
                disabled={actionLoading}
              />
            </View>
          </Card>

          {/* Usage monitoring */}
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Usage Monitoring</Text>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Clock color={monitoringActive ? theme.primary : theme.textMuted} size={20} strokeWidth={2} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>Nudge After Threshold</Text>
                <Text style={[styles.rowDesc, { color: theme.textMuted }]}>
                  Trigger a nudge after {focusIntervalMin} min of blocked app usage
                </Text>
              </View>
              <Switch
                value={monitoringActive}
                onValueChange={handleToggleMonitoring}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={theme.surface}
                disabled={actionLoading}
              />
            </View>

            {/* Interval picker */}
            <View style={styles.intervalRow}>
              {INTERVALS.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.intervalChip,
                    { borderColor: theme.border, backgroundColor: theme.surface },
                    focusIntervalMin === min && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setFocusIntervalMin(min)}
                >
                  <Text style={[
                    styles.intervalText, { color: theme.textSecondary },
                    focusIntervalMin === min && { color: theme.textOnPrimary },
                  ]}>
                    {min}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* How it works */}
          <Card style={[styles.howCard, { backgroundColor: theme.primaryMuted }]}>
            <Text style={[styles.howTitle, { color: theme.primary }]}>How it works</Text>
            <Text style={[styles.howText, { color: theme.primary, opacity: 0.85 }]}>
              1. Select apps you want to block during study sessions{'\n'}
              2. Enable Focus Shield — Oryn shows an overlay when you open them{'\n'}
              3. The overlay shows your current assignment, deadline, or goal{'\n'}
              4. You decide: go back, or open anyway (tracked in analytics){'\n\n'}
              Similar to how Opal works, but personalized to your Canvas deadlines.
            </Text>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 20, paddingTop: 60, paddingBottom: 48 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  statusText: { textAlign: 'center', marginVertical: 24 },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, marginBottom: 16 },
  alertText: { flex: 1, fontSize: 13, lineHeight: 18 },
  authCard: { alignItems: 'center', padding: 24, marginBottom: 16 },
  authTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  authDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  card: { marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  intervalRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  intervalChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  intervalText: { fontSize: 13, fontWeight: '600' },
  howCard: { marginTop: 20, padding: 16 },
  howTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  howText: { fontSize: 13, lineHeight: 20 },
});
