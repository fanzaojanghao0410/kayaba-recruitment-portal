import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { educationLabels, employmentTypeLabels, jobDepartments } from "@/constants/company";

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
  head: () => ({
    meta: [
      { title: "Lowongan Kerja - PT Kayaba Indonesia" },
      {
        name: "description",
        content:
          "Telusuri lowongan kerja PT Kayaba Indonesia untuk fungsi produksi, engineering, quality, maintenance, supply chain, dan support function.",
      },
    ],
  }),
});

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  status: string;
  description: string | null;
  min_education: string | null;
  min_experience_years: number | null;
  deadline: string | null;
  is_featured: boolean | null;
  created_at: string;
};

function JobsPage() {
  const [keyword, setKeyword] = useState("");
  const [department, setDepartment] = useState("all");
  const [type, setType] = useState("all");
  const [education, setEducation] = useState("all");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .in("status", ["published", "open"])
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      return (data ?? []) as Job[];
    },
  });

  const departments = useMemo(() => {
    const existing = new Set((jobs ?? []).map((job) => job.department).filter(Boolean));
    jobDepartments.forEach((item) => existing.add(item));
    return Array.from(existing).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    return (jobs ?? []).filter((job) => {
      const haystack =
        `${job.title} ${job.department} ${job.description ?? ""} ${job.location}`.toLowerCase();
      if (keyword && !haystack.includes(keyword.toLowerCase())) return false;
      if (department !== "all" && job.department !== department) return false;
      if (type !== "all" && job.employment_type !== type) return false;
      if (education !== "all" && job.min_education !== education) return false;
      return true;
    });
  }, [department, education, jobs, keyword, type]);

  const resetFilters = () => {
    setKeyword("");
    setDepartment("all");
    setType("all");
    setEducation("all");
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.6fr] lg:items-end">
            <div>
              <span className="eyebrow">
                <BriefcaseBusiness className="h-4 w-4" />
                Career Opportunities
              </span>
              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight md:text-5xl">
                Lowongan kerja untuk talenta manufaktur otomotif.
              </h1>
              <p className="mt-5 max-w-2xl leading-8 text-muted-foreground">
                Pilih posisi yang sesuai dengan kompetensi Anda. Setiap lowongan menampilkan
                departemen, lokasi kerja, kualifikasi, serta batas pendaftaran yang jelas.
              </p>
            </div>
            <Card className="industrial-card p-5">
              <div className="text-4xl font-extrabold text-primary">{filtered.length}</div>
              <div className="mt-1 font-bold">Lowongan tersedia</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Data hanya menampilkan posisi yang sudah dipublikasikan HR.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <Card className="industrial-card p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px_150px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Cari posisi, departemen, atau lokasi"
                className="h-11 pl-10"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Departemen</SelectItem>
                {departments.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {Object.entries(employmentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={education} onValueChange={setEducation}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Pendidikan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pendidikan</SelectItem>
                {Object.entries(educationLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={resetFilters} className="h-11">
              <Filter className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </Card>
      </section>

      <section className="container-page pb-20">
        {isLoading ? (
          <div className="grid gap-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-36 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="industrial-card py-16 text-center">
            <BriefcaseBusiness className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-extrabold">Lowongan tidak ditemukan</h2>
            <p className="mt-2 text-muted-foreground">
              Ubah filter pencarian atau cek kembali nanti.
            </p>
            <Button className="mt-5" onClick={resetFilters}>
              Tampilkan semua
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((job) => (
              <Card key={job.id} className="industrial-card industrial-card-hover overflow-hidden">
                <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground">{job.department}</Badge>
                      {job.is_featured && <Badge variant="outline">Prioritas</Badge>}
                      <Badge variant="secondary">Dibuka</Badge>
                    </div>
                    <h2 className="mt-4 text-2xl font-extrabold leading-tight">{job.title}</h2>
                    <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {job.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-primary" />
                        {employmentTypeLabels[job.employment_type] ?? job.employment_type}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        Min.{" "}
                        {job.min_education
                          ? (educationLabels[job.min_education] ?? job.min_education.toUpperCase())
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 md:min-w-48 md:items-end">
                    {job.deadline && (
                      <div className="text-left text-xs text-muted-foreground md:text-right">
                        Batas daftar
                        <div className="text-sm font-bold text-foreground">
                          {new Date(job.deadline).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    )}
                    <Button asChild>
                      <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                        Lihat detail
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
