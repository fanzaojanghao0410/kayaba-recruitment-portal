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
import { companyProfile, uxTrustSignals } from "@/constants/company";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Masuk Kandidat - PT Kayaba Indonesia" }] }),
});

const schema = z.object({
  email: z.string().email("Email tidak valid").max(200),
  password: z.string().min(6, "Password minimal 6 karakter").max(72),
});

type LoginForm = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const submit = async (payload: LoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(payload);
    setLoading(false);

    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email atau password salah" : error.message);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      navigate({ to: "/" });
      return;
    }

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const canAccessAdmin = roles?.some((item: { role: string }) => item.role === "admin" || item.role === "hr");
    toast.success("Berhasil masuk.");
    navigate({ to: canAccessAdmin ? "/admin" : "/jobs" });
  };

  return (
    <SiteShell>
      <section className="container-page grid gap-8 py-12 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <span className="eyebrow">
            <LockKeyhole className="h-4 w-4" />
            Candidate Access
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Masuk untuk melanjutkan perjalanan seleksi Anda.
          </h1>
          <p className="mt-5 max-w-xl leading-8 text-muted-foreground">
            Portal kandidat membantu Anda melamar posisi, memperbarui profil, dan mengikuti proses
            rekrutmen {companyProfile.shortName} dengan lebih tertata.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {uxTrustSignals.map((item) => (
              <div key={item.title} className="industrial-card p-4">
                <div className="font-extrabold">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="industrial-card p-6 md:p-8">
          <div className="mb-6">
            <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold">Masuk Kandidat</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/register" className="font-bold text-primary hover:underline">
                Daftar kandidat
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(submit)} className="grid gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                className="mt-1.5 h-11"
                {...register("email")}
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs font-bold text-primary hover:underline">
                  Lupa password?
                </button>
              </div>
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
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>

            <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
              Satu portal untuk kandidat dan tim HR. Sistem otomatis mengarahkan Anda ke dashboard sesuai role akun.
            </div>
          </form>
        </Card>
      </section>
    </SiteShell>
  );
}
