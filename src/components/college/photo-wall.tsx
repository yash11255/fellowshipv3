import Image from "next/image";
import { Reveal } from "./reveal";

/** Real photos from the college, in an uneven bento grid. `tall` items span two rows. */
export type Photo = { src: string; alt: string; tall?: boolean; wide?: boolean };

export function PhotoWall({ photos }: { photos: Photo[] }) {
  return (
    <ul className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4 lg:auto-rows-[220px] 2xl:auto-rows-[260px]">
      {photos.map((p, i) => (
        <li key={p.src} className={`${p.tall ? "row-span-2" : ""} ${p.wide ? "col-span-2" : ""}`}>
          <Reveal delay={(i % 4) * 0.06} className="group relative h-full overflow-hidden rounded-[20px] bg-mist">
            <Image src={p.src} alt={p.alt} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export const COLLEGE_PHOTOS: Photo[] = [
  { src: "/img/ot-1.webp", alt: "Fellows operating with Dr. Manu Bora", wide: true },
  { src: "/img/cert-2.jpg", alt: "Fellow receiving a certificate", tall: true },
  { src: "/img/cert-3.jpg", alt: "Fellows with their certificates", tall: true },
  { src: "/img/clinic-1.jpg", alt: "Faculty at the Orthosport clinic" },
  { src: "/img/cert-1.jpg", alt: "Certificate ceremony" },
  { src: "/img/ot-2.webp", alt: "Arthroscopic surgery in the operating theatre", wide: true },
  { src: "/img/team-1.jpg", alt: "Physiotherapist at Threads Physio", tall: true },
  { src: "/img/cert-5.jpg", alt: "Fellow receiving a certificate", tall: true },
  { src: "/img/team-4.jpg", alt: "Physiotherapy team" },
  { src: "/img/cert-4.jpg", alt: "Fellowship completion" },
];
