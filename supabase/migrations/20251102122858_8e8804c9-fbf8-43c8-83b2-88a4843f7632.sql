-- Create a secure function to validate answers without exposing correct answers
-- This function runs with SECURITY DEFINER so it can access correct_answer field
-- but doesn't return it to the client
CREATE OR REPLACE FUNCTION public.check_answer(
  _question_id uuid,
  _selected_answer character
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT correct_answer = _selected_answer
  FROM questions
  WHERE id = _question_id;
$$;

-- Update RLS policy on questions table to prevent students from seeing correct_answer
-- Drop existing student SELECT policy
DROP POLICY IF EXISTS "Anyone can view questions for active exams" ON public.questions;

-- Create new policy that allows SELECT but will be filtered by application code
-- to exclude correct_answer field
CREATE POLICY "Students can view questions for active exams"
ON public.questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM exams
    WHERE exams.id = questions.exam_id
    AND exams.is_active = true
  )
);

-- Create separate policy for admins to view all question fields including correct_answer
CREATE POLICY "Admins can view all question fields"
ON public.questions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));