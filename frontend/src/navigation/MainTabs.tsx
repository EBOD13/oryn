import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Target, Trophy, Settings } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';

import { HomeScreen } from '../screens/home/HomeScreen';
import { FocusScreen } from '../screens/focus/FocusScreen';
import { FocusActiveScreen } from '../screens/focus/FocusActiveScreen';
import { GoalsScreen } from '../screens/goals/GoalsScreen';
import { AddGoalScreen } from '../screens/goals/AddGoalScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();
const FocusStack = createNativeStackNavigator();
const GoalsStack = createNativeStackNavigator();

function FocusNavigator() {
  return (
    <FocusStack.Navigator screenOptions={{ headerShown: false }}>
      <FocusStack.Screen name="FocusHome" component={FocusScreen} />
      <FocusStack.Screen
        name="FocusActive"
        component={FocusActiveScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
      />
    </FocusStack.Navigator>
  );
}

function GoalsNavigator() {
  return (
    <GoalsStack.Navigator screenOptions={{ headerShown: false }}>
      <GoalsStack.Screen name="GoalsList" component={GoalsScreen} />
      <GoalsStack.Screen
        name="AddGoal"
        component={AddGoalScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'formSheet' }}
      />
    </GoalsStack.Navigator>
  );
}

export function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.borderLight,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 4,
          height: 70,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusNavigator}
        options={{
          tabBarLabel: 'Focus',
          tabBarIcon: ({ color, size }) => <Target color={color} size={size - 2} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsNavigator}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size - 2} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size - 2} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
  );
}
