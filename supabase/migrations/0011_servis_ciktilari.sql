-- =============================================================
-- ByteNova — 0011_servis_ciktilari
-- Cihaz fotoğrafları, teslim notu, PDF/fotoğraf storage bucket'ları
-- =============================================================

alter table public.service_orders
  add column delivery_note text;

-- ---------- SERVİS FOTOĞRAFLARI ----------

create table public.service_photos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index service_photos_idx on public.service_photos (service_order_id, created_at);

alter table public.service_photos enable row level security;

create policy "service_photos_select" on public.service_photos
  for select using (tenant_id = public.current_tenant_id());

create policy "service_photos_insert" on public.service_photos
  for insert with check (tenant_id = public.current_tenant_id());

create policy "service_photos_delete" on public.service_photos
  for delete using (tenant_id = public.current_tenant_id());

-- ---------- ÖZEL (PRİVATE) STORAGE — fotoğraflar + PDF belgeler ----------
-- Müşteri kişisel verisi içerdiğinden herkese açık değil; yalnız imzalı
-- URL (signed URL) ile erişilir. Yol düzeni: tenant_id/service_id/dosya

insert into storage.buckets (id, name, public)
values ('servis-belgeleri', 'servis-belgeleri', false)
on conflict (id) do nothing;

create policy "servis_belge_okuma" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'servis-belgeleri'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

create policy "servis_belge_yukleme" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'servis-belgeleri'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

create policy "servis_belge_silme" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'servis-belgeleri'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
