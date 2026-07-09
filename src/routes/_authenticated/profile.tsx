import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Save, UserRound, FileText, Download, Upload, ShieldCheck } from "lucide-react";
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
  cv_path?: string | null;
  cv_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
};

const MAX_CV_MB = 5;

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [uploading, setUploading] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["candidate-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("applicants")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
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
      const { error } = await supabase
        .from("applicants")
        .upsert(
          { ...profile, user_id: user.id, email: profile.email ?? user.email },
          { onConflict: "user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil kandidat tersimpan.");
      queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleCvUpload = async (file: File) => {
    if (!user || !profile) return;
    if (file.size > MAX_CV_MB * 1024 * 1024) {
      toast.error(`Ukuran CV maksimum ${MAX_CV_MB} MB.`);
      return;
    }
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      toast.error("Format harus PDF, DOC, atau DOCX.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${user.id}/cv-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("applicant-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // Hapus file lama kalau ada
      if (profile.cv_path && profile.cv_path !== path) {
        await supabase.storage.from("applicant-documents").remove([profile.cv_path]);
      }

      const nextProfile = { ...profile, cv_path: path };
      const { error: dbErr } = await supabase
        .from("applicants")
        .upsert(
          { ...nextProfile, user_id: user.id, email: profile.email ?? user.email },
          { onConflict: "user_id" },
        );
      if (dbErr) throw dbErr;

      setProfile(nextProfile);
      toast.success("CV berhasil di-upload.");
      queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
      queryClient.invalidateQueries({ queryKey: ["applicant-profile"] });
    } catch (err: any) {
      toast.error(err.message ?? "Gagal upload CV.");
    } finally {
      setUploading(false);
    }
  };

  const downloadOwnCv = async () => {
    if (!profile?.cv_path) return;
    const { data, error } = await supabase.storage
      .from("applicant-documents")
      .createSignedUrl(profile.cv_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  if (isLoading || !profile) {
    return <div className="h-80 animate-pulse bg-muted" />;
  }

  const cvName = profile.cv_path ? profile.cv_path.split("/").pop() : null;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <span className="eyebrow">
          <UserRound className="h-4 w-4" />
          Candidate Profile
        </span>
        <h1 className="mt-3 text-3xl font-extrabold">Profil Saya</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lengkapi data utama & upload CV. CV wajib ada sebelum Anda dapat melamar posisi.
        </p>
      </div>

      {!profile.cv_path ? (
        <div className="flex items-start gap-3 border border-primary/40 bg-accent p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <div className="font-bold">CV belum diupload</div>
            <p className="mt-1 text-muted-foreground">
              Upload CV (PDF/DOC/DOCX, maks {MAX_CV_MB} MB) di kartu di bawah agar bisa melamar lowongan.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="industrial-card p-6">
        <div className="mb-5 flex items-center gap-2 border-b border-border pb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-extrabold">Dokumen CV / Resume</h2>
        </div>
        {profile.cv_path ? (
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-center gap-3 border border-border p-3">
              <div className="flex h-11 w-11 items-center justify-center bg-accent text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold">{cvName}</div>
                <div className="text-xs text-muted-foreground">Tersimpan aman di storage KYB</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={downloadOwnCv}>
                <Download className="mr-2 h-4 w-4" />
                Lihat
              </Button>
              <label className="inline-flex">
                <Button asChild disabled={uploading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Mengupload..." : "Ganti CV"}
                  </span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleCvUpload(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border p-8 text-center hover:border-primary hover:bg-accent">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="font-bold">Klik untuk upload CV</div>
            <div className="text-xs text-muted-foreground">PDF / DOC / DOCX · maks {MAX_CV_MB} MB</div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleCvUpload(file);
                event.target.value = "";
              }}
            />
            {uploading ? <div className="mt-2 text-xs text-primary">Sedang mengupload...</div> : null}
          </label>
        )}
      </Card>

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
          <Field label="Ekspektasi Gaji (Rp)">
            <Input
              type="number"
              value={profile.expected_salary ?? ""}
              onChange={(event) =>
                setProfile({
                  ...profile,
                  expected_salary: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </Field>
          <Field label="Alamat Domisili">
            <Input value={profile.address_domicile ?? ""} onChange={(event) => setProfile({ ...profile, address_domicile: event.target.value })} />
          </Field>
          <Field label="LinkedIn URL">
            <Input value={profile.linkedin_url ?? ""} onChange={(event) => setProfile({ ...profile, linkedin_url: event.target.value })} />
          </Field>
          <Field label="Portfolio URL">
            <Input value={profile.portfolio_url ?? ""} onChange={(event) => setProfile({ ...profile, portfolio_url: event.target.value })} />
          </Field>
        </div>
        <div className="mt-4">
          <Label>Ringkasan Profil</Label>
          <Textarea
            className="mt-1.5"
            rows={5}
            value={profile.summary ?? ""}
            onChange={(event) => setProfile({ ...profile, summary: event.target.value })}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {save.isPending ? "Menyimpan..." : "Simpan Profil"}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/jobs">Cari lowongan</Link>
          </Button>
        </div>
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
