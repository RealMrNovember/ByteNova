-- =============================================================
-- ByteNova — 0048_pc_toplama
-- Sprint 9-12, 5/7: PC Toplama ve Üretim (BOM) — Bölüm 16.
--
-- Kapsam notu: toplama tamamlanınca yeni bir SERİ NUMARALI ÜRÜN olarak
-- stoğa girer (satışa hazır) — ayrıca otomatik bir `devices` kaydı
-- AÇILMAZ; cihaz kaydı, mevcut akışlarda olduğu gibi (servis kabulü/
-- müşteri ilişkilendirmesi) satıldıktan sonra ayrıca açılabilir. İki
-- modülü tam otomatik birleştirmek (satışta otomatik cihaz oluşturma)
-- bu turda bilinçli olarak kapsam dışı bırakıldı.
-- =============================================================

-- ---------- STOK HAREKETİ TİPLERİNİ GENİŞLET ----------

alter table public.stock_movements drop constraint stock_movements_movement_type_check;
alter table public.stock_movements add constraint stock_movements_movement_type_check
  check (movement_type in (
    'purchase', 'sale', 'service_use', 'return', 'adjustment', 'count', 'initial',
    'assembly', 'assembly_iptal', 'disassembly'
  ));

-- ---------- REÇETE (BOM ŞABLONU) ----------

create table public.assembly_recipes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  labor_cost numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.assembly_recipes enable row level security;

create policy assembly_recipes_select on public.assembly_recipes
  for select using (tenant_id = public.current_tenant_id());

create table public.assembly_recipe_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recipe_id uuid not null references public.assembly_recipes(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,2) not null check (quantity > 0),
  sort_order int not null default 0
);

alter table public.assembly_recipe_items enable row level security;

create policy assembly_recipe_items_select on public.assembly_recipe_items
  for select using (tenant_id = public.current_tenant_id());

-- ---------- TOPLAMA EMRİ ----------

create table public.assembly_order_no_counters (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  last_no int not null default 0
);

alter table public.assembly_order_no_counters enable row level security;
create policy assembly_order_no_counters_select on public.assembly_order_no_counters
  for select using (tenant_id = public.current_tenant_id());

create or replace function public.sonraki_toplama_no(p_tenant_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_no int;
begin
  insert into public.assembly_order_no_counters (tenant_id, last_no)
  values (p_tenant_id, 1)
  on conflict (tenant_id) do update set last_no = assembly_order_no_counters.last_no + 1
  returning last_no into v_no;

  return 'PC-' || to_char(now(), 'YYYY') || '-' || lpad(v_no::text, 6, '0');
end;
$$;

create table public.assembly_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_no text not null,
  recipe_id uuid references public.assembly_recipes(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'taslak'
    check (status in ('taslak', 'parca_rezerve', 'montajda', 'test_ediliyor', 'tamamlandi', 'iptal')),
  labor_cost numeric(12,2) not null default 0,
  parts_cost numeric(12,2) not null default 0,
  checklist jsonb not null default '[
    {"label": "POST testi", "checked": false},
    {"label": "Stres testi", "checked": false},
    {"label": "Sıcaklık kontrolü", "checked": false}
  ]'::jsonb,
  product_id uuid references public.products(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index assembly_orders_tenant_idx on public.assembly_orders (tenant_id, created_at desc);

alter table public.assembly_orders enable row level security;

create policy assembly_orders_select on public.assembly_orders
  for select using (tenant_id = public.current_tenant_id());

create table public.assembly_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assembly_order_id uuid not null references public.assembly_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  serial_no text,
  unit_cost_try numeric(12,2),
  created_at timestamptz not null default now()
);

create index assembly_order_items_order_idx on public.assembly_order_items (assembly_order_id);

alter table public.assembly_order_items enable row level security;

create policy assembly_order_items_select on public.assembly_order_items
  for select using (tenant_id = public.current_tenant_id());

-- ---------- DEMONTAJ ----------

create table public.disassembly_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_type text not null check (source_type in ('assembly_order', 'serbest')),
  source_assembly_order_id uuid references public.assembly_orders(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.disassembly_orders enable row level security;

create policy disassembly_orders_select on public.disassembly_orders
  for select using (tenant_id = public.current_tenant_id());

create table public.disassembly_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  disassembly_order_id uuid not null references public.disassembly_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,2) not null check (quantity > 0),
  serial_no text,
  estimated_value numeric(12,2),
  created_at timestamptz not null default now()
);

alter table public.disassembly_order_items enable row level security;

create policy disassembly_order_items_select on public.disassembly_order_items
  for select using (tenant_id = public.current_tenant_id());

-- ---------- RPC: REÇETE OLUŞTUR ----------

create or replace function public.recete_olustur(
  p_name text,
  p_description text,
  p_labor_cost numeric,
  p_kalemler jsonb -- [{product_id, quantity}]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_id uuid;
  v_kalem record;
  v_sira int := 0;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'reçete adı zorunlu';
  end if;

  insert into public.assembly_recipes (tenant_id, name, description, labor_cost, created_by)
  values (v_tenant, trim(p_name), nullif(trim(coalesce(p_description, '')), ''), coalesce(p_labor_cost, 0), auth.uid())
  returning id into v_id;

  for v_kalem in select * from jsonb_to_recordset(p_kalemler) as x(product_id uuid, quantity numeric)
  loop
    if v_kalem.product_id is null or coalesce(v_kalem.quantity, 0) <= 0 then
      continue;
    end if;
    insert into public.assembly_recipe_items (tenant_id, recipe_id, product_id, quantity, sort_order)
    values (v_tenant, v_id, v_kalem.product_id, v_kalem.quantity, v_sira);
    v_sira := v_sira + 1;
  end loop;

  return v_id;
end;
$$;

-- ---------- RPC: TOPLAMA EMRİ OLUŞTUR ----------

create or replace function public.toplama_emri_olustur(
  p_recipe_id uuid default null,
  p_customer_id uuid default null,
  p_kalemler jsonb default null, -- reçete yoksa serbest liste: [{product_id, quantity}]
  p_notlar text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_order_id uuid;
  v_order_no text;
  v_labor numeric := 0;
  v_kalem record;
  v_urun record;
  v_maliyet_tl numeric;
  v_kur numeric;
  v_toplam_parca_maliyeti numeric := 0;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if p_recipe_id is null and p_kalemler is null then
    raise exception 'bir reçete seçin veya serbest parça listesi girin';
  end if;

  if p_recipe_id is not null then
    select labor_cost into v_labor from public.assembly_recipes
    where id = p_recipe_id and tenant_id = v_tenant;
    if not found then
      raise exception 'reçete bulunamadı';
    end if;
  end if;

  v_order_no := public.sonraki_toplama_no(v_tenant);

  insert into public.assembly_orders
    (tenant_id, order_no, recipe_id, customer_id, labor_cost, notes, created_by)
  values
    (v_tenant, v_order_no, p_recipe_id, p_customer_id, v_labor, nullif(trim(coalesce(p_notlar, '')), ''), auth.uid())
  returning id into v_order_id;

  for v_kalem in
    select product_id, quantity from public.assembly_recipe_items
      where recipe_id = p_recipe_id and p_recipe_id is not null
    union all
    select (x->>'product_id')::uuid, (x->>'quantity')::numeric
      from jsonb_array_elements(coalesce(p_kalemler, '[]'::jsonb)) as x
      where p_recipe_id is null
  loop
    select name, purchase_price, purchase_currency into v_urun
    from public.products where id = v_kalem.product_id and tenant_id = v_tenant;
    if not found then
      raise exception 'ürün bulunamadı: %', v_kalem.product_id;
    end if;

    v_maliyet_tl := null;
    if v_urun.purchase_price is not null then
      if v_urun.purchase_currency = 'TRY' then
        v_maliyet_tl := v_urun.purchase_price;
      else
        select rate_to_try into v_kur from public.exchange_rates
        where currency_code = v_urun.purchase_currency and tenant_id = v_tenant;
        if v_kur is null then
          select rate_to_try into v_kur from public.exchange_rates
          where currency_code = v_urun.purchase_currency and tenant_id is null;
        end if;
        if v_kur is not null then
          v_maliyet_tl := v_urun.purchase_price * v_kur;
        end if;
      end if;
    end if;

    insert into public.assembly_order_items
      (tenant_id, assembly_order_id, product_id, product_name, quantity, unit_cost_try)
    values
      (v_tenant, v_order_id, v_kalem.product_id, v_urun.name, v_kalem.quantity, v_maliyet_tl);

    v_toplam_parca_maliyeti := v_toplam_parca_maliyeti + coalesce(v_maliyet_tl, 0) * v_kalem.quantity;
  end loop;

  update public.assembly_orders set parts_cost = v_toplam_parca_maliyeti where id = v_order_id;

  perform public.audit_ekle('toplama_emri_olusturuldu', 'assembly_order', v_order_id::text, null,
    jsonb_build_object('order_no', v_order_no));

  return v_order_id;
end;
$$;

-- ---------- RPC: DURUM İLERLET (parça rezervasyonu burada) ----------

create or replace function public.toplama_durum_ilerlet(
  p_order_id uuid,
  p_yeni_durum text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_emir record;
  v_kalem record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_yeni_durum not in ('parca_rezerve', 'montajda', 'test_ediliyor', 'iptal') then
    raise exception 'bu uç noktadan geçilemeyecek durum: %', p_yeni_durum;
  end if;

  select * into v_emir from public.assembly_orders where id = p_order_id and tenant_id = v_tenant for update;
  if not found then
    raise exception 'toplama emri bulunamadı';
  end if;
  if v_emir.status in ('tamamlandi', 'iptal') then
    raise exception 'bu emir zaten kapanmış';
  end if;

  if p_yeni_durum = 'parca_rezerve' and v_emir.status = 'taslak' then
    for v_kalem in select product_id, quantity, product_name from public.assembly_order_items where assembly_order_id = p_order_id
    loop
      perform public.stok_hareketi_ekle(
        v_kalem.product_id, -v_kalem.quantity, 'assembly', 'assembly_order', p_order_id::text,
        format('Toplama emri (%s): %s', v_emir.order_no, v_kalem.product_name), false
      );
    end loop;
  elsif p_yeni_durum = 'iptal' and v_emir.status in ('parca_rezerve', 'montajda', 'test_ediliyor') then
    -- Rezerve edilmiş parçaları stoğa iade et
    for v_kalem in select product_id, quantity, product_name from public.assembly_order_items where assembly_order_id = p_order_id
    loop
      perform public.stok_hareketi_ekle(
        v_kalem.product_id, v_kalem.quantity, 'assembly_iptal', 'assembly_order', p_order_id::text,
        format('Toplama emri iptali (%s): %s', v_emir.order_no, v_kalem.product_name), false
      );
    end loop;
  end if;

  update public.assembly_orders set status = p_yeni_durum where id = p_order_id;

  perform public.audit_ekle('toplama_durumu_degisti', 'assembly_order', p_order_id::text, null,
    jsonb_build_object('eski_durum', v_emir.status, 'yeni_durum', p_yeni_durum));
end;
$$;

-- ---------- RPC: TAMAMLA (yeni ürün/stok kaydı burada oluşur) ----------

create or replace function public.toplama_tamamla(
  p_order_id uuid,
  p_urun_adi text,
  p_satis_fiyati numeric,
  p_seri_no text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_emir record;
  v_urun_id uuid;
  v_toplam_maliyet numeric;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if trim(coalesce(p_urun_adi, '')) = '' then
    raise exception 'ürün adı zorunlu';
  end if;

  select * into v_emir from public.assembly_orders where id = p_order_id and tenant_id = v_tenant for update;
  if not found then
    raise exception 'toplama emri bulunamadı';
  end if;
  if v_emir.status not in ('parca_rezerve', 'montajda', 'test_ediliyor') then
    raise exception 'yalnızca parçaları rezerve edilmiş bir emir tamamlanabilir';
  end if;

  v_toplam_maliyet := coalesce(v_emir.parts_cost, 0) + coalesce(v_emir.labor_cost, 0);

  insert into public.products
    (tenant_id, name, sku, sale_price, purchase_price, purchase_currency,
     stock_quantity, requires_serial, is_digital, created_by)
  values
    (v_tenant, trim(p_urun_adi), v_emir.order_no, p_satis_fiyati, v_toplam_maliyet, 'TRY',
     1, true, false, auth.uid())
  returning id into v_urun_id;

  update public.assembly_orders
  set status = 'tamamlandi', product_id = v_urun_id, completed_at = now()
  where id = p_order_id;

  if p_seri_no is not null and trim(p_seri_no) <> '' then
    update public.assembly_order_items
    set serial_no = trim(p_seri_no)
    where assembly_order_id = p_order_id and serial_no is null
      and id = (select id from public.assembly_order_items where assembly_order_id = p_order_id limit 1);
  end if;

  perform public.audit_ekle('toplama_tamamlandi', 'assembly_order', p_order_id::text, null,
    jsonb_build_object('urun_id', v_urun_id, 'maliyet', v_toplam_maliyet, 'satis_fiyati', p_satis_fiyati));

  return v_urun_id;
end;
$$;

-- ---------- RPC: DEMONTAJ ----------

create or replace function public.demontaj_yap(
  p_source_assembly_order_id uuid default null,
  p_kalemler jsonb default null, -- serbest demontaj: [{product_id, quantity, serial_no, estimated_value}]
  p_notlar text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_disassembly_id uuid;
  v_emir record;
  v_kalem record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  insert into public.disassembly_orders
    (tenant_id, source_type, source_assembly_order_id, notes, created_by)
  values
    (v_tenant, case when p_source_assembly_order_id is not null then 'assembly_order' else 'serbest' end,
     p_source_assembly_order_id, nullif(trim(coalesce(p_notlar, '')), ''), auth.uid())
  returning id into v_disassembly_id;

  if p_source_assembly_order_id is not null then
    select * into v_emir from public.assembly_orders
    where id = p_source_assembly_order_id and tenant_id = v_tenant;
    if not found then
      raise exception 'toplama emri bulunamadı';
    end if;
    if v_emir.status <> 'tamamlandi' then
      raise exception 'yalnızca tamamlanmış bir toplama emri demonte edilebilir';
    end if;

    for v_kalem in select product_id, quantity, product_name, serial_no from public.assembly_order_items where assembly_order_id = p_source_assembly_order_id
    loop
      insert into public.disassembly_order_items
        (tenant_id, disassembly_order_id, product_id, quantity, serial_no)
      values (v_tenant, v_disassembly_id, v_kalem.product_id, v_kalem.quantity, v_kalem.serial_no);

      perform public.stok_hareketi_ekle(
        v_kalem.product_id, v_kalem.quantity, 'disassembly', 'disassembly_order', v_disassembly_id::text,
        format('Demontaj: %s', v_kalem.product_name), false
      );
    end loop;

    if v_emir.product_id is not null then
      update public.products set stock_quantity = 0, is_active = false where id = v_emir.product_id;
    end if;
  else
    for v_kalem in select * from jsonb_to_recordset(coalesce(p_kalemler, '[]'::jsonb))
      as x(product_id uuid, quantity numeric, serial_no text, estimated_value numeric)
    loop
      if v_kalem.product_id is null or coalesce(v_kalem.quantity, 0) <= 0 then
        continue;
      end if;
      insert into public.disassembly_order_items
        (tenant_id, disassembly_order_id, product_id, quantity, serial_no, estimated_value)
      values (v_tenant, v_disassembly_id, v_kalem.product_id, v_kalem.quantity, v_kalem.serial_no, v_kalem.estimated_value);

      perform public.stok_hareketi_ekle(
        v_kalem.product_id, v_kalem.quantity, 'disassembly', 'disassembly_order', v_disassembly_id::text,
        'Demontaj: ikinci el parça', false
      );
    end loop;
  end if;

  perform public.audit_ekle('demontaj_yapildi', 'disassembly_order', v_disassembly_id::text, null, null);

  return v_disassembly_id;
end;
$$;
