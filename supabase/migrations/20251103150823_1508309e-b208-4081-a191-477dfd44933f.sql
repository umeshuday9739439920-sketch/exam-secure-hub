-- 1. Update check_answer function with input validation
CREATE OR REPLACE FUNCTION public.check_answer(_question_id uuid, _selected_answer character)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_answer character;
BEGIN
  -- Validate inputs
  IF _question_id IS NULL THEN
    RAISE EXCEPTION 'question_id cannot be null';
  END IF;
  
  IF _selected_answer NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'selected_answer must be A, B, C, or D';
  END IF;
  
  -- Check answer
  SELECT correct_answer INTO v_correct_answer
  FROM questions
  WHERE id = _question_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'question not found';
  END IF;
  
  RETURN v_correct_answer = _selected_answer;
END;
$$;

-- 2. Add INSERT and UPDATE policies for user_roles to enable role management
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add INSERT policy for profiles table for resilience
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);