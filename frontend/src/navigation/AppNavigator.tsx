import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../ThemeContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { CanvasConnectScreen } from '../screens/settings/CanvasConnectScreen';
import { AppBlockingScreen } from '../screens/settings/AppBlockingScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { session, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="CanvasConnect"
              component={CanvasConnectScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="AppBlocking"
              component={AppBlockingScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
