import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bir kullanıcının e-posta/parolasını doğrular — mevcut oturumu ETKİLEMEDEN.
 * @supabase/ssr'nin createBrowserClient'ı çerezlere yazdığı için burada
 * bilerek kullanılmıyor; persistSession:false ile bellekte kalan, izole
 * bir istemci kullanılır (kasiyer oturumu asla değişmez).
 *
 * Dönen onay yalnız UX'tir — gerçek yetki denetimi satis_olustur()
 * RPC'sinde p_iskonto_onaylayan_id ile sunucu tarafında tekrar yapılır.
 */
export async function yoneticiParolaDogrula(
  email: string,
  password: string
): Promise<{ ok: true; userId: string; adSoyad: string | null } | { ok: false; mesaj: string }> {
  const gecici = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await gecici.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, mesaj: "E-posta veya parola hatalı." };
  }

  const { data: profil } = await gecici
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", data.user.id)
    .single();

  if (!profil || !["owner", "manager"].includes(profil.role)) {
    return { ok: false, mesaj: "Bu kullanıcının iskonto onay yetkisi yok." };
  }

  return { ok: true, userId: profil.id, adSoyad: profil.full_name };
}
