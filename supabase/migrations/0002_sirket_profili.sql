-- =============================================================
-- ByteNova — 0002_sirket_profili
-- Şirket bilgileri (telefon, adres, logo) + kurulum durumu
-- + logo storage bucket'ı ve politikaları
-- Uygulama: Supabase Dashboard → SQL Editor → bu dosyayı çalıştır
-- =============================================================

-- ---------- TENANT ALANLARI ----------

alter table public.tenants
  add column phone text,
  add column address text,
  add column logo_url text,
  add column onboarding_completed boolean not null default false;

-- Sahip/yönetici kendi işletme bilgilerini güncelleyebilir
create policy "tenant_update_owner" on public.tenants
  for update using (
    id = public.current_tenant_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('owner','manager')
    )
  );

-- ---------- LOGO STORAGE ----------

insert into storage.buckets (id, name, public)
values ('logolar', 'logolar', true)
on conflict (id) do nothing;

-- Herkes okuyabilir (logolar halka açık: servis formu, showroom vb.)
create policy "logo_okuma" on storage.objects
  for select using (bucket_id = 'logolar');

-- Kullanıcı yalnız kendi tenant klasörüne yükleyebilir/güncelleyebilir
create policy "logo_yukleme" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logolar'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

create policy "logo_guncelleme" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logolar'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );

create policy "logo_silme" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logolar'
    and (storage.foldername(name))[1] = public.current_tenant_id()::text
  );
