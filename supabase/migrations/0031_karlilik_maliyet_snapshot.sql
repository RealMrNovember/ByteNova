-- =============================================================
-- ByteNova — 0031_karlilik_maliyet_snapshot
-- Sprint 6, Gün 27 (1/2): Kârlılık raporu için "satış anındaki maliyet"
-- anlık görüntüsü.
--
-- products.purchase_price TEK bir güncel değerdir (her alışta üzerine
-- yazılır — Gün 21). Bu, geçmiş bir satışın kârını bugünün maliyetiyle
-- yanlış hesaplamamıza yol açar. Çözüm: her satış kalemi, satış anındaki
-- maliyeti (TL karşılığı) donmuş halde saklar (unit_cost). Böylece
-- kârlılık raporunda iki yöntem seçilebilir hale gelir:
--   - "Satış Anındaki Maliyet": bu sütun (tarihsel olarak doğru)
--   - "Güncel Maliyet": products.purchase_price bugünkü kurla (rapor
--     tarafında hesaplanır — bu migration'ın konusu değil)
-- Bu migration'dan ÖNCEKİ satışlarda unit_cost null kalır; rapor bunu
-- açıkça belirtir, geriye dönük veri uydurulmaz.
-- =============================================================

alter table public.sale_items add column unit_cost numeric(12,2);

-- satis_olustur(): ürün kalemlerinde satış anındaki birim maliyeti
-- (TL karşılığı) hesaplayıp unit_cost'a yazıyor. İmza değişmiyor —
-- düz create-or-replace güvenli.

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
  v_urun record;
  v_kur numeric;
  v_birim_maliyet_tl numeric;
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

    -- Satış anındaki maliyet (TL) — yalnız ürün kalemlerinde, kârlılık
    -- raporunun "satış anındaki maliyet" yöntemi için donmuş anlık görüntü.
    v_birim_maliyet_tl := null;
    if v_kalem.item_type = 'urun' and v_kalem.product_id is not null then
      select purchase_price, purchase_currency into v_urun
      from public.products where id = v_kalem.product_id and tenant_id = v_tenant;

      if v_urun.purchase_price is not null then
        if v_urun.purchase_currency = 'TRY' then
          v_birim_maliyet_tl := v_urun.purchase_price;
        else
          select rate_to_try into v_kur
          from public.exchange_rates
          where currency_code = v_urun.purchase_currency and tenant_id = v_tenant;
          if v_kur is null then
            select rate_to_try into v_kur
            from public.exchange_rates
            where currency_code = v_urun.purchase_currency and tenant_id is null;
          end if;
          if v_kur is not null then
            v_birim_maliyet_tl := v_urun.purchase_price * v_kur;
          end if;
        end if;
      end if;
    end if;

    insert into public.sale_items
      (tenant_id, sale_id, item_type, product_id, name, quantity, unit_price, discount_amount, line_total, unit_cost)
    values
      (v_tenant, v_sale_id, v_kalem.item_type, v_kalem.product_id, v_kalem.name,
       v_kalem.quantity, v_kalem.unit_price, coalesce(v_kalem.discount_amount, 0),
       v_kalem.quantity * v_kalem.unit_price - coalesce(v_kalem.discount_amount, 0),
       v_birim_maliyet_tl);

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
