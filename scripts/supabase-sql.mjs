// Supabase Management API üzerinden SQL çalıştırır.
// Kullanım:
//   node scripts/supabase-sql.mjs supabase/migrations/0002_sirket_profili.sql
//   node scripts/supabase-sql.mjs "select count(*) from tenants"
// Gerekli env: SUPABASE_ACCESS_TOKEN (ve opsiyonel SUPABASE_PROJECT_REF)

import { readFileSync, existsSync } from "node:fs";

function loadEnvLocal() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return;
  if (!existsSync(".env.local")) return;
  for (const satir of readFileSync(".env.local", "utf8").split("\n")) {
    const m = satir.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

loadEnvLocal();

const ref = process.env.SUPABASE_PROJECT_REF ?? "zhdritiqzmopychcwwkd";
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("HATA: SUPABASE_ACCESS_TOKEN tanımlı değil.");
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) {
  console.error("Kullanım: node scripts/supabase-sql.mjs <dosya.sql | 'SQL'>");
  process.exit(1);
}
const query = arg.endsWith(".sql") ? readFileSync(arg, "utf8") : arg;

const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  }
);

const text = await res.text();
console.log(`HTTP ${res.status}`);
console.log(text.slice(0, 3000));
process.exit(res.ok ? 0 : 1);
