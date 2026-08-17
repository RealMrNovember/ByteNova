import { createBrowserClient } from "@supabase/ssr";
import { KONSOL_COOKIE_ADI } from "./konsol-cookie";

export function createKonsolClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { name: KONSOL_COOKIE_ADI } }
  );
}
