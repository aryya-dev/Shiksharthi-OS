// TypeScript types for Shiksharthi OS

export type UserRole = 'ADMIN' | 'SPOC' | 'FACULTY';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type DoubtStatus = 'PENDING' | 'RESOLVING' | 'RESOLVED';
export type InteractionType = 'CALL' | 'PTM_MEET' | 'EMAIL' | 'COUNSELLING';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at?: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string[];
  joining_date?: string;
  is_active: boolean;
}

export interface Subject {
  id: string;
  name: string;
  grade_level: string; // "Class 11" | "Class 12"
  description?: string;
}

export interface Student {
  id: string;
  name: string;
  grade_level: string;
  parent_name: string;
  scholarship_status: string; // "None" | "25%" | "50%" | "100%" etc.
  enrollment_status: 'Active' | 'Suspended' | 'Graduated';
  enrollment_date?: string;
}

export interface StudentFee {
  id: string;
  student_id: string;
  total_amount: number;
  scholarship_discount: number;
  amount_paid: number;
  created_at?: string;
  updated_at?: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  sequence_order: number;
  estimated_hours: number;
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  prerequisites: string[];
  learning_outcomes: string[];
  formulas: string[];
  definitions: Record<string, string>;
}

export interface ChapterTopic {
  id: string;
  chapter_id: string;
  name: string;
  sequence_order: number;
  estimated_minutes: number;
  is_completed: boolean;
  completed_at?: string;
}

export interface LessonPlan {
  id: string;
  chapter_id: string;
  class_number: number;
  topics: string[];
  learning_objectives: string[];
  examples: string[];
  homework: string[];
  revision_strategy?: string;
  chapter_test_json?: {
    title: string;
    questions: Array<{ question: string; options: string[]; answer: number }>;
  };
}

export interface ClassLog {
  id: string;
  class_date: string;
  duration_minutes: number;
  faculty_id: string | null;
  subject_id: string | null;
  chapter_id: string | null;
  planned_topics: string[];
  actual_topics_covered: string[]; // array of topic ids
  homework_assigned?: string;
  remarks?: string;
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface Doubt {
  id: string;
  student_id: string;
  faculty_id?: string;
  question: string;
  category: string; // "Physics" | "Chemistry" | "Mathematics"
  status: DoubtStatus;
  remarks?: string;
  resolution_time_minutes?: number;
  created_at: string;
  resolved_at?: string;
}

export interface Feedback {
  id: string;
  class_id: string;
  student_id: string;
  rating_clarity: number; // 1-5
  rating_pace: number; // 1-5
  rating_understanding: number; // 1-5
  comments?: string;
  created_at?: string;
}

export interface Exam {
  id: string;
  name: string;
  exam_date: string;
  total_marks: number;
  subject_id: string;
  is_published: boolean;
  question_paper_json?: {
    instructions: string[];
    questions: Array<{ id: number; question: string; marks: number; section: string }>;
  };
}

export interface ExamChapter {
  id: string;
  exam_id: string;
  chapter_id: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  percentile?: number;
  remarks?: string;
}

export interface ParentInteraction {
  id: string;
  student_id: string;
  interaction_type: InteractionType;
  interaction_date: string;
  details: string;
  follow_up_date?: string;
  logged_by: string; // user profile id
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
