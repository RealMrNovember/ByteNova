import type { Metadata } from "next";
import { createKonsolClient } from "@/lib/supabase/konsol-server";
import { PANEL_MENU } from "@/lib/menu";
import { PlatformAyarlari } from "@/components/konsol/PlatformAyarlari";

export const metadata: Metadata = { title: "Platform Ayarları — Konsol — ByteNova" };

const VARSAYILAN_DURUM: Record<string, "off" | "coming_soon" | "beta" | "on"> = {
  aktif: "on",
  insa: "beta",
  yakinda: "coming_soon",
  kilitli: "coming_soon",
};

export default async function KonsolAyarlarPage() {
  const supabase = await createKonsolClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: flagSatirlariHam }, { data: paketlerHam }, { data: benimProfil }] = await Promise.all([
    supabase.from("feature_flags").select("key, status").is("tenant_id", null),
    supabase.from("addon_packages").select("key, name, icon, status").order("sort_order"),
    user ? supabase.from("platform_admins").select("role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const flagHaritasi = new Map((flagSatirlariHam ?? []).map((f) => [f.key, f.status]));

  const flagSatirlari = PANEL_MENU.filter((m) => m.slug).map((m) => ({
    key: m.slug,
    ad: m.ad,
    ikon: m.ikon,
    durum: (flagHaritasi.get(m.slug) ?? VARSAYILAN_DURUM[m.durum] ?? "coming_soon") as "off" | "coming_soon" | "beta" | "on",
  }));

  const paketSatirlari = (paketlerHam ?? []).map((p) => ({
    key: p.key,
    ad: p.name,
    ikon: p.icon,
    durum: p.status as "draft" | "available" | "deprecated",
  }));

  const duzenleyebilir = ["master", "manager"].includes(benimProfil?.role ?? "");

  return (
    <PlatformAyarlari flagSatirlari={flagSatirlari} paketSatirlari={paketSatirlari} duzenleyebilir={duzenleyebilir} />
  );
}
