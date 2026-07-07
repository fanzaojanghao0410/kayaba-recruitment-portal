import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
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

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: "Daftar Kandidat - PT Kayaba Indonesia" }] }),
});

const schema = z
  .object({
    full_name: z.string().min(3, "Nama minimal 3 karakter").max(120),
    email: z.string().email("Email tidak valid").max(200),
    phone: z.string().min(9, "Nomor telepon minimal 9 digit").max(20),
    city: z.string().min(2, "Kota wajib diisi").max(80),
    password: z.string().min(6, "Password minimal 6 karakter").max(72),
    passwordConfirm: z.string().min(6),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Konfirmasi password tidak sama",
    path: ["passwordConfirm"],
  });

type RegisterForm = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) });

  const submit = async (payload: RegisterForm) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: { data: { full_name: payload.full_name, phone: payload.phone } },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message === "User already registered" ? "Email sudah terdaftar" : error.message);
      return;
    }

    if (data.user) {
      await supabase.from("applicants").upsert({
        user_id: data.user.id,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        city: payload.city,
      });
    }

    setLoading(false);
    toast.success("Akun kandidat berhasil dibuat.");
    navigate({ to: "/jobs" });
  };

  return (
    <SiteShell>
      <section className="container-page grid gap-8 py-12 md:py-16 lg:grid-cols-[0.9fr_1fr] lg:items-start">
        <div>
          <span className="eyebrow">
            <UserPlus className="h-4 w-4" />
            Candidate Registration
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Buat akun kandidat resmi KYB Indonesia.
          </h1>
          <p className="mt-5 max-w-xl leading-8 text-muted-foreground">
            Data ini menjadi identitas awal untuk melamar lowongan, memantau status seleksi, dan menerima pembaruan dari tim HR.
          </p>
          <div className="mt-8 border border-primary/30 bg-accent p-4 text-sm leading-6 text-accent-foreground">
            Rekrutmen PT Kayaba Indonesia tidak memungut biaya. Gunakan email dan nomor telepon aktif agar komunikasi seleksi lebih aman.
          </div>
        </div>

        <Card className="industrial-card p-6 md:p-8">
          <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
            <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Daftar Kandidat</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Masuk kandidat
                </Link>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(submit)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Lengkap" error={errors.full_name?.message}>
                <Input className="mt-1.5" {...register("full_name")} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" className="mt-1.5" {...register("email")} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nomor Telepon" error={errors.phone?.message}>
                <Input className="mt-1.5" {...register("phone")} />
              </Field>
              <Field label="Kota Domisili" error={errors.city?.message}>
                <Input className="mt-1.5" {...register("city")} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Password" error={errors.password?.message}>
                <Input type="password" className="mt-1.5" {...register("password")} />
              </Field>
              <Field label="Konfirmasi Password" error={errors.passwordConfirm?.message}>
                <Input type="password" className="mt-1.5" {...register("passwordConfirm")} />
              </Field>
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Buat Akun
            </Button>
          </form>
        </Card>
      </section>
    </SiteShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}