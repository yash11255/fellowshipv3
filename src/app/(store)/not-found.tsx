import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page grid min-h-[70vh] place-items-center py-16 text-center text-ink">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-brand">Error 404</p>
        <h1 className="mt-4 text-[clamp(2.4rem,1.5rem+3vw,4.5rem)] font-semibold leading-[1] tracking-[-0.045em]">This page isn&apos;t here.</h1>
        <p className="mx-auto mt-4 max-w-[44ch] text-[17px] text-ink/60">It may have moved when we rebuilt the site. Try one of these instead.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-white hover:bg-brand">Home</Link>
          <Link href="/programs" className="inline-flex h-12 items-center rounded-full border border-ink/15 px-6 text-[14px] font-semibold hover:border-ink">Programmes</Link>
          <Link href="/journal" className="inline-flex h-12 items-center rounded-full border border-ink/15 px-6 text-[14px] font-semibold hover:border-ink">Blog</Link>
        </div>
      </div>
    </div>
  );
}
