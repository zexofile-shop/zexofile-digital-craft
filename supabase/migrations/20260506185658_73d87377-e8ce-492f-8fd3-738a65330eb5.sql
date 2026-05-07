
-- Add granular permissions to user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Helper to check admin permission keys
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::public.app_role
      AND (
        (permissions->>'all')::boolean = true
        OR (permissions->>_perm)::boolean = true
        OR _user_id IN (SELECT id FROM public.profiles WHERE email = 'niteshprakash555@gmail.com')
      )
  )
$$;

-- Ensure super-admin gets full perms
UPDATE public.user_roles
SET permissions = jsonb_build_object('all', true)
WHERE user_id IN (SELECT id FROM public.profiles WHERE email = 'niteshprakash555@gmail.com');

-- Seed website settings row if missing
INSERT INTO public.website_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Seed legal pages
INSERT INTO public.legal_pages (slug, title, content) VALUES
 ('terms','Terms & Conditions','# Terms & Conditions\n\nWelcome to Zexofile Shop.'),
 ('privacy','Privacy Policy','# Privacy Policy\n\nWe respect your privacy.'),
 ('refund','Refund Policy','# Refund Policy\n\nDigital goods are non-refundable once delivered.')
ON CONFLICT (slug) DO NOTHING;
