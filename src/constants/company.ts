import {
  Award,
  Building2,
  ClipboardCheck,
  CheckCircle2,
  Factory,
  Gauge,
  GraduationCap,
  HeartHandshake,
  LineChart,
  MapPin,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

export const companyProfile = {
  name: "PT Kayaba Indonesia",
  shortName: "KYB Indonesia",
  established: "25 Februari 1976",
  address:
    "Jl. Jawa Blok II No.4, Kawasan Industri MM2100, Cikarang Barat, Bekasi, Jawa Barat 17520",
  email: "recruitment@kyb.co.id",
  phone: "+62 21 8998 1741",
  website: "https://hrd.kyb.co.id",
  summary:
    "Produsen shock absorber terbesar di Indonesia dan bagian dari ekosistem Astra Otoparts serta KYB Corporation Japan.",
};

export const corporateStats = [
  { icon: Factory, value: "200.000 m2", label: "Area Pabrik", note: "Kawasan Industri MM2100" },
  {
    icon: Building2,
    value: "80.130 m2",
    label: "Bangunan Produksi",
    note: "Fasilitas manufaktur modern",
  },
  { icon: Users, value: "2.183", label: "Pegawai", note: "Data portal rekrutmen Jan 2024" },
  { icon: Award, value: "1976", label: "Berdiri", note: "Pengalaman manufaktur otomotif" },
];

export const productLines = [
  {
    title: "Produk 4W",
    copy: "Shock absorber untuk kendaraan roda empat OEM dan OES.",
    icon: Gauge,
  },
  {
    title: "Produk 2W",
    copy: "Suspensi kendaraan roda dua untuk kebutuhan produksi dan aftermarket.",
    icon: Settings2,
  },
  {
    title: "Aftermarket",
    copy: "Rangkaian produk pengganti dengan standar kualitas KYB.",
    icon: ShieldCheck,
  },
  {
    title: "Produk Khusus",
    copy: "Dukungan untuk ekspor, railway, racing, dan kebutuhan industri baru.",
    icon: Sparkles,
  },
];

export const hiringSteps = [
  { title: "Registrasi", copy: "Kandidat membuat akun dan melengkapi profil dasar." },
  { title: "Seleksi Administrasi", copy: "Tim HR meninjau CV, data diri, dan kesesuaian posisi." },
  { title: "Asesmen", copy: "Tes teknis, psikotes, atau evaluasi kompetensi sesuai posisi." },
  { title: "Interview", copy: "Wawancara HR dan user untuk mendalami pengalaman kerja." },
  { title: "Offering", copy: "Kandidat terpilih menerima penawaran dan jadwal onboarding." },
];

export const culturePillars = [
  {
    icon: ShieldCheck,
    title: "Quality First",
    copy: "Setiap proses diarahkan pada kualitas, keselamatan, dan kepatuhan standar manufaktur.",
  },
  {
    icon: LineChart,
    title: "Kaizen Mindset",
    copy: "Perbaikan berkelanjutan menjadi bagian dari cara kerja tim lintas fungsi.",
  },
  {
    icon: HeartHandshake,
    title: "Kolaborasi",
    copy: "Lingkungan kerja yang menghubungkan engineering, produksi, quality, dan support function.",
  },
  {
    icon: GraduationCap,
    title: "Pengembangan Talenta",
    copy: "Karyawan didorong tumbuh melalui pembelajaran teknis, disiplin kerja, dan kepemimpinan.",
  },
];

export const jobDepartments = [
  "Production",
  "Engineering",
  "Quality Assurance",
  "Maintenance",
  "Research & Development",
  "Supply Chain",
  "Human Resources",
  "Finance",
  "EHS",
];

export const employmentTypeLabels: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Kontrak",
  internship: "Magang",
  freelance: "Freelance",
};

export const educationLabels: Record<string, string> = {
  sma: "SMA/SMK",
  d1: "D1",
  d2: "D2",
  d3: "D3",
  s1: "S1",
  s2: "S2",
  s3: "S3",
};

export const jobStatusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Dibuka",
  closed: "Ditutup",
  archived: "Arsip",
};

export const applicationStatusLabels: Record<string, string> = {
  new: "Baru",
  screening: "Screening",
  shortlisted: "Shortlist",
  interview_scheduled: "Interview",
  interview_completed: "Interview Selesai",
  reference_check: "Reference Check",
  offered: "Offering",
  hired: "Diterima",
  rejected: "Ditolak",
  withdrawn: "Withdrawn",
};

export const contactHighlights = [
  { icon: MapPin, label: "Lokasi", value: "MM2100 Industrial Town, Bekasi" },
  { icon: CheckCircle2, label: "Fokus", value: "OEM, OES, aftermarket, dan ekspor" },
  {
    icon: ShieldCheck,
    label: "Standar",
    value: "Mesin berkualitas tinggi dan uji kelayakan produk",
  },
];

export const careerAudience = [
  {
    title: "Fresh Graduate",
    subtitle: "Mulai dari fondasi industri",
    copy: "Untuk lulusan baru yang ingin belajar ritme manufaktur, disiplin kualitas, dan problem solving di area produksi otomotif.",
    icon: GraduationCap,
    cues: ["Training dasar", "Mentoring area kerja", "Rotasi kebutuhan departemen"],
  },
  {
    title: "Experienced Hire",
    subtitle: "Bawa pengalaman untuk scale-up",
    copy: "Untuk profesional yang siap memperkuat engineering, quality, maintenance, supply chain, HR, finance, dan EHS.",
    icon: Target,
    cues: ["Role ownership", "Cross-functional project", "Improvement roadmap"],
  },
  {
    title: "Internship",
    subtitle: "Eksposur nyata ke manufaktur",
    copy: "Untuk mahasiswa yang ingin memahami proses kerja pabrik, data produksi, safety, dan standar kerja profesional.",
    icon: ClipboardCheck,
    cues: ["Project based", "Supervisor area", "Laporan terstruktur"],
  },
];

export const uxTrustSignals = [
  {
    title: "Transparan",
    copy: "Kandidat melihat tahapan proses dan status lowongan dengan bahasa yang sederhana.",
  },
  {
    title: "Terarah",
    copy: "Filter posisi, kategori kandidat, dan detail kualifikasi membantu kandidat memilih dengan percaya diri.",
  },
  {
    title: "Aman",
    copy: "Pesan anti-penipuan ditampilkan sejak awal untuk menurunkan kecemasan kandidat.",
  },
  {
    title: "Terukur",
    copy: "HR mendapatkan struktur data pipeline, timeline, rating, dan catatan internal.",
  },
];
