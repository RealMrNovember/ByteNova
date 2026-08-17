-- =============================================================
-- ByteNova — 0040_teklif_modulu
-- Sprint 7-8: Teklif (kurumsal satış öncesi fiyat teklifi) modülü.
-- addon_packages.kurumsal_satis'a bağlı (menu.ts'te zaten "teklifler"
-- slug'ı ve addonKey tanımlıydı — Gün 8'den beri hazır bekleyen kanca).
--
-- Yaşam döngüsü: Taslak → Gönderildi → Müşteri İnceliyor → Kabul/Reddedildi
-- /Süresi Doldu. Dövizli teklif desteklenir (kur donmuş halde saklanır,
-- alış/satış RPC'lerindeki desenle aynı). Kabul edilen teklif tek tıkla
-- satışa dönüştürülür — bu, satis_olustur()'un (Gün 16) İÇİNDEN
-- ÇAĞRILARAK yapılır (stok düşümü, açık hesap borcu, audit dahil tüm
-- doğrulanmış mantık aynen kullanılır, tekrar yazılmaz).
-- =============================================================

create table public.quote_no_counters (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  year int not null,
  last_no int not null default 0,
  primary key (tenant_id, year)
);

create or replace function public.sonraki_teklif_no(p_tenant_id uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_yil int := extract(year from now())::int;
  v_sira int;
begin
  insert into public.quote_no_counters (tenant_id, year, last_no)
  values (p_tenant_id, v_yil, 1)
  on conflict (tenant_id, year) do update set last_no = quote_no_counters.last_no + 1
  returning last_no into v_sira;

  return 'TK-' || v_yil || '-' || lpad(v_sira::text, 6, '0');
end;
$$;

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_no text not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status text not null default 'taslak'
    check (status in ('taslak', 'gonderildi', 'musteri_inceliyor', 'kabul', 'reddedildi', 'suresi_doldu')),
  currency text not null default 'TRY',
  exchange_rate numeric(12,4),
  valid_until timestamptz not null default (now() + interval '14 days'),
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  note text,
  public_token uuid not null default gen_random_uuid() unique,
  viewed_at timestamptz,
  decided_at timestamptz,
  decision_note text,
  converted_sale_id uuid references public.sales(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index quotes_no_unique on public.quotes (tenant_id, quote_no);
create index quotes_tenant_idx on public.quotes (tenant_id, created_at desc);
create index quotes_customer_idx on public.quotes (customer_id);

create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.updated_at_guncelle();

create or replace function public.teklif_no_ata()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.quote_no is null or trim(new.quote_no) = '' then
    new.quote_no := public.sonraki_teklif_no(new.tenant_id);
  end if;
  return new;
end;
$$;

create trigger quotes_no_ata
  before insert on public.quotes
  for each row execute function public.teklif_no_ata();

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  item_type text not null check (item_type in ('urun', 'iscilik', 'hizmet')),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null
);

create index quote_items_quote_idx on public.quote_items (quote_id);

alter table public.quote_no_counters enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create policy "quote_no_counters_select" on public.quote_no_counters
  for select using (tenant_id = public.current_tenant_id());

create policy "quotes_select" on public.quotes
  for select using (tenant_id = public.current_tenant_id());

create policy "quote_items_select" on public.quote_items
  for select using (tenant_id = public.current_tenant_id());

-- ---------- RPC'LER ----------
-- Tüm yazma işlemleri SECURITY DEFINER RPC'ler üzerinden — satis_olustur()
-- ile aynı desen, RLS'e insert/update policy'si bilerek eklenmedi.

create or replace function public.teklif_olustur(
  p_musteri_id uuid,
  p_kalemler jsonb,
  p_para_birimi text default 'TRY',
  p_kur numeric default 1,
  p_gecerlilik_gun int default 14,
  p_genel_iskonto numeric default 0,
  p_not text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_indirimsiz_toplam numeric := 0;
  v_satir_iskonto_toplami numeric := 0;
  v_subtotal numeric := 0;
  v_toplam numeric := 0;
  v_quote_id uuid;
  v_kalem record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_gecerlilik_gun is null or p_gecerlilik_gun <= 0 then
    raise exception 'geçerlilik süresi (gün) pozitif olmalı';
  end if;

  select coalesce(sum(quantity * unit_price), 0),
         coalesce(sum(coalesce(discount_amount, 0)), 0)
    into v_indirimsiz_toplam, v_satir_iskonto_toplami
  from jsonb_to_recordset(p_kalemler)
    as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric, discount_amount numeric);

  if v_indirimsiz_toplam <= 0 then
    raise exception 'teklifte en az bir geçerli kalem olmalı';
  end if;

  v_subtotal := v_indirimsiz_toplam - v_satir_iskonto_toplami;
  v_toplam := v_subtotal - coalesce(p_genel_iskonto, 0);
  if v_toplam < 0 then
    raise exception 'iskonto sonrası tutar negatif olamaz';
  end if;

  insert into public.quotes
    (tenant_id, customer_id, currency, exchange_rate, valid_until, subtotal, discount_amount, total_amount, note, created_by)
  values
    (v_tenant, p_musteri_id, p_para_birimi, p_kur, now() + (p_gecerlilik_gun || ' days')::interval,
     v_subtotal, coalesce(p_genel_iskonto, 0), v_toplam, nullif(trim(coalesce(p_not, '')), ''), auth.uid())
  returning id into v_quote_id;

  for v_kalem in
    select * from jsonb_to_recordset(p_kalemler)
      as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric, discount_amount numeric)
  loop
    if v_kalem.item_type not in ('urun', 'iscilik', 'hizmet') then
      raise exception 'geçersiz kalem tipi: %', v_kalem.item_type;
    end if;
    insert into public.quote_items
      (tenant_id, quote_id, item_type, product_id, name, quantity, unit_price, discount_amount, line_total)
    values
      (v_tenant, v_quote_id, v_kalem.item_type, v_kalem.product_id, v_kalem.name,
       v_kalem.quantity, v_kalem.unit_price, coalesce(v_kalem.discount_amount, 0),
       v_kalem.quantity * v_kalem.unit_price - coalesce(v_kalem.discount_amount, 0));
  end loop;

  perform public.audit_ekle(
    'teklif_olusturuldu', 'quote', v_quote_id::text, null,
    jsonb_build_object('toplam', v_toplam, 'para_birimi', p_para_birimi)
  );

  return v_quote_id;
end;
$$;

create or replace function public.teklif_gonderildi_isaretle(p_teklif_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  update public.quotes
  set status = 'gonderildi'
  where id = p_teklif_id and tenant_id = v_tenant and status = 'taslak';

  if not found then
    raise exception 'teklif bulunamadı veya zaten gönderilmiş';
  end if;

  perform public.audit_ekle('teklif_gonderildi', 'quote', p_teklif_id::text, null, null);
end;
$$;

-- Herkese açık (token tabanlı) fonksiyonlar — is_platform_admin()/rol_su()
-- kontrolü BİLEREK yok; yetkilendirme token'ın kendisi (gen_random_uuid,
-- tahmin edilemez). quotes/quote_items'ın SELECT RLS'i current_tenant_id()
-- istediği için anonim (oturumsuz) müşteri normal sorguyla hiçbir satır
-- göremez — bu yüzden görüntüleme de SECURITY DEFINER bir RPC üzerinden,
-- yalnız gerekli alanlar seçilerek yapılıyor.

create or replace function public.teklif_detay_al(p_token uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_sonuc jsonb;
begin
  select jsonb_build_object(
    'id', q.id, 'quote_no', q.quote_no, 'status', q.status,
    'currency', q.currency, 'exchange_rate', q.exchange_rate,
    'valid_until', q.valid_until, 'subtotal', q.subtotal,
    'discount_amount', q.discount_amount, 'total_amount', q.total_amount,
    'note', q.note, 'decided_at', q.decided_at, 'decision_note', q.decision_note,
    'created_at', q.created_at,
    'isletme_adi', t.name,
    'musteri_adi', c.name,
    'kalemler', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', qi.name, 'quantity', qi.quantity, 'unit_price', qi.unit_price,
        'discount_amount', qi.discount_amount, 'line_total', qi.line_total
      ) order by qi.id)
      from public.quote_items qi where qi.quote_id = q.id
    ), '[]'::jsonb)
  ) into v_sonuc
  from public.quotes q
  join public.tenants t on t.id = q.tenant_id
  join public.customers c on c.id = q.customer_id
  where q.public_token = p_token;

  if v_sonuc is null then
    raise exception 'teklif bulunamadı';
  end if;

  return v_sonuc;
end;
$$;

create or replace function public.teklif_goruntulendi(p_token uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_teklif record;
begin
  update public.quotes
  set status = 'musteri_inceliyor', viewed_at = coalesce(viewed_at, now())
  where public_token = p_token and status = 'gonderildi'
  returning * into v_teklif;

  if not found then
    select * into v_teklif from public.quotes where public_token = p_token;
  end if;

  if not found then
    raise exception 'teklif bulunamadı';
  end if;

  return jsonb_build_object('id', v_teklif.id, 'status', v_teklif.status);
end;
$$;

create or replace function public.teklif_musteri_karari(
  p_token uuid,
  p_karar text,
  p_not text default null
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_teklif record;
begin
  if p_karar not in ('kabul', 'reddedildi') then
    raise exception 'geçersiz karar';
  end if;

  select * into v_teklif from public.quotes where public_token = p_token;
  if not found then
    raise exception 'teklif bulunamadı';
  end if;
  if v_teklif.status not in ('gonderildi', 'musteri_inceliyor') then
    raise exception 'bu teklif artık karara açık değil';
  end if;
  if v_teklif.valid_until < now() then
    update public.quotes set status = 'suresi_doldu' where id = v_teklif.id;
    raise exception 'teklifin geçerlilik süresi doldu';
  end if;

  update public.quotes
  set status = p_karar, decided_at = now(), decision_note = nullif(trim(coalesce(p_not, '')), '')
  where id = v_teklif.id;

  -- audit_ekle() kullanılmıyor: o fonksiyon current_tenant_id()'yi (yani
  -- auth.uid() ile eşlenen bir profile satırını) varsayar. Bu RPC anonim
  -- bir müşteri tarafından (oturumsuz, yalnız token ile) çağrılır — burada
  -- auth.uid() null olacağından audit_ekle() denemesi tenant_id NOT NULL
  -- kısıtına takılıp tüm işlemi geri alırdı. tenant_id teklifin kendisinden
  -- açıkça veriliyor.
  insert into public.audit_logs (tenant_id, user_id, action, entity, entity_id, new_value)
  values (
    v_teklif.tenant_id, null, 'teklif_musteri_karari', 'quote', v_teklif.id::text,
    jsonb_build_object('karar', p_karar, 'not', p_not)
  );
end;
$$;

create or replace function public.teklif_satisa_donustur(p_teklif_id uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_teklif record;
  v_kalemler jsonb;
  v_odemeler jsonb;
  v_sale_id uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select * into v_teklif from public.quotes where id = p_teklif_id and tenant_id = v_tenant;
  if not found then
    raise exception 'teklif bulunamadı';
  end if;
  if v_teklif.status <> 'kabul' then
    raise exception 'yalnız kabul edilmiş teklifler satışa dönüştürülebilir';
  end if;
  if v_teklif.converted_sale_id is not null then
    raise exception 'bu teklif zaten satışa dönüştürülmüş';
  end if;

  select jsonb_agg(jsonb_build_object(
    'item_type', qi.item_type, 'product_id', qi.product_id, 'name', qi.name,
    'quantity', qi.quantity, 'unit_price', qi.unit_price, 'discount_amount', qi.discount_amount
  ))
  into v_kalemler
  from public.quote_items qi
  where qi.quote_id = p_teklif_id;

  v_odemeler := jsonb_build_array(jsonb_build_object(
    'method', 'acik_hesap', 'amount', v_teklif.total_amount, 'installments', null, 'account_id', null
  ));

  v_sale_id := public.satis_olustur(
    v_teklif.customer_id, v_kalemler, v_odemeler, v_teklif.discount_amount, 0,
    null, false, 'sonra_kesilecek', null
  );

  update public.quotes set converted_sale_id = v_sale_id where id = p_teklif_id;

  perform public.audit_ekle(
    'teklif_satisa_donusturuldu', 'quote', p_teklif_id::text, null,
    jsonb_build_object('sale_id', v_sale_id)
  );

  return v_sale_id;
end;
$$;
