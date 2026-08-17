import type { Metadata } from "next";
import { ReceteFormu } from "@/components/toplama/ReceteFormu";

export const metadata: Metadata = { title: "Yeni Reçete — ByteNova" };

export default function YeniRecetePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold text-white">Yeni Reçete (BOM)</h1>
      <p className="mt-0.5 text-sm text-slate-400">
        Sık toplanan bir yapılandırmayı şablon olarak kaydedin.
      </p>
      <div className="glass mt-6 rounded-xl p-6">
        <ReceteFormu />
      </div>
    </div>
  );
}
