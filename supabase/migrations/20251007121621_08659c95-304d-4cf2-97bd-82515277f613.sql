-- Drop both existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate them as PERMISSIVE policies (explicit for clarity)
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
AS PERMISSIVE
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles  
CREATE POLICY "Admins can view all profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));