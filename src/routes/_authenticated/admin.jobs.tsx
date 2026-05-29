import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { JobManagement } from "@/components/admin/JobManagement";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  component: AdminJobsPage,
});

function AdminJobsPage() {
  const { hasRole } = useAuth();

  // AuthLayout sudah memblokir non-admin/HR pada route /admin/*
  if (!hasRole("admin") && !hasRole("hr")) return null;


  return (
    <AdminLayout>
      <JobManagement />
    </AdminLayout>
  );
}

