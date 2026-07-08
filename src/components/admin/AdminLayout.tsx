import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, Briefcase, LayoutDashboard, LogOut, Menu, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/Logo";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Lowongan", href: "/admin/jobs", icon: Briefcase },
  { title: "Pelamar", href: "/admin/applicants", icon: Users },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, hasRole } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Berhasil logout");
    navigate({ to: "/login" });
  };

  const roleLabel = hasRole("admin") ? "Administrator" : "HR Staff";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-secondary text-secondary-foreground lg:block">
        <div className="flex h-16 items-center border-b border-white/10 bg-background px-5">
          <Link to="/admin" className="flex items-center">
            <Logo size="md" />
          </Link>
        </div>
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-secondary-foreground/55">HR Command Center</div>
          <div className="mt-2 text-sm font-bold">PT Kayaba Indonesia</div>
        </div>
        <nav className="space-y-1 p-3">
          {sidebarItems.map((item) => {
            const active = item.href === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 border border-transparent px-3 py-3 text-sm font-bold",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-secondary-foreground/72 hover:border-white/15 hover:bg-white/8 hover:text-secondary-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/96 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" asChild>
                <Link to="/admin">
                  <Menu className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <div className="text-sm font-extrabold">Recruitment Portal</div>
                <div className="text-xs text-muted-foreground">Database-connected HR operations</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Notifikasi">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="hidden border border-border bg-card px-3 py-2 text-right text-xs md:block">
                <div className="max-w-44 truncate font-bold">{user?.email}</div>
                <div className="text-muted-foreground">{roleLabel}</div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}