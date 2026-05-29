import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Factory,
  GraduationCap,
  MapPin,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { educationLabels, employmentTypeLabels, hiringSteps } from "@/constants/company";

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetailPage,
});

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string[] | string | null;
  responsibilities: string[] | string | null;
  qualifications: string[] | string | null;
  skills_required: string[] | string | null;
  benefits: string[] | string | null;
  min_education: string | null;
  min_experience_years: number | null;
  status: string;
  deadline: string | null;
  quota: number | null;
};

function normalizeList(value: string[] | string | null | undefined) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["public-job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (error) throw error;
      return data as Job;
    },
  });

  const { data: applicant } = useQuery({
    queryKey: ["applicant-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("applicants")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { id: string } | null;
    },
  });

  const { data: existingApplication } = useQuery({
    queryKey: ["existing-application", jobId, applicant?.id],
    enabled: !!applicant?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id,status")
        .eq("job_id", jobId)
        .eq("applicant_id", applicant!.id)
        .maybeSingle();
      return data as { id: string; status: string } | null;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Silakan masuk terlebih dahulu.");

      let applicantId = applicant?.id;
      if (!applicantId) {
        const { data: createdApplicant, error: applicantError } = await supabase
          .from("applicants")
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Kandidat",
          })
          .select("id")
          .single();
        if (applicantError) throw applicantError;
        applicantId = createdApplicant.id;
      }

      const { data: createdApplication, error } = await supabase
        .from("applications")
        .insert({
          applicant_id: applicantId,
          job_id: jobId,
          status: "new",
        })
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("application_timeline").insert({
        application_id: createdApplication.id,
        status: "new",
        title: "Lamaran dikirim",
        description: "Kandidat mengirim lamaran melalui portal karier.",
      });
    },
    onSuccess: () => {
      toast.success("Lamaran berhasil dikirim.");
      queryClient.invalidateQueries({ queryKey: ["existing-application"] });
      queryClient.invalidateQueries({ queryKey: ["applicant-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <SiteShell>
        <div className="container-page py-16">
          <div className="h-80 animate-pulse rounded-lg bg-muted" />
        </div>
      </SiteShell>
    );
  }

  if (!job) {
    return (
      <SiteShell>
        <div className="container-page py-16 text-center">
          <h1 className="text-2xl font-extrabold">Lowongan tidak ditemukan</h1>
          <Button asChild className="mt-5">
            <Link to="/jobs">Kembali ke lowongan</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const requirements = normalizeList(job.requirements);
  const responsibilities = normalizeList(job.responsibilities);
  const skills = normalizeList(job.skills_required);
  const benefits = normalizeList(job.benefits);
  const isOpen = job.status === "published" || job.status === "open";

  return (
    <SiteShell>
      <section className="border-b border-border bg-white">
        <div className="container-page py-10 md:py-14">
          <Button variant="ghost" asChild className="-ml-3 mb-6">
            <Link to="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke daftar lowongan
            </Link>
          </Button>
          <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground">{job.department}</Badge>
                <Badge variant={isOpen ? "secondary" : "outline"}>
                  {isOpen ? "Dibuka" : "Tidak aktif"}
                </Badge>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight md:text-5xl">
                {job.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
                {job.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {job.location}
                </span>
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4 text-primary" />
                  {employmentTypeLabels[job.employment_type] ?? job.employment_type}
                </span>
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Min.{" "}
                  {job.min_education
                    ? (educationLabels[job.min_education] ?? job.min_education.toUpperCase())
                    : "-"}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Batas{" "}
                    {new Date(job.deadline).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            <Card className="industrial-card p-5 lg:sticky lg:top-28">
              <h2 className="text-lg font-extrabold">Ringkasan Posisi</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Departemen</dt>
                  <dd className="font-bold text-right">{job.department}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Lokasi</dt>
                  <dd className="font-bold text-right">{job.location}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <dt className="text-muted-foreground">Pengalaman</dt>
                  <dd className="font-bold text-right">{job.min_experience_years ?? 0}+ tahun</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Kuota</dt>
                  <dd className="font-bold text-right">
                    {job.quota ? `${job.quota} orang` : "Menyesuaikan"}
                  </dd>
                </div>
              </dl>
              <div className="mt-6">
                {existingApplication ? (
                  <Button className="w-full" disabled>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Sudah Dilamar
                  </Button>
                ) : !isOpen ? (
                  <Button className="w-full" disabled>
                    Lowongan Tidak Aktif
                  </Button>
                ) : !user ? (
                  <Button className="w-full" asChild>
                    <Link to="/login">Masuk untuk Melamar</Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => apply.mutate()}
                    disabled={apply.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {apply.isPending ? "Mengirim..." : "Lamar Sekarang"}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="space-y-6">
            <ContentBlock
              title="Tanggung Jawab"
              items={responsibilities}
              fallback={job.description}
            />
            <ContentBlock
              title="Kualifikasi"
              items={requirements}
              fallback="Kualifikasi lengkap akan diinformasikan oleh tim HR sesuai kebutuhan posisi."
            />
          </div>
          <div className="space-y-6">
            <ContentBlock
              title="Skill yang Dibutuhkan"
              items={skills}
              fallback="Kemampuan teknis dan komunikasi sesuai kebutuhan departemen."
            />
            <ContentBlock
              title="Benefit"
              items={benefits}
              fallback="Benefit mengikuti kebijakan perusahaan dan ketentuan yang berlaku."
            />
          </div>
        </div>
      </section>

      <section className="bg-surface py-14">
        <div className="container-page">
          <div className="mb-8 flex items-center gap-3">
            <Factory className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-extrabold">Alur Rekrutmen</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {hiringSteps.map((step, index) => (
              <div key={step.title} className="industrial-card p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-extrabold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mt-4 font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function ContentBlock({
  title,
  items,
  fallback,
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <Card className="industrial-card p-6">
      <h2 className="red-rule pl-5 text-xl font-extrabold">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{fallback}</p>
      )}
    </Card>
  );
}
