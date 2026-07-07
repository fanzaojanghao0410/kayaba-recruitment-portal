import type { ReactNode } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { Briefcase, CheckCircle2, Edit, Eye, MapPin, MoreVertical, Plus, Search, Trash2, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { educationLabels, employmentTypeLabels, jobDepartments, jobStatusLabels } from "@/constants/company";

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  status: string;
  description: string | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  min_education: string | null;
  min_experience_years: number | null;
  min_salary: number | null;
  max_salary: number | null;
  quota: number | null;
  deadline: string | null;
  is_featured: boolean | null;
  applications?: Array<{ count: number }>;
};

type FormData = {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
  responsibilities: string;
  min_education: string;
  min_experience_years: string;
  min_salary: string;
  max_salary: string;
  quota: string;
  deadline: string;
  status: string;
};

const emptyForm: FormData = {
  title: "",
  department: "Engineering",
  location: "MM2100, Bekasi",
  employment_type: "full_time",
  description: "",
  requirements: "",
  responsibilities: "",
  min_education: "s1",
  min_experience_years: "0",
  min_salary: "",
  max_salary: "",
  quota: "",
  deadline: "",
  status: "draft",
};

export function JobManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-jobs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*,applications:applications(count)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Job[];
    },
  });

  const filteredJobs = (jobs ?? []).filter((job) => {
    const haystack = `${job.title} ${job.department} ${job.location}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  const stats = {
    total: jobs?.length ?? 0,
    published: jobs?.filter((job) => job.status === "published").length ?? 0,
    draft: jobs?.filter((job) => job.status === "draft").length ?? 0,
    applicants: jobs?.reduce((sum, job) => sum + (job.applications?.[0]?.count ?? 0), 0) ?? 0,
  };

  const resetForm = () => setFormData(emptyForm);

  const payload = (data: FormData) => ({
    title: data.title,
    department: data.department,
    location: data.location,
    employment_type: data.employment_type,
    description: data.description,
    requirements: data.requirements.split("\n").map((item) => item.trim()).filter(Boolean),
    responsibilities: data.responsibilities.split("\n").map((item) => item.trim()).filter(Boolean),
    min_education: data.min_education,
    min_experience_years: Number(data.min_experience_years) || 0,
    min_salary: data.min_salary ? Number(data.min_salary) : null,
    max_salary: data.max_salary ? Number(data.max_salary) : null,
    quota: data.quota ? Number(data.quota) : null,
    deadline: data.deadline || null,
    status: data.status,
  });

  const createJob = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("jobs").insert(payload(formData));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lowongan berhasil dibuat.");
      setDialogMode(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateJob = useMutation({
    mutationFn: async () => {
      if (!selectedJob) return;
      const { error } = await supabase.from("jobs").update(payload(formData)).eq("id", selectedJob.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lowongan berhasil diperbarui.");
      setDialogMode(null);
      setSelectedJob(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteJob = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      const { error } = await supabase.from("jobs").delete().eq("id", deleteTarget.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lowongan dihapus.");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const togglePublish = useMutation({
    mutationFn: async (job: Job) => {
      const status = job.status === "published" ? "closed" : "published";
      const { error } = await supabase.from("jobs").update({ status }).eq("id", job.id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(status === "published" ? "Lowongan dipublikasikan." : "Lowongan ditutup.");
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openEdit = (job: Job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      description: job.description ?? "",
      requirements: (job.requirements ?? []).join("\n"),
      responsibilities: (job.responsibilities ?? []).join("\n"),
      min_education: job.min_education ?? "s1",
      min_experience_years: String(job.min_experience_years ?? 0),
      min_salary: job.min_salary?.toString() ?? "",
      max_salary: job.max_salary?.toString() ?? "",
      quota: job.quota?.toString() ?? "",
      deadline: job.deadline ?? "",
      status: job.status,
    });
    setDialogMode("edit");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">Job Management</span>
          <h1 className="mt-3 text-3xl font-extrabold">Manajemen Lowongan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Kelola posisi, detail kualifikasi, publikasi, dan jumlah pelamar.</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogMode("create"); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Lowongan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Briefcase },
          { label: "Published", value: stats.published, icon: CheckCircle2 },
          { label: "Draft", value: stats.draft, icon: Edit },
          { label: "Pelamar", value: stats.applicants, icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          return (
          <Card key={item.label} className="industrial-card p-5">
            <Icon className="h-5 w-5 text-primary" />
            <div className="mt-4 text-2xl font-extrabold">{item.value}</div>
            <div className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{item.label}</div>
          </Card>
          );
        })}
      </div>

      <Card className="industrial-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari lowongan, departemen, lokasi" className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(jobStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="industrial-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Memuat data lowongan...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-10 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-extrabold">Belum ada lowongan</h2>
            <Button className="mt-5" onClick={() => setDialogMode("create")}>Tambah Lowongan</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posisi</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pelamar</TableHead>
                <TableHead>Batas</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="font-bold">{job.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</div>
                  </TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell><Badge variant={job.status === "published" ? "default" : "outline"}>{jobStatusLabels[job.status] ?? job.status}</Badge></TableCell>
                  <TableCell>{job.applications?.[0]?.count ?? 0}</TableCell>
                  <TableCell>{job.deadline ? format(new Date(job.deadline), "dd MMM yyyy", { locale: id }) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link to="/jobs/$jobId" params={{ jobId: job.id }}><Eye className="mr-2 h-4 w-4" />Lihat Public</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(job)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish.mutate(job)}>
                          {job.status === "published" ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          {job.status === "published" ? "Tutup" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(job)}><Trash2 className="mr-2 h-4 w-4" />Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) { setDialogMode(null); setSelectedJob(null); } }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "edit" ? "Edit Lowongan" : "Tambah Lowongan"}</DialogTitle>
            <DialogDescription>Isi detail posisi, persyaratan, tanggung jawab, dan status publikasi.</DialogDescription>
          </DialogHeader>
          <JobForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>Batal</Button>
            <Button onClick={() => (dialogMode === "edit" ? updateJob.mutate() : createJob.mutate())} disabled={createJob.isPending || updateJob.isPending}>
              {createJob.isPending || updateJob.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Lowongan</DialogTitle>
            <DialogDescription>Lowongan “{deleteTarget?.title}” akan dihapus dari database.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteJob.mutate()} disabled={deleteJob.isPending}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobForm({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Judul Posisi"><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></Field>
        <Field label="Departemen">
          <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{jobDepartments.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Lokasi"><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></Field>
        <Field label="Tipe Kerja">
          <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(employmentTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Deskripsi"><Textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tanggung Jawab (satu per baris)"><Textarea rows={5} value={formData.responsibilities} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })} /></Field>
        <Field label="Persyaratan (satu per baris)"><Textarea rows={5} value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Pendidikan">
          <Select value={formData.min_education} onValueChange={(value) => setFormData({ ...formData, min_education: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(educationLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Pengalaman"><Input type="number" value={formData.min_experience_years} onChange={(e) => setFormData({ ...formData, min_experience_years: e.target.value })} /></Field>
        <Field label="Kuota"><Input type="number" value={formData.quota} onChange={(e) => setFormData({ ...formData, quota: e.target.value })} /></Field>
        <Field label="Deadline"><Input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Gaji Minimum"><Input type="number" value={formData.min_salary} onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })} /></Field>
        <Field label="Gaji Maksimum"><Input type="number" value={formData.max_salary} onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}