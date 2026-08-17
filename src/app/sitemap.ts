import type { MetadataRoute } from "next";

const SITE_URL = "https://bytenova.cicibyte.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const sayfalar = ["", "/moduller", "/fiyatlandirma", "/sss", "/demo", "/giris", "/kayit"];
  return sayfalar.map((yol) => ({
    url: `${SITE_URL}${yol}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: yol === "" ? 1 : 0.7,
  }));
}
