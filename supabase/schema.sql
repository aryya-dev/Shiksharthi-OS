-- Shiksharthi OS - Database Schema Definition
-- Designed for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Roles Enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'SPOC', 'FACULTY');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE');
CREATE TYPE doubt_status AS ENUM ('PENDING', 'RESOLVING', 'RESOLVED');
CREATE TYPE interaction_type AS ENUM ('CALL', 'PTM_MEET', 'EMAIL', 'COUNSELLING');

-- 1. Profiles Table (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'FACULTY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    specialization VARCHAR(255)[],
    joining_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50) NOT NULL, -- e.g. "Class 11", "Class 12"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50) NOT NULL, -- e.g. "Class 11", "Class 12"
    parent_name VARCHAR(255) NOT NULL,
    scholarship_status VARCHAR(100) DEFAULT 'None',
    enrollment_status VARCHAR(50) DEFAULT 'Active', -- Active, Suspended, Graduated
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Chapters Table (AI Curriculum Engine inserts/manages)
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sequence_order INT NOT NULL, -- Chapter 1, 2, etc.
    estimated_hours NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    difficulty_level VARCHAR(50) DEFAULT 'Medium', -- Easy, Medium, Hard
    prerequisites TEXT[],
    learning_outcomes TEXT[],
    formulas TEXT[],
    definitions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Chapter Topics Table (Granular tracking)
CREATE TABLE IF NOT EXISTS chapter_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sequence_order INT NOT NULL,
    estimated_minutes INT DEFAULT 60,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Lesson Plans Table (AI-generated subtopics and curriculum planner)
CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    class_number INT NOT NULL, -- e.g. Lecture 1, Lecture 2
    topics TEXT[] NOT NULL,
    learning_objectives TEXT[],
    examples TEXT[],
    homework TEXT[],
    revision_strategy TEXT,
    chapter_test_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Classes (Class Log Table)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT NOT NULL DEFAULT 90,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    planned_topics VARCHAR(255)[], -- references lesson_plans class_number or direct topics
    actual_topics_covered UUID[] DEFAULT '{}', -- references chapter_topics(id)
    homework_assigned TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'PRESENT',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- 10. Doubts Table
CREATE TABLE IF NOT EXISTS doubts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    category VARCHAR(255), -- Physics, Chemistry, Math, general
    status doubt_status NOT NULL DEFAULT 'PENDING',
    remarks TEXT,
    resolution_time_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    rating_clarity INT CHECK (rating_clarity BETWEEN 1 AND 5),
    rating_pace INT CHECK (rating_pace BETWEEN 1 AND 5),
    rating_understanding INT CHECK (rating_understanding BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- 12. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    total_marks INT NOT NULL DEFAULT 100,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT FALSE,
    question_paper_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Exam Chapters Table (Scope of Exam)
CREATE TABLE IF NOT EXISTS exam_chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE(exam_id, chapter_id)
);

-- 14. Exam Results Table
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL,
    percentile NUMERIC(5, 2),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id)
);

-- 15. Parent Interactions Table (Parent Communication CRM)
CREATE TABLE IF NOT EXISTS parent_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL DEFAULT 'CALL',
    interaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    details TEXT NOT NULL,
    follow_up_date DATE,
    logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to main tables
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_faculty_modtime BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_students_modtime BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_chapters_modtime BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_doubts_modtime BEFORE UPDATE ON doubts FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Database Indexes for high performance query resolution
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade_level);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON chapter_topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_classes_date ON classes(class_date);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_student ON doubts(student_id);
CREATE INDEX IF NOT EXISTS idx_doubts_status ON doubts(status);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_interactions_student ON parent_interactions(student_id);

-- 17. Student Fees Table (For Monitoring Payments)
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL DEFAULT 28000,
    scholarship_discount NUMERIC NOT NULL DEFAULT 0,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically create a student_fees record when a new student is registered
CREATE OR REPLACE FUNCTION public.handle_new_student_fee()
RETURNS TRIGGER AS $$
DECLARE
    discount_pct NUMERIC := 0;
    discount_amt NUMERIC := 0;
BEGIN
    -- Parse scholarship percentage from scholarship_status (e.g., "50% Merit" -> 50, "None" -> 0, "100%" -> 100)
    IF NEW.scholarship_status ILIKE '%100%' THEN
        discount_pct := 100;
    ELSIF NEW.scholarship_status ILIKE '%75%' THEN
        discount_pct := 75;
    ELSIF NEW.scholarship_status ILIKE '%50%' THEN
        discount_pct := 50;
    ELSIF NEW.scholarship_status ILIKE '%25%' THEN
        discount_pct := 25;
    ELSIF NEW.scholarship_status ILIKE '%10%' THEN
        discount_pct := 10;
    ELSE
        discount_pct := 0;
    END IF;

    discount_amt := (28000 * discount_pct) / 100;

    INSERT INTO public.student_fees (student_id, total_amount, scholarship_discount, amount_paid)
    VALUES (NEW.id, 28000, discount_amt, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_student_created
    AFTER INSERT ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_student_fee();

-- Trigger to automatically update the scholarship discount when student is updated
CREATE OR REPLACE FUNCTION public.handle_update_student_fee()
RETURNS TRIGGER AS $$
DECLARE
    discount_pct NUMERIC := 0;
    discount_amt NUMERIC := 0;
BEGIN
    IF NEW.scholarship_status IS DISTINCT FROM OLD.scholarship_status THEN
        IF NEW.scholarship_status ILIKE '%100%' THEN
            discount_pct := 100;
        ELSIF NEW.scholarship_status ILIKE '%75%' THEN
            discount_pct := 75;
        ELSIF NEW.scholarship_status ILIKE '%50%' THEN
            discount_pct := 50;
        ELSIF NEW.scholarship_status ILIKE '%25%' THEN
            discount_pct := 25;
        ELSIF NEW.scholarship_status ILIKE '%10%' THEN
            discount_pct := 10;
        ELSE
            discount_pct := 0;
        END IF;

        discount_amt := (28000 * discount_pct) / 100;

        UPDATE public.student_fees 
        SET scholarship_discount = discount_amt,
            updated_at = NOW()
        WHERE student_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_student_updated
    AFTER UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_student_fee();

-- Indexes for student_fees
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);

-- Disable Row Level Security (RLS) on all tables to ensure anonymous client inserts/updates succeed
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE doubts DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE parent_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees DISABLE ROW LEVEL SECURITY;
