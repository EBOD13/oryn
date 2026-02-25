import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../ThemeContext';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const variantBg: Record<string, ViewStyle> = {
    primary: { backgroundColor: theme.primary },
    secondary: { backgroundColor: theme.primaryMuted },
    ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.border },
    danger: { backgroundColor: theme.danger },
  };

  const variantText: Record<string, TextStyle> = {
    primary: { color: theme.textOnPrimary },
    secondary: { color: theme.primary },
    ghost: { color: theme.textPrimary },
    danger: { color: '#FFFFFF' },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, variantBg[variant], sizeStyle[size], isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.textOnPrimary : theme.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.text, variantText[variant], textSize[size], textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600' },
});

const sizeStyle: Record<string, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 24 },
  lg: { paddingVertical: 18, paddingHorizontal: 32 },
};

const textSize: Record<string, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 16 },
};
