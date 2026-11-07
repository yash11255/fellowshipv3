import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Analytics, OrganizationJsonLd } from "@/components/site/analytics";
import { Assistant } from "@/components/assistant/assistant";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-black focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Assistant />
      <Analytics />
      <OrganizationJsonLd />
    </>
  );
}
