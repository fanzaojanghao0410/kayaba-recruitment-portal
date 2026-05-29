import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  FileCheck2,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteShell } from "@/components/site/SiteShell";
import { companyProfile, contactHighlights, hiringSteps } from "@/constants/company";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Kontak Rekrutmen - PT Kayaba Indonesia" },
      {
        name: "description",
        content:
          "Pusat bantuan rekrutmen PT Kayaba Indonesia untuk pertanyaan pendaftaran, seleksi, dokumen, dan keamanan proses.",
      },
    ],
  }),
});

const faqs = [
  {
    category: "Pendaftaran",
    icon: FileCheck2,
    items: [
      {
        question: "Bagaimana cara melamar posisi di PT Kayaba Indonesia?",
        answer:
          "Buat akun kandidat, lengkapi profil dasar, pilih lowongan yang sesuai, lalu kirim lamaran dari halaman detail posisi.",
      },
      {
        question: "Apakah saya bisa melamar lebih dari satu posisi?",
        answer:
          "Bisa, selama kualifikasi Anda relevan. Sistem akan menyimpan setiap lamaran sebagai proses seleksi yang terpisah.",
      },
    ],
  },
  {
    category: "Seleksi",
    icon: CalendarDays,
    items: [
      {
        question: "Berapa lama proses seleksi berjalan?",
        answer:
          "Durasi dapat berbeda per posisi. Secara umum, kandidat akan melalui administrasi, asesmen, interview, dan keputusan akhir.",
      },
      {
        question: "Bagaimana saya mengetahui status lamaran?",
        answer:
          "Status dapat dilihat melalui akun kandidat. Tim HR juga dapat menghubungi kandidat melalui email atau WhatsApp aktif.",
      },
    ],
  },
  {
    category: "Keamanan",
    icon: ShieldCheck,
    items: [
      {
        question: "Apakah rekrutmen PT Kayaba Indonesia berbayar?",
        answer:
          "Tidak. PT Kayaba Indonesia tidak memungut biaya administrasi, transportasi, akomodasi, medical check-up, atau biaya lain dalam proses rekrutmen.",
      },
      {
        question: "Apa yang harus dilakukan jika menerima undangan mencurigakan?",
        answer:
          "Abaikan permintaan pembayaran dan verifikasi informasi melalui kanal resmi perusahaan atau portal karier ini.",
      },
    ],
  },
];

function ContactPage() {
  const [query, setQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!query) return faqs;
    const q = query.toLowerCase();
    return faqs
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(q)),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Pesan terkirim. Tim rekrutmen akan meninjau pertanyaan Anda.");
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-white">
        <div className="container-page grid gap-10 py-14 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <span className="eyebrow">
              <HelpCircle className="h-4 w-4" />
              Candidate Help Center
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Bantuan rekrutmen yang jelas, aman, dan mudah diverifikasi.
            </h1>
            <p className="mt-5 max-w-2xl leading-8 text-muted-foreground">
              Halaman ini dirancang untuk menurunkan kecemasan kandidat: informasi biaya, alur
              seleksi, dokumen, dan kontak resmi ditempatkan dalam satu pusat bantuan.
            </p>
          </div>
          <Card className="industrial-card p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-extrabold">Waspada Penipuan Rekrutmen</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  PT Kayaba Indonesia tidak memungut biaya dalam bentuk apa pun. Verifikasi undangan
                  seleksi hanya melalui kanal resmi.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {contactHighlights.map((item) => (
            <Card key={item.label} className="industrial-card p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <div className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {item.label}
              </div>
              <p className="mt-2 font-extrabold">{item.value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-surface py-14">
        <div className="container-page grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="eyebrow">Frequently Asked Questions</span>
            <h2 className="mt-3 text-3xl font-extrabold">Cari jawaban sebelum menghubungi HR.</h2>
            <div className="relative mt-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari pertanyaan tentang seleksi, dokumen, biaya..."
                className="h-11 pl-10"
              />
            </div>
          </div>
          <div className="grid gap-4">
            {filteredFaqs.map((group) => (
              <Card key={group.category} className="industrial-card p-5">
                <div className="mb-3 flex items-center gap-3">
                  <group.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-extrabold">{group.category}</h3>
                </div>
                <Accordion type="single" collapsible>
                  {group.items.map((item) => (
                    <AccordionItem key={item.question} value={item.question}>
                      <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                      <AccordionContent className="leading-7 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page section-pad">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <Card className="industrial-card p-6">
              <h2 className="text-2xl font-extrabold">Kontak Resmi Rekrutmen</h2>
              <div className="mt-6 space-y-4 text-sm">
                <a href={`mailto:${companyProfile.email}`} className="flex items-center gap-3 hover:text-primary">
                  <Mail className="h-4 w-4 text-primary" />
                  {companyProfile.email}
                </a>
                <a
                  href={`tel:${companyProfile.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  {companyProfile.phone}
                </a>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span className="leading-7 text-muted-foreground">{companyProfile.address}</span>
                </div>
              </div>
            </Card>
            <Card className="industrial-card p-6">
              <h3 className="font-extrabold">Tahapan yang Akan Dilalui Kandidat</h3>
              <div className="mt-5 grid gap-3">
                {hiringSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-3 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-extrabold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold">{step.title}</div>
                      <p className="mt-1 leading-6 text-muted-foreground">{step.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="industrial-card p-6 md:p-8">
            <h2 className="text-2xl font-extrabold">Kirim Pertanyaan</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan form ini untuk pertanyaan non-darurat terkait portal, status, atau dokumen.
            </p>
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input required placeholder="Nama lengkap" className="h-11" />
                <Input required type="email" placeholder="Email aktif" className="h-11" />
              </div>
              <Input placeholder="Subjek pertanyaan" className="h-11" />
              <Textarea required placeholder="Tuliskan pertanyaan Anda dengan jelas" rows={6} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  Jangan mengirim data sensitif seperti password atau OTP.
                </p>
                <Button type="submit">
                  Kirim
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>

      <section className="container-page pb-16">
        <Card className="industrial-card grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-xl font-extrabold">Belum memiliki akun kandidat?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Buat profil terlebih dahulu agar proses melamar posisi berjalan lebih cepat.
            </p>
          </div>
          <Button asChild>
            <Link to="/register">
              Daftar Kandidat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </SiteShell>
  );
}
