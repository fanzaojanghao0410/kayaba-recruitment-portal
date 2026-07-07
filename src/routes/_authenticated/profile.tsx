import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profil Kandidat - PT Kayaba Indonesia" }] }),
});

type ApplicantProfile = {
  id?: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  address_domicile?: string | null;
  summary?: string | null;
  expected_salary?: number | null;
};

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["candidate-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("applicants").select("*").eq("user_id", user!.id).maybeSingle();
      const nextProfile = (data ?? {
        user_id: user!.id,
        email: user!.email,
        full_name: user!.user_metadata?.full_name ?? "",
      }) as ApplicantProfile;
      setProfile(nextProfile);
      return nextProfile;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!profile || !user) return;
      const { error } = await supabase.from("applicants").upsert({ ...profile, user_id: user.id, email: profile.email ?? user.email });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil kandidat tersimpan.");
      queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !profile) {
    return <div className="h-80 animate-pulse bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <span className="eyebrow">
          <UserRound className="h-4 w-4" />
          Candidate Profile
        </span>
        <h1 className="mt-3 text-3xl font-extrabold">Profil Saya</h1>
        <p className="mt-2 text-sm text-muted-foreground">Lengkapi data utama agar proses seleksi lebih mudah ditinjau HR.</p>
      </div>

      <Card className="industrial-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Lengkap">
            <Input value={profile.full_name ?? ""} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={profile.email ?? user?.email ?? ""} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
          </Field>
          <Field label="Telepon">
            <Input value={profile.phone ?? ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
          </Field>
          <Field label="Kota Domisili">
            <Input value={profile.city ?? ""} onChange={(event) => setProfile({ ...profile, city: event.target.value })} />
          </Field>
          <Field label="Ekspektasi Gaji">
            <Input type="number" value={profile.expected_salary ?? ""} onChange={(event) => setProfile({ ...profile, expected_salary: event.target.value ? Number(event.target.value) : null })} />
          </Field>
          <Field label="Alamat Domisili">
            <Input value={profile.address_domicile ?? ""} onChange={(event) => setProfile({ ...profile, address_domicile: event.target.value })} />
          </Field>
        </div>
        <div className="mt-4">
          <Label>Ringkasan Profil</Label>
          <Textarea className="mt-1.5" rows={5} value={profile.summary ?? ""} onChange={(event) => setProfile({ ...profile, summary: event.target.value })} />
        </div>
        <Button className="mt-5" onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {save.isPending ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}