-- =============================================================
-- ByteNova — 0018_satis
-- Hızlı satış (POS) v1: karma kalemler (ürün/işçilik/hizmet),
-- satış numarası üretimi, atomik satış oluşturma RPC'si.
-- =============================================================

-- ---------- SATIŞ NUMARASI SAYAÇLARI ----------
-- Format: SN-YYYY-NNNNNN (service_no ile aynı desen)

create table public.sale_no_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  year int not null,
  last_no int not null default 0,
  primary key (tenant_id, year)
);

create or replace function public.sonraki_satis_no(p_tenant_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  yil int := extract(year from now());
  sira int;
begin
  insert into public.sale_no_counters (tenant_id, year, last_no)
  values (p_tenant_id, yil, 1)
  on conflict (tenant_id, year)
  do update set last_no = sale_no_counters.last_no + 1
  returning last_no into sira;

  return 'SN-' || yil || '-' || lpad(sira::text, 6, '0');
end;
$$;

-- ---------- SATIŞLAR ----------

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sale_no text not null,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'tamamlandi' check (status in ('tamamlandi', 'iptal')),
  subtotal numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  payment_method text not null check (payment_method in ('nakit', 'kart', 'acik_hesap')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index sales_no_unique on public.sales (tenant_id, sale_no);
create index sales_tenant_idx on public.sales (tenant_id, created_at desc);
create index sales_customer_idx on public.sales (customer_id);

-- Satış no otomatik ata (boş bırakılırsa) — servis_no_ata() ile aynı desen,
-- ancak o fonksiyon service_no kolonuna sabitlenmiş olduğu için burada
-- ayrı bir tetikleyici fonksiyon gerekiyor.
create or replace function public.satis_no_ata()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.sale_no is null or trim(new.sale_no) = '' then
    new.sale_no := public.sonraki_satis_no(new.tenant_id);
  end if;
  return new;
end;
$$;

create trigger sales_no_ata
  before insert on public.sales
  for each row execute function public.satis_no_ata();

alter table public.sales enable row level security;

create policy "sales_select" on public.sales
  for select using (tenant_id = public.current_tenant_id());

-- ---------- SATIŞ KALEMLERİ (karma: ürün / işçilik / hizmet) ----------

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  item_type text not null check (item_type in ('urun', 'iscilik', 'hizmet')),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);

create index sale_items_sale_idx on public.sale_items (sale_id);

alter table public.sale_items enable row level security;

create policy "sale_items_select" on public.sale_items
  for select using (tenant_id = public.current_tenant_id());

-- Her iki tabloya da yazma yalnız aşağıdaki RPC üzerinden olur —
-- satış + kalemler + stok düşümü tek atomik işlemdir.

create or replace function public.satis_olustur(
  p_musteri_id uuid,
  p_kalemler jsonb,
  p_odeme_yontemi text,
  p_negatif_onay boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_sale_id uuid;
  v_toplam numeric := 0;
  v_kalem record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if p_odeme_yontemi not in ('nakit', 'kart', 'acik_hesap') then
    raise exception 'geçersiz ödeme yöntemi';
  end if;

  if p_odeme_yontemi = 'acik_hesap' and p_musteri_id is null then
    raise exception 'açık hesap için müşteri seçilmeli';
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_toplam
  from jsonb_to_recordset(p_kalemler)
    as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric);

  if v_toplam <= 0 then
    raise exception 'satışta en az bir geçerli kalem olmalı';
  end if;

  insert into public.sales (tenant_id, customer_id, subtotal, total_amount, payment_method, created_by)
  values (v_tenant, p_musteri_id, v_toplam, v_toplam, p_odeme_yontemi, auth.uid())
  returning id into v_sale_id;

  for v_kalem in
    select * from jsonb_to_recordset(p_kalemler)
      as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric)
  loop
    if v_kalem.item_type not in ('urun', 'iscilik', 'hizmet') then
      raise exception 'geçersiz kalem tipi: %', v_kalem.item_type;
    end if;
    if v_kalem.quantity is null or v_kalem.quantity <= 0 then
      raise exception 'geçersiz miktar: %', v_kalem.name;
    end if;
    if v_kalem.unit_price is null or v_kalem.unit_price < 0 then
      raise exception 'geçersiz birim fiyat: %', v_kalem.name;
    end if;

    insert into public.sale_items
      (tenant_id, sale_id, item_type, product_id, name, quantity, unit_price, line_total)
    values
      (v_tenant, v_sale_id, v_kalem.item_type, v_kalem.product_id, v_kalem.name,
       v_kalem.quantity, v_kalem.unit_price, v_kalem.quantity * v_kalem.unit_price);

    if v_kalem.item_type = 'urun' and v_kalem.product_id is not null then
      perform public.stok_hareketi_ekle(
        v_kalem.product_id, -v_kalem.quantity, 'sale', 'sale', v_sale_id::text,
        'Satış: ' || v_kalem.name, p_negatif_onay
      );
    end if;
  end loop;

  perform public.audit_ekle(
    'satis_olusturuldu', 'sale', v_sale_id::text, null,
    jsonb_build_object('toplam', v_toplam, 'odeme_yontemi', p_odeme_yontemi)
  );

  return v_sale_id;
end;
$$;
