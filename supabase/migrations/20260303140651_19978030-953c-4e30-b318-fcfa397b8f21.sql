
DELETE FROM public.user_roles WHERE user_id != '560f29d4-b254-409a-b64c-8cc7418a0e9a';
DELETE FROM public.answers WHERE attempt_id IN (SELECT id FROM public.exam_attempts WHERE student_id != '560f29d4-b254-409a-b64c-8cc7418a0e9a');
DELETE FROM public.exam_attempts WHERE student_id != '560f29d4-b254-409a-b64c-8cc7418a0e9a';
DELETE FROM public.profiles WHERE id != '560f29d4-b254-409a-b64c-8cc7418a0e9a';
INSERT INTO public.user_roles (user_id, role) VALUES ('560f29d4-b254-409a-b64c-8cc7418a0e9a', 'admin') ON CONFLICT (user_id, role) DO NOTHING;
