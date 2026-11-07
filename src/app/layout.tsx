import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSeo } from "@/lib/settings";

const archivo = Inter({ variable: "--font-archivo", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  return {
    metadataBase: new URL(seo.siteUrl),
    title: { default: seo.siteTitle, template: seo.titleTemplate },
    description: seo.siteDescription,
    openGraph: { type: "website", siteName: seo.organizationName, title: seo.siteTitle, description: seo.siteDescription, images: seo.ogImage ? [seo.ogImage] : [], locale: "en_IN" },
    twitter: { card: "summary_large_image", title: seo.siteTitle, description: seo.siteDescription, images: seo.ogImage ? [seo.ogImage] : [] },
    robots: seo.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    verification: seo.gscVerification ? { google: seo.gscVerification } : undefined,
  };
}

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${archivo.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
