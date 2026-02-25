import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../utils/colors';

export function SignUpScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<any>();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: authError } = await signUp(email.trim().toLowerCase(), password, displayName.trim());
    setLoading(false);
    if (authError) {
      setError(authError);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>📬</Text>
        <Text style={styles.successTitle}>Check your email</Text>
        <Text style={styles.successText}>
          We sent a confirmation link to <Text style={{ fontWeight: '600' }}>{email}</Text>.
          Click it to activate your account.
        </Text>
        <Button
          label="Back to Sign In"
          onPress={() => navigation.navigate('SignIn')}
          variant="ghost"
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your productivity journey</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Name"
            placeholder="Your name"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />
          <Input
            label="Email"
            placeholder="you@university.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Min 8 characters"
            value={password}
            onChangeText={setPassword}
            isPassword
            hint="At least 8 characters"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Create Account"
            onPress={handleSignUp}
            loading={loading}
            style={styles.btn}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  form: {},
  error: { color: colors.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: { marginTop: 8, width: '100%' },
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  successText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
