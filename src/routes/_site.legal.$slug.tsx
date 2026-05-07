import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_site/legal/$slug")({
  component: LegalPage,
});

function LegalPage() {
  const { slug } = useParams({ from: "/_site/legal/$slug" });
  const [page, setPage] = useState<{ title: string; content: string } | null>(null);
  useEffect(() => {
    supabase.from("legal_pages").select("title, content").eq("slug", slug).maybeSingle()
      .then(({ data }) => setPage(data ?? { title: "Not found", content: "This page does not exist." }));
  }, [slug]);

  if (!page) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">{page.title}</h1>
      <article className="mt-6 whitespace-pre-line rounded-2xl bg-card p-6 ring-1 ring-border text-foreground/90 leading-relaxed">
        {page.content}
      </article>
    </section>
  );
}
