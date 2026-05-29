import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
  head: () => ({ meta: [{ title: "HR Command Center - PT Kayaba Indonesia" }] }),
});

const schema = z.object({
  email: z.string().email("Email tidak valid").max(200),
  password: z.string().min(6, "Password minimal 6 karakter").max(72),
});

type AdminLoginForm = z.infer<typeof schema>;

function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({ resolver: zodResolver(schema) });

  const submit = async (payload: AdminLoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(payload);
    setLoading(false);

    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email atau password salah" : error.message);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const canAccessAdmin = roles?.some((item) => item.role === "admin" || item.role === "hr");

    if (!canAccessAdmin) {
      await supabase.auth.signOut();
      toast.error("Akun ini tidak memiliki akses HR.");
      return;
    }

    toast.success("Masuk ke HR Command Center.");
    navigate({ to: "/admin" });
  };

  return (
    <SiteShell>
      <section className="container-page grid gap-8 py-12 md:py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="dark-panel rounded-lg p-7 md:p-10">
          <span className="eyebrow text-white/70">
            <LockKeyhole className="h-4 w-4" />
            Restricted Access
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            HR Command Center untuk mengelola pipeline rekrutmen.
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-white/68">
            Area ini dibuat untuk tim HR dan administrator: kelola lowongan, pantau kandidat,
            dokumentasikan catatan internal, dan jaga integritas proses seleksi.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Role-based access", "Audit trail", "Candidate pipeline"].map((item) => (
              <div key={item} className="rounded-md border border-white/12 bg-white/8 p-4 text-sm font-bold text-white">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="industrial-card p-6 md:p-8">
          <div className="mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold">Login HR/Admin</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hanya akun dengan role admin atau HR yang dapat masuk.
            </p>
          </div>

          <form onSubmit={handleSubmit(submit)} className="grid gap-4">
            <div>
              <Label htmlFor="email">Email Internal</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="hr@kyb.co.id"
                className="mt-1.5 h-11"
                {...register("email")}
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  className="h-11 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Tampilkan password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </Button>

            <div className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
              Kandidat umum?{" "}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Masuk kandidat
              </Link>
            </div>
          </form>
        </Card>
      </section>
    </SiteShell>
  );
}
