import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  partialPrefetching: true,
  // 301s from the old Shopify URLs so rankings and inbound links carry over.
  async redirects() {
    // Old WordPress URLs → new routes, so rankings and inbound links carry over.
    const r = (source: string, destination: string) => ({ source, destination, permanent: true });
    return [
      r("/fellowship-details", "/programs/fellowship-in-arthroscopy"),
      r("/fellowship-in-physiotherapy", "/programs/physiotherapy-internship"),
      r("/blogs", "/journal"), r("/blog", "/journal"),
      r("/homepage-black", "/"), r("/home", "/"),
      r("/login-2", "/login"), r("/register", "/apply"), r("/account-2", "/account"),
      r("/category/:slug*", "/journal"), r("/tag/:slug*", "/journal"),
      r("/contact", "/contact-us"), r("/programmes", "/programs"),
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
