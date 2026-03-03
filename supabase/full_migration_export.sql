-- ============================================
-- FULL SCHEMA MIGRATION SCRIPT
-- Project: Exam Management System
-- Generated: 2026-03-03
-- Run this on your external Supabase project
-- ============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.question_type AS ENUM ('mcq', 'long_text');

-- 2. TABLES

-- Profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Exams table
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  total_marks integer NOT NULL,
  passing_marks integer NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type question_type NOT NULL DEFAULT 'mcq',
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer char(1),
  marks integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Exam attempts table
CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id),
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  score integer,
  total_marks integer,
  percentage numeric,
  passed boolean,
  tab_switches integer DEFAULT 0,
  requires_grading boolean DEFAULT false,
  grading_completed boolean DEFAULT false
);

-- Index for multiple attempts
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_exam_started_at
ON public.exam_attempts (student_id, exam_id, started_at DESC);

-- Answers table
CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer char(1),
  text_answer text,
  is_correct boolean,
  awarded_marks integer,
  is_graded boolean DEFAULT false,
  graded_by uuid,
  graded_at timestamptz
);

-- 3. FUNCTIONS

-- has_role function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- check_answer function
CREATE OR REPLACE FUNCTION public.check_answer(_question_id uuid, _selected_answer character)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_correct_answer character;
BEGIN
  IF _question_id IS NULL THEN
    RAISE EXCEPTION 'question_id cannot be null';
  END IF;
  IF _selected_answer NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'selected_answer must be A, B, C, or D';
  END IF;
  SELECT correct_answer INTO v_correct_answer
  FROM questions WHERE id = _question_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'question not found';
  END IF;
  RETURN v_correct_answer = _selected_answer;
END;
$$;

-- handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- 4. TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- == profiles ==
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- == user_roles ==
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- == exams ==
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active exams" ON public.exams FOR SELECT TO authenticated USING (is_active = true);

-- == questions ==
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all question fields" ON public.questions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view questions for active exams" ON public.questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM exams WHERE exams.id = questions.exam_id AND exams.is_active = true));

-- == exam_attempts ==
CREATE POLICY "Admins can view all attempts" ON public.exam_attempts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete attempts" ON public.exam_attempts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can insert their own attempts" ON public.exam_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their own attempts" ON public.exam_attempts FOR UPDATE TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students can view their own attempts" ON public.exam_attempts FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students can delete incomplete attempts" ON public.exam_attempts FOR DELETE TO authenticated USING (auth.uid() = student_id AND submitted_at IS NULL);

-- == answers ==
CREATE POLICY "Admins can view all answers" ON public.answers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can manage their own answers" ON public.answers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM exam_attempts WHERE exam_attempts.id = answers.attempt_id AND exam_attempts.student_id = auth.uid()));
