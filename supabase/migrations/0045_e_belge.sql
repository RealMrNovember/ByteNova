-- =============================================================
-- ByteNova — 0045_e_belge
-- Sprint 9-12, 2/7: e-Belge — entegratör soyutlaması + gider pusulası +
-- portal modu (Bölüm 35, docs/ByteNova_PROJE_DOSYASI_v2.md).
--
-- Kapsam notu: gerçek bir e-Fatura/e-Arşiv entegratör kimlik bilgisi
-- (GİB bağlantısı) bu ortamda mevcut değil. Bu migration + ilişkili
-- uygulama kodu (src/lib/e-belge.ts) GERÇEK mimariyi kurar — belge
-- kaydı tablosu, "entegratörsüz mod" (portalde el ile kesilip numarası
-- bağlanan belge — Bölüm 35'in "düşük teknoloji modu"), gider pusulası
-- PDF üretimi — ancak e-Fatura/e-Arşiv numarası üretimi ve mükellef
-- sorgulama SANDBOX'tır (gerçek GİB API çağrısı yapılmaz). Ayrıca
-- KDV tevkifatı / özel matrah / tarih-versiyonlu vergi kural motoru
-- (Bölüm 37) BİLİNÇLİ OLARAK bu turda kurulmadı — proje dosyasının
-- kendisi bile bunun "üretime alınmadan önce uzman/mali müşavir
-- doğrulamasından geçirilmesi" gerektiğini açıkça belirtiyor; sahte
-- vergi hesaplama kuralları icat etmek gerçek muhasebe hatasına yol
-- açabileceğinden bu migration yalnızca BELGE KAYDI/ARŞİVİ mimarisini
-- kurar, vergi tutarı hesaplamaz.
-- =============================================================

-- ---------- TEDARİKÇİ: MÜKELLEF / ŞAHIS AYRIMI ----------

alter table public.suppliers add column is_taxpayer boolean not null default true;

comment on column public.suppliers.is_taxpayer is
  'false ise bu tedarikçi vergi mükellefi olmayan bir şahıstır — alımlarında fatura yerine gider pusulası düzenlenir.';

-- ---------- BELGE (SATIŞ) TİPİ GENİŞLETMESİ ----------

alter table public.sales drop constraint sales_document_type_check;
alter table public.sales add constraint sales_document_type_check
  check (document_type in ('okc_fisi', 'sonra_kesilecek', 'e_fatura', 'e_arsiv_fatura'));

-- ---------- e-BELGE / GİDER PUSULASI KAYIT ARŞİVİ ----------

create table public.e_document_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  document_type text not null check (document_type in ('e_fatura', 'e_arsiv_fatura', 'gider_pusulasi')),
  reference_type text not null check (reference_type in ('sale', 'purchase')),
  reference_id uuid, -- gider pusulası bağımsız da düzenlenebilir (bir alış kaydına bağlı olmadan)
  document_no text not null,
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  description text,
  amount numeric(12,2) not null,
  withholding_rate numeric(5,2),
  withholding_amount numeric(12,2),
  net_amount numeric(12,2),
  provider_mode text not null default 'sandbox' check (provider_mode in ('sandbox', 'entegrator', 'portal')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index e_document_records_tenant_idx on public.e_document_records (tenant_id, created_at desc);
create unique index e_document_records_reference_idx on public.e_document_records (reference_type, reference_id, document_type);

alter table public.e_document_records enable row level security;

create policy e_document_records_select on public.e_document_records
  for select using (tenant_id = public.current_tenant_id());

-- ---------- KURUMSAL SATIŞA e-BELGE KESME (SANDBOX) ----------
-- satis_belgesini_kes() ile aynı aile — o yalnız ÖKC fişi içindi, bu
-- VKN'li kurumsal müşterilere e-Fatura/e-Arşiv kesmek için. Belge
-- numarası sandbox'ta sıralı bir sayaçla üretilir (gerçek entegratörde
-- bu numara GİB'den döner).

create or replace function public.satis_e_belge_kes(
  p_sale_id uuid,
  p_belge_tipi text
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_musteri_vkn text;
  v_toplam numeric;
  v_belge_no text;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_belge_tipi not in ('e_fatura', 'e_arsiv_fatura') then
    raise exception 'geçersiz e-belge tipi: %', p_belge_tipi;
  end if;

  select s.total_amount, c.tax_number into v_toplam, v_musteri_vkn
  from public.sales s
  left join public.customers c on c.id = s.customer_id
  where s.id = p_sale_id and s.tenant_id = v_tenant and s.document_issued_at is null;

  if not found then
    raise exception 'satış bulunamadı veya belgesi zaten kesilmiş';
  end if;
  if p_belge_tipi = 'e_fatura' and (v_musteri_vkn is null or trim(v_musteri_vkn) = '') then
    raise exception 'e-Fatura için müşterinin VKN''si kayıtlı olmalı';
  end if;

  v_belge_no := (case when p_belge_tipi = 'e_fatura' then 'EFT' else 'EAR' end)
    || '-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  update public.sales
  set document_type = p_belge_tipi, receipt_no = v_belge_no, document_issued_at = now()
  where id = p_sale_id;

  insert into public.e_document_records
    (tenant_id, document_type, reference_type, reference_id, document_no, customer_id, amount, created_by)
  select v_tenant, p_belge_tipi, 'sale', p_sale_id, v_belge_no, customer_id, v_toplam, auth.uid()
  from public.sales where id = p_sale_id;

  perform public.audit_ekle('satis_e_belge_kesildi', 'sale', p_sale_id::text, null,
    jsonb_build_object('belge_no', v_belge_no, 'belge_tipi', p_belge_tipi));

  return v_belge_no;
end;
$$;

-- ---------- GİDER PUSULASI (VERGİ MÜKELLEFİ OLMAYAN ALIM) ----------
-- Stopaj oranı burada SABİT KODLANMAZ — kullanıcı girer (varsayılan 0),
-- PDF'de şeffafça gösterilir. Gerçek stopaj/istisna oranları ürün
-- grubuna ve mevzuata göre değişir (Bölüm 37) — bu, muhasebe/mali
-- müşavir onayı gerektiren bir karardır, ByteNova dayatmaz.

create or replace function public.gider_pusulasi_olustur(
  p_supplier_id uuid,
  p_tutar numeric,
  p_aciklama text,
  p_stopaj_orani numeric default 0,
  p_referans_purchase_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_id uuid;
  v_belge_no text;
  v_stopaj_tutari numeric;
  v_net numeric;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_tutar is null or p_tutar <= 0 then
    raise exception 'geçersiz tutar';
  end if;
  if not exists (
    select 1 from public.suppliers
    where id = p_supplier_id and tenant_id = v_tenant and is_taxpayer = false
  ) then
    raise exception 'gider pusulası yalnız vergi mükellefi olmayan tedarikçiler için düzenlenebilir';
  end if;

  v_stopaj_tutari := round(p_tutar * coalesce(p_stopaj_orani, 0) / 100, 2);
  v_net := p_tutar - v_stopaj_tutari;
  v_belge_no := 'GP-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  insert into public.e_document_records
    (tenant_id, document_type, reference_type, reference_id, document_no, supplier_id,
     description, amount, withholding_rate, withholding_amount, net_amount, created_by)
  values
    (v_tenant, 'gider_pusulasi', 'purchase', p_referans_purchase_id,
     v_belge_no, p_supplier_id, p_aciklama, p_tutar, p_stopaj_orani, v_stopaj_tutari, v_net, auth.uid())
  returning id into v_id;

  perform public.audit_ekle('gider_pusulasi_olusturuldu', 'supplier', p_supplier_id::text, null,
    jsonb_build_object('belge_no', v_belge_no, 'tutar', p_tutar, 'aciklama', p_aciklama));

  return v_id;
end;
$$;
