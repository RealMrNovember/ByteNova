-- =============================================================
-- ByteNova — 0022_kasa_kapanis_turkiye_saati
-- kasa_kapat(): current_date sunucunun (UTC) tarihini veriyordu.
-- Gece yarısına yakın saatlerde (00:00-03:00 Türkiye saati) bu, kapanışın
-- yanlış güne (bir önceki UTC gününe) kaydedilmesine yol açıyordu.
-- Türkiye saat dilimi (Europe/Istanbul) açıkça kullanılacak şekilde
-- düzeltildi.
-- =============================================================

create or replace function public.kasa_kapat(
  p_account_id uuid,
  p_fiili_bakiye numeric,
  p_aciklama text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tenant uuid;
  v_beklenen numeric;
  v_fark numeric;
  v_id uuid;
  v_bugun date;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'cashier') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  v_bugun := (now() at time zone 'Europe/Istanbul')::date;

  select balance into v_beklenen
  from public.cash_accounts
  where id = p_account_id and tenant_id = v_tenant and is_active = true
  for update;

  if not found then
    raise exception 'kasa hesabı bulunamadı veya erişim yok';
  end if;

  if exists (
    select 1 from public.cash_closings
    where account_id = p_account_id and closing_date = v_bugun
  ) then
    raise exception 'bu hesap bugün zaten kapatıldı';
  end if;

  v_fark := p_fiili_bakiye - v_beklenen;

  if v_fark <> 0 and (p_aciklama is null or trim(p_aciklama) = '') then
    raise exception 'FARK_ACIKLAMASI_GEREKLI: beklenen %, fiili %', v_beklenen, p_fiili_bakiye;
  end if;

  insert into public.cash_closings
    (tenant_id, account_id, closing_date, expected_balance, actual_balance, difference, explanation, closed_by)
  values
    (v_tenant, p_account_id, v_bugun, v_beklenen, p_fiili_bakiye, v_fark, nullif(trim(p_aciklama), ''), auth.uid())
  returning id into v_id;

  if v_fark <> 0 then
    perform public.kasa_hareketi_ekle(
      p_account_id, v_fark, 'duzeltme', 'cash_closing', v_id::text,
      'Kasa kapanış farkı: ' || p_aciklama
    );
  end if;

  perform public.audit_ekle(
    'kasa_kapatildi', 'cash_closing', v_id::text, null,
    jsonb_build_object('expected', v_beklenen, 'actual', p_fiili_bakiye, 'difference', v_fark)
  );

  return v_id;
end;
$$;
