import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Factory, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteShell } from "@/components/site/SiteShell";
import { companyProfile, corporateStats, culturePillars, productLines } from "@/constants/company";
import aboutImg from "@/assets/about-factory.jpg";
import heroImg from "@/assets/hero-factory.jpg";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Profil PT Kayaba Indonesia" },
      {
        name: "description",
        content:
          "Profil PT Kayaba Indonesia, produsen shock absorber terbesar di Indonesia yang berdiri sejak 1976.",
      },
    ],
  }),
});

const milestones = [
  ["1976", "PT Kayaba Indonesia berdiri dan mulai membangun kapabilitas produksi shock absorber."],
  ["OEM & OES", "Menjadi pemasok untuk kebutuhan kendaraan roda dua, roda empat, dan aftermarket."],
  ["Ekspor", "Mengembangkan dukungan produk untuk pasar ekspor dan kategori khusus."],
  ["Hari Ini", "Mengoperasikan fasilitas manufaktur besar di kawasan industri MM2100, Bekasi."],
];

function AboutPage() {
  return (
    <SiteShell>
      <section className="bg-white">
        <div className="container-page grid gap-10 py-14 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <span className="eyebrow">
              <Building2 className="h-4 w-4" />
              Company Profile
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              {companyProfile.name}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {companyProfile.summary} Perusahaan ini menjadi bagian penting dari rantai pasok
              otomotif nasional melalui produk suspensi yang digunakan di berbagai segmen kendaraan.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/jobs">
                  Lihat Lowongan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/contact">Kontak Rekrutmen</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            <img
              src={aboutImg}
              alt="Fasilitas PT Kayaba Indonesia"
              className="aspect-[16/10] rounded-lg border border-border object-cover shadow-md"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="industrial-card p-4">
                <div className="text-2xl font-extrabold text-primary">1976</div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Berdiri
                </p>
              </div>
              <div className="industrial-card p-4">
                <div className="text-2xl font-extrabold text-primary">MM2100</div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Bekasi
                </p>
              </div>
              <div className="industrial-card p-4">
                <div className="text-2xl font-extrabold text-primary">KYB</div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Global Standard
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-12">
        <div className="container-page grid gap-4 md:grid-cols-4">
          {corporateStats.map((item) => (
            <Card key={item.label} className="industrial-card p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <div className="mt-4 text-2xl font-extrabold">{item.value}</div>
              <div className="text-sm font-bold">{item.label}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.note}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="eyebrow">Timeline</span>
            <h2 className="mt-3 text-3xl font-extrabold">Perjalanan manufaktur KYB Indonesia.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Dari produksi lokal hingga dukungan aftermarket dan ekspor, KYB Indonesia terus
              memperkuat kualitas proses, keselamatan kerja, dan pengembangan talenta.
            </p>
          </div>
          <div className="space-y-3">
            {milestones.map(([year, text]) => (
              <div key={year} className="industrial-card grid gap-4 p-5 sm:grid-cols-[120px_1fr]">
                <div className="text-xl font-extrabold text-primary">{year}</div>
                <p className="leading-7 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-panel py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <span className="eyebrow text-white/70">
              <Factory className="h-4 w-4" />
              Product Scope
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-white">
              Produk yang menggerakkan industri otomotif.
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {productLines.map((item) => (
                <div key={item.title} className="rounded-lg border border-white/12 bg-white/8 p-4">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-extrabold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/68">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <img
            src={heroImg}
            alt="Produksi shock absorber"
            className="aspect-[4/3] rounded-lg border border-white/10 object-cover"
          />
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="mb-8 max-w-2xl">
          <span className="eyebrow">
            <ShieldCheck className="h-4 w-4" />
            People & Culture
          </span>
          <h2 className="mt-3 text-3xl font-extrabold">Nilai kerja yang dicari dari kandidat.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {culturePillars.map((item) => (
            <Card key={item.title} className="industrial-card industrial-card-hover p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.copy}</p>
            </Card>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
