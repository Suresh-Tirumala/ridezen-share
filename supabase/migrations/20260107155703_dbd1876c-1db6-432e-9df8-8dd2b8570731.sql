-- Drop the duplicate trigger we just created (keep the existing handle_new_user)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();