# TODO - KYB Recruitment Portal Redesign (UI/UX + Struktur + Database)

## Fase 0 — Persiapan
- [ ] Audit seluruh route yang ada (public + authenticated/admin) untuk menemukan bug/logika bercampur UI
- [ ] Audit integrasi Supabase (client/server/auth context) dan kontrak tipe data
- [ ] Freeze target: skema final (profiles/user_profiles, skills/applicant_skills) + mapping dari data lama

## Fase 1 — Refactor Frontend (tanpa mengubah DB dulu)
- [ ] Buat folder struktur baru: `features/`, `services/`, `domain/`, `components/` (presentational), `lib/`
- [ ] Buat service layer Supabase per domain (jobs/applications/auth/profile/admin)
- [ ] Standardisasi React Query hooks (caching, error mapping, loading states)
- [ ] Rapikan route: pindahkan side-effects & conditional logic ke loader/hooks

## Fase 2 — Redesign UI/UX (branding KYB)
- [ ] Buat brand system yang konsisten (token spacing/typography/radius/shadow)
- [ ] Redesign Landing (hero, trust, process timeline, CTA)
- [ ] Redesign Jobs listing + Job detail (badge, deadline, employment type)
- [ ] Redesign application flow stepper + forms (validation + UX yang rapi)
- [ ] Redesign Admin dashboard: analytics cards, filters, tables, timeline drawer

## Fase 3 — Database Consolidation + Migration Strategy
- [ ] Pilih skema final dan buat mapping data lama → skema final
- [ ] Tulis migration bertahap (expand → update code → contract)
- [ ] Konsolidasi tabel & relasi (foreign keys, soft delete, views)
- [ ] Review & perketat RLS agar sesuai role (applicant vs HR vs admin)
- [ ] Update/rapikan function/RPC (mis. `get_admin_stats`)

## Fase 4 — Sinkronisasi TypeScript types & DTO
- [ ] Buat `src/types/domain.ts` + `src/types/api.ts`
- [ ] Pastikan tipe data sesuai schema final + RPC outputs
- [ ] Hilangkan `any` dan samakan nama field di seluruh UI

## Fase 5 — Testing & Quality Gate
- [ ] `npm run lint` dan `npm run build`
- [ ] QA manual: login, daftar, lihat jobs, apply, admin login, dashboard
- [ ] Validasi RLS: applicant tidak bisa akses data lain
- [ ] Checklist deploy: Vercel/Cloudflare + Supabase migration readiness

## Catatan
- [ ] Semua perubahan harus menjaga pengalaman “jauh lebih indah dan professional” vs versi awal.

