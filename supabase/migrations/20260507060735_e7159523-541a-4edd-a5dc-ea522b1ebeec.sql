-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles
INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
SELECT u.id, u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(u.raw_user_meta_data->>'full_name', ' ', 1)),
  COALESCE(u.raw_user_meta_data->>'last_name', NULLIF(split_part(u.raw_user_meta_data->>'full_name', ' ', 2), '')),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Backfill missing roles
INSERT INTO public.user_roles (user_id, role, permissions)
SELECT u.id,
  CASE WHEN u.email IN ('niteshprakash555@gmail.com','zexofile@gmail.com') THEN 'admin'::public.app_role ELSE 'user'::public.app_role END,
  CASE WHEN u.email IN ('niteshprakash555@gmail.com','zexofile@gmail.com') THEN '{"all": true}'::jsonb ELSE '{}'::jsonb END
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;