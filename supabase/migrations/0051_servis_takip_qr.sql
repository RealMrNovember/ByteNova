-- Müşteri servis takip sayfası (QR) — bkz. PROJE_DOSYASI §Servis Kabul (QR ile müşteri
-- servis durum sayfasına ulaşabilir) ve Sprint 9-12 P1 listesi. Teklif onayının
-- public_token/SECURITY DEFINER desenini birebir izler: müşteri kimlik doğrulamadan,
-- yalnızca kendi servisinin sınırlı/güvenli bir görünümüne erişir.

alter table public.service_orders
  add column public_token uuid not null default gen_random_uuid() unique;

create or replace function public.servis_takip_bilgisi_al(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sonuc jsonb;
begin
  select jsonb_build_object(
    'service_no', s.service_no,
    'status', s.status,
    'declared_issue', s.declared_issue,
    'estimated_cost', s.estimated_cost,
    'final_cost', s.final_cost,
    'advance_paid', s.advance_paid,
    'created_at', s.created_at,
    'delivered_at', s.delivered_at,
    'isletme_adi', t.name,
    'isletme_telefon', t.phone,
    'musteri_adi', c.name,
    'cihaz', jsonb_build_object('tur', d.device_type, 'marka', d.brand, 'model', d.model),
    'gecmis', coalesce((
      select jsonb_agg(jsonb_build_object('durum', h.to_status, 'tarih', h.created_at) order by h.created_at)
      from public.service_status_history h where h.service_order_id = s.id
    ), '[]'::jsonb)
  ) into v_sonuc
  from public.service_orders s
  join public.tenants t on t.id = s.tenant_id
  join public.customers c on c.id = s.customer_id
  left join public.devices d on d.id = s.device_id
  where s.public_token = p_token;

  if v_sonuc is null then
    raise exception 'servis bulunamadı';
  end if;

  return v_sonuc;
end;
$$;
