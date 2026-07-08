/**
 * Server functions for admin/HR operations that require server-side auth.
 * - getSignedCvUrl: role-checked signed URL for CV download.
 * - exportApplicationsCsv: role-checked CSV export with filters.
 * - notifyStatusChange: send status change email via Resend.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statusLabels: Record<string, string> = {
  new: "Lamaran Diterima",
  submitted: "Lamaran Diterima",
  screening: "Screening",
  shortlisted: "Masuk Shortlist",
  interview_scheduled: "Interview Terjadwal",
  interview_completed: "Interview Selesai",
  reference_check: "Reference Check",
  offered: "Menerima Penawaran",
  hired: "Selamat, Anda Diterima!",
  rejected: "Hasil Seleksi",
  withdrawn: "Lamaran Dibatalkan",
};

function emailBody(name: string, jobTitle: string, status: string) {
  const label = statusLabels[status] ?? status;
  const map: Record<string, string> = {
    new: `Terima kasih ${name}, lamaran Anda untuk posisi <strong>${jobTitle}</strong> telah kami terima dan sedang diproses.`,
    submitted: `Terima kasih ${name}, lamaran Anda untuk posisi <strong>${jobTitle}</strong> telah kami terima.`,
    screening: `Halo ${name}, lamaran Anda untuk <strong>${jobTitle}</strong> sedang direview oleh tim HR.`,
    shortlisted: `Selamat ${name}, Anda masuk shortlist untuk posisi <strong>${jobTitle}</strong>. Kami akan menghubungi Anda untuk tahap berikutnya.`,
    interview_scheduled: `Halo ${name}, jadwal interview untuk posisi <strong>${jobTitle}</strong> sudah terjadwal. Detail akan menyusul.`,
    interview_completed: `Halo ${name}, interview untuk <strong>${jobTitle}</strong> telah selesai. Terima kasih atas waktunya.`,
    offered: `Selamat ${name}, kami dengan senang hati menawarkan Anda posisi <strong>${jobTitle}</strong>. Silakan cek portal untuk detail penawaran.`,
    hired: `Selamat ${name}! Anda diterima bekerja untuk posisi <strong>${jobTitle}</strong> di PT Kayaba Indonesia.`,
    rejected: `Halo ${name}, terima kasih atas ketertarikan Anda pada posisi <strong>${jobTitle}</strong>. Pada kesempatan ini kami belum dapat melanjutkan proses. Semoga sukses di kesempatan berikutnya.`,
    withdrawn: `Halo ${name}, lamaran Anda untuk <strong>${jobTitle}</strong> telah dibatalkan.`,
  };
  const content = map[status] ?? `Status lamaran Anda untuk <strong>${jobTitle}</strong> telah diperbarui menjadi <strong>${label}</strong>.`;
  return `
  <!doctype html>
  <html><body style="margin:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#111">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e7">
          <tr><td style="background:#0a0a0a;padding:24px 32px;border-bottom:4px solid #dc2626">
            <div style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:2px">KAYABA</div>
            <div style="color:#a1a1aa;font-size:12px;margin-top:4px">PT KAYABA INDONESIA · CAREER PORTAL</div>
          </td></tr>
          <tr><td style="padding:32px">
            <h1 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">${label}</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46">${content}</p>
            <p style="margin:24px 0 0;font-size:14px;color:#71717a">Salam,<br/><strong>Tim Rekrutmen PT Kayaba Indonesia</strong></p>
          </td></tr>
          <tr><td style="background:#fafafa;padding:16px 32px;border-top:1px solid #e4e4e7;font-size:11px;color:#a1a1aa">
            Email otomatis. Jangan balas ke alamat ini. Info: recruitment@kyb.co.id
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

export const getSignedCvUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ applicationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!isStaff) throw new Error("Forbidden: HR/Admin only");

    const { data: app, error } = await supabase
      .from("applications")
      .select("applicant:applicant_id(cv_path,cv_url,full_name)")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (error) throw error;
    const path = (app as any)?.applicant?.cv_path;
    const fallback = (app as any)?.applicant?.cv_url;
    if (!path) {
      if (fallback) return { url: fallback as string };
      throw new Error("Kandidat belum meng-upload CV.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("applicant-documents")
      .createSignedUrl(path, 60);
    if (sErr) throw sErr;
    return { url: signed.signedUrl };
  });

export const exportApplicationsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        jobId: z.string().uuid().optional().nullable(),
        status: z.string().optional().nullable(),
        from: z.string().optional().nullable(),
        to: z.string().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!isStaff) throw new Error("Forbidden: HR/Admin only");

    let query = supabase
      .from("applications")
      .select(
        `id,status,internal_rating,screening_score,interview_date,created_at,updated_at,
         job:job_id(title,department,location),
         applicant:applicant_id(full_name,email,phone,city,expected_salary)`,
      )
      .order("created_at", { ascending: false });
    if (data.jobId) query = query.eq("job_id", data.jobId);
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    if (data.from) query = query.gte("created_at", data.from);
    if (data.to) query = query.lte("created_at", data.to);

    const { data: rows, error } = await query;
    if (error) throw error;

    const headers = [
      "ID Aplikasi",
      "Tanggal Melamar",
      "Nama",
      "Email",
      "Telepon",
      "Kota",
      "Posisi",
      "Departemen",
      "Lokasi Kerja",
      "Status",
      "Rating Internal",
      "Screening Score",
      "Tanggal Interview",
      "Ekspektasi Gaji",
    ];
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of (rows ?? []) as any[]) {
      lines.push(
        [
          r.id,
          new Date(r.created_at).toISOString(),
          r.applicant?.full_name,
          r.applicant?.email,
          r.applicant?.phone,
          r.applicant?.city,
          r.job?.title,
          r.job?.department,
          r.job?.location,
          r.status,
          r.internal_rating,
          r.screening_score,
          r.interview_date ? new Date(r.interview_date).toISOString() : "",
          r.applicant?.expected_salary,
        ]
          .map(escape)
          .join(","),
      );
    }
    return { csv: "\uFEFF" + lines.join("\n"), count: rows?.length ?? 0 };
  });

export const notifyStatusChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ applicationId: z.string().uuid(), status: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: userId });
    if (!isStaff) throw new Error("Forbidden");

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      return { ok: false, reason: "Resend belum dikonfigurasi (RESEND_API_KEY / RESEND_FROM_EMAIL kosong)." };
    }

    const { data: app, error } = await supabase
      .from("applications")
      .select("id, applicant:applicant_id(email,full_name), job:job_id(title)")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (error) throw error;
    const email = (app as any)?.applicant?.email;
    const name = (app as any)?.applicant?.full_name ?? "Kandidat";
    const jobTitle = (app as any)?.job?.title ?? "posisi ini";
    if (!email) return { ok: false, reason: "Email pelamar tidak ditemukan." };

    const subject = `${statusLabels[data.status] ?? "Update Status Lamaran"} - PT Kayaba Indonesia`;
    const html = emailBody(name, jobTitle, data.status);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from: fromEmail, to: [email], subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend gagal [${res.status}]: ${text}`);
    }
    return { ok: true };
  });
