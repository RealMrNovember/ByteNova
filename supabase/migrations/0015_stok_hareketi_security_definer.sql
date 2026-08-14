-- =============================================================
-- ByteNova — 0015_stok_hareketi_security_definer
-- stok_hareketi_ekle() SECURITY DEFINER olmalı: stock_movements
-- tablosuna INSERT policy tanımlanmadığı için (yazma yalnızca bu
-- fonksiyon üzerinden olsun diye) çağıran rolün RLS'e takılmadan
-- yazabilmesi gerekiyor. Fonksiyon içinde tenant_id ve ürün
-- sahipliği zaten manuel doğrulanıyor (audit_ekle ile aynı desen).
-- =============================================================

create or replace function public.stok_hareketi_ekle(
  p_product_id uuid,
  p_degisim numeric,
  p_tip text,
  p_referans_tip text default null,
  p_referans_id text default null,
  p_neden text default null
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_once numeric;
  v_sonra numeric;
begin
  v_tenant := public.current_tenant_id();

  select stock_quantity into v_once
  from public.products
  where id = p_product_id and tenant_id = v_tenant
  for update;

  if not found then
    raise exception 'ürün bulunamadı veya erişim yok';
  end if;

  v_sonra := v_once + p_degisim;

  update public.products
  set stock_quantity = v_sonra
  where id = p_product_id;

  insert into public.stock_movements
    (tenant_id, product_id, movement_type, quantity_change, quantity_before, quantity_after,
     reference_type, reference_id, reason, created_by)
  values
    (v_tenant, p_product_id, p_tip, p_degisim, v_once, v_sonra,
     p_referans_tip, p_referans_id, p_neden, auth.uid());

  return v_sonra;
end;
$$;
