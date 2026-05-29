import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { to: "/", label: "Beranda" },
  { to: "/jobs", label: "Lowongan" },
  { to: "/about", label: "Profil Perusahaan" },
  { to: "/contact", label: "Kontak" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const { user, signOut, hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const canAccessAdmin = user && (hasRole("admin") || hasRole("hr"));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/92 backdrop-blur-xl">
      <div className="hidden border-b border-border/70 bg-secondary text-secondary-foreground md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Portal Rekrutmen Resmi PT Kayaba Indonesia
          </div>
          <div className="text-secondary-foreground/75">MM2100 Industrial Town, Bekasi</div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((item) => {
            const active =
              pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3.5 py-2 text-sm font-bold rounded-md ${
                  active
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {canAccessAdmin && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                HR Dashboard
              </Link>
            </Button>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <UserRound className="mr-2 h-4 w-4" />
                  <span className="max-w-36 truncate">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/jobs" className="cursor-pointer">
                    <BriefcaseBusiness className="mr-2 h-4 w-4" />
                    Lowongan Saya
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Daftar Kandidat</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Buka menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="container-page grid gap-2 py-4">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-4">
              {user ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="col-span-2"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild onClick={() => setOpen(false)}>
                    <Link to="/login">Masuk</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/register">Daftar</Link>
                  </Button>
                </>
              )}
              {canAccessAdmin && (
                <Button
                  variant="secondary"
                  asChild
                  onClick={() => setOpen(false)}
                  className="col-span-2"
                >
                  <Link to="/admin">HR Dashboard</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
