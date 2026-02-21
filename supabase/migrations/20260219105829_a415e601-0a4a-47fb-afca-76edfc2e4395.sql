
-- Drop FK constraints on profiles and residents so staff can add residents without auth accounts
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.residents DROP CONSTRAINT IF EXISTS residents_user_id_fkey;
