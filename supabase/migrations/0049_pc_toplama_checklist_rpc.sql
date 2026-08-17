-- assembly_orders üzerinde sadece SELECT RLS politikası vardı; test checklist'i
-- doğrudan istemciden .update() ile değiştirmeye çalışan bileşen RLS tarafından
-- sessizce engelleniyordu (0 satır etkilendi, hata dönmedi). Diğer tüm PC Toplama
-- yazma işlemleri gibi bunu da SECURITY DEFINER bir RPC üzerinden yapıyoruz.

create or replace function public.toplama_checklist_guncelle(p_order_id uuid, p_index int, p_checked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_emir record;
  v_checklist jsonb;
begin
  v_tenant := public.current_tenant_id();
  if public.rol_su() not in ('owner', 'manager', 'technician') then
    raise exception 'bu işlem için yetkiniz yok';
  end if;

  select * into v_emir from public.assembly_orders where id = p_order_id and tenant_id = v_tenant;
  if not found then
    raise exception 'toplama emri bulunamadı';
  end if;
  if v_emir.status in ('tamamlandi', 'iptal') then
    raise exception 'bu emir zaten kapanmış';
  end if;
  if p_index < 0 or p_index >= jsonb_array_length(v_emir.checklist) then
    raise exception 'geçersiz checklist indeksi';
  end if;

  v_checklist := jsonb_set(v_emir.checklist, array[p_index::text, 'checked'], to_jsonb(p_checked));
  update public.assembly_orders set checklist = v_checklist where id = p_order_id;
end;
$$;
