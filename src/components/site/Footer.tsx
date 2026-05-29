import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { companyProfile } from "@/constants/company";
import { Logo } from "./Logo";

const footerLinks = [
  { to: "/", label: "Beranda" },
  { to: "/jobs", label: "Lowongan Kerja" },
  { to: "/about", label: "Profil Perusahaan" },
  { to: "/contact", label: "Kontak Rekrutmen" },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-secondary text-secondary-foreground">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_0.8fr_1.2fr]">
          <div>
            <div className="inline-flex rounded-md bg-white p-2">
              <Logo size="md" />
            </div>
            <p className="mt-5 max-w-xl text-sm leading-7 text-secondary-foreground/72">
              {companyProfile.summary} Portal ini digunakan untuk publikasi lowongan, seleksi
              kandidat, dan komunikasi rekrutmen yang lebih tertata.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-secondary-foreground/82">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Hati-hati penipuan. Rekrutmen KYB tidak memungut biaya.
            </div>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-[0.12em]">Navigasi</h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-secondary-foreground/70 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-[0.12em]">
              PT Kayaba Indonesia
            </h4>
            <ul className="mt-5 space-y-4 text-sm text-secondary-foreground/72">
              <li className="flex gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>{companyProfile.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${companyProfile.email}`} className="hover:text-white">
                  {companyProfile.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`tel:${companyProfile.phone.replace(/\s/g, "")}`}
                  className="hover:text-white"
                >
                  {companyProfile.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-secondary-foreground/58 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} PT Kayaba Indonesia. All rights reserved.</p>
          <p>Career portal theme for KYB Indonesia recruitment operations.</p>
        </div>
      </div>
    </footer>
  );
}
