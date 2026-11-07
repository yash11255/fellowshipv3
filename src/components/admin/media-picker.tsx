"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { listMedia, uploadImage } from "@/lib/cms-actions";

/** Modal: pick an existing image or upload a new one. Calls onPick with the public URL. */
export function MediaPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (url: string, alt?: string) => void }) {
  const [items, setItems] = useState<string[] | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || items) return;
    listMedia().then(setItems).catch(() => setErr("Couldn't load images."));
  }, [open, items]);

  if (!open) return null;
  const shown = (items ?? []).filter((u) => !q || u.toLowerCase().includes(q.toLowerCase())).slice(0, 240);
  const upload = (f: File) => start(async () => {
    setErr("");
    const fd = new FormData(); fd.append("file", f);
    const r = await uploadImage(fd);
    if (!r.ok) return setErr(r.error);
    setItems((s) => [r.url, ...(s ?? [])]);
    onPick(r.url, f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  });

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Choose an image" className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[#ececec] p-4">
          <p className="text-[15px] font-semibold">Choose an image</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by file name" className="h-9 flex-1 rounded-lg border border-[#d4d4d4] px-3 text-[13px]" />
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button onClick={() => file.current?.click()} disabled={pending} className="h-9 rounded-lg bg-[#303030] px-4 text-[13px] font-medium text-white disabled:opacity-50">{pending ? "Uploading…" : "Upload new"}</button>
          <button onClick={onClose} className="h-9 rounded-lg px-3 text-[13px] text-grey hover:text-black">Close</button>
        </div>
        {err && <p className="px-4 pt-3 text-[13px] text-sale">{err}</p>}
        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4 md:grid-cols-6"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}>
          {!items && <p className="col-span-full py-10 text-center text-[13px] text-grey">Loading…</p>}
          {shown.map((u) => (
            <button key={u} onClick={() => onPick(u)} title={u} className="group relative aspect-square overflow-hidden rounded-lg bg-[#f4f4f4] ring-[#303030] hover:ring-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
              <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
              {u.startsWith("/uploads/") && <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[10px] font-medium">Uploaded</span>}
            </button>
          ))}
        </div>
        <p className="border-t border-[#ececec] px-4 py-2 text-[12px] text-grey">Tip: drag an image onto the grid to upload it. Max 8 MB.</p>
      </div>
    </div>
  );
}

/** Field showing the current image with Change/Remove. */
export function ImageField({ label, value, onChange, help }: { label: string; value: string; onChange: (v: string) => void; help?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className="text-[13px] font-medium">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        <button type="button" onClick={() => setOpen(true)} className="relative grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-[#c9c9c9] bg-[#fafafa] text-[12px] text-grey hover:border-[#303030]">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
          {value ? <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" /> : "Choose image"}
        </button>
        <div className="min-w-0 text-[12px]">
          <p className="truncate font-mono text-grey">{value || "No image"}</p>
          <div className="mt-1 flex gap-3"><button type="button" onClick={() => setOpen(true)} className="text-[#005bd3] hover:underline">{value ? "Change" : "Choose"}</button>{value && <button type="button" onClick={() => onChange("")} className="text-sale hover:underline">Remove</button>}</div>
          {help && <p className="mt-1 text-grey">{help}</p>}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(u) => { onChange(u); setOpen(false); }} />
    </div>
  );
}
