import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ApplicantManagement } from "@/components/admin/ApplicantManagement";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/applicants")({
  component: AdminApplicantsPage,
});

function AdminApplicantsPage() {
  const { hasRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !hasRole("admin") && !hasRole("hr")) {
      navigate({ to: "/" });
    }
  }, [hasRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!hasRole("admin") && !hasRole("hr")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <Button onClick={() => navigate({ to: "/" })} variant="outline">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <ApplicantManagement />
    </AdminLayout>
  );
}
