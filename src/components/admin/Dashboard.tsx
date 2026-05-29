import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Briefcase,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  ArrowRight,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  UserCheck,
  Building2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: "red" | "blue" | "green" | "yellow" | "purple";
  loading?: boolean;
}

function StatsCard({ title, value, change, changeLabel, icon: Icon, color, loading }: StatsCardProps) {
  const colorStyles = {
    red: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    yellow: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  };

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              {value.toLocaleString("id-ID")}
            </h3>
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {change >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    change >= 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {change >= 0 ? "+" : ""}
                  {change}%
                </span>
                <span className="text-xs text-slate-500">
                  {changeLabel || "vs bulan lalu"}
                </span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorStyles[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecentActivity {
  id: string;
  action: string;
  entity_type: string;
  details: Record<string, string>;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  department: string;
  status: string;
  applications_count?: number;
  deadline: string | null;
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  applicant: {
    full_name: string;
  } | null;
  job: {
    title: string;
  } | null;
}

export function Dashboard() {
  // Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalJobs },
        { count: activeJobs },
        { count: totalApplications },
        { count: newApplications },
        { count: shortlistedCount },
        { count: interviewCount },
        { count: hiredCount },
      ] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "shortlisted"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "interview_scheduled"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "hired"),
      ]);

      return {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        totalApplications: totalApplications || 0,
        newApplications: newApplications || 0,
        shortlisted: shortlistedCount || 0,
        interviews: interviewCount || 0,
        hired: hiredCount || 0,
      };
    },
  });

  // Recent Applications
  const { data: recentApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["recent-applications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          created_at,
          applicant:applicant_id(full_name),
          job:job_id(title)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      
      return (data || []) as unknown as Application[];
    },
  });

  // Active Jobs with Application Counts
  const { data: activeJobsList, isLoading: jobsLoading } = useQuery({
    queryKey: ["active-jobs-dashboard"],
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          department,
          status,
          deadline,
          applications:applications(count)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5);
      
      return (jobs || []).map((job: any) => ({
        ...job,
        applications_count: job.applications?.[0]?.count || 0,
      })) as Job[];
    },
  });

  // Recent Activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      return (data || []) as RecentActivity[];
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      screening: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      shortlisted: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      interview_scheduled: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      interview_completed: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
      offered: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
      hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: "Baru",
      screening: "Screening",
      shortlisted: "Shortlist",
      interview_scheduled: "Interview",
      interview_completed: "Interview Done",
      offered: "Offering",
      hired: "Diterima",
      rejected: "Ditolak",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Selamat datang di Admin Portal KYB Indonesia
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="hidden sm:flex">
            <Link to="/admin/jobs">
              <Briefcase className="mr-2 h-4 w-4" />
              Kelola Lowongan
            </Link>
          </Button>
          <Button asChild className="bg-red-600 hover:bg-red-700">
            <Link to="/admin/jobs">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Lowongan
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Lowongan"
          value={stats?.totalJobs || 0}
          change={12}
          icon={Briefcase}
          color="blue"
          loading={statsLoading}
        />
        <StatsCard
          title="Total Pelamar"
          value={stats?.totalApplications || 0}
          change={8}
          icon={Users}
          color="red"
          loading={statsLoading}
        />
        <StatsCard
          title="Pelamar Baru"
          value={stats?.newApplications || 0}
          change={-5}
          icon={FileCheck}
          color="green"
          loading={statsLoading}
        />
        <StatsCard
          title="Kandidat Diterima"
          value={stats?.hired || 0}
          change={15}
          icon={UserCheck}
          color="purple"
          loading={statsLoading}
        />
      </div>

      {/* Pipeline Stats */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Recruitment Pipeline</CardTitle>
          <CardDescription>Status pelamar saat ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: "Baru", count: stats?.newApplications || 0, color: "bg-blue-500" },
              { label: "Screening", count: stats?.totalApplications || 0, color: "bg-yellow-500" },
              { label: "Shortlist", count: stats?.shortlisted || 0, color: "bg-purple-500" },
              { label: "Interview", count: stats?.interviews || 0, color: "bg-orange-500" },
              { label: "Offering", count: 0, color: "bg-cyan-500" },
              { label: "Diterima", count: stats?.hired || 0, color: "bg-emerald-500" },
              { label: "Ditolak", count: 0, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="text-center space-y-2">
                <div className={cn("w-full h-2 rounded-full", item.color)} />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {item.count}
                </p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Pelamar Terbaru</CardTitle>
              <CardDescription>5 pelamar terbaru yang mendaftar</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/applicants">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : recentApplications?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada pelamar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApplications?.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-950 dark:to-red-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">
                          {app.applicant?.full_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {app.applicant?.full_name || "Unknown"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {app.job?.title} • {format(new Date(app.created_at), "dd MMM yyyy", { locale: id })}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(app.status)}>
                      {getStatusLabel(app.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Active Jobs */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg">Lowongan Aktif</CardTitle>
                <CardDescription>{stats?.activeJobs} lowongan terbuka</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/jobs">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : activeJobsList?.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada lowongan aktif</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeJobsList?.map((job) => (
                    <div
                      key={job.id}
                      className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm line-clamp-1">
                            {job.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {job.department}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {job.applications_count} pelamar
                        </Badge>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          Deadline: {format(new Date(job.deadline), "dd MMM yyyy", { locale: id })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/jobs">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Lowongan
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/applicants">
                  <Eye className="mr-2 h-4 w-4" />
                  Review Pelamar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
