import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/refund")({
  beforeLoad: () => { throw redirect({ to: "/legal/$slug", params: { slug: "refund" } }); },
});
