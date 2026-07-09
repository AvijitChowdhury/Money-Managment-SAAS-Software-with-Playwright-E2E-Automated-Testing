import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Smart Money Manager — Agency finance, bilingual" },
      { name: "description", content: "Bilingual (English/Bengali) money management SaaS for digital, creative and software agencies. Track cash flow, invoices, budgets and goals." },
      { property: "og:title", content: "Smart Money Manager — Agency finance, bilingual" },
      { property: "og:description", content: "Centralize cash flow, invoicing, budgets, and goals in one bilingual workspace built for agencies." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Easy Life",
          url: "/",
          brand: "Smart Money Manager",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Smart Money Manager",
          url: "/",
        }),
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-6">
        <div className="text-lime font-bold text-xl">EASY LIFE</div>
        <Link to="/auth" className="rounded-full bg-lime text-lime-foreground font-semibold px-5 py-2 text-sm">Sign in</Link>
      </header>
      <section className="max-w-4xl mx-auto text-center px-6 py-24">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Smart Money Manager for Agencies</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Centralize cash flow, invoicing, budgets, and goals in one bilingual (English / Bengali) workspace built for digital, creative and software agencies.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth" className="rounded-full bg-lime text-lime-foreground font-semibold px-6 py-3 text-sm">Get started</Link>
          <a href="#features" className="rounded-full border px-6 py-3 text-sm font-semibold">View agency features</a>
        </div>
      </section>
      <section id="features" className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-6 pb-24">
        {[
          ["Cash flow visibility", "See balance, income, expense and savings at a glance."],
          ["Project profitability", "Budgets, alerts, and category-level burn tracking."],
          ["Bilingual UX", "Instant EN ↔ BN toggle for team and client communication."],
        ].map(([h, p]) => (
          <div key={h} className="bg-card border rounded-2xl p-6 shadow-sm">
            <div className="text-lg font-bold">{h}</div>
            <p className="mt-2 text-sm text-muted-foreground">{p}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
