import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { KONSOL_COOKIE_ADI } from "@/lib/supabase/konsol-cookie";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/konsol")) {
    return konsolMiddleware(request, path);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (path.startsWith("/panel") || path === "/kurulum")) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/giris" || path === "/kayit")) {
    const url = request.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Konsol tenant panelinden tamamen ayrı bir çerez adı (KONSOL_COOKIE_ADI)
// kullanır — bu sayede aynı tarayıcıda iki oturum birbirinden bağımsızdır.
// MFA/AAL2 zorunluluğu burada değil, (app) layout'ta kontrol edilir; bu
// katman yalnız "hiç oturum yoksa girişe gönder" işini yapar.
async function konsolMiddleware(request: NextRequest, path: string) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: KONSOL_COOKIE_ADI },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const girisYolu = path === "/konsol/giris";

  if (!user && !girisYolu) {
    const url = request.nextUrl.clone();
    url.pathname = "/konsol/giris";
    return NextResponse.redirect(url);
  }

  if (user && girisYolu) {
    const url = request.nextUrl.clone();
    url.pathname = "/konsol";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/konsol/:path*",
    "/kurulum",
    "/giris",
    "/kayit",
    "/sifre-yenile",
  ],
};
