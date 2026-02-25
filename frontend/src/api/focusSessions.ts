import { apiClient } from './client';
import { FocusSession, SessionReflection, SessionType } from '../types';

export const focusSessionsApi = {
  list: (limit = 20, offset = 0) =>
    apiClient.get<FocusSession[]>('/focus-sessions', { params: { limit, offset } }).then((r) => r.data),

  getActive: () =>
    apiClient.get<FocusSession | null>('/focus-sessions/active').then((r) => r.data),

  start: (data: { session_type: SessionType; target_duration_min?: number; assignment_id?: string }) =>
    apiClient.post<FocusSession>('/focus-sessions', data).then((r) => r.data),

  end: (sessionId: string, focusScore?: number) =>
    apiClient.post<FocusSession>(`/focus-sessions/${sessionId}/end`, null, {
      params: focusScore ? { focus_score: focusScore } : {},
    }).then((r) => r.data),

  addReflection: (
    sessionId: string,
    data: {
      what_i_learned?: string;
      difficulty_rating?: number;
      confidence_rating?: number;
      mood_before?: string;
      mood_after?: string;
    },
  ) =>
    apiClient.post<SessionReflection>(`/focus-sessions/${sessionId}/reflection`, data).then((r) => r.data),
};
