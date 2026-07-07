import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Factory,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteShell } from "@/components/site/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import {
  companyProfile,
  corporateStats,
  careerAudience,
  culturePillars,
  educationLabels,
  employmentTypeLabels,
  hiringSteps,
  productLines,
  uxTrustSignals,
} from "@/constants/company";
import heroImg from "@/assets/hero-factory.jpg";
import aboutImg from "@/assets/about-factory.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Karier PT Kayaba Indonesia" },
      {
        name: "description",
        content:
          "Portal karier PT Kayaba Indonesia untuk talenta manufaktur otomotif, engineering, quality, supply chain, dan fungsi pendukung.",
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
  min_education: string | null;
  status: string;
  description: string | null;
  deadline: string | null;
  is_featured?: boolean | null;
};

function HomePage() {
  const { data: jobs } = useQuery({
    queryKey: ["home-featured-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,department,location,employment_type,min_education,status,description,deadline,is_featured",
        )
        .in("status", ["published", "open"])
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) {
        console.error("Gagal memuat lowongan prioritas", error);
        return [] as Job[];
      }
      return (data ?? []) as Job[];
    },
    retry: 1,
  });

  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-border bg-surface">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="container-page relative grid min-h-[calc(100vh-7rem)] gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="eyebrow">
              <Factory className="h-4 w-4" />
              Career Portal
            </div>
            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.02] tracking-normal text-foreground md:text-6xl">
              Bangun karier manufaktur bersama {companyProfile.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Bergabung dengan produsen shock absorber terbesar di Indonesia. Di sini talenta
              teknik, produksi, quality, supply chain, dan HR bekerja dalam standar manufaktur
              global.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/jobs">
                  Lihat Lowongan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">Profil Perusahaan</Link>
              </Button>
            </div>
            <div className="mt-8 flex max-w-2xl items-start gap-3 border border-primary/20 bg-accent/70 p-4 text-sm text-accent-foreground">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>
                Proses rekrutmen PT Kayaba Indonesia tidak memungut biaya. Abaikan pihak yang
                meminta pembayaran transportasi, akomodasi, atau administrasi.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-8 hidden h-24 w-8 bg-primary lg:block" />
            <div className="overflow-hidden border border-border shadow-lg">
              <img
                src={heroImg}
                alt="Fasilitas manufaktur PT Kayaba Indonesia"
                className="h-[34rem] w-full object-cover"
              />
            </div>
            <div className="absolute bottom-5 left-5 right-5 grid gap-3 border border-border bg-background/94 p-4 shadow-lg backdrop-blur md:grid-cols-3">
              {corporateStats.slice(0, 3).map((item) => (
                <div key={item.label}>
                  <div className="text-xl font-extrabold text-foreground">{item.value}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="grid gap-4 md:grid-cols-4">
          {corporateStats.map((item) => (
            <div key={item.label} className="metric-tile p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <div className="mt-5 text-2xl font-extrabold">{item.value}</div>
              <div className="mt-1 text-sm font-bold">{item.label}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="border border-border bg-secondary p-5 text-secondary-foreground shadow-lg md:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="eyebrow text-secondary-foreground/70">Candidate Experience</span>
              <h2 className="mt-3 text-3xl font-extrabold text-secondary-foreground">
                Dirancang untuk mengurangi ragu, memperjelas pilihan, dan mempercepat keputusan.
              </h2>
              <p className="mt-4 leading-7 text-secondary-foreground/70">
                Struktur halaman memakai prinsip psikologi desain: social proof di awal, pilihan
                kandidat yang jelas, proses bertahap, dan pesan keamanan yang terus terlihat.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {uxTrustSignals.map((item) => (
                <div key={item.title} className="border border-secondary-foreground/15 bg-secondary-foreground/8 p-4">
                  <div className="text-sm font-extrabold text-secondary-foreground">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-secondary-foreground/68">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <img
              src={aboutImg}
              alt="Area produksi KYB Indonesia"
              className="aspect-[4/3] w-full border border-border object-cover shadow-md"
            />
          </div>
          <div>
            <span className="eyebrow">Manufacturing Excellence</span>
            <h2 className="red-rule mt-4 pl-5 text-3xl font-extrabold leading-tight md:text-4xl">
              Pabrik otomotif dengan disiplin kualitas Jepang dan skala Indonesia.
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              {companyProfile.name} memproduksi shock absorber untuk kendaraan roda dua, roda empat,
              aftermarket, ekspor, dan kebutuhan khusus. Portal ini dirancang agar kandidat memahami
              lingkungan kerja, kebutuhan kompetensi, dan jalur seleksi sejak awal.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {productLines.map((item) => (
                <div key={item.title} className="industrial-card p-4">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="mb-8 max-w-3xl">
          <span className="eyebrow">Choose Your Entry Point</span>
          <h2 className="mt-3 text-3xl font-extrabold">
            Tiga jalur kandidat, satu standar kerja KYB.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Kandidat tidak dipaksa langsung mencari lowongan. Mereka bisa mengenali jalur yang
            paling relevan dulu, lalu masuk ke posisi yang sesuai.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {careerAudience.map((item) => (
            <Card key={item.title} className="industrial-card industrial-card-hover p-6">
              <item.icon className="h-7 w-7 text-primary" />
              <div className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-primary">
                {item.subtitle}
              </div>
              <h3 className="mt-2 text-2xl font-extrabold">{item.title}</h3>
              <p className="mt-3 min-h-20 text-sm leading-7 text-muted-foreground">{item.copy}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.cues.map((cue) => (
                  <Badge key={cue} variant="secondary">
                    {cue}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">Budaya Kerja</span>
            <h2 className="mt-3 text-3xl font-extrabold">
              Tempat untuk talenta yang presisi, disiplin, dan mau tumbuh.
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/about">Lihat profil KYB</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {culturePillars.map((item) => (
            <Card key={item.title} className="industrial-card industrial-card-hover p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="dark-panel py-16">
        <div className="container-page">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="eyebrow text-secondary-foreground/70">Open Positions</span>
              <h2 className="mt-3 text-3xl font-extrabold text-secondary-foreground">Lowongan prioritas</h2>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/jobs">
                Semua lowongan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {(jobs ?? []).map((job) => (
              <Card key={job.id} className="border-secondary-foreground/10 bg-background p-5 text-foreground">
                <div className="flex items-start justify-between gap-4">
                  <Badge className="bg-primary text-primary-foreground">{job.department}</Badge>
                  {job.is_featured && <Badge variant="outline">Featured</Badge>}
                </div>
                <h3 className="mt-5 min-h-14 text-xl font-extrabold leading-tight">{job.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {job.description}
                </p>
                <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-primary" />
                    {employmentTypeLabels[job.employment_type] ?? job.employment_type}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarCheck2 className="h-4 w-4 text-primary" />
                    Minimal{" "}
                    {job.min_education
                      ? (educationLabels[job.min_education] ?? job.min_education.toUpperCase())
                      : "-"}
                  </div>
                </div>
                <Button className="mt-6 w-full" asChild>
                  <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                    Detail posisi
                  </Link>
                </Button>
              </Card>
            ))}
            {(jobs ?? []).length === 0 && (
              <Card className="border-secondary-foreground/10 bg-background p-6 text-foreground lg:col-span-3">
                <h3 className="font-extrabold">Belum ada lowongan yang sedang dibuka.</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Silakan cek kembali portal karier secara berkala.
                </p>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="eyebrow">Recruitment Flow</span>
            <h2 className="mt-3 text-3xl font-extrabold">
              Tahapan seleksi dibuat transparan sejak awal.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Kandidat dapat melihat posisi, mendaftar, dan mengikuti perkembangan proses seleksi
              melalui portal.
            </p>
          </div>
          <div className="grid gap-3">
            {hiringSteps.map((step, index) => (
              <div key={step.title} className="industrial-card flex gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary font-extrabold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-extrabold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="grid gap-6 border border-border bg-card p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Siapkan CV terbaru dan data diri lengkap
            </div>
            <h2 className="mt-3 text-2xl font-extrabold">
              Mulai perjalanan karier Anda di KYB Indonesia.
            </h2>
          </div>
          <Button size="lg" asChild>
            <Link to="/register">
              Daftar Kandidat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
