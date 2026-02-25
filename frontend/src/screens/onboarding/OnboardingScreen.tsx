import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usersApi } from '../../api/users';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../ThemeContext';
import { UNIVERSITIES, University } from '../../utils/schools';
import { AppTheme } from '../../utils/theme';

const YEARS = [
  { label: 'Freshman', value: 1 },
  { label: 'Sophomore', value: 2 },
  { label: 'Junior', value: 3 },
  { label: 'Senior', value: 4 },
  { label: '5th Year', value: 5 },
  { label: 'Graduate', value: 6 },
];

const STUDY_HOURS = [
  { label: '1–2 hrs', value: 120 },
  { label: '3 hrs', value: 180 },
  { label: '4 hrs', value: 240 },
  { label: '5+ hrs', value: 300 },
];

const EXAM_LEAD = [
  { label: '3 days', value: 3 },
  { label: '1 week', value: 7 },
  { label: '2 weeks', value: 14 },
];

const SHIELD_STYLES = [
  { label: '💪 Motivational', value: 'motivational', desc: '"You\'re almost there!"' },
  { label: '📊 Factual', value: 'factual', desc: '"You have 3 hours until this is due."' },
  { label: '🚨 Urgent', value: 'urgent', desc: '"Stop scrolling. Open your notes."' },
];

type Step = 'school' | 'profile' | 'preferences' | 'canvas';

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { theme, setUniversity, university } = useTheme();
  const [step, setStep] = useState<Step>('school');
  const [loading, setLoading] = useState(false);

  // School search
  const [search, setSearch] = useState('');

  // Profile
  const [major, setMajor] = useState('');
  const [year, setYear] = useState<number | null>(null);

  // Preferences
  const [dailyStudyMin, setDailyStudyMin] = useState(180);
  const [examLead, setExamLead] = useState(14);
  const [shieldStyle, setShieldStyle] = useState('motivational');

  const filteredSchools = search.trim()
    ? UNIVERSITIES.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.shortName.toLowerCase().includes(search.toLowerCase()),
      )
    : UNIVERSITIES.slice(0, 20);

  const handleSelectSchool = async (uni: University) => {
    await setUniversity(uni);
    setSearch('');
    setStep('profile');
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await usersApi.updateProfile({
        major: major || undefined,
        institution: university?.name,
        college_year: year ?? undefined,
      });
      await usersApi.updatePreferences({
        daily_study_goal_minutes: dailyStudyMin,
        exam_prep_lead_days: examLead,
        shield_message_style: shieldStyle as any,
      });
      await usersApi.completeOnboarding();
    } catch {}
    setLoading(false);
    navigation.replace('Main');
  };

  // ── Step 1: School Picker ──────────────────────────────────────────────────
  if (step === 'school') {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.topBarTitle, { color: theme.textOnPrimary }]}>Welcome to Oryn</Text>
          <Text style={[styles.topBarSub, { color: theme.textOnPrimary, opacity: 0.8 }]}>
            Find your school to personalize your experience
          </Text>
          {university && (
            <View style={[styles.previewPill, { backgroundColor: theme.textOnPrimary + '22' }]}>
              <Text style={{ color: theme.textOnPrimary, fontWeight: '700', fontSize: 13 }}>
                {university.shortName} — theme applied ✓
              </Text>
            </View>
          )}
        </View>

        <TextInput
          style={[styles.searchInput, { borderColor: theme.border, color: theme.textPrimary }]}
          placeholder="Search your university…"
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />

        <ScrollView contentContainerStyle={styles.schoolList}>
          {filteredSchools.map((uni) => (
            <SchoolRow
              key={uni.id}
              uni={uni}
              selected={university?.id === uni.id}
              theme={theme}
              onPress={() => handleSelectSchool(uni)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Step 2: Profile ────────────────────────────────────────────────────────
  if (step === 'profile') {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <StepHeader
          theme={theme}
          step={2}
          total={4}
          title="About You"
          sub="Tell us a bit about yourself"
          onBack={() => setStep('school')}
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <SchoolBadge theme={theme} university={university} />
          <Input label="Major" placeholder="e.g. Computer Science" value={major} onChangeText={setMajor} />
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Year in school</Text>
          <View style={styles.chipRow}>
            {YEARS.map((y) => (
              <TouchableOpacity
                key={y.value}
                style={[
                  styles.chip,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                  year === y.value && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setYear(y.value)}
              >
                <Text style={[styles.chipText, { color: theme.textSecondary }, year === y.value && { color: theme.textOnPrimary }]}>
                  {y.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <StepFooter theme={theme} onNext={() => setStep('preferences')} nextLabel="Next →" />
      </View>
    );
  }

  // ── Step 3: Study Preferences ──────────────────────────────────────────────
  if (step === 'preferences') {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <StepHeader
          theme={theme}
          step={3}
          total={4}
          title="Study Preferences"
          sub="Customize how Oryn coaches you"
          onBack={() => setStep('profile')}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Daily study goal</Text>
          <View style={styles.chipRow}>
            {STUDY_HOURS.map((h) => (
              <TouchableOpacity
                key={h.value}
                style={[
                  styles.chipLarge,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                  dailyStudyMin === h.value && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setDailyStudyMin(h.value)}
              >
                <Text style={[styles.chipText, { color: theme.textSecondary }, dailyStudyMin === h.value && { color: theme.textOnPrimary }]}>
                  {h.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Start exam prep before</Text>
          <View style={styles.chipRow}>
            {EXAM_LEAD.map((e) => (
              <TouchableOpacity
                key={e.value}
                style={[
                  styles.chip,
                  { borderColor: theme.border, backgroundColor: theme.surface },
                  examLead === e.value && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setExamLead(e.value)}
              >
                <Text style={[styles.chipText, { color: theme.textSecondary }, examLead === e.value && { color: theme.textOnPrimary }]}>
                  {e.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Shield notification style</Text>
          {SHIELD_STYLES.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.shieldCard,
                { borderColor: theme.border, backgroundColor: theme.surface },
                shieldStyle === s.value && { borderColor: theme.primary, backgroundColor: theme.primaryMuted },
              ]}
              onPress={() => setShieldStyle(s.value)}
            >
              <Text style={[styles.shieldLabel, { color: theme.textPrimary }, shieldStyle === s.value && { color: theme.primary }]}>
                {s.label}
              </Text>
              <Text style={[styles.shieldDesc, { color: theme.textMuted }]}>{s.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <StepFooter theme={theme} onNext={() => setStep('canvas')} nextLabel="Next →" />
      </View>
    );
  }

  // ── Step 4: Connect Canvas ─────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StepHeader
        theme={theme}
        step={4}
        total={4}
        title="Connect Canvas"
        sub="Import your assignments automatically"
        onBack={() => setStep('preferences')}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <SchoolBadge theme={theme} university={university} />

        <View style={[styles.connectCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={styles.connectEmoji}>🎓</Text>
          <Text style={[styles.connectTitle, { color: theme.textPrimary }]}>
            {university?.name ?? 'Your University'} Canvas
          </Text>
          <Text style={[styles.connectDesc, { color: theme.textSecondary }]}>
            We'll open your school's Canvas login. Sign in with your university credentials and
            Oryn will securely capture a read-only access token.
          </Text>
          <Button
            label="Open Canvas Login"
            onPress={() =>
              navigation.navigate('CanvasConnect', {
                canvasDomain: university?.canvasDomain ?? '',
                onSuccess: handleFinish,
              })
            }
            size="lg"
            style={{ marginTop: 16, width: '100%' }}
            disabled={!university?.canvasDomain}
          />
          {!university?.canvasDomain && (
            <Text style={[styles.noCanvasHint, { color: theme.textMuted }]}>
              Enter your Canvas domain in Settings after signup.
            </Text>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.primaryMuted }]}>
          <Text style={[styles.infoText, { color: theme.primary }]}>
            🔒 Your login credentials are never stored by Oryn. We only save a read-only token
            to sync assignments and grades.
          </Text>
        </View>
      </ScrollView>
      <StepFooter
        theme={theme}
        onNext={handleFinish}
        nextLabel="Skip for now"
        loading={loading}
        nextVariant="ghost"
      />
    </View>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SchoolRow({
  uni, selected, theme, onPress,
}: { uni: University; selected: boolean; theme: AppTheme; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[
        styles.schoolRow,
        { borderColor: theme.border, backgroundColor: selected ? theme.primaryMuted : theme.surface },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.schoolSwatch, { backgroundColor: uni.primaryColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.schoolName, { color: theme.textPrimary }]}>{uni.name}</Text>
        <Text style={[styles.schoolShort, { color: theme.textMuted }]}>{uni.shortName}</Text>
      </View>
      {selected && <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '700' }}>✓</Text>}
    </TouchableOpacity>
  );
}

function SchoolBadge({ theme, university }: { theme: AppTheme; university: University | null }) {
  if (!university) return null;
  return (
    <View style={[styles.schoolBadge, { backgroundColor: university.primaryColor }]}>
      <View style={[styles.schoolSwatchDot, { backgroundColor: university.secondaryColor }]} />
      <View>
        <Text style={[styles.schoolBadgeName, { color: university.textOnPrimary }]}>{university.shortName}</Text>
        <Text style={[styles.schoolBadgeFull, { color: university.textOnPrimary, opacity: 0.75 }]} numberOfLines={1}>
          {university.name}
        </Text>
      </View>
    </View>
  );
}

function StepHeader({
  theme, step, total, title, sub, onBack,
}: { theme: AppTheme; step: number; total: number; title: string; sub: string; onBack: () => void }) {
  return (
    <View style={[styles.stepHeader, { backgroundColor: theme.primary }]}>
      <TouchableOpacity onPress={onBack} style={styles.backTouchable}>
        <Text style={[styles.backArrow, { color: theme.textOnPrimary }]}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.stepDots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i + 1 <= step ? theme.textOnPrimary : theme.textOnPrimary + '44',
                width: i + 1 === step ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.stepTitle, { color: theme.textOnPrimary }]}>{title}</Text>
      <Text style={[styles.stepSub, { color: theme.textOnPrimary, opacity: 0.75 }]}>{sub}</Text>
    </View>
  );
}

function StepFooter({
  theme, onNext, nextLabel, loading, nextVariant = 'primary',
}: {
  theme: AppTheme;
  onNext: () => void;
  nextLabel: string;
  loading?: boolean;
  nextVariant?: 'primary' | 'ghost';
}) {
  return (
    <View style={[styles.stepFooter, { borderTopColor: theme.borderLight, backgroundColor: theme.background }]}>
      <Button label={nextLabel} onPress={onNext} size="lg" loading={loading} variant={nextVariant} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { padding: 24, paddingTop: 60, paddingBottom: 24 },
  topBarTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  topBarSub: { fontSize: 14, lineHeight: 20 },
  previewPill: { marginTop: 12, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  searchInput: {
    margin: 16, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, backgroundColor: '#fff',
  },
  schoolList: { paddingHorizontal: 16, paddingBottom: 40 },
  schoolRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  schoolSwatch: { width: 10, height: 36, borderRadius: 5 },
  schoolName: { fontSize: 14, fontWeight: '600' },
  schoolShort: { fontSize: 12, marginTop: 2 },
  stepHeader: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 20 },
  backTouchable: { marginBottom: 12 },
  backArrow: { fontSize: 14, fontWeight: '600' },
  stepDots: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  dot: { height: 6, borderRadius: 3 },
  stepTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  stepSub: { fontSize: 14 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5 },
  chipLarge: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  shieldCard: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 10 },
  shieldLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  shieldDesc: { fontSize: 12 },
  schoolBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 14, marginBottom: 20 },
  schoolSwatchDot: { width: 28, height: 28, borderRadius: 14 },
  schoolBadgeName: { fontSize: 16, fontWeight: '800' },
  schoolBadgeFull: { fontSize: 12, marginTop: 2 },
  connectCard: { borderWidth: 1.5, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  connectEmoji: { fontSize: 44, marginBottom: 8 },
  connectTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  connectDesc: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  noCanvasHint: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  infoCard: { borderRadius: 12, padding: 14 },
  infoText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
  stepFooter: { flexDirection: 'row', padding: 20, paddingBottom: 40, borderTopWidth: 1 },
});
