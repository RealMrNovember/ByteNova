import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { KONSOL_COOKIE_ADI } from "./konsol-cookie";

export async function createKonsolClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: KONSOL_COOKIE_ADI },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component içinden çağrıldığında yazma yapılamaz;
            // oturum tazeleme middleware'de gerçekleşir.
          }
        },
      },
    }
  );
}
