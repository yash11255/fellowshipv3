"use client";

import { useEffect, useRef, useState } from "react";
import { MediaPicker } from "./media-picker";

/* Visual editor (contentEditable) with an HTML view. Output is cleaned server-side on save. */
type Tool = { label: string; title: string; run: () => void; cls?: string };

export function RichEditor({ value, onChange, minHeight = 480 }: { value: string; onChange: (html: string) => void; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const range = useRef<Range | null>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [picker, setPicker] = useState(false);

  // Load content into the editable area on mount and when returning from HTML view.
  useEffect(() => {
    if (mode === "visual" && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "<p></p>";
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mode switch / mount; typing updates value itself
  }, [mode]);

  const sync = () => ref.current && onChange(ref.current.innerHTML);
  const save = () => { const s = window.getSelection(); if (s?.rangeCount && ref.current?.contains(s.anchorNode)) range.current = s.getRangeAt(0).cloneRange(); };
  const restore = () => { ref.current?.focus(); const s = window.getSelection(); if (range.current && s) { s.removeAllRanges(); s.addRange(range.current); } };
  const exec = (cmd: string, arg?: string) => { restore(); document.execCommand(cmd, false, arg); sync(); };
  const insert = (html: string) => { restore(); document.execCommand("insertHTML", false, html); sync(); };
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

  const tools: Tool[] = [
    { label: "¶", title: "Paragraph", run: () => exec("formatBlock", "<p>") },
    { label: "H2", title: "Heading", run: () => exec("formatBlock", "<h2>"), cls: "font-semibold" },
    { label: "H3", title: "Subheading", run: () => exec("formatBlock", "<h3>"), cls: "font-semibold" },
    { label: "B", title: "Bold", run: () => exec("bold"), cls: "font-bold" },
    { label: "I", title: "Italic", run: () => exec("italic"), cls: "italic" },
    { label: "• List", title: "Bulleted list", run: () => exec("insertUnorderedList") },
    { label: "1. List", title: "Numbered list", run: () => exec("insertOrderedList") },
    { label: "❝", title: "Quote", run: () => exec("formatBlock", "<blockquote>") },
    { label: "Link", title: "Add link (select text first)", run: () => { save(); const u = prompt("Link URL (use /programs/… for pages on this site)", "/programs/fellowship-in-arthroscopy"); if (u) exec("createLink", u); } },
    { label: "Unlink", title: "Remove link", run: () => exec("unlink") },
    { label: "Image", title: "Insert image", run: () => { save(); setPicker(true); } },
    { label: "YouTube", title: "Embed a YouTube video", run: () => { save(); const u = prompt("YouTube link"); const id = u?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1]; if (id) insert(`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video" allowfullscreen></iframe><p></p>`); else if (u) alert("That doesn't look like a YouTube link."); } },
    { label: "FAQ", title: "Question & answer block", run: () => insert("<details><summary>Question?</summary><p>Answer.</p></details><p></p>") },
    { label: "CTA", title: "Call-to-action link to apply", run: () => insert('<p><strong><a href="/apply">Apply for the fellowship →</a></strong></p>') },
    { label: "—", title: "Divider", run: () => insert("<hr /><p></p>") },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-[#e3e3e3] bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-[#ececec] bg-white px-2 py-2">
        {/* eslint-disable-next-line react-hooks/refs -- handlers read refs on click, not during render */}
        {mode === "visual" && tools.map((t) => (
          <button key={t.label} type="button" title={t.title} onMouseDown={(e) => { e.preventDefault(); save(); }} onClick={t.run}
            className={`h-8 rounded-md px-2.5 text-[13px] hover:bg-[#f1f1f1] ${t.cls ?? ""}`}>{t.label}</button>
        ))}
        <div className="ml-auto flex rounded-lg bg-[#f1f1f1] p-0.5">
          {(["visual", "html"] as const).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={`h-7 rounded-md px-3 text-[12px] font-medium capitalize ${mode === m ? "bg-white shadow-sm" : "text-grey"}`}>{m === "html" ? "HTML" : "Visual"}</button>)}
        </div>
      </div>
      {mode === "visual" ? (
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={sync} onBlur={() => { save(); sync(); }} onKeyUp={save} onMouseUp={save}
          aria-label="Post content" role="textbox" aria-multiline
          className="prose-rc max-w-none px-6 py-5 outline-none [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg [&_img]:rounded-lg"
          style={{ minHeight }} />
      ) : (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} aria-label="Post HTML"
          className="block w-full resize-y p-4 font-mono text-[13px] leading-relaxed outline-none" style={{ minHeight }} />
      )}
      <MediaPicker open={picker} onClose={() => setPicker(false)} onPick={(u, alt) => {
        setPicker(false);
        const a = prompt("Describe the image (alt text, helps SEO & accessibility)", alt ?? "") ?? "";
        insert(`<figure><img src="${esc(u)}" alt="${esc(a)}" /></figure><p></p>`);
      }} />
    </div>
  );
}
