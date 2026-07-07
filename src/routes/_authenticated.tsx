import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Mail, User, Briefcase, LogOut, Menu, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ROLES } from "@/constants";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading, signOut, hasRole, isAdmin, isHR } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Memuat…
      </div>
    );
  }

  // Build navigation items based on user roles
  const items: Array<{ to: string; icon: any; label: string }> = [];
  const isAdminOrHRRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin()) {
    // Admin has full access
    items.push({ to: "/admin", icon: LayoutDashboard, label: "Dashboard" });
    items.push({ to: "/admin/jobs", icon: Briefcase, label: "Lowongan" });
    items.push({ to: "/admin/applicants", icon: Users, label: "Pelamar" });
  } else if (isHR()) {
    // HR has limited access - no applicant management
    items.push({ to: "/admin", icon: LayoutDashboard, label: "Dashboard" });
    items.push({ to: "/admin/jobs", icon: Briefcase, label: "Lowongan" });
    items.push({ to: "/admin/applicants", icon: Users, label: "Pelamar" });
  } else {
    // Applicant users see different menu
    items.push({ to: "/applications", icon: Mail, label: "Mail Box" });
    items.push({ to: "/profile", icon: User, label: "Profil Saya" });
    items.push({ to: "/jobs", icon: Briefcase, label: "Lowongan" });
  }

  // Prevent non-admin/HR users from accessing admin routes
  if (isAdminOrHRRoute && !isAdmin() && !isHR()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="text-7xl font-display font-extrabold text-primary">403</div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <div className="mt-6">
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center border border-primary bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Kembali ke Lowongan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard layout
  if (isAdminOrHRRoute) {
    return (
      <Outlet />
    );
  }

  // User dashboard layout
  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/">
            <Logo />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="border border-border p-2 hover:bg-surface-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r border-border flex-col",
            "lg:flex lg:sticky lg:top-0 lg:h-screen",
            open ? "flex" : "hidden lg:flex"
          )}
        >
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {items.map((it) => {
              const active = pathname === it.to || pathname.startsWith(it.to + "/");
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 border border-transparent px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center border border-primary/25 bg-accent text-primary font-semibold">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{user.email}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {isAdmin()
                    ? "Admin"
                    : isHR()
                      ? "HR"
                      : "Pelamar"}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-1" /> Keluar
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
