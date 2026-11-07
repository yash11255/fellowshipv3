import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/admin";
import { getSeo } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "SEO settings" };

export default async function Seo() {
  await connection();
  await requireStaff("manager");
  const s = await getSeo();
  return (
    <>
      <SettingsForm title="Search engine listing" description="Defaults for every page. Products can override their title and description in the product editor."
        target={{ kind: "seo" }} initial={s}
        fields={[
          { name: "siteTitle", label: "Homepage title", type: "text", max: 70, help: "50–60 characters is ideal for Google." },
          { name: "titleTemplate", label: "Page title template", type: "text", max: 70, help: "%s is replaced by the page title, e.g. “Shilajit Gold | Arthroscopy College”." },
          { name: "siteDescription", label: "Default meta description", type: "textarea", max: 170, help: "120–160 characters. Shown under your link in search results." },
          { name: "siteUrl", label: "Canonical site URL", type: "url", help: "Used for canonical tags, sitemap and social previews." },
          { name: "ogImage", label: "Default social share image", type: "text", help: "1200×630 recommended. Path like /brand/og.jpg or a full URL." },
          { name: "organizationName", label: "Organisation name (structured data)", type: "text" },
          { name: "instagram", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/…" },
          { name: "youtube", label: "YouTube URL", type: "url", placeholder: "https://youtube.com/@…" },
          { name: "ga4Id", label: "Google Analytics 4 ID", type: "text", placeholder: "G-XXXXXXXXXX" },
          { name: "metaPixelId", label: "Meta Pixel ID", type: "text", placeholder: "1234567890" },
          { name: "gscVerification", label: "Google Search Console verification code", type: "text", help: "The content value of the google-site-verification meta tag." },
          { name: "allowIndexing", label: "Allow search engines to index the store", type: "toggle", help: "Turn off on staging so it never appears in Google." },
        ]} />
      <div className="rounded-xl border border-[#e3e3e3] bg-white p-4 text-[13px]">
        <p className="font-semibold">Generated automatically</p>
        <ul className="mt-2 space-y-1 text-grey">
          <li><Link href="/sitemap.xml" target="_blank" className="text-[#005bd3] hover:underline">/sitemap.xml</Link>: every active product, collection and page. Submit it in Google Search Console.</li>
          <li><Link href="/robots.txt" target="_blank" className="text-[#005bd3] hover:underline">/robots.txt</Link>: blocks admin, checkout and account pages; follows the indexing switch above.</li>
          <li>Product, Organization and Breadcrumb structured data (JSON-LD) on every page.</li>
          <li>Canonical URLs and Open Graph / Twitter cards from the values above.</li>
        </ul>
      </div>
    </>
  );
}
