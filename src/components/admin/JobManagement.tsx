import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Building2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  status: string;
  description: string | null;
  min_salary: number | null;
  max_salary: number | null;
  deadline: string | null;
  applications_count?: number;
  created_at: string;
  is_featured: boolean;
}

const employmentTypes: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Kontrak",
  internship: "Magang",
  freelance: "Freelance",
};

const jobStatuses: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
  published: { label: "Published", color: "bg-emerald-100 text-emerald-700" },
  closed: { label: "Closed", color: "bg-red-100 text-red-700" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-700" },
};

export function JobManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    employment_type: "full_time",
    description: "",
    requirements: "",
    responsibilities: "",
    min_education: "s1",
    min_experience_years: 0,
    min_salary: "",
    max_salary: "",
    quota: "",
    deadline: "",
    status: "draft",
  });

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["admin-jobs", statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(`
          *,
          applications:applications(count)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((job: any) => ({
        ...job,
        applications_count: job.applications?.[0]?.count || 0,
      })) as Job[];
    },
  });

  // Create job mutation
  const createJob = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("jobs").insert({
        title: data.title,
        department: data.department,
        location: data.location,
        employment_type: data.employment_type,
        description: data.description,
        requirements: data.requirements.split("\n").filter(Boolean),
        responsibilities: data.responsibilities.split("\n").filter(Boolean),
        min_education: data.min_education,
        min_experience_years: parseInt(data.min_experience_years.toString()) || 0,
        min_salary: data.min_salary ? parseInt(data.min_salary) : null,
        max_salary: data.max_salary ? parseInt(data.max_salary) : null,
        quota: data.quota ? parseInt(data.quota) : null,
        deadline: data.deadline || null,
        status: data.status,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lowongan berhasil dibuat");
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: any) => {
      toast.error("Gagal membuat lowongan: " + error.message);
    },
  });

  // Update job mutation
  const updateJob = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("jobs")
        .update({
          title: data.title,
          department: data.department,
          location: data.location,
          employment_type: data.employment_type,
          description: data.description,
          requirements: data.requirements.split("\n").filter(Boolean),
          responsibilities: data.responsibilities.split("\n").filter(Boolean),
          min_education: data.min_education,
          min_experience_years: parseInt(data.min_experience_years.toString()) || 0,
          min_salary: data.min_salary ? parseInt(data.min_salary) : null,
          max_salary: data.max_salary ? parseInt(data.max_salary) : null,
          quota: data.quota ? parseInt(data.quota) : null,
          deadline: data.deadline || null,
          status: data.status,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lowongan berhasil diupdate");
      setIsEditDialogOpen(false);
      setSelectedJob(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: any) => {
      toast.error("Gagal mengupdate lowongan: " + error.message);
    },
  });

  // Delete job mutation
  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lowongan berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setSelectedJob(null);
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (error: any) => {
      toast.error("Gagal menghapus lowongan: " + error.message);
    },
  });

  // Toggle publish status
  const togglePublish = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "closed" : "published";
      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      toast.success(newStatus === "published" ? "Lowongan dipublikasikan" : "Lowongan ditutup");
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "",
      employment_type: "full_time",
      description: "",
      requirements: "",
      responsibilities: "",
      min_education: "s1",
      min_experience_years: 0,
      min_salary: "",
      max_salary: "",
      quota: "",
      deadline: "",
      status: "draft",
    });
  };

  const openEditDialog = (job: Job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      description: job.description || "",
      requirements: "",
      responsibilities: "",
      min_education: "s1",
      min_experience_years: 0,
      min_salary: job.min_salary?.toString() || "",
      max_salary: job.max_salary?.toString() || "",
      quota: "",
      deadline: job.deadline || "",
      status: job.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createJob.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJob) {
      updateJob.mutate({ id: selectedJob.id, data: formData });
    }
  };

  const filteredJobs = jobs?.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: jobs?.length || 0,
    published: jobs?.filter((j) => j.status === "published").length || 0,
    draft: jobs?.filter((j) => j.status === "draft").length || 0,
    closed: jobs?.filter((j) => j.status === "closed").length || 0,
    totalApplications: jobs?.reduce((acc, job) => acc + (job.applications_count || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Lowongan
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Kelola lowongan kerja dan monitor aplikasi
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Lowongan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Published</p>
                <p className="text-xl font-bold">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Draft</p>
                <p className="text-xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Pelamar</p>
                <p className="text-xl font-bold">{stats.totalApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari lowongan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredJobs?.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">Belum ada lowongan</h3>
              <p className="text-slate-500 mt-1">Mulai dengan menambahkan lowongan baru</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Lowongan
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pelamar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-slate-500">
                        {employmentTypes[job.employment_type]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {job.department}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {job.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={jobStatuses[job.status]?.color || "bg-slate-100"}>
                        {jobStatuses[job.status]?.label || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        {job.applications_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(job)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => togglePublish.mutate({ id: job.id, currentStatus: job.status })}
                          >
                            {job.status === "published" ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Tutup Lowongan
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Publish
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedJob(job);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Lowongan Baru</DialogTitle>
            <DialogDescription>
              Isi detail lowongan kerja yang ingin dipublikasikan
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Pekerjaan *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Production Engineer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departemen *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Cibitung, Jawa Barat"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_type">Tipe Pekerjaan *</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(employmentTypes).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Pekerjaan *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan tugas dan tanggung jawab pekerjaan..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_salary">Gaji Minimum (Opsional)</Label>
                <Input
                  id="min_salary"
                  type="number"
                  value={formData.min_salary}
                  onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                  placeholder="e.g. 8000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_salary">Gaji Maksimum (Opsional)</Label>
                <Input
                  id="max_salary"
                  type="number"
                  value={formData.max_salary}
                  onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })}
                  placeholder="e.g. 15000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quota">Kuota (Opsional)</Label>
                <Input
                  id="quota"
                  type="number"
                  value={formData.quota}
                  onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                  placeholder="Jumlah karyawan yang dibutuhkan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (Opsional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Simpan dulu)</SelectItem>
                  <SelectItem value="published">Published (Langsung publish)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                disabled={createJob.isPending}
              >
                {createJob.isPending ? "Menyimpan..." : "Simpan Lowongan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lowongan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Same form fields as create */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Judul Pekerjaan</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Departemen</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedJob(null);
                  resetForm();
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                disabled={updateJob.isPending}
              >
                {updateJob.isPending ? "Menyimpan..." : "Update Lowongan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Lowongan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus lowongan "{selectedJob?.title}"?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedJob(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedJob && deleteJob.mutate(selectedJob.id)}
              disabled={deleteJob.isPending}
            >
              {deleteJob.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
