import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart3, ExternalLink, QrCode, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics, useIsAdmin, useMenuItems, useMyShop } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, money, NICHES, planOf, PLAN_PRICE, slugify } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MenuQR Pro" },
      { name: "description", content: "Manage your shop, menu and QR code from your MenuQR Pro dashboard." },
      { property: "og:title", content: "Dashboard — MenuQR Pro" },
      { property: "og:description", content: "Manage your shop, menu and QR code." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { data: shop, isLoading } = useMyShop(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: items } = useMenuItems(shop?.id);
  const { data: events } = useAnalytics(shop?.id);

  const views = (events ?? []).filter((e) => e.event_type === "view").length;
  const scans = (events ?? []).filter((e) => e.event_type === "scan").length;

  return (
    <DashboardShell title="Dashboard" description="Overview of your shop." isAdmin={isAdmin}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !shop ? (
        <CreateShop userId={user?.id} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Menu views (30d)" value={views} icon={BarChart3} />
            <Stat label="QR scans (30d)" value={scans} icon={QrCode} />
            <Stat label="Menu items" value={items?.length ?? 0} icon={UtensilsCrossed} />
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">{shop.name}</h2>
            <p className="text-sm text-muted-foreground">
              {shop.niche} · status {shop.status}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Meta label="Plan" value={<span className="capitalize">{shop.plan}</span>} />
              <Meta label="Started on" value={formatDate(shop.plan_started_at ?? shop.created_at)} />
              <Meta label="Renews / ends" value={formatDate(shop.plan_expires_at)} />
              <Meta
                label="Payment"
                value={
                  shop.payment_status === "paid" ? (
                    <span className="text-primary">Paid {money(Number(shop.amount_paid ?? PLAN_PRICE[shop.plan] ?? 0))}</span>
                  ) : shop.plan === "basic" ? (
                    <span className="text-muted-foreground">Free plan</span>
                  ) : (
                    <span className="text-destructive">Unpaid</span>
                  )
                }
              />
            </div>

            <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {[
                `${Number.isFinite(planOf(shop.plan).items) ? planOf(shop.plan).items : "Unlimited"} menu items`,
                planOf(shop.plan).ai ? "AI menu tools" : "AI tools locked",
                planOf(shop.plan).ordering ? "WhatsApp ordering" : "Ordering locked",
                planOf(shop.plan).analytics ? "Full analytics" : "Basic view counter",
              ].map((f) => (
                <li key={f} className="rounded-full border px-2.5 py-1">
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> View public menu
                </a>
              </Button>
              <Button asChild size="sm">
                <Link to="/menu">Edit menu</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/qr">Get QR code</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function CreateShop({ userId }: { userId?: string | undefined }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState(NICHES[0]!);
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!userId) return;
    if (name.trim().length < 2) {
      toast.error("Enter your shop name");
      return;
    }
    setSaving(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("shops").insert({
      owner_id: userId,
      name: name.trim(),
      slug,
      niche,
      whatsapp: whatsapp.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Shop created");
    qc.invalidateQueries({ queryKey: ["my-shop"] });
  }

  return (
    <div className="max-w-lg rounded-2xl border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Create your shop</h2>
      <p className="mt-1 text-sm text-muted-foreground">This takes about 30 seconds.</p>
      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop-name">Shop name</Label>
          <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rafeek Textile" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="niche">Business type</Label>
          <select
            id="niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {NICHES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wa">WhatsApp number (with country code)</Label>
          <Input id="wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="919876543210" />
        </div>
        <Button className="w-full" onClick={create} disabled={saving}>
          Create shop
        </Button>
      </div>
    </div>
  );
}
