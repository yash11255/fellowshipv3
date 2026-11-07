import Script from "next/script";
import { getSeo } from "@/lib/settings";

/** GA4 + Meta Pixel from admin SEO settings. Loads after the page is interactive. */
export async function Analytics() {
  const { ga4Id, metaPixelId } = await getSeo();
  return (
    <>
      {ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4Id}');`}</Script>
        </>
      )}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}</Script>
      )}
    </>
  );
}

export async function OrganizationJsonLd() {
  const s = await getSeo();
  const data = {
    "@context": "https://schema.org", "@type": "Organization", name: s.organizationName, url: s.siteUrl,
    logo: `${s.siteUrl.replace(/\/$/, "")}/brand/logo-black.png`, sameAs: [s.instagram, s.youtube].filter(Boolean),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
