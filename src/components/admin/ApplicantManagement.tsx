import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Users,
  FileText,
  Briefcase,
  MapPin,
  GraduationCap,
  Star,
  ArrowLeft,
  Send,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Applicant {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string | null;
  gender: string;
  birth_date: string;
  education: string;
  experience: string;
  applied_position: string;
  applied_date: string;
  status: string;
  screening_score: number | null;
  cv_url: string | null;
}

interface Application {
  id: string;
  status: string;
  screening_score: number | null;
  interview_date: string | null;
  interview_score: number | null;
  hr_notes: string | null;
  internal_rating: number | null;
  created_at: string;
  job: {
    title: string;
    department: string;
  };
  applicant: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    photo_url: string | null;
    gender: string;
    birth_date: string;
    address_domicile: string;
    city: string;
    cv_url: string | null;
    summary: string | null;
    expected_salary: number | null;
    linkedin_url: string | null;
    portfolio_url: string | null;
  };
  educations: Array<{
    institution: string;
    degree: string;
    major: string;
    gpa: number;
    end_year: number;
  }>;
  experiences: Array<{
    company_name: string;
    position: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
  }>;
  skills: Array<{
    skill_name: string;
    proficiency_level: number;
  }>;
  timeline: Array<{
    id: string;
    status: string;
    title: string;
    description: string;
    created_at: string;
  }>;
}

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "new", label: "Baru" },
  { value: "screening", label: "Screening" },
  { value: "shortlisted", label: "Shortlist" },
  { value: "interview_scheduled", label: "Interview" },
  { value: "offered", label: "Offering" },
  { value: "hired", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  screening: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  shortlisted: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  interview_scheduled: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  interview_completed: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  offered: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  withdrawn: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const statusLabels: Record<string, string> = {
  new: "Baru",
  screening: "Screening",
  shortlisted: "Shortlist",
  interview_scheduled: "Interview",
  interview_completed: "Interview Done",
  offered: "Offering",
  hired: "Diterima",
  rejected: "Ditolak",
  withdrawn: "Withdrawn",
};

export function ApplicantManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [hrNote, setHrNote] = useState("");
  const [internalRating, setInternalRating] = useState<number>(0);

  const queryClient = useQueryClient();

  // Fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-applications", statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select(`
          *,
          job:job_id(title, department),
          applicant:applicant_id(id, full_name, email, phone, photo_url, gender, birth_date, address_domicile, city, cv_url, summary, expected_salary, linkedin_url, portfolio_url),
          educations:applicant_id(educations(institution, degree, major, gpa, end_year)),
          experiences:applicant_id(experiences(company_name, position, start_date, end_date, is_current, description)),
          skills:applicant_id(skills(skill_name, proficiency_level)),
          timeline:application_timeline(id, status, title, description, created_at)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as unknown as Application[];
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Add timeline entry
      await supabase.from("application_timeline").insert({
        application_id: id,
        status,
        title: `Status changed to ${statusLabels[status] || status}`,
        description: "Status updated by HR",
      });
    },
    onSuccess: () => {
      toast.success("Status berhasil diupdate");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      if (selectedApplication) {
        setSelectedApplication(null);
        setIsDetailOpen(false);
      }
    },
    onError: (error: any) => {
      toast.error("Gagal mengupdate status: " + error.message);
    },
  });

  // Add HR note mutation
  const addHrNote = useMutation({
    mutationFn: async ({ applicationId, note }: { applicationId: string; note: string }) => {
      const { error } = await supabase.from("hr_notes").insert({
        application_id: applicationId,
        content: note,
        note_type: "general",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Catatan berhasil ditambahkan");
      setHrNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
  });

  // Update rating mutation
  const updateRating = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const { error } = await supabase
        .from("applications")
        .update({ internal_rating: rating })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rating berhasil diupdate");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
  });

  const filteredApplications = applications?.filter((app) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      app.applicant?.full_name?.toLowerCase().includes(searchLower) ||
      app.applicant?.email?.toLowerCase().includes(searchLower) ||
      app.job?.title?.toLowerCase().includes(searchLower) ||
      app.job?.department?.toLowerCase().includes(searchLower)
    );
  });

  const openDetail = (application: Application) => {
    setSelectedApplication(application);
    setInternalRating(application.internal_rating || 0);
    setIsDetailOpen(true);
    setActiveTab("profile");
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Monitoring Pelamar
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Review dan kelola semua pelamar yang mendaftar
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="h-4 w-4" />
          <span>{applications?.length || 0} pelamar total</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, email, atau posisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredApplications?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">Tidak ada pelamar</h3>
              <p className="text-slate-500 mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Coba ubah filter pencarian"
                  : "Belum ada pelamar yang mendaftar"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelamar</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications?.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => openDetail(app)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {app.applicant?.photo_url ? (
                            <img
                              src={app.applicant.photo_url}
                              alt={app.applicant.full_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-red-100 to-red-200 text-red-700">
                              {getInitials(app.applicant?.full_name || "")}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {app.applicant?.full_name}
                          </p>
                          <p className="text-sm text-slate-500">{app.applicant?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.job?.title}</p>
                        <p className="text-sm text-slate-500">{app.job?.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status] || "bg-slate-100"}>
                        {statusLabels[app.status] || app.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.internal_rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{app.internal_rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {format(new Date(app.created_at), "dd MMM yyyy", { locale: id })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: id })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(app)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Detail
                          </DropdownMenuItem>
                          {app.applicant?.cv_url && (
                            <DropdownMenuItem asChild>
                              <a
                                href={app.applicant.cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download CV
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: app.id, status: "shortlisted" })}
                            disabled={app.status === "shortlisted"}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Shortlist
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: app.id, status: "hired" })}
                            disabled={app.status === "hired"}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Hire
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: app.id, status: "rejected" })}
                            disabled={app.status === "rejected"}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDetailOpen(false)}
                    className="-ml-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedApplication.applicant?.full_name}
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                      Melamar untuk {selectedApplication.job?.title}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="documents">Dokumen</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="notes">Catatan HR</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      {selectedApplication.applicant?.photo_url ? (
                        <img
                          src={selectedApplication.applicant.photo_url}
                          alt={selectedApplication.applicant.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-red-100 to-red-200 text-red-700 text-2xl">
                          {getInitials(selectedApplication.applicant?.full_name || "")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">
                        {selectedApplication.applicant?.full_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {selectedApplication.applicant?.city || "-"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {calculateAge(selectedApplication.applicant?.birth_date)} tahun
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {selectedApplication.applicant?.expected_salary
                            ? `Rp ${selectedApplication.applicant.expected_salary.toLocaleString("id-ID")}`
                            : "-"}
                        </span>
                      </div>
                      {selectedApplication.applicant?.summary && (
                        <p className="mt-3 text-slate-600 text-sm">
                          {selectedApplication.applicant.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informasi Kontak</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-slate-500">Email</Label>
                        <p className="font-medium">{selectedApplication.applicant?.email}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500">Telepon</Label>
                        <p className="font-medium">{selectedApplication.applicant?.phone || "-"}</p>
                      </div>
                      {selectedApplication.applicant?.linkedin_url && (
                        <div className="col-span-2">
                          <Label className="text-slate-500">LinkedIn</Label>
                          <a
                            href={selectedApplication.applicant.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {selectedApplication.applicant.linkedin_url}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Education */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Pendidikan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedApplication.educations?.length === 0 ? (
                        <p className="text-slate-500 text-sm">Belum ada data pendidikan</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedApplication.educations?.map((edu, idx) => (
                            <div key={idx} className="border-l-2 border-slate-200 pl-4">
                              <p className="font-medium">{edu.institution}</p>
                              <p className="text-sm text-slate-600">
                                {edu.degree} - {edu.major}
                              </p>
                              <p className="text-xs text-slate-400">
                                IPK: {edu.gpa} • Lulus: {edu.end_year}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Experience */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Pengalaman Kerja
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedApplication.experiences?.length === 0 ? (
                        <p className="text-slate-500 text-sm">Belum ada pengalaman kerja</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedApplication.experiences?.map((exp, idx) => (
                            <div key={idx} className="border-l-2 border-slate-200 pl-4">
                              <p className="font-medium">{exp.position}</p>
                              <p className="text-sm text-slate-600">{exp.company_name}</p>
                              <p className="text-xs text-slate-400">
                                {format(new Date(exp.start_date), "MMM yyyy", { locale: id })} -{" "}
                                {exp.is_current
                                  ? "Sekarang"
                                  : exp.end_date
                                    ? format(new Date(exp.end_date), "MMM yyyy", { locale: id })
                                    : "-"}
                              </p>
                              {exp.description && (
                                <p className="text-sm text-slate-500 mt-1">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedApplication.skills?.length === 0 ? (
                        <p className="text-slate-500 text-sm">Belum ada skills</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.skills?.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill.skill_name}
                              {skill.proficiency_level && (
                                <span className="ml-1 text-slate-400">({skill.proficiency_level}/5)</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Dokumen Pelamar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedApplication.applicant?.cv_url ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-red-600" />
                            <div>
                              <p className="font-medium">CV / Resume</p>
                              <p className="text-sm text-slate-500">PDF Document</p>
                            </div>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <a
                              href={selectedApplication.applicant.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-8">Tidak ada dokumen tersedia</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Timeline Recruitment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedApplication.timeline?.length === 0 ? (
                          <p className="text-slate-500 text-center py-4">Belum ada activity</p>
                        ) : (
                          selectedApplication.timeline?.map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-red-600" />
                                {idx < (selectedApplication.timeline?.length || 0) - 1 && (
                                  <div className="w-0.5 h-full bg-slate-200 mt-1" />
                                )}
                              </div>
                              <div className="pb-4">
                                <p className="font-medium text-sm">{item.title}</p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Catatan HR</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Internal Rating</Label>
                        <div className="flex items-center gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => {
                                setInternalRating(star);
                                updateRating.mutate({ id: selectedApplication.id, rating: star });
                              }}
                              className="focus:outline-none"
                            >
                              <Star
                                className={cn(
                                  "h-6 w-6 transition-colors",
                                  star <= internalRating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-slate-300"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>HR Notes</Label>
                        <Textarea
                          value={hrNote}
                          onChange={(e) => setHrNote(e.target.value)}
                          placeholder="Tambahkan catatan tentang kandidat ini..."
                          className="mt-2"
                          rows={4}
                        />
                        <Button
                          onClick={() =>
                            addHrNote.mutate({
                              applicationId: selectedApplication.id,
                              note: hrNote,
                            })
                          }
                          disabled={!hrNote.trim() || addHrNote.isPending}
                          className="mt-2 bg-red-600 hover:bg-red-700"
                          size="sm"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Tambah Catatan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        updateStatus.mutate({ id: selectedApplication.id, status: "shortlisted" })
                      }
                      disabled={selectedApplication.status === "shortlisted"}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Shortlist
                    </Button>
                    <Button
                      onClick={() =>
                        updateStatus.mutate({ id: selectedApplication.id, status: "interview_scheduled" })
                      }
                      disabled={selectedApplication.status === "interview_scheduled"}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Interview
                    </Button>
                    <Button
                      onClick={() =>
                        updateStatus.mutate({ id: selectedApplication.id, status: "hired" })
                      }
                      disabled={selectedApplication.status === "hired"}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Hire
                    </Button>
                    <Button
                      onClick={() =>
                        updateStatus.mutate({ id: selectedApplication.id, status: "rejected" })
                      }
                      disabled={selectedApplication.status === "rejected"}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
