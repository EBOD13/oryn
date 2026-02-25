import { apiClient } from './client';
import { Goal, GoalLog, GoalCategory, GoalType, GoalRecurrence } from '../types';

export const goalsApi = {
  list: () =>
    apiClient.get<Goal[]>('/goals').then((r) => r.data),

  create: (data: {
    title: string;
    description?: string;
    category: GoalCategory;
    goal_type: GoalType;
    recurrence: GoalRecurrence;
    target_value?: number;
    target_unit?: string;
    target_date?: string;
  }) => apiClient.post<Goal>('/goals', data).then((r) => r.data),

  update: (id: string, data: Partial<Pick<Goal, 'title' | 'description' | 'target_value' | 'target_date' | 'is_active' | 'recurrence'>>) =>
    apiClient.patch<Goal>(`/goals/${id}`, data).then((r) => r.data),

  log: (data: { goal_id: string; value: number; notes?: string; logged_date?: string }) =>
    apiClient.post<GoalLog>('/goals/logs', data).then((r) => r.data),

  getLogs: (goalId: string) =>
    apiClient.get<GoalLog[]>(`/goals/${goalId}/logs`).then((r) => r.data),
};
