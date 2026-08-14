-- =============================================================
-- ByteNova — 0016_stok_disiplini
-- Negatif stok politikası (tenant ayarı) + Sayım v1
-- (snapshot → fark → onay → düzeltme + audit)
-- =============================================================

-- ---------- NEGATİF STOK POLİTİKASI ----------

alter table public.tenants
  add column negative_stock_policy text not null default 'uyarili'
  check (negative_stock_policy in ('uyarili', 'onayli', 'yasak'));

-- stok_hareketi_ekle(): sonuç negatife düşerse tenant politikasına göre
-- davranır — 'yasak' engeller, 'onayli' açık onay ister (p_negatif_onay),
-- 'uyarili' izin verir (çağıran taraf dönen negatif değere göre uyarı gösterir).
create or replace function public.stok_hareketi_ekle(
  p_product_id uuid,
  p_degisim numeric,
  p_tip text,
  p_referans_tip text default null,
  p_referans_id text default null,
  p_neden text default null,
  p_negatif_onay boolean default false
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
  v_politika text;
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

  if v_sonra < 0 then
    select negative_stock_policy into v_politika
    from public.tenants where id = v_tenant;

    if v_politika = 'yasak' then
      raise exception 'STOK_YETERSIZ: mevcut % adet, % adet çıkarılamaz', v_once, abs(p_degisim);
    elsif v_politika = 'onayli' and not p_negatif_onay then
      raise exception 'NEGATIF_STOK_ONAY_GEREKLI: % → %', v_once, v_sonra;
    end if;
  end if;

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

-- ---------- SAYIM v1 ----------

create table public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  status text not null default 'taslak' check (status in ('taslak', 'tamamlandi', 'iptal')),
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz
);

create index stock_counts_tenant_idx on public.stock_counts (tenant_id, started_at desc);

alter table public.stock_counts enable row level security;

create policy "stock_counts_select" on public.stock_counts
  for select using (tenant_id = public.current_tenant_id());

create table public.stock_count_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  stock_count_id uuid not null references public.stock_counts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  expected_quantity numeric(12,2) not null,
  counted_quantity numeric(12,2),
  unique (stock_count_id, product_id)
);

create index stock_count_items_sayim_idx on public.stock_count_items (stock_count_id);

alter table public.stock_count_items enable row level security;

create policy "stock_count_items_select" on public.stock_count_items
  for select using (tenant_id = public.current_tenant_id());

-- Bu iki tabloya yazma yalnız aşağıdaki RPC'ler üzerinden olur —
-- "taslak" durumu ve tenant sahipliği merkezi olarak burada doğrulanır.

create or replace function public.sayim_baslat()
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  insert into public.stock_counts (tenant_id, started_by)
  values (v_tenant, auth.uid())
  returning id into v_id;

  insert into public.stock_count_items (tenant_id, stock_count_id, product_id, expected_quantity)
  select v_tenant, v_id, id, stock_quantity
  from public.products
  where tenant_id = v_tenant and is_active = true;

  perform public.audit_ekle('sayim_baslatildi', 'stock_count', v_id::text);

  return v_id;
end;
$$;

create or replace function public.sayim_miktar_gir(p_kalem_id uuid, p_miktar numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.stock_count_items sci
  set counted_quantity = p_miktar
  where sci.id = p_kalem_id
    and sci.tenant_id = v_tenant
    and exists (
      select 1 from public.stock_counts sc
      where sc.id = sci.stock_count_id and sc.status = 'taslak'
    );

  if not found then
    raise exception 'sayım kalemi bulunamadı veya sayım artık taslak değil';
  end if;
end;
$$;

create or replace function public.sayim_tamamla(p_sayim_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_kalem record;
  v_duzeltilen integer := 0;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if not exists (
    select 1 from public.stock_counts
    where id = p_sayim_id and tenant_id = v_tenant and status = 'taslak'
  ) then
    raise exception 'sayım bulunamadı veya zaten tamamlanmış';
  end if;

  for v_kalem in
    select id, product_id, expected_quantity, counted_quantity
    from public.stock_count_items
    where stock_count_id = p_sayim_id
      and counted_quantity is not null
      and counted_quantity <> expected_quantity
  loop
    perform public.stok_hareketi_ekle(
      v_kalem.product_id,
      v_kalem.counted_quantity - v_kalem.expected_quantity,
      'count',
      'stock_count',
      p_sayim_id::text,
      'Sayım düzeltmesi'
    );
    v_duzeltilen := v_duzeltilen + 1;
  end loop;

  update public.stock_counts
  set status = 'tamamlandi', completed_by = auth.uid(), completed_at = now()
  where id = p_sayim_id;

  perform public.audit_ekle(
    'sayim_tamamlandi', 'stock_count', p_sayim_id::text,
    null, jsonb_build_object('duzeltilen_urun_sayisi', v_duzeltilen)
  );

  return v_duzeltilen;
end;
$$;

create or replace function public.sayim_iptal(p_sayim_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.stock_counts
  set status = 'iptal'
  where id = p_sayim_id and tenant_id = v_tenant and status = 'taslak';

  if not found then
    raise exception 'sayım bulunamadı veya zaten tamamlanmış';
  end if;

  perform public.audit_ekle('sayim_iptal_edildi', 'stock_count', p_sayim_id::text);
end;
$$;
