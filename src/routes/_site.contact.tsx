import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, MessageCircle, Send, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/_site/contact")({
  component: ContactPage,
  head: () => ({ meta: [{ title: "Contact — Zexofile Shop" }] }),
});

const ICONS: Record<string, any> = { whatsapp: MessageCircle, telegram: Send, email: Mail, phone: Phone };

function ContactPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("contacts").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setContacts(data ?? []));
  }, []);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Get in touch</h1>
      <p className="mt-1 text-muted-foreground">We typically respond within 30 minutes.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <a href="mailto:zexofile@gmail.com" className="group flex items-center gap-4 rounded-2xl bg-gradient-card p-5 ring-1 ring-border hover:ring-primary/40 hover:shadow-elegant transition-smooth">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><Mail className="h-5 w-5" /></div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</div>
            <div className="font-semibold group-hover:text-primary">zexofile@gmail.com</div>
          </div>
        </a>

        {contacts.map((c) => {
          const Icon = ICONS[c.type] ?? MessageCircle;
          return (
            <a key={c.id} href={c.url ?? "#"} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-2xl bg-gradient-card p-5 ring-1 ring-border hover:ring-primary/40 hover:shadow-elegant transition-smooth">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><Icon className="h-5 w-5" /></div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="font-semibold group-hover:text-primary">{c.value}</div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
