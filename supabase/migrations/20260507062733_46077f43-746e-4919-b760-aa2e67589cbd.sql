CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage app_secrets" ON public.app_secrets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.app_secrets (key, description) VALUES
  ('RAZORPAY_KEY_ID', 'Razorpay public Key ID'),
  ('RAZORPAY_KEY_SECRET', 'Razorpay secret key'),
  ('IMGBB_API_KEY', 'ImgBB image upload API key'),
  ('VAPID_PUBLIC_KEY', 'Web Push VAPID public key'),
  ('VAPID_PRIVATE_KEY', 'Web Push VAPID private key'),
  ('VAPID_SUBJECT', 'Web Push subject (mailto:...)')
ON CONFLICT (key) DO NOTHING;