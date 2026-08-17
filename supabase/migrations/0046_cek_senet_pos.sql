-- =============================================================
-- ByteNova — 0046_cek_senet_pos
-- Sprint 9-12, 3/7: Çek/Senet Portföyü + POS Mutabakat (Bölüm 21-22,
-- docs/ByteNova_PROJE_DOSYASI_v2.md).
--
-- Kapsam notu: Çek/senet TL ile sınırlı tutuldu (dövizli çek — kur takibi,
-- vade sonu kur farkı — bilinçli olarak bu turda kurulmadı; spesifikasyon
-- bunu açıkça zorunlu kılmıyor ve karmaşıklığı bu özelliğin boyutunu
-- ikiye katlardı). Çek/senet portföyü kendi başına bağımsız bir takip
-- sistemidir — alındığında otomatik olarak müşteri borcunu azaltmaz
-- (bu, işletmenin "çek alınca borç kapanır mı yoksa tahsil edilince mi"
-- kararına bağlıdır ve dayatılmaz); yalnız iki tartışmasız nokta gerçek
-- kasa/cari hareketi üretir: tahsil edilince (gerçekten kasaya para
-- girer) ve tedarikçiye ciro edilince (gerçekten o borç azalır).
-- =============================================================

alter table public.customers add column risk_notu text;

comment on column public.customers.risk_notu is
  'Karşılıksız çek gibi risk olaylarının otomatik eklendiği serbest metin — cariye işaretlenir, kesinti kararı işletmenindir.';

-- ---------- ÇEK / SENET PORTFÖYÜ ----------

create table public.cheques (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  instrument_type text not null check (instrument_type in ('cek', 'senet')),
  direction text not null check (direction in ('alinan', 'verilen')),
  party_name text not null, -- alınan: keşideci adı · verilen: lehtar adı
  customer_id uuid references public.customers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null, -- verilen: ait olduğu tedarikçi · alınan: ciro edilen tedarikçi
  bank_name text,
  branch_name text,
  cheque_no text,
  due_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'portfoyde'
    check (status in ('portfoyde', 'bankaya_verildi', 'tahsil_edildi', 'karsiliksiz', 'ciro_edildi', 'odendi')),
  account_id uuid references public.cash_accounts(id) on delete set null, -- tahsil/ödeme yapılan kasa hesabı
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cheques_tenant_idx on public.cheques (tenant_id, due_date);
create index cheques_tenant_status_idx on public.cheques (tenant_id, status);

create trigger cheques_updated_at
  before update on public.cheques
  for each row execute function public.updated_at_guncelle();

alter table public.cheques enable row level security;

create policy cheques_select on public.cheques
  for select using (tenant_id = public.current_tenant_id());

-- ---------- DURUM GEÇMİŞİ ----------

create table public.cheque_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cheque_id uuid not null references public.cheques(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index cheque_events_cheque_idx on public.cheque_events (cheque_id, created_at);

alter table public.cheque_events enable row level security;

create policy cheque_events_select on public.cheque_events
  for select using (tenant_id = public.current_tenant_id());

-- ---------- ÇEK/SENET OLUŞTUR ----------

create or replace function public.cek_senet_olustur(
  p_instrument_type text,
  p_direction text,
  p_party_name text,
  p_due_date date,
  p_amount numeric,
  p_customer_id uuid default null,
  p_supplier_id uuid default null,
  p_bank_name text default null,
  p_branch_name text default null,
  p_cheque_no text default null,
  p_notes text default null
)
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
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_instrument_type not in ('cek', 'senet') then
    raise exception 'geçersiz belge tipi: %', p_instrument_type;
  end if;
  if p_direction not in ('alinan', 'verilen') then
    raise exception 'geçersiz yön: %', p_direction;
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'geçersiz tutar';
  end if;
  if trim(coalesce(p_party_name, '')) = '' then
    raise exception 'keşideci/lehtar adı zorunlu';
  end if;

  insert into public.cheques
    (tenant_id, instrument_type, direction, party_name, customer_id, supplier_id,
     bank_name, branch_name, cheque_no, due_date, amount, notes, created_by)
  values
    (v_tenant, p_instrument_type, p_direction, trim(p_party_name), p_customer_id, p_supplier_id,
     nullif(trim(coalesce(p_bank_name, '')), ''), nullif(trim(coalesce(p_branch_name, '')), ''),
     nullif(trim(coalesce(p_cheque_no, '')), ''), p_due_date, p_amount,
     nullif(trim(coalesce(p_notes, '')), ''), auth.uid())
  returning id into v_id;

  insert into public.cheque_events (tenant_id, cheque_id, from_status, to_status, user_id)
  values (v_tenant, v_id, null, 'portfoyde', auth.uid());

  perform public.audit_ekle('cek_senet_olusturuldu', 'cheque', v_id::text, null,
    jsonb_build_object('tip', p_instrument_type, 'yon', p_direction, 'tutar', p_amount));

  return v_id;
end;
$$;

-- ---------- DURUM GÜNCELLE (kasa/cari entegrasyonu burada) ----------

create or replace function public.cek_senet_durum_guncelle(
  p_id uuid,
  p_yeni_durum text,
  p_account_id uuid default null,
  p_hedef_tedarikci_id uuid default null,
  p_not text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_cek record;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_yeni_durum not in ('portfoyde', 'bankaya_verildi', 'tahsil_edildi', 'karsiliksiz', 'ciro_edildi', 'odendi') then
    raise exception 'geçersiz durum: %', p_yeni_durum;
  end if;

  select * into v_cek from public.cheques where id = p_id and tenant_id = v_tenant for update;
  if not found then
    raise exception 'çek/senet bulunamadı veya erişim yok';
  end if;
  if v_cek.status = p_yeni_durum then
    raise exception 'zaten bu durumda';
  end if;

  if p_yeni_durum = 'tahsil_edildi' then
    if v_cek.direction <> 'alinan' then
      raise exception 'yalnızca alınan çek/senet tahsil edilebilir';
    end if;
    if p_account_id is null then
      raise exception 'tahsil edilecek kasa hesabı seçilmeli';
    end if;
    perform public.kasa_hareketi_ekle(
      p_account_id, v_cek.amount, 'tahsilat', 'cheque', p_id::text,
      format('%s tahsilatı: %s', case when v_cek.instrument_type = 'cek' then 'Çek' else 'Senet' end, v_cek.party_name)
    );
  elsif p_yeni_durum = 'odendi' then
    if v_cek.direction <> 'verilen' then
      raise exception 'yalnızca verilen çek/senet ödenmiş sayılabilir';
    end if;
    if p_account_id is null then
      raise exception 'ödemenin çıktığı kasa hesabı seçilmeli';
    end if;
    perform public.kasa_hareketi_ekle(
      p_account_id, -v_cek.amount, 'odeme', 'cheque', p_id::text,
      format('%s ödemesi: %s', case when v_cek.instrument_type = 'cek' then 'Çek' else 'Senet' end, v_cek.party_name)
    );
  elsif p_yeni_durum = 'ciro_edildi' then
    if v_cek.direction <> 'alinan' then
      raise exception 'yalnızca alınan çek/senet ciro edilebilir';
    end if;
    if p_hedef_tedarikci_id is null then
      raise exception 'ciro edilecek tedarikçi seçilmeli';
    end if;
    perform public.tedarikci_borc_ekle(
      p_hedef_tedarikci_id, -v_cek.amount, 1, 'cheque', p_id::text,
      format('Çek/senet cirosu: %s', v_cek.party_name), 'duzeltme'
    );
  elsif p_yeni_durum = 'karsiliksiz' then
    if v_cek.customer_id is not null then
      update public.customers
      set risk_notu = trim(both E'\n' from coalesce(risk_notu || E'\n', '')
        || format('Karşılıksız çek/senet: %s — %s TL (%s)', v_cek.party_name, v_cek.amount, to_char(now(), 'DD.MM.YYYY')))
      where id = v_cek.customer_id;
    end if;
  end if;

  update public.cheques
  set status = p_yeni_durum,
      account_id = coalesce(p_account_id, account_id),
      supplier_id = case when p_yeni_durum = 'ciro_edildi' then p_hedef_tedarikci_id else supplier_id end
  where id = p_id;

  insert into public.cheque_events (tenant_id, cheque_id, from_status, to_status, note, user_id)
  values (v_tenant, p_id, v_cek.status, p_yeni_durum, nullif(trim(coalesce(p_not, '')), ''), auth.uid());

  perform public.audit_ekle('cek_senet_durum_degisti', 'cheque', p_id::text, null,
    jsonb_build_object('eski_durum', v_cek.status, 'yeni_durum', p_yeni_durum));
end;
$$;

-- ---------- POS MUTABAKAT ----------

create table public.pos_settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  cash_account_id uuid not null references public.cash_accounts(id) on delete cascade,
  settlement_date date not null,
  expected_amount numeric(12,2) not null,
  received_amount numeric(12,2) not null,
  commission_amount numeric(12,2) not null default 0,
  expense_id uuid references public.expenses(id) on delete set null,
  status text not null check (status in ('eslesti', 'fark_var')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (cash_account_id, settlement_date)
);

alter table public.pos_settlements enable row level security;

create policy pos_settlements_select on public.pos_settlements
  for select using (tenant_id = public.current_tenant_id());

-- p_expected_amount istemciden alınmaz — o günün gerçek "tahsilat" toplamı
-- sunucu tarafında hesaplanır, sahte mutabakat girilemez.
create or replace function public.pos_mutabakat_yap(
  p_cash_account_id uuid,
  p_settlement_date date,
  p_received_amount numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_beklenen numeric;
  v_komisyon numeric;
  v_durum text;
  v_gider_id uuid;
  v_id uuid;
  v_tip text;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select type into v_tip from public.cash_accounts where id = p_cash_account_id and tenant_id = v_tenant;
  if not found or v_tip <> 'pos' then
    raise exception 'geçersiz POS hesabı';
  end if;

  select coalesce(sum(amount), 0) into v_beklenen
  from public.cash_movements
  where account_id = p_cash_account_id
    and movement_type = 'tahsilat'
    and created_at >= (p_settlement_date::timestamptz)
    and created_at < (p_settlement_date + 1)::timestamptz;

  v_komisyon := greatest(v_beklenen - p_received_amount, 0);
  v_durum := case when abs(v_beklenen - p_received_amount) < 0.01 then 'eslesti' else 'fark_var' end;

  if v_komisyon > 0.01 then
    v_gider_id := public.gider_ekle(
      'pos_komisyonu', format('POS mutabakatı — %s', to_char(p_settlement_date, 'DD.MM.YYYY')),
      v_komisyon, p_cash_account_id
    );
  end if;

  insert into public.pos_settlements
    (tenant_id, cash_account_id, settlement_date, expected_amount, received_amount,
     commission_amount, expense_id, status, notes, created_by)
  values
    (v_tenant, p_cash_account_id, p_settlement_date, v_beklenen, p_received_amount,
     v_komisyon, v_gider_id, v_durum, nullif(trim(coalesce(p_notes, '')), ''), auth.uid())
  returning id into v_id;

  perform public.audit_ekle('pos_mutabakat_yapildi', 'pos_settlement', v_id::text, null,
    jsonb_build_object('beklenen', v_beklenen, 'alinan', p_received_amount, 'komisyon', v_komisyon));

  return v_id;
end;
$$;
