"use client";

import { usePathname } from "next/navigation";
import { WhatsAppDestek } from "./WhatsAppDestek";

// Panel içinde WhatsApp baloncuğu gösterilmez — orada destek erişimi
// Ayarlar sayfasına taşındı (uygulama içi, daha az dikkat dağıtıcı).
export function ConditionalWhatsApp() {
  const pathname = usePathname();
  if (pathname?.startsWith("/panel") || pathname?.startsWith("/konsol")) return null;
  return <WhatsAppDestek />;
}
