// ─── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  institution?: string;
  major?: string;
  college_year?: number; // 1-6
  timezone: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  daily_study_goal_minutes: number;
  exam_prep_lead_days: number;
  focus_break_interval_min: number;
  focus_break_duration_min: number;
  focus_break_allowed: boolean;
  notification_style: 'nudge' | 'urgent' | 'silent';
  shield_message_style: 'motivational' | 'factual' | 'urgent';
  ai_provider: 'gemini' | 'openai' | 'claude';
  updated_at: string;
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
export interface CanvasCourse {
  id: string;
  canvas_course_id: string;
  course_name: string;
  course_code?: string;
  instructor_name?: string;
  color?: string;
  is_active: boolean;
}

export interface CanvasAssignment {
  id: string;
  course_id: string;
  canvas_assignment_id: string;
  title: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  submission_types: string[];
  is_submitted: boolean;
  grade?: number;
  canvas_score?: number;
  submission_late: boolean;
}

// ─── Focus Sessions ───────────────────────────────────────────────────────────
export type SessionType = 'study' | 'exam_prep' | 'project' | 'reading' | 'review';
export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'paused';
export type MoodType = 'stressed' | 'focused' | 'tired' | 'motivated' | 'neutral';

export interface FocusSession {
  id: string;
  user_id: string;
  study_plan_id?: string;
  assignment_id?: string;
  session_type: SessionType;
  target_duration_min?: number;
  actual_duration_min?: number;
  started_at: string;
  ended_at?: string;
  status: SessionStatus;
  breaks_taken: number;
  total_break_min: number;
  focus_score?: number;
  created_at: string;
  updated_at: string;
}

export interface SessionReflection {
  id: string;
  session_id: string;
  user_id: string;
  what_i_learned?: string;
  difficulty_rating?: number; // 1-5
  confidence_rating?: number; // 1-5
  mood_before?: MoodType;
  mood_after?: MoodType;
  ai_summary?: string;
  created_at: string;
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export type GoalCategory = 'academic' | 'fitness' | 'personal' | 'career' | 'financial';
export type GoalType = 'habit' | 'milestone' | 'metric';
export type GoalRecurrence = 'daily' | 'weekly' | 'monthly' | 'once';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  goal_type: GoalType;
  recurrence: GoalRecurrence;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
  is_active: boolean;
  is_automated: boolean;
  current_streak: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

export interface GoalLog {
  id: string;
  goal_id: string;
  user_id: string;
  value: number;
  notes?: string;
  source: 'manual' | 'apple_health' | 'strava' | 'google_fit' | 'canvas' | 'auto';
  logged_date: string;
  created_at: string;
}

// ─── Study Plans ──────────────────────────────────────────────────────────────
export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  daily_goal_minutes: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

// ─── Nudges ───────────────────────────────────────────────────────────────────
export interface Nudge {
  id: string;
  user_id: string;
  title: string;
  message: string;
  nudge_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
}

// ─── Gamification ─────────────────────────────────────────────────────────────
export interface UserStats {
  user_id: string;
  total_focus_minutes: number;
  total_sessions: number;
  current_daily_streak: number;
  best_daily_streak: number;
  oryn_points: number;
  level: number;
  updated_at: string;
}
