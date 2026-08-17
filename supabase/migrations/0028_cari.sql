-- =============================================================
-- ByteNova — 0028_cari
-- Sprint 5, Gün 22: Müşteri/tedarikçi cari bakiyeleri.
--
-- Müşteri cari TL bazlıdır (satışlar hep TL). Tedarikçi cari, tedarikçinin
-- kendi para biriminde tutulur (Gün 21'deki dövizli alış faturasıyla
-- birebir uyumlu); borç arttıkça ağırlıklı ortalama kur (avg_exchange_rate)
-- güncellenir, ödeme anında o ortalama ile ödeme kuru arasındaki fark
-- nakit hareketi yaratmadan ayrı bir "kur farkı" muhasebe kaydına
-- (supplier_ledger) düşer — gerçek kur farkı geliri/gideri.
--
-- Bilinçli kapsam dışı: fatura-fatura eşleştirme (hangi alış ödendi)
-- yok — genel bakiye modeli. `purchases.payment_status` artık bilgi
-- amaçlı bir not, gerçek borç suppliers.balance'da. Fatura eşleştirme
-- ve yaşlandırma (30/60/90) Gün 24'e planlı.
-- =============================================================

-- ---------- BAKİYE KOLONLARI ----------

alter table public.customers add column balance numeric(12,2) not null default 0;
alter table public.suppliers add column balance numeric(12,2) not null default 0;
alter table public.suppliers add column avg_exchange_rate numeric(12,4);

-- ---------- MÜŞTERİ CARİ HAREKETLERİ ----------

create table public.customer_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  entry_type text not null check (entry_type in ('acik_hesap_satis', 'tahsilat', 'duzeltme')),
  amount numeric(12,2) not null,     -- + bakiyeyi artırır (borç), - azaltır
  balance_before numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  account_id uuid references public.cash_accounts(id) on delete set null,
  reference_type text,
  reference_id text,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index customer_ledger_customer_idx on public.customer_ledger (customer_id, created_at desc);

alter table public.customer_ledger enable row level security;

create policy "customer_ledger_select" on public.customer_ledger
  for select using (tenant_id = public.current_tenant_id());

-- ---------- TEDARİKÇİ CARİ HAREKETLERİ ----------

create table public.supplier_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  entry_type text not null check (entry_type in ('alis_borc', 'odeme', 'kur_farki', 'duzeltme')),
  amount numeric(12,2),              -- tedarikçinin kendi para biriminde (kur_farki'da null)
  amount_try numeric(12,2) not null, -- her satırda dolu — TL karşılığı
  exchange_rate numeric(12,4),
  balance_before numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  account_id uuid references public.cash_accounts(id) on delete set null,
  reference_type text,
  reference_id text,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index supplier_ledger_supplier_idx on public.supplier_ledger (supplier_id, created_at desc);

alter table public.supplier_ledger enable row level security;

create policy "supplier_ledger_select" on public.supplier_ledger
  for select using (tenant_id = public.current_tenant_id());

-- ---------- ORTAK PRİMİTİFLER (stok_hareketi_ekle/kasa_hareketi_ekle ile aynı desen) ----------

create or replace function public.musteri_borc_ekle(
  p_customer_id uuid,
  p_tutar numeric,           -- + borç ekler (açık hesap satış), - azaltır (tahsilat)
  p_entry_type text,
  p_referans_tip text default null,
  p_referans_id text default null,
  p_aciklama text default null,
  p_account_id uuid default null
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

  select balance into v_once
  from public.customers
  where id = p_customer_id and tenant_id = v_tenant
  for update;

  if not found then
    raise exception 'müşteri bulunamadı veya erişim yok';
  end if;

  v_sonra := v_once + p_tutar;

  update public.customers set balance = v_sonra where id = p_customer_id;

  insert into public.customer_ledger
    (tenant_id, customer_id, entry_type, amount, balance_before, balance_after,
     account_id, reference_type, reference_id, description, created_by)
  values
    (v_tenant, p_customer_id, p_entry_type, p_tutar, v_once, v_sonra,
     p_account_id, p_referans_tip, p_referans_id, p_aciklama, auth.uid());

  return v_sonra;
end;
$$;

-- Not: p_entry_type sonradan eklendi (aksi halde ödemeler de 'alis_borc'
-- etiketiyle kaydediliyordu) — parametre listesi değiştiği için eski
-- imza açıkça düşürülüyor (bkz. Gün 15/16'daki overload dersi).
drop function if exists public.tedarikci_borc_ekle(uuid, numeric, numeric, text, text, text);

create or replace function public.tedarikci_borc_ekle(
  p_supplier_id uuid,
  p_tutar_doviz numeric,      -- alış borcunda pozitif, ödemede negatif
  p_kur numeric,
  p_referans_tip text default null,
  p_referans_id text default null,
  p_aciklama text default null,
  p_entry_type text default 'alis_borc'
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_once numeric;
  v_eski_kur numeric;
  v_sonra numeric;
  v_yeni_kur numeric;
begin
  v_tenant := public.current_tenant_id();

  select balance, avg_exchange_rate into v_once, v_eski_kur
  from public.suppliers
  where id = p_supplier_id and tenant_id = v_tenant
  for update;

  if not found then
    raise exception 'tedarikçi bulunamadı veya erişim yok';
  end if;

  v_sonra := v_once + p_tutar_doviz;
  -- Ağırlıklı ortalama maliyet kuru — Gün 27'deki stok maliyet yöntemi
  -- konseptinin küçük bir öncüsü.
  v_yeni_kur := (v_once * coalesce(v_eski_kur, p_kur) + p_tutar_doviz * p_kur) / nullif(v_sonra, 0);

  update public.suppliers
  set balance = v_sonra, avg_exchange_rate = coalesce(v_yeni_kur, p_kur)
  where id = p_supplier_id;

  insert into public.supplier_ledger
    (tenant_id, supplier_id, entry_type, amount, amount_try, exchange_rate,
     balance_before, balance_after, reference_type, reference_id, description, created_by)
  values
    (v_tenant, p_supplier_id, p_entry_type, p_tutar_doviz, p_tutar_doviz * p_kur, p_kur,
     v_once, v_sonra, p_referans_tip, p_referans_id, p_aciklama, auth.uid());

  return v_sonra;
end;
$$;

-- ---------- MÜŞTERİ TAHSİLATI (açık hesap borcunu kapatma) ----------

create or replace function public.musteri_tahsilat_al(
  p_customer_id uuid,
  p_tutar numeric,
  p_account_id uuid,
  p_aciklama text default null
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_yeni_bakiye numeric;
begin
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_tutar is null or p_tutar <= 0 then
    raise exception 'geçersiz tutar';
  end if;

  perform public.kasa_hareketi_ekle(
    p_account_id, p_tutar, 'tahsilat', 'customer_ledger', p_customer_id::text,
    coalesce(p_aciklama, 'Cari tahsilat')
  );

  v_yeni_bakiye := public.musteri_borc_ekle(
    p_customer_id, -p_tutar, 'tahsilat', 'customer_ledger', null, p_aciklama, p_account_id
  );

  perform public.audit_ekle(
    'musteri_tahsilat_alindi', 'customer', p_customer_id::text, null,
    jsonb_build_object('tutar', p_tutar, 'yeni_bakiye', v_yeni_bakiye)
  );

  return v_yeni_bakiye;
end;
$$;

-- ---------- TEDARİKÇİ ÖDEMESİ (kur farkı otomatik hesaplanır) ----------

create or replace function public.tedarikci_odeme_yap(
  p_supplier_id uuid,
  p_tutar_doviz numeric,
  p_kur numeric,
  p_account_id uuid,
  p_aciklama text default null
)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_bakiye numeric;
  v_ort_kur numeric;
  v_kur_farki_tl numeric;
  v_yeni_bakiye numeric;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_tutar_doviz is null or p_tutar_doviz <= 0 then
    raise exception 'geçersiz tutar';
  end if;
  if p_kur is null or p_kur <= 0 then
    raise exception 'geçersiz kur';
  end if;

  select balance, avg_exchange_rate into v_bakiye, v_ort_kur
  from public.suppliers
  where id = p_supplier_id and tenant_id = v_tenant;

  if not found then
    raise exception 'tedarikçi bulunamadı veya erişim yok';
  end if;

  -- Kasadan TL çıkışı
  perform public.kasa_hareketi_ekle(
    p_account_id, -(p_tutar_doviz * p_kur), 'odeme', 'supplier_ledger', p_supplier_id::text,
    coalesce(p_aciklama, 'Tedarikçi ödemesi')
  );

  v_yeni_bakiye := public.tedarikci_borc_ekle(
    p_supplier_id, -p_tutar_doviz, p_kur, 'supplier_ledger', null, p_aciklama, 'odeme'
  );

  -- tedarikci_borc_ekle negatif tutarda ortalama kuru YENİDEN hesaplar
  -- (bakiye azaldığında formül anlamsızlaşır) — ödemede ortalama kur
  -- SABİT kalmalı, bu yüzden burada eski haline geri yazıyoruz.
  update public.suppliers set avg_exchange_rate = v_ort_kur where id = p_supplier_id;

  if v_ort_kur is not null then
    v_kur_farki_tl := p_tutar_doviz * (p_kur - v_ort_kur);
    if abs(v_kur_farki_tl) > 0.01 then
      insert into public.supplier_ledger
        (tenant_id, supplier_id, entry_type, amount, amount_try, exchange_rate,
         balance_before, balance_after, reference_type, reference_id, description, created_by)
      values
        (v_tenant, p_supplier_id, 'kur_farki', null, v_kur_farki_tl, p_kur,
         v_bakiye - p_tutar_doviz, v_bakiye - p_tutar_doviz, 'supplier_ledger', null,
         case when v_kur_farki_tl > 0 then 'Kur farkı gideri' else 'Kur farkı geliri' end,
         auth.uid());
    end if;
  end if;

  perform public.audit_ekle(
    'tedarikci_odeme_yapildi', 'supplier', p_supplier_id::text, null,
    jsonb_build_object('tutar_doviz', p_tutar_doviz, 'kur', p_kur, 'yeni_bakiye', v_yeni_bakiye)
  );

  return v_yeni_bakiye;
end;
$$;

-- ---------- satis_olustur(): açık hesap artık gerçek cari borç yaratıyor ----------
-- İmza değişmiyor (Gün 20'deki 9 parametre) — düz create-or-replace güvenli.

create or replace function public.satis_olustur(
  p_musteri_id uuid,
  p_kalemler jsonb,
  p_odemeler jsonb,
  p_genel_iskonto numeric default 0,
  p_yuvarlama numeric default 0,
  p_iskonto_onaylayan_id uuid default null,
  p_negatif_onay boolean default false,
  p_belge_tipi text default 'sonra_kesilecek',
  p_fis_no text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_sale_id uuid;
  v_indirimsiz_toplam numeric := 0;
  v_satir_iskonto_toplami numeric := 0;
  v_subtotal numeric := 0;
  v_toplam numeric := 0;
  v_iskonto_yuzde numeric := 0;
  v_odeme_toplami numeric := 0;
  v_odeme_yontemi text;
  v_yontem_sayisi int;
  v_kalem record;
  v_odeme record;
  v_max_taksit int;
  v_belge_kesildi_mi timestamptz;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if p_belge_tipi not in ('okc_fisi', 'sonra_kesilecek') then
    raise exception 'geçersiz belge tipi';
  end if;
  if p_belge_tipi = 'okc_fisi' and (p_fis_no is null or trim(p_fis_no) = '') then
    raise exception 'ÖKC fişi için fiş numarası zorunlu';
  end if;
  v_belge_kesildi_mi := case when p_belge_tipi = 'okc_fisi' then now() else null end;

  select coalesce(sum(quantity * unit_price), 0),
         coalesce(sum(coalesce(discount_amount, 0)), 0)
    into v_indirimsiz_toplam, v_satir_iskonto_toplami
  from jsonb_to_recordset(p_kalemler)
    as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric, discount_amount numeric);

  if v_indirimsiz_toplam <= 0 then
    raise exception 'satışta en az bir geçerli kalem olmalı';
  end if;

  v_subtotal := v_indirimsiz_toplam - v_satir_iskonto_toplami;
  v_toplam := v_subtotal - coalesce(p_genel_iskonto, 0) + coalesce(p_yuvarlama, 0);

  if v_toplam < 0 then
    raise exception 'iskonto ve yuvarlama sonrası tutar negatif olamaz';
  end if;

  if public.rol_su() = 'cashier' then
    v_iskonto_yuzde := case when v_indirimsiz_toplam > 0
      then ((v_satir_iskonto_toplami + coalesce(p_genel_iskonto, 0)) / v_indirimsiz_toplam) * 100
      else 0 end;

    if v_iskonto_yuzde > 10 then
      if p_iskonto_onaylayan_id is null then
        raise exception 'ISKONTO_ONAY_GEREKLI: %.1f%% iskonto limitin üzerinde', v_iskonto_yuzde;
      end if;
      if not exists (
        select 1 from public.profiles
        where id = p_iskonto_onaylayan_id and tenant_id = v_tenant and role in ('owner', 'manager')
      ) then
        raise exception 'geçersiz onaylayan kullanıcı';
      end if;
    end if;
  end if;

  select count(distinct method), coalesce(sum(amount), 0)
    into v_yontem_sayisi, v_odeme_toplami
  from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid);

  if v_yontem_sayisi is null or v_yontem_sayisi = 0 then
    raise exception 'en az bir ödeme kalemi olmalı';
  end if;

  if abs(v_odeme_toplami - v_toplam) > 0.01 then
    raise exception 'ödemeler toplamı (%) satış tutarına (%) eşit değil', v_odeme_toplami, v_toplam;
  end if;

  select max_installments into v_max_taksit from public.tenants where id = v_tenant;

  for v_odeme in select * from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid)
  loop
    if v_odeme.method not in ('nakit', 'kart', 'acik_hesap') then
      raise exception 'geçersiz ödeme yöntemi: %', v_odeme.method;
    end if;
    if v_odeme.method = 'acik_hesap' and p_musteri_id is null then
      raise exception 'açık hesap için müşteri seçilmeli';
    end if;
    if v_odeme.method <> 'acik_hesap' and v_odeme.account_id is null then
      raise exception 'kasa hesabı seçilmeli: %', v_odeme.method;
    end if;
    if v_odeme.installments is not null and v_odeme.installments > 1 then
      if v_odeme.method <> 'kart' then
        raise exception 'taksit yalnız kart ödemesinde geçerli';
      end if;
      if v_odeme.installments > v_max_taksit then
        raise exception 'TAKSIT_LIMITI_ASILDI: azami % taksit', v_max_taksit;
      end if;
    end if;
  end loop;

  v_odeme_yontemi := case when v_yontem_sayisi > 1 then 'karma'
    else (select method from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid) limit 1)
  end;

  insert into public.sales
    (tenant_id, customer_id, subtotal, discount_amount, rounding_amount, total_amount, payment_method,
     document_type, receipt_no, document_issued_at, created_by)
  values
    (v_tenant, p_musteri_id, v_subtotal, coalesce(p_genel_iskonto, 0), coalesce(p_yuvarlama, 0), v_toplam, v_odeme_yontemi,
     p_belge_tipi, nullif(trim(p_fis_no), ''), v_belge_kesildi_mi, auth.uid())
  returning id into v_sale_id;

  for v_kalem in
    select * from jsonb_to_recordset(p_kalemler)
      as x(item_type text, product_id uuid, name text, quantity numeric, unit_price numeric, discount_amount numeric)
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
    if coalesce(v_kalem.discount_amount, 0) > v_kalem.quantity * v_kalem.unit_price then
      raise exception 'satır iskontosu kalem tutarını aşamaz: %', v_kalem.name;
    end if;

    insert into public.sale_items
      (tenant_id, sale_id, item_type, product_id, name, quantity, unit_price, discount_amount, line_total)
    values
      (v_tenant, v_sale_id, v_kalem.item_type, v_kalem.product_id, v_kalem.name,
       v_kalem.quantity, v_kalem.unit_price, coalesce(v_kalem.discount_amount, 0),
       v_kalem.quantity * v_kalem.unit_price - coalesce(v_kalem.discount_amount, 0));

    if v_kalem.item_type = 'urun' and v_kalem.product_id is not null then
      perform public.stok_hareketi_ekle(
        v_kalem.product_id, -v_kalem.quantity, 'sale', 'sale', v_sale_id::text,
        'Satış: ' || v_kalem.name, p_negatif_onay
      );
    end if;
  end loop;

  for v_odeme in select * from jsonb_to_recordset(p_odemeler) as x(method text, amount numeric, installments int, account_id uuid)
  loop
    insert into public.sale_payments (tenant_id, sale_id, method, amount, installments, account_id)
    values (v_tenant, v_sale_id, v_odeme.method, v_odeme.amount, v_odeme.installments, v_odeme.account_id);

    if v_odeme.method = 'acik_hesap' then
      -- Kasaya para girmez — müşteri cari borcu artar (Gün 22).
      perform public.musteri_borc_ekle(
        p_musteri_id, v_odeme.amount, 'acik_hesap_satis', 'sale', v_sale_id::text,
        'Açık hesap satış: ' || (select sale_no from public.sales where id = v_sale_id)
      );
    else
      perform public.kasa_hareketi_ekle(
        v_odeme.account_id, v_odeme.amount, 'tahsilat', 'sale', v_sale_id::text,
        'Satış tahsilatı'
      );
    end if;
  end loop;

  perform public.audit_ekle(
    'satis_olusturuldu', 'sale', v_sale_id::text, null,
    jsonb_build_object(
      'toplam', v_toplam, 'genel_iskonto', p_genel_iskonto, 'yuvarlama', p_yuvarlama,
      'odeme_yontemi', v_odeme_yontemi, 'iskonto_onaylayan_id', p_iskonto_onaylayan_id,
      'belge_tipi', p_belge_tipi
    )
  );

  return v_sale_id;
end;
$$;

-- ---------- alis_olustur(): her alış tedarikçi cari borcu yaratıyor ----------
-- İmza değişmiyor — düz create-or-replace güvenli.

create or replace function public.alis_olustur(
  p_supplier_id uuid,
  p_supplier_invoice_no text,
  p_invoice_date date,
  p_currency text,
  p_exchange_rate numeric,
  p_kalemler jsonb,
  p_payment_status text default 'odenmedi',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_purchase_id uuid;
  v_purchase_no text;
  v_toplam numeric := 0;
  v_kalem record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'warehouse') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  if not exists (
    select 1 from public.suppliers where id = p_supplier_id and tenant_id = v_tenant
  ) then
    raise exception 'tedarikçi bulunamadı veya erişim yok';
  end if;

  if p_payment_status not in ('odenmedi', 'kismi', 'odendi') then
    raise exception 'geçersiz ödeme durumu';
  end if;

  if p_exchange_rate is null or p_exchange_rate <= 0 then
    raise exception 'geçersiz kur';
  end if;

  select coalesce(sum(quantity * unit_price), 0) into v_toplam
  from jsonb_to_recordset(p_kalemler)
    as x(product_id uuid, quantity numeric, unit_price numeric);

  if v_toplam <= 0 then
    raise exception 'alışta en az bir geçerli kalem olmalı';
  end if;

  v_purchase_no := public.sonraki_alis_no(v_tenant);

  insert into public.purchases
    (tenant_id, purchase_no, supplier_id, supplier_invoice_no, invoice_date,
     currency, exchange_rate, total_amount, payment_status, notes, created_by)
  values
    (v_tenant, v_purchase_no, p_supplier_id, nullif(trim(p_supplier_invoice_no), ''), p_invoice_date,
     p_currency, p_exchange_rate, v_toplam, p_payment_status, nullif(trim(p_notes), ''), auth.uid())
  returning id into v_purchase_id;

  for v_kalem in
    select * from jsonb_to_recordset(p_kalemler)
      as x(product_id uuid, quantity numeric, unit_price numeric)
  loop
    if v_kalem.product_id is null then
      raise exception 'her kalem bir ürüne bağlı olmalı';
    end if;
    if v_kalem.quantity is null or v_kalem.quantity <= 0 then
      raise exception 'geçersiz miktar';
    end if;
    if v_kalem.unit_price is null or v_kalem.unit_price < 0 then
      raise exception 'geçersiz birim fiyat';
    end if;

    insert into public.purchase_items
      (tenant_id, purchase_id, product_id, quantity, unit_price, line_total)
    values
      (v_tenant, v_purchase_id, v_kalem.product_id, v_kalem.quantity, v_kalem.unit_price,
       v_kalem.quantity * v_kalem.unit_price);

    perform public.stok_hareketi_ekle(
      v_kalem.product_id, v_kalem.quantity, 'purchase', 'purchase', v_purchase_id::text,
      'Alış: ' || v_purchase_no
    );

    update public.products
    set purchase_price = v_kalem.unit_price,
        purchase_currency = p_currency,
        sale_price = case
          when auto_price then ceil(v_kalem.unit_price * p_exchange_rate * (1 + coalesce(price_margin, 0) / 100.0))
          else sale_price
        end
    where id = v_kalem.product_id and tenant_id = v_tenant;
  end loop;

  -- Tedarikçi cari borcu (Gün 22) — alışın kendi para birimi/kuruyla.
  perform public.tedarikci_borc_ekle(
    p_supplier_id, v_toplam, p_exchange_rate, 'purchase', v_purchase_id::text,
    'Alış: ' || v_purchase_no
  );

  perform public.audit_ekle(
    'alis_olusturuldu', 'purchase', v_purchase_id::text, null,
    jsonb_build_object('purchase_no', v_purchase_no, 'toplam', v_toplam, 'para_birimi', p_currency)
  );

  return v_purchase_id;
end;
$$;
