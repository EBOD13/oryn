import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, DEFAULT_THEME, themeFromUniversity } from './utils/theme';
import { University, findUniversity } from './utils/schools';

interface ThemeContextValue {
  theme: AppTheme;
  university: University | null;
  setUniversity: (uni: University) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  university: null,
  setUniversity: async () => {},
  loadSavedTheme: async () => {},
});

const STORAGE_KEY = '@oryn_university_id';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);
  const [university, setUniversityState] = useState<University | null>(null);

  const setUniversity = useCallback(async (uni: University) => {
    setUniversityState(uni);
    setTheme(themeFromUniversity(uni));
    await AsyncStorage.setItem(STORAGE_KEY, uni.id);
  }, []);

  const loadSavedTheme = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const uni = findUniversity(saved);
        if (uni) {
          setUniversityState(uni);
          setTheme(themeFromUniversity(uni));
        }
      }
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, university, setUniversity, loadSavedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
