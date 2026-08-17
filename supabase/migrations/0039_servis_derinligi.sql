-- =============================================================
-- ByteNova — 0039_servis_derinligi
-- Sprint 7-8: Servis derinliği (proje dosyası Bölüm 12.7/12.9/12.10) —
-- ücretli teşhis, garanti/tekrar servis + azami tamir süresi, teslim
-- alınmayan cihaz otomasyonunun veri temeli. Kanban görünümü ve azami
-- süre sayacı istemci tarafında (mevcut service_status_history üzerinden)
-- hesaplanıyor — bunlar için yeni sütun gerekmiyor.
-- =============================================================

alter table public.tenants
  add column default_warranty_days int not null default 90,
  add column hazir_bekleme_gun int not null default 15;

alter table public.service_orders
  add column diagnosis_fee numeric(12,2),
  add column diagnosis_fee_charged boolean not null default false,
  add column warranty_claim boolean not null default false,
  add column warranty_days int;

-- ---------- ÜCRETLİ TEŞHİS (Bölüm 12.10) ----------
-- Müşteri teklifi reddederse: teşhis raporu saklanır (kayıt değişmez),
-- cihaz "hazır" (teslim bekliyor) durumuna geçer, ücretli teşhis bedeli
-- ayrı kalem olarak işaretlenir. Tahsilat mevcut servis_tahsilat_al()
-- akışıyla (Gün 18) yapılır — yeni bir ödeme mekanizması gerekmiyor.

create or replace function public.servis_teshis_ucreti_uygula(
  p_service_id uuid,
  p_ucret numeric
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;
  if p_ucret is null or p_ucret <= 0 then
    raise exception 'geçersiz teşhis ücreti';
  end if;

  update public.service_orders
  set diagnosis_fee = p_ucret,
      diagnosis_fee_charged = true,
      status = 'hazir'
  where id = p_service_id and tenant_id = v_tenant;

  if not found then
    raise exception 'servis bulunamadı veya erişim yok';
  end if;

  insert into public.service_notes (tenant_id, service_order_id, user_id, content)
  values (
    v_tenant, p_service_id, auth.uid(),
    '💰 Müşteri teklifi reddetti — ücretli teşhis bedeli: ' || p_ucret::text || ' TL. Cihaz teslim bekliyor.'
  );

  perform public.audit_ekle(
    'servis_teshis_ucreti_uygulandi', 'service_order', p_service_id::text, null,
    jsonb_build_object('ucret', p_ucret)
  );
end;
$$;
