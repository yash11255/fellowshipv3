// Imports WordPress posts (from .raw/wp-*.json, exported via the WP REST API) into the DB.
// Images are mapped to the local copies in public/media; YouTube embeds become youtube-nocookie iframes.
// Usage (dev server stopped): node scripts/import-wp.mjs
import fs from "node:fs";
import path from "node:path";
import sanitizeHtml from "sanitize-html";
import { PGlite } from "@electric-sql/pglite";

const posts = JSON.parse(fs.readFileSync(".raw/wp-posts.json", "utf8"));
const media = JSON.parse(fs.readFileSync(".raw/wp-media.json", "utf8"));
const local = new Set(fs.readdirSync("public/media"));
const decode = (s) => s.replace(/&#8217;/g, "’").replace(/&#8216;/g, "‘").replace(/&#8220;/g, "“").replace(/&#8221;/g, "”").replace(/&#8211;/g, "–").replace(/&#8212;/g, "—").replace(/&#038;|&amp;/g, "&").replace(/&#8230;/g, "…").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'");
const strip = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const toLocal = (url) => {
  if (!url) return null;
  const base = path.basename(url.split("?")[0]);
  if (local.has(base)) return `/media/${base}`;
  const full = base.replace(/-\d+x\d+(?=\.\w+$)/, "");          // resized variant → original
  return local.has(full) ? `/media/${full}` : null;
};

const ALLOWED = {
  allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "img", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br", "hr", "figure", "figcaption", "iframe"],
  allowedAttributes: { a: ["href"], img: ["src", "alt"], iframe: ["src", "title", "allow", "allowfullscreen"] },
  allowedSchemes: ["https", "mailto", "tel"],
  allowedIframeHostnames: ["www.youtube-nocookie.com"],
  transformTags: {
    h1: "h2", h5: "h4", h6: "h4",
    img: (tag, a) => { const src = toLocal(a.src); return src ? { tagName: "img", attribs: { src, alt: a.alt ?? "" } } : { tagName: "span", attribs: {} }; },
    iframe: (tag, a) => {
      const id = a.src?.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([\w-]{11})/)?.[1];
      return id ? { tagName: "iframe", attribs: { src: `https://www.youtube-nocookie.com/embed/${id}`, title: a.title || "Video", allow: "encrypted-media; picture-in-picture", allowfullscreen: "" } } : { tagName: "span", attribs: {} };
    },
    a: (tag, a) => ({ tagName: "a", attribs: { href: (a.href ?? "").replace(/^https?:\/\/(www\.)?arthroscopycollege\.com/, "") || "/" } }),
  },
  exclusiveFilter: (f) => (["p", "li", "h2", "h3", "span"].includes(f.tag) && !f.text.trim() && !f.mediaChildren?.length),
};
// WP oEmbed blocks hold a bare YouTube URL inside a figure: turn it into an iframe before sanitising.
const embeds = (h) => h.replace(/<figure[^>]*wp-block-embed[^>]*>[\s\S]*?(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11}))[\s\S]*?<\/figure>/g, (_m, _u, id) => `<iframe src="https://www.youtube.com/embed/${id}"></iframe>`);
const clean = (h) => sanitizeHtml(embeds(h), ALLOWED).replace(/<span><\/span>/g, "").replace(/\s{2,}/g, " ").trim();

const db = new PGlite("./.data/pg");
let a = 0;
for (const p of posts) {
  if (p.status !== "publish") continue;
  const m = media.find((x) => x.id === p.featured_media);
  const image = toLocal(m?.source_url);
  const title = decode(p.title.rendered);
  const excerpt = strip(p.excerpt.rendered).replace(/\s*\[…\]$/, "").slice(0, 300);
  const seo = p.yoast_head_json ?? {};
  await db.query(
    `insert into articles (slug, title, excerpt, body, image, author, seo_title, seo_description, published_at) values ($1,$2,$3,$4,$5,'Dr. Manu Bora',$6,$7,$8)
     on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, body=excluded.body, image=excluded.image, seo_title=excluded.seo_title, seo_description=excluded.seo_description, published_at=excluded.published_at, updated_at=now()`,
    [p.slug, title, excerpt, clean(p.content.rendered), image, seo.title ? decode(seo.title).slice(0, 120) : null, (seo.description ? decode(seo.description) : excerpt).slice(0, 170), p.date_gmt + "Z"]);
  a++;
}
console.log(`articles: ${a}`);

// Legal pages on the old site were WordPress placeholder text; see scripts/seed-legal.mjs instead.
await db.close();
