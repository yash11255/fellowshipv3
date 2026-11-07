import Image from "next/image";
import clsx from "clsx";

/**
 * Current single-product renders are 2048² squares with a badge panel baked into the right ~40%.
 * This frames just the bottle (≈5–60% horizontally) so it reads as a clean packshot.
 * Drop this once clean transparent renders arrive.
 */
export function Packshot({ src, alt, className, priority, sizes = "40vw" }: {
  src: string; alt: string; className?: string; priority?: boolean; sizes?: string;
}) {
  return (
    <div className={clsx("relative aspect-[4/7] overflow-hidden", className)}>
      <div className="absolute inset-y-0 left-[-9%] w-[182%]">
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover mix-blend-multiply" />
      </div>
    </div>
  );
}
