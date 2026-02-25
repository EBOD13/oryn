import { apiClient } from './client';
import { CanvasCourse, CanvasAssignment } from '../types';

export const canvasApi = {
  sync: (canvasApiKey: string, canvasDomain: string) =>
    apiClient.post('/canvas/sync', { canvas_api_key: canvasApiKey, canvas_domain: canvasDomain }).then((r) => r.data),

  getCourses: () =>
    apiClient.get<CanvasCourse[]>('/canvas/courses').then((r) => r.data),

  getUpcomingAssignments: (days = 14) =>
    apiClient.get<CanvasAssignment[]>('/canvas/assignments/upcoming', { params: { days } }).then((r) => r.data),

  getAssignments: (courseId?: string) =>
    apiClient.get<CanvasAssignment[]>('/canvas/assignments', {
      params: courseId ? { course_id: courseId } : {},
    }).then((r) => r.data),
};
