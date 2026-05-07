import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getSecret } from "./app-secrets.server";

const Input = z.object({
  imageBase64: z.string().min(10).max(20_000_000),
  filename: z.string().max(120).optional(),
});

/** Upload an image to ImgBB and return the hosted URL. */
export const uploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = (await getSecret("IMGBB_API_KEY")) ?? process.env.IMGBB_API_KEY;
    if (!key) throw new Error("IMGBB_API_KEY not configured");
    const body = new URLSearchParams();
    body.set("image", data.imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""));
    if (data.filename) body.set("name", data.filename);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, { method: "POST", body });
    const json = await res.json() as any;
    if (!res.ok || !json?.data?.url) {
      throw new Error(json?.error?.message || "ImgBB upload failed");
    }
    return { url: json.data.url as string, deleteUrl: json.data.delete_url as string | undefined };
  });
