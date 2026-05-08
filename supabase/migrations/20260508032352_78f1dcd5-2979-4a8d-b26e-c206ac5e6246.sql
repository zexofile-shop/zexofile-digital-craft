
ALTER TABLE public.custom_orders
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS social_accounts jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sample_images jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_choice text,
  ADD COLUMN IF NOT EXISTS notification_choice_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS push_prompt_vapid_version integer DEFAULT 0;

ALTER TABLE public.website_settings
  ADD COLUMN IF NOT EXISTS vapid_key_version integer NOT NULL DEFAULT 1;
