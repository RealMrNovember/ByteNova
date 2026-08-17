-- =============================================================
-- ByteNova — 0035_yeni_tenant_varsayilan_plan
-- Sprint 6, Gün 29 düzeltmesi: 0034'teki geriye dönük UPDATE yalnızca o an
-- var olan tenant'ları kapsıyordu; handle_new_user() güncellenmediği için
-- migration sonrası kayıt olan YENİ tenant'lar plan_id/billing_cycle'sız
-- kalıyordu (Ayarlar > Abonelik'te plan satırı boş görünüyordu — canlı
-- testte bulundu). Tetikleyici artık her yeni tenant'a varsayılan olarak
-- Başlangıç/aylık atıyor.
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  v_baslangic_plan_id uuid;
begin
  select id into v_baslangic_plan_id from public.subscription_plans where key = 'baslangic';

  insert into public.tenants (name, plan_id, billing_cycle)
  values (
    coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), 'İşletmem'),
    v_baslangic_plan_id, 'aylik'
  )
  returning id into new_tenant_id;

  insert into public.profiles (id, tenant_id, full_name, role)
  values (new.id, new_tenant_id, new.raw_user_meta_data->>'full_name', 'owner');

  insert into public.branches (tenant_id, name, is_default)
  values (new_tenant_id, 'Merkez', true);

  return new;
end;
$$;
