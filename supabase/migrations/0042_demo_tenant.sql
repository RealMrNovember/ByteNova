-- Showroom "canlı demo" özelliği: kayıt olmadan gezilebilen, örnek veriyle
-- doldurulmuş, her gece sıfırlanan sabit bir demo tenant'ı işaretlemek için.
-- Bilinçli tasarım kararı: demo tenant yazılabilir bırakılıyor (ziyaretçi
-- panelde gerçekten işlem yapabilsin diye) — kötüye kullanım riski,
-- tenant_id ile sağlanan RLS izolasyonu sayesinde yalnızca bu tek tenant'ın
-- kendi verisiyle sınırlı kalır (başka hiçbir tenant'ı etkilemez) ve
-- /api/cron/demo-sifirla ile her gece tamamen sıfırlanır.

alter table public.tenants add column is_demo boolean not null default false;

comment on column public.tenants.is_demo is
  'true ise bu tenant Showroom''un herkese açık canlı demo hesabıdır; /api/cron/demo-sifirla her gece verisini sıfırlar.';
