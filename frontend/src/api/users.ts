import { apiClient } from './client';
import { UserProfile, UserPreferences } from '../types';

export const usersApi = {
  getProfile: () =>
    apiClient.get<UserProfile>('/users/me').then((r) => r.data),

  updateProfile: (data: Partial<Pick<UserProfile, 'display_name' | 'institution' | 'major' | 'college_year' | 'timezone'>>) =>
    apiClient.patch<UserProfile>('/users/me', data).then((r) => r.data),

  getPreferences: () =>
    apiClient.get<UserPreferences>('/users/me/preferences').then((r) => r.data),

  updatePreferences: (data: Partial<Omit<UserPreferences, 'user_id' | 'updated_at'>>) =>
    apiClient.patch<UserPreferences>('/users/me/preferences', data).then((r) => r.data),

  completeOnboarding: () =>
    apiClient.post<UserProfile>('/users/me/onboarding/complete').then((r) => r.data),
};
