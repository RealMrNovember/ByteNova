import type { SupabaseClient } from "@supabase/supabase-js";

export type KonsolAdim = "/konsol" | "/konsol/mfa-kur" | "/konsol/mfa-dogrula";

/**
 * Konsol girişinden sonra kullanıcının gitmesi gereken adımı belirler:
 * hiç doğrulanmış TOTP faktörü yoksa kurulum, faktör var ama bu oturumda
 * henüz doğrulanmadıysa (AAL1→AAL2) doğrulama, ikisi de tamamsa konsol.
 * MFA Supabase Auth'un yerleşik `auth.mfa` API'siyle yönetilir — ayrı bir
 * tablo/alan gerekmez.
 */
export async function konsolSonrakiAdim(supabase: SupabaseClient): Promise<KonsolAdim> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return "/konsol/mfa-kur";
  if (data.currentLevel === "aal2") return "/konsol";
  if (data.nextLevel === "aal2") return "/konsol/mfa-dogrula";
  return "/konsol/mfa-kur";
}
