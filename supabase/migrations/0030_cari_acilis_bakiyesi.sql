-- =============================================================
-- ByteNova — 0030_cari_acilis_bakiyesi
-- Sprint 5, Gün 24 (1/2): Cari açılış bakiyesi (devir).
-- İşletme ByteNova'ya geçerken eski sisteminden devreden müşteri
-- alacağı / tedarikçi borcu varsa, bunu sahte bir "açık hesap satış"
-- ya da "alış" gibi göstermeden tek seferlik bir açılış kaydıyla
-- girebilmesi için. Yalnızca o müşteri/tedarikçinin HİÇ cari hareketi
-- yokken kullanılabilir — gerçek bir işlemi geriye dönük "düzeltme"
-- amacıyla kötüye kullanılmasın diye.
-- =============================================================

alter table public.customer_ledger drop constraint customer_ledger_entry_type_check;
alter table public.customer_ledger add constraint customer_ledger_entry_type_check
  check (entry_type in ('acik_hesap_satis', 'tahsilat', 'duzeltme', 'acilis_bakiyesi'));

alter table public.supplier_ledger drop constraint supplier_ledger_entry_type_check;
alter table public.supplier_ledger add constraint supplier_ledger_entry_type_check
  check (entry_type in ('alis_borc', 'odeme', 'kur_farki', 'duzeltme', 'acilis_bakiyesi'));

create or replace function public.musteri_acilis_bakiyesi_belirle(
  p_customer_id uuid,
  p_tutar numeric,
  p_aciklama text default null
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_tutar is null or p_tutar = 0 then
    raise exception 'geçersiz tutar';
  end if;
  if not exists (select 1 from public.customers where id = p_customer_id and tenant_id = v_tenant) then
    raise exception 'müşteri bulunamadı veya erişim yok';
  end if;
  if exists (select 1 from public.customer_ledger where customer_id = p_customer_id) then
    raise exception 'AÇILIŞ_BAKİYESİ_ZATEN_VAR: bu müşteride zaten cari hareket var, açılış bakiyesi yalnızca ilk hareketten önce belirlenebilir';
  end if;

  return public.musteri_borc_ekle(
    p_customer_id, p_tutar, 'acilis_bakiyesi', 'opening_balance', null,
    coalesce(nullif(trim(p_aciklama), ''), 'Açılış bakiyesi (devir)')
  );
end;
$$;

create or replace function public.tedarikci_acilis_bakiyesi_belirle(
  p_supplier_id uuid,
  p_tutar numeric,
  p_kur numeric,
  p_aciklama text default null
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_tutar is null or p_tutar = 0 then
    raise exception 'geçersiz tutar';
  end if;
  if p_kur is null or p_kur <= 0 then
    raise exception 'geçersiz kur';
  end if;
  if not exists (select 1 from public.suppliers where id = p_supplier_id and tenant_id = v_tenant) then
    raise exception 'tedarikçi bulunamadı veya erişim yok';
  end if;
  if exists (select 1 from public.supplier_ledger where supplier_id = p_supplier_id) then
    raise exception 'AÇILIŞ_BAKİYESİ_ZATEN_VAR: bu tedarikçide zaten cari hareket var, açılış bakiyesi yalnızca ilk hareketten önce belirlenebilir';
  end if;

  return public.tedarikci_borc_ekle(
    p_supplier_id, p_tutar, p_kur, 'opening_balance', null,
    coalesce(nullif(trim(p_aciklama), ''), 'Açılış bakiyesi (devir)'), 'acilis_bakiyesi'
  );
end;
$$;
