import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { canvasApi } from '../../api/canvas';
import { useTheme } from '../../ThemeContext';

/**
 * Canvas OAuth-style token extraction via WebView.
 *
 * Flow:
 * 1. Open the school's Canvas login page in a WebView
 * 2. User logs in with university credentials (never seen/stored by us)
 * 3. On successful login, we navigate to /profile/settings
 * 4. Inject JS that calls Canvas's internal token API using the active browser session
 * 5. Token is posted back to RN via postMessage → stored on backend
 */

// JS injected after the settings page loads
const EXTRACT_TOKEN_JS = `
(function() {
  if (!window.location.pathname.includes('/profile/settings')) return;

  function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  }

  var csrf = decodeURIComponent(getCookie('_csrf_token') || '');

  fetch('/api/v1/users/self/tokens', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      'Accept': 'application/json',
    },
    body: JSON.stringify({ token: { purpose: 'Oryn', expires_at: '' } })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d && d.token && d.token.token) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CANVAS_TOKEN',
        token: d.token.token,
        userId: d.token.user_id,
      }));
    } else {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CANVAS_ERROR',
        message: 'Token not found in response',
      }));
    }
  })
  .catch(function(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CANVAS_ERROR',
      message: e.message || 'Network error',
    }));
  });
})();
true; // required for iOS WKWebView
`;

// Detect when the user has successfully logged in
function isLoggedIn(url: string): boolean {
  return (
    url.includes('/dashboard') ||
    url.includes('/?login_success') ||
    url.includes('/courses') ||
    (url.includes('/profile') && !url.includes('/login'))
  );
}

export function CanvasConnectScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { canvasDomain, onSuccess } = route.params as {
    canvasDomain: string;
    onSuccess?: () => void;
  };

  const webviewRef = useRef<WebView>(null);
  const [phase, setPhase] = useState<'login' | 'extracting' | 'success' | 'error'>('login');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigatedToSettings = useRef(false);

  const loginUrl = canvasDomain
    ? `https://${canvasDomain}/login`
    : '';

  const handleNavigationChange = (navState: WebViewNavigation) => {
    const url = navState.url;

    // Once the user is logged in, redirect to profile/settings to extract token
    if (isLoggedIn(url) && !navigatedToSettings.current) {
      navigatedToSettings.current = true;
      setPhase('extracting');
      webviewRef.current?.injectJavaScript(
        `window.location.href = 'https://${canvasDomain}/profile/settings'; true;`,
      );
    }

    // After arriving at settings, run the extraction script
    if (url.includes('/profile/settings') && phase === 'extracting') {
      webviewRef.current?.injectJavaScript(EXTRACT_TOKEN_JS);
    }
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CANVAS_TOKEN' && data.token) {
        setPhase('success');
        // Send token to our backend
        try {
          await canvasApi.sync(data.token, canvasDomain);
        } catch {}
        setTimeout(() => {
          onSuccess ? onSuccess() : navigation.goBack();
        }, 1500);
      } else if (data.type === 'CANVAS_ERROR') {
        setErrorMsg(data.message ?? 'Unknown error');
        setPhase('error');
      }
    } catch {}
  };

  if (!canvasDomain) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>No Canvas Domain</Text>
        <Text style={[styles.errorDesc, { color: theme.textSecondary }]}>
          Please select your school first so we know which Canvas instance to connect to.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.retryBtn, { backgroundColor: theme.primary }]}>
          <Text style={{ color: theme.textOnPrimary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={[styles.successTitle, { color: theme.textPrimary }]}>Canvas Connected!</Text>
        <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
          Your assignments and courses are being imported.
        </Text>
        <ActivityIndicator color={theme.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.errorEmoji}>❌</Text>
        <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Connection Failed</Text>
        <Text style={[styles.errorDesc, { color: theme.textSecondary }]}>{errorMsg}</Text>
        <TouchableOpacity
          onPress={() => {
            setPhase('login');
            navigatedToSettings.current = false;
          }}
          style={[styles.retryBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={{ color: theme.textOnPrimary, fontWeight: '700' }}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: theme.textOnPrimary }]}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textOnPrimary }]}>
          {phase === 'extracting' ? 'Connecting Canvas…' : 'Sign in to Canvas'}
        </Text>
        <Text style={[styles.headerSub, { color: theme.textOnPrimary, opacity: 0.75 }]}>
          {phase === 'extracting'
            ? 'Securely retrieving your access token…'
            : `Log in with your ${canvasDomain} credentials`}
        </Text>
      </View>

      {/* Loading bar */}
      {(loadingUrl || phase === 'extracting') && (
        <View style={[styles.loadingBar, { backgroundColor: theme.primaryMuted }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {phase === 'extracting' ? 'Extracting token…' : 'Loading…'}
          </Text>
        </View>
      )}

      <WebView
        ref={webviewRef}
        source={{ uri: loginUrl }}
        onNavigationStateChange={handleNavigationChange}
        onMessage={handleMessage}
        onLoadStart={() => setLoadingUrl(true)}
        onLoadEnd={() => setLoadingUrl(false)}
        onError={(e) => {
          setErrorMsg(e.nativeEvent.description);
          setPhase('error');
        }}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  closeBtn: { marginBottom: 8 },
  closeText: { fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  headerSub: { fontSize: 13 },
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loadingText: { fontSize: 13 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successEmoji: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorEmoji: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  errorDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginBottom: 12 },
  cancelBtn: { padding: 12 },
  cancelText: { fontSize: 14, fontWeight: '500' },
});
