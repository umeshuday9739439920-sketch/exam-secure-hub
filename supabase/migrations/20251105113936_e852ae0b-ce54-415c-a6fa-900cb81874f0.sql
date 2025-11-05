-- Create enum for question types
CREATE TYPE public.question_type AS ENUM ('mcq', 'long_text');

-- Add question_type column to questions table
ALTER TABLE public.questions
ADD COLUMN question_type public.question_type NOT NULL DEFAULT 'mcq';

-- Make MCQ-specific fields nullable for long text questions
ALTER TABLE public.questions
ALTER COLUMN option_a DROP NOT NULL,
ALTER COLUMN option_b DROP NOT NULL,
ALTER COLUMN option_c DROP NOT NULL,
ALTER COLUMN option_d DROP NOT NULL,
ALTER COLUMN correct_answer DROP NOT NULL;

-- Add fields to answers table for long text responses and grading
ALTER TABLE public.answers
ADD COLUMN text_answer text,
ADD COLUMN awarded_marks integer,
ADD COLUMN is_graded boolean DEFAULT false,
ADD COLUMN graded_by uuid REFERENCES auth.users(id),
ADD COLUMN graded_at timestamp with time zone;

-- Add field to exam_attempts to track if manual grading is needed
ALTER TABLE public.exam_attempts
ADD COLUMN requires_grading boolean DEFAULT false,
ADD COLUMN grading_completed boolean DEFAULT false;

-- Add index for faster grading queries
CREATE INDEX idx_answers_grading ON public.answers(is_graded, graded_at) WHERE is_graded = false;
CREATE INDEX idx_attempts_grading ON public.exam_attempts(requires_grading, grading_completed) WHERE requires_grading = true AND grading_completed = false;