import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, Mail, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { applicationStatusLabels, employmentTypeLabels } from "@/constants/company";

export const Route = createFileRoute("/_authenticated/applications")({
  component: ApplicationsPage,
  head: () => ({ meta: [{ title: "Mail Box Lamaran - PT Kayaba Indonesia" }] }),
});

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  job: { id: string; title: string; department: string; employment_type: string; location: string } | null;
  timeline?: Array<{ id: string; status: string; title: string; description: string | null; created_at: string }>;
};

const statusTone: Record<string, string> = {
  new: "border-border bg-background text-foreground",
  screening: "border-primary/30 bg-accent text-accent-foreground",
  shortlisted: "border-primary bg-primary text-primary-foreground",
  interview_scheduled: "border-primary bg-primary text-primary-foreground",
  interview_completed: "border-primary bg-primary text-primary-foreground",
  reference_check: "border-primary bg-primary text-primary-foreground",
  offered: "border-primary bg-primary text-primary-foreground",
  hired: "border-primary bg-primary text-primary-foreground",
  rejected: "border-destructive bg-destructive text-destructive-foreground",
  withdrawn: "border-border bg-muted text-muted-foreground",
};

function ApplicationsPage() {
  const { user } = useAuth();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["candidate-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: applicant } = await supabase
        .from("applicants")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!applicant?.id) return [] as ApplicationRow[];

      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          created_at,
          updated_at,
          job:job_id(id,title,department,employment_type,location),
          timeline:application_timeline(id,status,title,description,created_at)
        `)
        .eq("applicant_id", applicant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ApplicationRow[];
    },
  });

  const unreadChanges = (applications ?? []).filter((item) => item.updated_at && item.updated_at !== item.created_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">
            <Mail className="h-4 w-4" />
            Mail Box Pelamar
          </span>
          <h1 className="mt-3 text-3xl font-extrabold">Status Lamaran Saya</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pantau status, timeline, dan perubahan terbaru dari setiap lamaran yang sudah dikirim.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm font-bold">
          <Bell className="h-4 w-4 text-primary" />
          {unreadChanges} pembaruan status
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (applications ?? []).length === 0 ? (
        <Card className="industrial-card p-10 text-center">
          <BriefcaseBusiness className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-extrabold">Belum ada lamaran terkirim</h2>
          <p className="mt-2 text-sm text-muted-foreground">Pilih lowongan aktif lalu gunakan tombol Lamar Sekarang.</p>
          <Button asChild className="mt-5">
            <Link to="/jobs">Cari Lowongan</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5">
          {(applications ?? []).map((application) => (
            <Card key={application.id} className="industrial-card p-5 md:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusTone[application.status] ?? "border-border bg-background"}>
                      {applicationStatusLabels[application.status] ?? application.status}
                    </Badge>
                    {application.job?.department ? <Badge variant="outline">{application.job.department}</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold leading-tight">{application.job?.title ?? "Lowongan"}</h2>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-primary" />
                      {application.job?.employment_type ? employmentTypeLabels[application.job.employment_type] : "-"}
                    </span>
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Dikirim {new Date(application.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  {application.job?.id ? (
                    <Button asChild variant="outline" className="mt-5">
                      <Link to="/jobs/$jobId" params={{ jobId: application.job.id }}>Lihat Detail Lowongan</Link>
                    </Button>
                  ) : null}
                </div>

                <div className="border-l border-border pl-5">
                  <h3 className="font-extrabold">Timeline</h3>
                  <div className="mt-4 space-y-4">
                    {(application.timeline ?? []).length === 0 ? (
                      <TimelineItem title="Lamaran terkirim" date={application.created_at} status={application.status} />
                    ) : (
                      [...(application.timeline ?? [])]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((item) => (
                          <TimelineItem key={item.id} title={item.title} date={item.created_at} status={item.status} description={item.description ?? undefined} />
                        ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineItem({ title, date, status, description }: { title: string; date: string; status: string; description?: string }) {
  const Icon = status === "rejected" ? XCircle : status === "hired" ? CheckCircle2 : Clock3;
  return (
    <div className="flex gap-3 text-sm">
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-primary/30 bg-accent text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-bold">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {new Date(date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
        {description ? <p className="mt-1 leading-6 text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );
}