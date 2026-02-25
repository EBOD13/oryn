import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function AppWithTheme() {
  const { loadSavedTheme, theme } = useTheme();

  useEffect(() => {
    loadSavedTheme();
  }, [loadSavedTheme]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppWithTheme />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
