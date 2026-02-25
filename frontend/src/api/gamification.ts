import { apiClient } from './client';
import { UserStats } from '../types';

export const gamificationApi = {
  getStats: () =>
    apiClient.get<UserStats>('/gamification/stats').then((r) => r.data),
};
