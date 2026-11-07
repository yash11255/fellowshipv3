import type { MetadataRoute } from "next";
import { getSeo } from "@/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl, allowIndexing } = await getSeo();
  const base = siteUrl.replace(/\/$/, "");
  if (!allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/account", "/order/", "/login", "/api/", "/styleguide"] },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
