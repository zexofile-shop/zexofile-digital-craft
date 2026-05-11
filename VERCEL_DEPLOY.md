# Deploy Zexofile Shop to Vercel (Free)

Vercel pe full functional hosting — SSR, server functions (Razorpay, push notifications, admin APIs), sab kaam karega. Free tier kaafi hai 10k+ users tak.

> Note: Vercel deployment is **separate** from Lovable preview. Lovable preview Cloudflare Workers use karta hai. Dono parallel chal sakte hain.

---

## 1. GitHub repo setup

1. Lovable me **GitHub → Connect to GitHub** click karke repo create kar lo.
2. Push ho jayega automatically.

## 2. Vercel pe import

1. https://vercel.com/new pe jao.
2. GitHub repo select karo.
3. **Framework Preset:** `Other` (vercel.json already configured hai).
4. **Build Command, Install Command, Output Directory** — chhod do as is, `vercel.json` se pick ho jayega.
5. Deploy click **mat karo abhi** — pehle env vars add karo (next step).

## 3. Environment Variables (Vercel → Project Settings → Environment Variables)

Ye saari keys add karo. **All Environments** (Production, Preview, Development) check rakhna.

### Public (browser ko chahiye)
| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://bffypjleiwocmcfuseqy.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZnlwamxlaXdvY21jZnVzZXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzE4OTUsImV4cCI6MjA5MzcwNzg5NX0.Ju_OmXXDuYPlDGHEpIMqy7PGwqMAyC9qxoVlSYSvcoQ` |
| `VITE_SUPABASE_PROJECT_ID` | `bffypjleiwocmcfuseqy` |

### Server-side (server functions ke liye)
| Key | Where to find |
|---|---|
| `SUPABASE_URL` | same as `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | same as `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud → Backend → API Settings → `service_role` key (secret hai, kahin paste mat karo public me) |
| `RAZORPAY_KEY_ID` | Already admin panel me set hai — same value daalo (or admin panel se hi manage karo) |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard → Settings → API Keys |
| `VAPID_PUBLIC_KEY` | Already configured — same value |
| `VAPID_PRIVATE_KEY` | Already configured — same value |
| `VAPID_SUBJECT` | `mailto:zexofile@gmail.com` |
| `IMGBB_API_KEY` | https://api.imgbb.com/ se le lo (already configured) |

> **Tip:** App secrets (Razorpay, VAPID, ImgBB) admin panel `/admin/api-keys` se bhi manage hote hain — wahan se update karoge to Vercel restart ki zaroorat nahi (DB se padhe jaate hain). Env vars sirf fallback hain.

## 4. Custom Domain (zexofile.shop)

1. Vercel → Project → **Settings → Domains** → `zexofile.shop` add karo.
2. Vercel jo DNS records dega (A `76.76.21.21` + CNAME for www) — apne domain registrar pe daalo.
3. SSL automatic ho jayega 5–10 min me.

## 5. Supabase Auth Redirect URLs update

Lovable Cloud → Backend → **Authentication → URL Configuration**:
- **Site URL:** `https://zexofile.shop`
- **Redirect URLs:** add karo:
  - `https://zexofile.shop/**`
  - `https://*.vercel.app/**` (preview deployments ke liye)

Google OAuth bhi automatically kaam karega kyunki Lovable managed OAuth use ho raha hai.

## 6. Razorpay webhook (optional but recommended)

Razorpay dashboard → Webhooks → New webhook:
- URL: `https://zexofile.shop/api/public/razorpay-webhook` (agar implement kiya hai)
- Events: `payment.captured`, `payment.failed`

---

## Deploy karne ke baad

- **Frontend changes** ke liye: GitHub pe push → Vercel auto deploy.
- **Database changes** Lovable se hi karte raho — ek hi Supabase backend dono jagah use hoga.
- **Admin panel** same domain pe `/admin` route se accessible hai. Agar alag subdomain chahiye to instructions bolna.

## Troubleshooting

- **500 errors on server functions**: Vercel → Deployments → Functions → Logs check karo. Aksar env var missing hota hai.
- **Razorpay auth failed**: `RAZORPAY_KEY_SECRET` env var check karo, ya admin panel se update karo.
- **Push notifications kaam nahi karte**: VAPID keys teeno (public/private/subject) set hain confirm karo.
- **Build fails with "Failed to resolve"**: `bun install` locally chala ke commit karo lockfile.
