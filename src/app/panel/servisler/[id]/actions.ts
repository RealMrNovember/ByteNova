"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { servisPdfOlustur } from "@/lib/pdf/olustur";

export async function teslimiTamamla(
  servisId: string,
  aksesuarlar: { name: string; delivered: boolean }[],
  teslimNotu: string,
  finalTutar: number | null,
  kalanTahsilat: number | null,
  kasaHesapId: string | null,
  garantiGun: number = 0
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  if (kalanTahsilat && kalanTahsilat > 0 && kasaHesapId) {
    const { error: tahsilatHatasi } = await supabase.rpc("servis_tahsilat_al", {
      p_service_id: servisId,
      p_tutar: kalanTahsilat,
      p_tip: "kapanis",
      p_account_id: kasaHesapId,
    });
    if (tahsilatHatasi) return { ok: false as const };
  }

  const { error } = await supabase
    .from("service_orders")
    .update({
      status: "teslim_edildi",
      delivered_at: new Date().toISOString(),
      accessories: aksesuarlar,
      delivery_note: teslimNotu.trim() || null,
      final_cost: finalTutar,
      warranty_days: garantiGun > 0 ? garantiGun : null,
    })
    .eq("id", servisId);

  if (error) return { ok: false as const };

  await supabase.rpc("audit_ekle", {
    p_action: "servis_teslim_edildi",
    p_entity: "service_order",
    p_entity_id: servisId,
    p_new: { final_cost: finalTutar, kalan_tahsilat: kalanTahsilat },
  });

  revalidatePath(`/panel/servisler/${servisId}`);
  return { ok: true as const };
}

export async function whatsappIcinBelgeHazirla(
  servisId: string,
  tip: "kabul" | "teslim"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, hata: "oturum_yok" };

  const { data: profil } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  const tenantId = profil?.tenant_id;
  if (!tenantId) return { ok: false as const, hata: "tenant_yok" };

  // Eklenti kontrolü: WhatsApp paylaşımı yalnızca aktif abonelikte
  const { data: abonelik } = await supabase
    .from("tenant_addon_subscriptions")
    .select("status")
    .eq("addon_key", "whatsapp_sms")
    .maybeSingle();
  if (abonelik?.status !== "active" && abonelik?.status !== "trial") {
    return { ok: false as const, hata: "eklenti_yok" };
  }

  const sonuc = await servisPdfOlustur(supabase, servisId, tip);
  if (!sonuc) return { ok: false as const, hata: "servis_yok" };

  const yol = `${tenantId}/${servisId}/${Date.now()}-${sonuc.dosyaAdi}`;
  const { error: yuklemeHatasi } = await supabase.storage
    .from("servis-belgeleri")
    .upload(yol, sonuc.buffer, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (yuklemeHatasi) return { ok: false as const, hata: "yukleme_hatasi" };

  const { data: imzali } = await supabase.storage
    .from("servis-belgeleri")
    .createSignedUrl(yol, 60 * 60 * 24 * 7); // 7 gün geçerli
  if (!imzali?.signedUrl) return { ok: false as const, hata: "url_hatasi" };

  await supabase.rpc("audit_ekle", {
    p_action: "servis_belgesi_whatsapp_hazirlandi",
    p_entity: "service_order",
    p_entity_id: servisId,
    p_new: { tip },
  });

  const musteri = sonuc.servis.customers as {
    name: string;
    phone: string | null;
  } | null;

  return {
    ok: true as const,
    url: imzali.signedUrl,
    telefon: musteri?.phone ?? null,
    musteriAdi: musteri?.name ?? "",
    servisNo: sonuc.servis.service_no,
    tip,
  };
}
