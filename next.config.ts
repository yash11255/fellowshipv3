import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  partialPrefetching: true,
  // 301s from the old Shopify URLs so rankings and inbound links carry over.
  async redirects() {
    const page = (from: string, to: string) => ({ source: `/pages/${from}`, destination: to, permanent: true });
    return [
      page("about-us", "/about"), page("faqs", "/faq"), page("contact", "/contact"),
      page("terms-of-service", "/policies/terms"), page("refund-policy", "/policies/refund"),
      page("shipping-policy", "/policies/shipping"), page("privacy-policy", "/policies/privacy"),
      page("services", "/clinic"),
      ...["supplements", "joint", "skin", "hair", "sports-injury", "psychology", "nutrition", "muscles"].map((s) => page(s, `/clinic/${s}`)),
      { source: "/pages/:slug*", destination: "/press", permanent: true }, // press feature pages
      { source: "/policies/terms-of-service", destination: "/policies/terms", permanent: true },
      { source: "/policies/refund-policy", destination: "/policies/refund", permanent: true },
      { source: "/policies/shipping-policy", destination: "/policies/shipping", permanent: true },
      { source: "/policies/privacy-policy", destination: "/policies/privacy", permanent: true },
      { source: "/blogs/:blog/:slug", destination: "/journal/:slug", permanent: true },
      { source: "/blogs/:blog", destination: "/journal", permanent: true },
      { source: "/collections/all", destination: "/shop", permanent: true },
      { source: "/collections/:handle/products/:product", destination: "/products/:product", permanent: true },
      { source: "/collections/:handle", destination: "/shop", permanent: true },
      { source: "/account/login", destination: "/login", permanent: true },
      { source: "/cart", destination: "/checkout", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
