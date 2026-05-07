-- Update has_admin_permission to include zexofile@gmail.com as super admin
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::public.app_role
      AND (
        (permissions->>'all')::boolean = true
        OR (permissions->>_perm)::boolean = true
        OR _user_id IN (SELECT id FROM public.profiles WHERE email IN ('niteshprakash555@gmail.com','zexofile@gmail.com'))
      )
  )
$function$;

-- Update handle_new_user trigger function to include zexofile@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2), '')),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role, permissions)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email IN ('niteshprakash555@gmail.com','zexofile@gmail.com') THEN 'admin'::public.app_role ELSE 'user'::public.app_role END,
    CASE WHEN NEW.email IN ('niteshprakash555@gmail.com','zexofile@gmail.com') THEN '{"all": true}'::jsonb ELSE '{}'::jsonb END
  ) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Promote any existing matching profiles
INSERT INTO public.user_roles (user_id, role, permissions)
SELECT p.id, 'admin'::public.app_role, '{"all": true}'::jsonb
FROM public.profiles p
WHERE p.email IN ('niteshprakash555@gmail.com','zexofile@gmail.com')
ON CONFLICT (user_id, role) DO UPDATE SET permissions = '{"all": true}'::jsonb;

-- Push subscriptions table for web push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage their subs" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read all subs" ON public.push_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));