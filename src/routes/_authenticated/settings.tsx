import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useMyShop, uploadShopMedia } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NICHES, shopTiming, shopSocialLink } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Shop Settings — MenuQR Pro" },
      { name: "description", content: "Update your shop name, branding, WhatsApp number and currency." },
      { property: "og:title", content: "Shop Settings — MenuQR Pro" },
      { property: "og:description", content: "Update your shop branding and contact details." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    niche: NICHES[0]!,
    whatsapp: "",
    phone: "",
    address: "",
    currency: "₹",
    timing: "",
    social_link: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: shop.name,
      tagline: shop.tagline ?? "",
      niche: shop.niche,
      whatsapp: shop.whatsapp ?? "",
      phone: shop.phone ?? "",
      address: shop.address ?? "",
      currency: shop.currency ?? "₹",
      timing: shopTiming(shop) ?? "",
      social_link: shopSocialLink(shop) ?? "",
    });
  }, [shop]);

  async function save() {
    if (!shop) return;
    setSaving(true);
    
    const currentFeatures = shop.features || {};
    const updatedFeatures = {
      ...currentFeatures,
      timing: form.timing.trim() || undefined,
      social_link: form.social_link.trim() || undefined,
    };
    
    // Clean up undefined properties from features before saving
    Object.keys(updatedFeatures).forEach(key => {
      if (updatedFeatures[key] === undefined) {
        delete updatedFeatures[key];
      }
    });

    const { error } = await supabase
      .from("shops")
      .update({
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        niche: form.niche,
        whatsapp: form.whatsapp.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        currency: form.currency || "₹",
        features: updatedFeatures,
      })
      .eq("id", shop.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["my-shop"] });
  }

  async function upload(kind: "logo_url" | "cover_url", file?: File) {
    if (!shop || !file) return;
    try {
      const url = await uploadShopMedia(file, shop.id);
      const patch = kind === "logo_url" ? { logo_url: url } : { cover_url: url };
      const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
      if (error) throw error;
      toast.success("Image updated");
      qc.invalidateQueries({ queryKey: ["my-shop"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <DashboardShell title="Shop Settings" description="Branding and contact details." isAdmin={isAdmin}>
      {!shop ? (
        <p className="text-sm text-muted-foreground">Create your shop on the dashboard first.</p>
      ) : (
        <div className="max-w-2xl space-y-4 rounded-2xl border bg-card p-6">
          <Text id="s-name" label="Shop name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Text id="s-tag" label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
          <div className="space-y-2">
            <Label htmlFor="s-niche">Business type</Label>
            <select
              id="s-niche"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.niche}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
            >
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <Text id="s-wa" label="WhatsApp number" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <Text id="s-phone" label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Text id="s-addr" label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          <Text id="s-timing" label="Opening Hours (e.g. Mon-Sun, 9am-10pm)" value={form.timing} onChange={(v) => setForm({ ...form, timing: v })} />
          <Text id="s-social" label="Social Media Link (e.g. Instagram URL)" value={form.social_link} onChange={(v) => setForm({ ...form, social_link: v })} />
          <Text id="s-cur" label="Currency symbol" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-logo">Logo</Label>
              <Input id="s-logo" type="file" accept="image/*" onChange={(e) => upload("logo_url", e.target.files?.[0])} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-cover">Cover image</Label>
              <Input id="s-cover" type="file" accept="image/*" onChange={(e) => upload("cover_url", e.target.files?.[0])} />
            </div>
          </div>

          <Button onClick={save} disabled={saving}>
            Save changes
          </Button>
          <p className="text-xs text-muted-foreground">Public link: /shop/{shop.slug}</p>
        </div>
      )}
    </DashboardShell>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
