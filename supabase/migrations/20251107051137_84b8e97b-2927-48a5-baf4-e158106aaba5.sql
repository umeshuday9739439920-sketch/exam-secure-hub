-- Allow multiple attempts per student per exam
ALTER TABLE public.exam_attempts
DROP CONSTRAINT IF EXISTS exam_attempts_exam_id_student_id_key;

-- Optional: index to keep queries performant when listing attempts
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_exam_started_at
ON public.exam_attempts (student_id, exam_id, started_at DESC);
