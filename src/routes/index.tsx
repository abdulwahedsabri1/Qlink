import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Check, QrCode, Sparkles, Smartphone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuQR Pro — QR Menus & Catalogs for Local Businesses" },
      {
        name: "description",
        content:
          "Create a beautiful digital menu or catalog, share it with one QR code, and take orders on WhatsApp. Built for restaurants, salons, bakeries and boutiques.",
      },
      { property: "og:title", content: "MenuQR Pro — QR Menus & Catalogs for Local Businesses" },
      {
        property: "og:description",
        content: "One QR code for your entire menu or catalog, with WhatsApp ordering and live analytics.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: QrCode, title: "One QR, always current", body: "Update prices any time — the printed QR never changes." },
  { icon: Smartphone, title: "Premium mobile menu", body: "A fast, image-rich menu page your customers actually enjoy." },
  { icon: MessageCircle, title: "WhatsApp ordering", body: "Customers build a cart and send the order straight to your phone." },
  { icon: Sparkles, title: "AI menu generator", body: "Describe your business and get a full menu draft in seconds." },
  { icon: BarChart3, title: "Live analytics", body: "See scans, views and your most-viewed items." },
  { icon: Check, title: "Any local business", body: "Restaurants, salons, bakeries, boutiques, clinics and more." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <QrCode className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">MenuQR Pro</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/pricing" className="hidden px-3 text-sm text-muted-foreground hover:text-foreground sm:block">
              Pricing
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" /> AI-powered digital menus
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          One QR code. Your entire business, on every phone.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          MenuQR Pro turns your menu or product catalog into a premium mobile page customers open by
          scanning — and order from on WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Create your free QR menu <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/pricing">See pricing</Link>
          </Button>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-3xl font-semibold">Everything your shop needs</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-3xl font-semibold">Simple plans</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border bg-card p-6 ${p.highlight ? "ring-2 ring-primary" : ""}`}
              >
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
                <p className="mt-4 font-display text-3xl font-semibold">{p.price}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full" variant={p.highlight ? "default" : "outline"}>
                  <Link to="/auth">Start with {p.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MenuQR Pro. Built for local businesses.
      </footer>
    </div>
  );
}
