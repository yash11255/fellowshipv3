import Image from "next/image";

export function Logo({ className }: { tone?: "dark" | "light"; className?: string }) {
  return <Image src="/brand/logo.jpg" alt="Arthroscopy College" width={180} height={60} priority className={className} />;
}
