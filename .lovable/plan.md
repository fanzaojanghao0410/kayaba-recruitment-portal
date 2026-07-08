
# Rencana Eksekusi

## 0. Konfigurasi & Secrets (dilakukan lebih dulu)
- Update `.env`: `SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PROJECT_ID`, dan `SUPABASE_PUBLISHABLE_KEY` → project `jkycacidlvufhgyplwdg` (samakan dengan `VITE_SUPABASE_ANON_KEY` yang sudah benar).
- Simpan `SUPABASE_SERVICE_ROLE_KEY` (dari chat) via `set_secret`.
- Buka form aman `add_secret` untuk `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (contoh: `noreply@kayaba-indonesia.co.id`).
- Scrape aset publik dari `kayaba-indonesia.co.id` (logo + 3-5 foto produk/gedung), simpan ke `src/assets/kayaba/`.

## 1. SQL Migration Lengkap (satu migration)
- Tabel: `profiles`, `user_roles` (enum `app_role`: admin, hr, applicant), `applicants`, `jobs` (+ kolom `category`, `location`, `is_published`), `applications`, `application_timeline`, `hr_notes`, `notifications`.
- Function `has_role()` SECURITY DEFINER (anti-recursion).
- Trigger: auto-create `profiles` + role `applicant` saat signup; auto-insert `application_timeline` + `notifications` saat status berubah; enqueue email via pg_net → server route.
- RLS policies:
  - `jobs`: SELECT `anon` (hanya `is_published=true`), all-ops untuk admin/hr.
  - `applications`, `applicants`: pemilik + admin/hr.
  - `application_timeline`, `hr_notes`, `notifications`: sesuai peran.
- GRANT per role (anon, authenticated, service_role).
- Storage bucket **private** `applicant-documents` + RLS objects: user upload ke path `{user_id}/...`, admin/hr baca semua.

## 2. Sistem Login Unified
- Hapus `admin-login.tsx` & route-nya.
- Satu `/login`: setelah sign-in, cek `user_roles`, redirect: admin/hr → `/admin`, applicant → `/applications`.
- Route `_authenticated/admin/*` di-gate via `has_role` (loader server-fn).

## 3. Halaman Jobs (Pelamar)
- Search cepat (debounced, full-text `ilike` di title+description).
- Filter: kategori (dropdown), lokasi (dropdown), tipe kerja.
- Grid responsif dengan skeleton, empty state, count hasil.
- Detail lowongan `/jobs/$jobId` — sudah ada, poles: persyaratan, benefit, tombol "Lamar Sekarang" → dialog application form (redirect login kalau belum auth).

## 4. Admin Dashboard — CRUD & Monitoring
- **Jobs**: create/edit/delete/publish-toggle, form lengkap dengan kategori & lokasi.
- **Applicants**: table + detail drawer (profil, dokumen, timeline, notes, rating). Update status → trigger otomatis timeline + email.
- **Documents**: tombol "Download" via signed URL (server-fn `getSignedCvUrl`, expire 60s, cek role).
- **Export CSV**: 2 tombol — export applications (filter by job + date range) & export timeline. Format: header rapi, tanggal ISO, UTF-8 BOM.
- Dashboard stats real dari DB (count jobs aktif, pelamar bulan ini, per status).

## 5. Notifikasi Email Otomatis
- Server route `/api/public/webhooks/status-changed` (verifikasi HMAC dari trigger DB), atau simpler: server-fn `updateApplicationStatus` yang setelah update DB langsung call Resend.
- Template email per status: `submitted`, `screening`, `interview_scheduled`, `offered`, `hired`, `rejected` — HTML sederhana dengan brand merah/hitam Kayaba.
- Kirim via Resend REST API, `from` = `RESEND_FROM_EMAIL`.
- Log ke tabel `notifications`.

## 6. UI/UX Revamp
- Ganti semua foto pabrik generik dengan aset scraped Kayaba (logo asli, produk shock absorber).
- Iconify (`@iconify/react`) menggantikan lucide di area yang butuh ikon industri.
- Spacing/typography konsisten: `Inter` body + `Manrope` heading via `@fontsource`.
- Hero home: logo Kayaba + tagline resmi + CTA "Lihat Lowongan".
- Section "Tentang Kayaba" dengan foto gedung/produk asli.
- Card lowongan: rapi, konsisten, tanpa border-radius (aturan brand sebelumnya).

## 7. Keamanan
- Semua download CV via signed URL server-fn (tidak expose path storage).
- Server-fn `requireSupabaseAuth` + cek `has_role` untuk semua admin action.
- Zod validation di semua server-fn input.
- Tidak ada service role key di kode client.

## Info Teknis yang Diperlukan dari Anda
- **RESEND_API_KEY** (dari dashboard Resend)
- **RESEND_FROM_EMAIL** (domain harus sudah verified di Resend, mis. `noreply@kayaba-indonesia.co.id` — kalau belum verified email akan gagal terkirim)

## Yang TIDAK saya lakukan (di luar scope, kalau perlu bilang)
- Membuat akun admin awal (Anda buat manual via Cloud → Users, lalu saya insert role via SQL — atau kasih tahu email admin, saya seed di migration).
- Verifikasi domain Resend (Anda lakukan di dashboard Resend).

Kalau plan ini oke saya langsung eksekusi dari step 0.
