-- Toptancı XML/B2B entegrasyonu (P1, bkz. PROJE_DOSYASI §15.2).
-- Gerçek bir distribütör API kimlik bilgisi bu ortamda yok — SupplierFeedProvider
-- soyutlaması (src/lib/tedarikciFeed.ts) sandbox modunda örnek bir katalog üretir.
-- Şema/eşleştirme/fiyat-önerisi mimarisi gerçek üretim mimarisiyle birebir aynı;
-- yalnızca "dış API'den XML/JSON çek" adımı mock'lanır.

create table public.supplier_feeds (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  provider_key text not null check (provider_key in ('penta', 'index_datagate', 'arena')),
  status text not null default 'aktif' check (status in ('aktif', 'pasif')),
  last_synced_at timestamptz,
  last_sync_item_count int,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, supplier_id)
);

create table public.supplier_feed_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  feed_id uuid not null references public.supplier_feeds(id) on delete cascade,
  external_code text not null,
  barcode text,
  name text not null,
  price numeric(12, 2) not null,
  currency text not null default 'USD',
  stock_quantity numeric not null default 0,
  matched_product_id uuid references public.products(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (feed_id, external_code)
);

create index supplier_feed_items_tenant_matched_idx on public.supplier_feed_items (tenant_id, matched_product_id);
create index supplier_feed_items_feed_idx on public.supplier_feed_items (feed_id);

alter table public.supplier_feeds enable row level security;
alter table public.supplier_feed_items enable row level security;

create policy supplier_feeds_select on public.supplier_feeds for select
  using (tenant_id = public.current_tenant_id());
create policy supplier_feeds_insert on public.supplier_feeds for insert
  with check (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager', 'warehouse'));
create policy supplier_feeds_update on public.supplier_feeds for update
  using (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager', 'warehouse'));
create policy supplier_feeds_delete on public.supplier_feeds for delete
  using (tenant_id = public.current_tenant_id() and public.rol_su() in ('owner', 'manager', 'warehouse'));

-- supplier_feed_items yalnızca okunur; her yazma toptanci_feed_kalemleri_yukle() üzerinden olur
-- (senkron her seferinde tüm kalemleri değiştirdiği ve eşleştirme mantığı içerdiği için
-- düz istemci .upsert()'ü yerine tek bir RPC'de topluca yapılır — PC Toplama'daki checklist
-- hatasından çıkarılan derse uygun: bu modülde de TEK yazma yolu var).
create policy supplier_feed_items_select on public.supplier_feed_items for select
  using (tenant_id = public.current_tenant_id());

create or replace function public.toptanci_feed_kalemleri_yukle(p_feed_id uuid, p_kalemler jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_feed record;
  v_eslesen int := 0;
  v_toplam int := 0;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select * into v_feed from public.supplier_feeds where id = p_feed_id and tenant_id = v_tenant;
  if not found then
    raise exception 'tedarikçi feed''i bulunamadı';
  end if;

  delete from public.supplier_feed_items where feed_id = p_feed_id;

  insert into public.supplier_feed_items
    (tenant_id, feed_id, external_code, barcode, name, price, currency, stock_quantity, matched_product_id, updated_at)
  select
    v_tenant, p_feed_id, k.external_code, k.barcode, k.name, k.price, k.currency, k.stock_quantity,
    (select p.id from public.products p
      where p.tenant_id = v_tenant and p.is_active = true
        and ((k.barcode is not null and p.barcode = k.barcode) or p.sku = k.external_code)
      limit 1),
    now()
  from jsonb_to_recordset(p_kalemler) as k(
    external_code text, barcode text, name text, price numeric, currency text, stock_quantity numeric
  );

  get diagnostics v_toplam = row_count;
  select count(*) into v_eslesen from public.supplier_feed_items where feed_id = p_feed_id and matched_product_id is not null;

  update public.supplier_feeds
    set last_synced_at = now(), last_sync_item_count = v_toplam
    where id = p_feed_id;

  perform public.audit_ekle('toptanci_feed_senkronize_edildi', 'supplier_feed', p_feed_id::text, null,
    jsonb_build_object('toplam_kalem', v_toplam, 'eslesen_kalem', v_eslesen));

  return jsonb_build_object('toplam_kalem', v_toplam, 'eslesen_kalem', v_eslesen);
end;
$$;
