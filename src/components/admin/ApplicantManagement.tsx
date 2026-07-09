import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Download, Eye, FileDown, FileText, History, MoreVertical, Search, Send, Star, UserCheck, Users, XCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { applicationStatusLabels } from "@/constants/company";
import { getSignedCvUrl, exportApplicationsCsv, notifyStatusChange } from "@/lib/admin.functions";

type Application = {
  id: string;
  status: string;
  screening_score: number | null;
  interview_date: string | null;
  internal_rating: number | null;
  created_at: string;
  job: { title: string; department: string } | null;
  applicant: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    cv_url: string | null;
    cv_path: string | null;
    summary: string | null;
    expected_salary: number | null;
  } | null;
  timeline?: Array<{ id: string; status: string; title: string; description: string | null; created_at: string }>;
};

const statusOptions = ["all", "new", "screening", "shortlisted", "interview_scheduled", "offered", "hired", "rejected"];

export function ApplicantManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [hrNote, setHrNote] = useState("");
  const [internalRating, setInternalRating] = useState(0);
  const queryClient = useQueryClient();
  const signedUrlFn = useServerFn(getSignedCvUrl);
  const exportFn = useServerFn(exportApplicationsCsv);
  const notifyFn = useServerFn(notifyStatusChange);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-applications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select(`
          id,status,screening_score,interview_date,internal_rating,created_at,
          job:job_id(title,department),
          applicant:applicant_id(id,full_name,email,phone,city,cv_url,cv_path,summary,expected_salary),
          timeline:application_timeline(id,status,title,description,created_at)
        `)
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Application[];
    },
  });

  const filteredApplications = (applications ?? []).filter((app) => {
    const haystack = `${app.applicant?.full_name ?? ""} ${app.applicant?.email ?? ""} ${app.job?.title ?? ""} ${app.job?.department ?? ""}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
      // Trigger DB otomatis menambahkan timeline & notification. Kirim email async.
      try {
        const res = await notifyFn({ data: { applicationId: id, status } });
        if (res && "reason" in res && res.reason) {
          console.warn("[email]", res.reason);
        }
      } catch (err: any) {
        console.warn("[email] gagal:", err?.message ?? err);
      }
    },
    onSuccess: () => {
      toast.success("Status pelamar diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      setSelectedApplication(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const downloadCv = async (applicationId: string) => {
    try {
      const res = await signedUrlFn({ data: { applicationId } });
      window.open(res.url, "_blank");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal membuka CV.");
    }
  };

  const handleExport = async () => {
    try {
      const res = await exportFn({
        data: { status: statusFilter === "all" ? null : statusFilter },
      });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pelamar-kayaba-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${res.count} baris di-export.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal export CSV.");
    }
  };

  const addHrNote = useMutation({
    mutationFn: async () => {
      if (!selectedApplication || !hrNote.trim()) return;
      const { error } = await supabase.from("hr_notes").insert({
        application_id: selectedApplication.id,
        content: hrNote,
        note_type: "general",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Catatan HR tersimpan.");
      setHrNote("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRating = useMutation({
    mutationFn: async (rating: number) => {
      if (!selectedApplication) return;
      const { error } = await supabase.from("applications").update({ internal_rating: rating }).eq("id", selectedApplication.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openDetail = (application: Application) => {
    setSelectedApplication(application);
    setInternalRating(application.internal_rating ?? 0);
    setActiveTab("profile");
  };

  const initials = (name?: string | null) => (name ?? "?").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">Applicant Pipeline</span>
          <h1 className="mt-3 text-3xl font-extrabold">Monitoring Pelamar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review kandidat, ubah status, pantau timeline, dan simpan catatan internal HR.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="border border-border bg-card px-3 py-2 text-sm font-bold"><Users className="mr-2 inline h-4 w-4 text-primary" />{applications?.length ?? 0} pelamar</div>
          <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" />Export CSV</Button>
        </div>
      </div>

      <Card className="industrial-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_210px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama, email, posisi, departemen" className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map((status) => <SelectItem key={status} value={status}>{status === "all" ? "Semua Status" : applicationStatusLabels[status]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="industrial-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Memuat pelamar...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Tidak ada pelamar sesuai filter.</div>
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
              {filteredApplications.map((app) => (
                <TableRow key={app.id} className="cursor-pointer" onClick={() => openDetail(app)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10"><AvatarFallback className="border border-primary/25 bg-accent text-primary">{initials(app.applicant?.full_name)}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-bold">{app.applicant?.full_name ?? "Kandidat"}</div>
                        <div className="text-xs text-muted-foreground">{app.applicant?.email ?? "-"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><div className="font-bold">{app.job?.title ?? "-"}</div><div className="text-xs text-muted-foreground">{app.job?.department ?? "-"}</div></TableCell>
                  <TableCell><Badge variant={app.status === "rejected" ? "destructive" : app.status === "hired" ? "default" : "outline"}>{applicationStatusLabels[app.status] ?? app.status}</Badge></TableCell>
                  <TableCell>{app.internal_rating ? <span className="font-bold">{app.internal_rating}/5</span> : <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell><div className="text-sm">{format(new Date(app.created_at), "dd MMM yyyy", { locale: id })}</div><div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: id })}</div></TableCell>
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetail(app)}><Eye className="mr-2 h-4 w-4" />Lihat Detail</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: app.id, status: "shortlisted" })}><CheckCircle2 className="mr-2 h-4 w-4" />Shortlist</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: app.id, status: "interview_scheduled" })}><Calendar className="mr-2 h-4 w-4" />Interview</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: app.id, status: "hired" })}><UserCheck className="mr-2 h-4 w-4" />Terima</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => updateStatus.mutate({ id: app.id, status: "rejected" })}><XCircle className="mr-2 h-4 w-4" />Tolak</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          {selectedApplication ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedApplication.applicant?.full_name ?? "Detail Pelamar"}</DialogTitle>
                <p className="text-sm text-muted-foreground">Melamar untuk {selectedApplication.job?.title ?? "-"}</p>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="documents">Dokumen</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="notes">Catatan HR</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-5 grid gap-4 md:grid-cols-2">
                  <Info label="Nama" value={selectedApplication.applicant?.full_name} />
                  <Info label="Email" value={selectedApplication.applicant?.email} />
                  <Info label="Telepon" value={selectedApplication.applicant?.phone} />
                  <Info label="Domisili" value={selectedApplication.applicant?.city} />
                  <Info label="Ekspektasi Gaji" value={selectedApplication.applicant?.expected_salary ? `Rp ${selectedApplication.applicant.expected_salary.toLocaleString("id-ID")}` : "-"} />
                  <Info label="Status" value={applicationStatusLabels[selectedApplication.status] ?? selectedApplication.status} />
                  <div className="md:col-span-2 border border-border p-4"><div className="text-xs font-bold uppercase text-muted-foreground">Ringkasan</div><p className="mt-2 text-sm leading-6">{selectedApplication.applicant?.summary ?? "Belum ada ringkasan profil."}</p></div>
                </TabsContent>
                <TabsContent value="documents" className="mt-5">
                  <Card className="industrial-card p-5">
                    {selectedApplication.applicant?.cv_path || selectedApplication.applicant?.cv_url ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3"><FileText className="h-8 w-8 text-primary" /><div><div className="font-bold">CV / Resume</div><div className="text-sm text-muted-foreground">Signed URL, berlaku 60 detik.</div></div></div>
                        <Button variant="outline" onClick={() => downloadCv(selectedApplication.id)}><Download className="mr-2 h-4 w-4" />Download CV</Button>
                      </div>
                    ) : <p className="text-sm text-muted-foreground">Kandidat belum meng-upload CV.</p>}
                  </Card>
                </TabsContent>
                <TabsContent value="timeline" className="mt-5">
                  <Card className="industrial-card p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-extrabold"><History className="h-4 w-4 text-primary" />Timeline Recruitment</h3>
                    <div className="space-y-4">
                      {(selectedApplication.timeline ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Belum ada timeline.</p> :
                        [...(selectedApplication.timeline ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((item) => (
                          <div key={item.id} className="border-l-2 border-primary pl-4"><div className="font-bold">{item.title}</div><div className="mt-1 text-xs text-muted-foreground">{format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: id })}</div><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>
                        ))}
                    </div>
                  </Card>
                </TabsContent>
                <TabsContent value="notes" className="mt-5 space-y-5">
                  <Card className="industrial-card p-5">
                    <Label>Internal Rating</Label>
                    <div className="mt-3 flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => { setInternalRating(star); updateRating.mutate(star); }}>
                          <Star className={star <= internalRating ? "h-6 w-6 fill-primary text-primary" : "h-6 w-6 text-muted-foreground"} />
                        </button>
                      ))}
                    </div>
                    <div className="mt-5">
                      <Label>Catatan HR</Label>
                      <Textarea className="mt-2" rows={4} value={hrNote} onChange={(event) => setHrNote(event.target.value)} placeholder="Tambahkan catatan internal..." />
                      <Button className="mt-3" size="sm" onClick={() => addHrNote.mutate()} disabled={!hrNote.trim() || addHrNote.isPending}><Send className="mr-2 h-4 w-4" />Tambah Catatan</Button>
                    </div>
                  </Card>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => updateStatus.mutate({ id: selectedApplication.id, status: "shortlisted" })}>Shortlist</Button>
                    <Button onClick={() => updateStatus.mutate({ id: selectedApplication.id, status: "interview_scheduled" })}>Interview</Button>
                    <Button onClick={() => updateStatus.mutate({ id: selectedApplication.id, status: "hired" })}>Terima</Button>
                    <Button variant="destructive" onClick={() => updateStatus.mutate({ id: selectedApplication.id, status: "rejected" })}>Tolak</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="border border-border p-4"><div className="text-xs font-bold uppercase text-muted-foreground">{label}</div><div className="mt-2 font-bold">{value || "-"}</div></div>;
}