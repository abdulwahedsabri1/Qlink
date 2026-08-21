import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, LayoutDashboard, LogOut, Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAllStaff, useIsAdmin } from "@/hooks/useShopData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Shop } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Super Admin — MenuQR Pro" },
      { name: "description", content: "Platform administration for shops, staff, plans and status." },
      { property: "og:title", content: "Super Admin — MenuQR Pro" },
      { property: "og:description", content: "Platform administration for shops, staff and users." },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "shops" | "staff";

function AdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");

  const { data: shops } = useQuery({
    queryKey: ["admin-shops"],
    enabled: !!isAdmin,
    queryFn: async (): Promise<Shop[]> => {
      const { data, error } = await supabase.from("shops").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Shop[];
    },
  });

  const { data: staff } = useAllStaff(!!isAdmin);

  const { data: itemCount } = useQuery({
    queryKey: ["admin-item-count"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { count } = await supabase.from("menu_items").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: scanCount } = useQuery({
    queryKey: ["admin-scan-count"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { count } = await supabase.from("analytics_events").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return shops ?? [];
    return (shops ?? []).filter(
      (s) => s.name.toLowerCase().includes(term) || s.slug.includes(term) || s.niche.toLowerCase().includes(term),
    );
  }, [shops, q]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("shops").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Shop updated");
    qc.invalidateQueries({ queryKey: ["admin-shops"] });
  }

  async function setPlan(id: string, plan: string) {
    const { error } = await supabase.from("shops").update({ plan }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plan updated");
    qc.invalidateQueries({ queryKey: ["admin-shops"] });
  }

  async function setStaffStatus(id: string, status: string) {
    const { error } = await supabase.from("staff").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["all-staff"] });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isLoading) {
    return <AdminFrame tab={tab} setTab={setTab} onSignOut={signOut}><p className="text-slate-400">Loading…</p></AdminFrame>;
  }

  if (!isAdmin) {
    return (
      <AdminFrame tab={tab} setTab={setTab} onSignOut={signOut}>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="font-display text-xl font-semibold text-white">Restricted area</h2>
          <p className="mt-2 text-sm text-slate-400">This console is only available to platform administrators.</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to my dashboard</Link>
          </Button>
        </div>
      </AdminFrame>
    );
  }

  const active = (shops ?? []).filter((s) => s.status === "active").length;

  return (
    <AdminFrame tab={tab} setTab={setTab} onSignOut={signOut}>
      {tab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStat label="Total shops" value={shops?.length ?? 0} />
          <AdminStat label="Active shops" value={active} />
          <AdminStat label="Menu items" value={itemCount ?? 0} />
          <AdminStat label="Tracked events" value={scanCount ?? 0} />
          <AdminStat label="Staff members" value={staff?.length ?? 0} />
          <AdminStat label="Paid plans" value={(shops ?? []).filter((s) => s.plan !== "basic").length} />
          <AdminStat label="Suspended" value={(shops ?? []).filter((s) => s.status === "suspended").length} />
          <AdminStat
            label="New this week"
            value={
              (shops ?? []).filter((s) => Date.now() - new Date(s.created_at).getTime() < 7 * 86400000).length
            }
          />
        </div>
      )}

      {tab === "shops" && (
        <div className="space-y-4">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shops by name, slug or niche"
            className="max-w-sm border-white/10 bg-white/5 text-white placeholder:text-slate-500"
          />
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-sm text-slate-200">
              <thead className="border-b border-white/10 text-left text-slate-400">
                <tr>
                  <th className="p-3">Shop</th>
                  <th className="p-3">Niche</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="p-3">
                      <p className="font-medium text-white">{s.name}</p>
                      <a
                        href={`/shop/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        /shop/{s.slug}
                      </a>
                    </td>
                    <td className="p-3">{s.niche}</td>
                    <td className="p-3">
                      <select
                        aria-label={`Plan for ${s.name}`}
                        value={s.plan}
                        onChange={(e) => setPlan(s.id, e.target.value)}
                        className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs"
                      >
                        <option value="basic">basic</option>
                        <option value="pro">pro</option>
                        <option value="premium">premium</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          s.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400",
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-transparent text-white hover:bg-white/10"
                        onClick={() => setStatus(s.id, s.status === "active" ? "suspended" : "active")}
                      >
                        {s.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={5}>
                      No shops found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "staff" && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-slate-200">
            <thead className="border-b border-white/10 text-left text-slate-400">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Role</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {(staff ?? []).map((m) => (
                <tr key={m.id} className="border-b border-white/5 last:border-0">
                  <td className="p-3 font-medium text-white">{m.name}</td>
                  <td className="p-3">{m.shops?.name ?? "—"}</td>
                  <td className="p-3">{m.role}</td>
                  <td className="p-3 text-slate-400">{m.phone ?? m.email ?? "—"}</td>
                  <td className="p-3">{m.status}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10"
                      onClick={() => setStaffStatus(m.id, m.status === "active" ? "inactive" : "active")}
                    >
                      {m.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
              {(staff?.length ?? 0) === 0 && (
                <tr>
                  <td className="p-4 text-slate-400" colSpan={6}>
                    No staff added yet. Shop owners add staff from their dashboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminFrame>
  );
}

function AdminFrame({
  tab,
  setTab,
  onSignOut,
  children,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "shops", label: "Shops", icon: Building2 },
    { id: "staff", label: "Staff", icon: Users },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500 text-slate-950">
              <Shield className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">MenuQR Admin Console</p>
              <p className="text-xs text-slate-400">Platform control centre</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link to="/dashboard">My dashboard</Link>
            </Button>
            <Button size="sm" variant="ghost" className="text-slate-300 hover:bg-white/10" onClick={onSignOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-5 pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white",
                tab === t.id && "bg-emerald-500/15 text-emerald-400",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-5 lg:p-8">{children}</main>
    </div>
  );
}

function AdminStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value.toLocaleString("en-IN")}</p>
    </div>
  );
}
