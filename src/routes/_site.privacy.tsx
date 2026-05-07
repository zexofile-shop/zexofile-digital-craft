import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/privacy")({
  beforeLoad: () => { throw redirect({ to: "/legal/$slug", params: { slug: "privacy" } }); },
});
