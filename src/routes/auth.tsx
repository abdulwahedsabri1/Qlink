import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — MenuQR Pro" },
      { name: "description", content: "Log in or create your MenuQR Pro account to build a QR menu for your business." },
      { property: "og:title", content: "Sign in — MenuQR Pro" },
      { property: "og:description", content: "Log in or create your MenuQR Pro account." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: "/dashboard", replace: true });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handle(mode: "login" | "signup") {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
        });
        if (error) {
          toast.error(
            error.message.toLowerCase().includes("invalid")
              ? "Wrong email or password. Please check and try again."
              : error.message,
          );
          return;
        }
        if (data.session) {
          toast.success("Welcome back");
          navigate({ to: "/dashboard", replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email.toLowerCase(),
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() },
          },
        });
        if (error) {
          toast.error(
            error.message.toLowerCase().includes("registered")
              ? "This email already has an account — log in instead."
              : error.message,
          );
          return;
        }
        if (data.session) navigate({ to: "/dashboard", replace: true });
        else toast.success("Check your email to confirm your account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-hero-gradient p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 text-background">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-gradient">
            <QrCode className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-semibold">MenuQR Pro</span>
        </Link>
        <div className="max-w-md text-background">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            One QR code. Your entire business, on every phone.
          </h2>
          <p className="mt-4 text-background/70">
            Restaurants, salons, bakeries and boutiques use MenuQR Pro to publish live menus and
            catalogs customers can order from on WhatsApp.
          </p>
        </div>
        <p className="text-sm text-background/50">Trusted by local businesses across India.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your shop, or create a free account.
          </p>

          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6 space-y-4" onKeyDown={(e) => { if (e.key === "Enter") void handle("login"); }}>
              <Field id="email" label="Email" value={email} onChange={setEmail} type="email" />
              <Field id="password" label="Password" value={password} onChange={setPassword} type="password" />
              <Button className="w-full" disabled={loading} onClick={() => handle("login")}>
                Log in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-4">
              <Field id="name" label="Your name" value={name} onChange={setName} />
              <Field id="email2" label="Email" value={email} onChange={setEmail} type="email" />
              <Field id="password2" label="Password" value={password} onChange={setPassword} type="password" />
              <Button className="w-full" disabled={loading} onClick={() => handle("signup")}>
                Create free account
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
