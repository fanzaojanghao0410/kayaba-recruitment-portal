import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, CheckCircle2, Clock3, FileCheck, Plus, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { applicationStatusLabels } from "@/constants/company";

type Application = {
  id: string;
  status: string;
  created_at: string;
  applicant: { full_name: string | null } | null;
  job: { title: string | null } | null;
};

type Job = {
  id: string;
  title: string;
  department: string;
  status: string;
  deadline: string | null;
  applications?: Array<{ count: number }>;
};

const pipelineKeys = ["new", "screening", "shortlisted", "interview_scheduled", "offered", "hired", "rejected"];

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: async () => {
      const [jobsRes, applicationsRes, recentRes, activeJobsRes] = await Promise.all([
        supabase.from("jobs").select("id,status", { count: "exact" }),
        supabase.from("applications").select("id,status", { count: "exact" }),
        supabase
          .from("applications")
          .select("id,status,created_at,applicant:applicant_id(full_name),job:job_id(title)")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("jobs")
          .select("id,title,department,status,deadline,applications:applications(count)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (applicationsRes.error) throw applicationsRes.error;
      if (recentRes.error) throw recentRes.error;
      if (activeJobsRes.error) throw activeJobsRes.error;

      const jobs = (jobsRes.data ?? []) as Array<{ id: string; status: string }>;
      const applications = (applicationsRes.data ?? []) as Array<{ id: string; status: string }>;
      const pipeline = pipelineKeys.map((status) => ({
        status,
        count: applications.filter((item) => item.status === status).length,
      }));

      return {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((item) => item.status === "published").length,
        totalApplications: applications.length,
        newApplications: applications.filter((item) => item.status === "new").length,
        hired: applications.filter((item) => item.status === "hired").length,
        rejected: applications.filter((item) => item.status === "rejected").length,
        pipeline,
        recentApplications: (recentRes.data ?? []) as unknown as Application[],
        activeJobsList: (activeJobsRes.data ?? []) as unknown as Job[],
      };
    },
  });

  const stats = [
    { title: "Total Lowongan", value: data?.totalJobs ?? 0, icon: Briefcase },
    { title: "Lowongan Aktif", value: data?.activeJobs ?? 0, icon: FileCheck },
    { title: "Total Pelamar", value: data?.totalApplications ?? 0, icon: Users },
    { title: "Pelamar Baru", value: data?.newApplications ?? 0, icon: Clock3 },
    { title: "Diterima", value: data?.hired ?? 0, icon: CheckCircle2 },
    { title: "Ditolak", value: data?.rejected ?? 0, icon: XCircle },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">HR Command Center</span>
          <h1 className="mt-3 text-3xl font-extrabold">Dashboard Rekrutmen</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ringkasan lowongan, pelamar, status pipeline, dan aktivitas terbaru dari database.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/jobs">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Lowongan
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((item) => (
          <Card key={item.title} className="industrial-card p-5">
            <item.icon className="h-5 w-5 text-primary" />
            <div className="mt-4 text-3xl font-extrabold">{isLoading ? "—" : item.value.toLocaleString("id-ID")}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{item.title}</div>
          </Card>
        ))}
      </div>

      <Card className="industrial-card p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Recruitment Pipeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">Distribusi status lamaran saat ini.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/applicants">Kelola Pelamar</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-7">
          {(data?.pipeline ?? pipelineKeys.map((status) => ({ status, count: 0 }))).map((item) => (
            <div key={item.status} className="border border-border bg-surface p-4">
              <div className="h-1.5 bg-primary" />
              <div className="mt-3 text-2xl font-extrabold">{item.count}</div>
              <div className="mt-1 text-xs font-bold text-muted-foreground">{applicationStatusLabels[item.status] ?? item.status}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="industrial-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">Pelamar Terbaru</h2>
              <p className="mt-1 text-sm text-muted-foreground">Lamaran terbaru yang masuk ke pipeline.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/applicants">
                Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border border border-border">
            {(data?.recentApplications ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Belum ada pelamar.</div>
            ) : (
              data?.recentApplications.map((app) => (
                <div key={app.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="font-bold">{app.applicant?.full_name ?? "Kandidat"}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{app.job?.title ?? "Lowongan"}</div>
                  </div>
                  <Badge variant={app.status === "rejected" ? "destructive" : "outline"}>{applicationStatusLabels[app.status] ?? app.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="industrial-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">Lowongan Aktif</h2>
              <p className="mt-1 text-sm text-muted-foreground">Posisi yang sedang dipublikasikan.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/jobs">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {(data?.activeJobsList ?? []).length === 0 ? (
              <div className="border border-border p-5 text-sm text-muted-foreground">Tidak ada lowongan aktif.</div>
            ) : (
              data?.activeJobsList.map((job) => (
                <div key={job.id} className="border border-border p-4">
                  <div className="font-bold leading-tight">{job.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{job.department}</div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span>{job.deadline ? `Batas ${new Date(job.deadline).toLocaleDateString("id-ID")}` : "Tanpa batas"}</span>
                    <Badge variant="secondary">{job.applications?.[0]?.count ?? 0} pelamar</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}