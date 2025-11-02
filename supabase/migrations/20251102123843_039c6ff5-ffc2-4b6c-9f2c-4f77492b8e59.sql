-- Add DELETE policies for exam_attempts table
CREATE POLICY "Admins can delete attempts"
ON exam_attempts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can delete incomplete attempts"
ON exam_attempts FOR DELETE
USING (auth.uid() = student_id AND submitted_at IS NULL);

-- Add DELETE policies for user_roles table
CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policies for profiles table
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
USING (auth.uid() = id);