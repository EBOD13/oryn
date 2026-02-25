import { University } from './schools';

export interface AppTheme {
  // School
  schoolId: string;
  schoolName: string;

  // Primary (school brand color)
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;   // very light tint background
  textOnPrimary: string;  // readable text on primary bg

  // Accent (school secondary color used for highlights)
  accent: string;
  accentMuted: string;

  // Static — do not change with school
  success: string;
  successMuted: string;
  danger: string;
  dangerMuted: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  tabActive: string;
  tabInactive: string;

  // Moods
  moodStressed: string;
  moodFocused: string;
  moodTired: string;
  moodMotivated: string;
  moodNeutral: string;
}

const STATIC = {
  success: '#10B981',
  successMuted: '#D1FAE5',
  danger: '#EF4444',
  dangerMuted: '#FEE2E2',
  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F0F9',
  border: '#E5E4F0',
  borderLight: '#F0EFF8',
  textPrimary: '#1A1730',
  textSecondary: '#6B6880',
  textMuted: '#A8A6BC',
  textInverse: '#FFFFFF',
  tabInactive: '#A8A6BC',
  moodStressed: '#EF4444',
  moodFocused: '#5B4FE8',
  moodTired: '#6B7280',
  moodMotivated: '#10B981',
  moodNeutral: '#F59E0B',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

/** Blend hex color with white by `amount` (0–1, higher = lighter) */
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);
  return `rgb(${r},${g},${b})`;
}

/** Darken hex by blending with black */
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.round(rgb.r * (1 - amount));
  const g = Math.round(rgb.g * (1 - amount));
  const b = Math.round(rgb.b * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

export function themeFromUniversity(uni: University): AppTheme {
  return {
    schoolId: uni.id,
    schoolName: uni.name,
    primary: uni.primaryColor,
    primaryDark: darken(uni.primaryColor, 0.15),
    primaryLight: lighten(uni.primaryColor, 0.25),
    primaryMuted: lighten(uni.primaryColor, 0.9),
    textOnPrimary: uni.textOnPrimary,
    accent: uni.secondaryColor === uni.primaryColor ? '#F59E0B' : uni.textOnPrimary,
    accentMuted: lighten(uni.secondaryColor, 0.7),
    tabActive: uni.primaryColor,
    ...STATIC,
  };
}

export const DEFAULT_THEME: AppTheme = {
  schoolId: 'default',
  schoolName: '',
  primary: '#5B4FE8',
  primaryDark: '#3D33C6',
  primaryLight: '#7B72EE',
  primaryMuted: '#EEF0FF',
  textOnPrimary: '#FFFFFF',
  accent: '#F59E0B',
  accentMuted: '#FEF3C7',
  tabActive: '#5B4FE8',
  ...STATIC,
};
