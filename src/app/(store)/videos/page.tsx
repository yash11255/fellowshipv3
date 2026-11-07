import type { Metadata } from "next";
import { VIDEOS, VIDEO_CATS } from "@/lib/videos";
import { VideoLibrary } from "@/components/video/video-library";

export const metadata: Metadata = { title: "Videos", description: "Fellowship experiences, surgical technique videos and patient education from Dr. Manu Bora and Arthroscopy College.", alternates: { canonical: "/videos" } };

export default function Videos() {
  const ld = { "@context": "https://schema.org", "@type": "ItemList", itemListElement: VIDEOS.slice(0, 20).map((v, i) => ({ "@type": "VideoObject", position: i + 1, name: v.title, thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, embedUrl: `https://www.youtube.com/embed/${v.id}`, uploadDate: "2025-01-01" })) };
  return (
    <div className="page pt-10 md:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="label text-brand">Watch</p>
      <h1 className="mt-3 text-[clamp(2.2rem,1.5rem+2.6vw,3.75rem)] font-semibold tracking-[-0.04em]">Video library</h1>
      <p className="body mt-3 max-w-[60ch] text-[16px]">Fellows&apos; experiences, internal-brace and ACL techniques, and patient education from Dr. Manu Bora.</p>
      <div className="mt-10"><VideoLibrary videos={VIDEOS} cats={VIDEO_CATS} /></div>
    </div>
  );
}
