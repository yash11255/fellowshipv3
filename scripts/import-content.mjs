// Imports Shopify pages + blog articles (HTML saved in .raw/) into the DB.
// - keeps content sections, drops theme widgets (product grids, blog teasers, appointment forms)
// - sanitises HTML to a small semantic allow-list
// - downloads every image to public/content/ so nothing depends on Shopify after migration
// Usage (dev server stopped): node scripts/import-content.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sanitizeHtml from "sanitize-html";
import { PGlite } from "@electric-sql/pglite";

const RAW = ".raw";
const PAGE_MAP = {
  "about-us": "about", faqs: "faq", contact: "contact",
  "terms-of-service": "policies/terms", "refund-policy": "policies/refund", "shipping-policy": "policies/shipping", "privacy-policy": "policies/privacy",
  services: "clinic", supplements: "clinic/supplements", joint: "clinic/joint", skin: "clinic/skin", hair: "clinic/hair",
  "sports-injury": "clinic/sports-injury", psychology: "clinic/psychology", nutrition: "clinic/nutrition", muscles: "clinic/muscles",
};
const DROP_SECTIONS = /product_block|featured_blog|request_appointment|newsletter|service_boost|research_papers|header|footer|announcement/i;

const ALLOWED = {
  allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "img", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br", "hr", "figure", "figcaption", "details", "summary"],
  allowedAttributes: { a: ["href"], img: ["src", "alt", "width", "height"] },
  allowedSchemes: ["https", "mailto", "tel"],
  transformTags: { h1: "h2", h5: "h4", h6: "h4", button: "h3" },
  exclusiveFilter: (f) => ((f.tag === "p" || f.tag === "li" || f.tag === "h2" || f.tag === "h3") && !f.text.trim() && !f.mediaChildren?.length)
    || (f.tag === "img" && /\b(icon|arrow|plus|minus|chevron|logo-?small)\b/i.test(f.attribs?.alt ?? ""))
    || (f.tag === "h3" && /^\s*(add to cart|learn more|shop now|read more|book( now| an appointment)?|view (all|more)|submit|close|menu|search|previous|next|[×✕<>‹›]+)\s*$/i.test(f.text)),
  nonTextTags: ["style", "script", "textarea", "option", "noscript", "svg", "form", "select", "iframe"],
};

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function localise(html, dir) {
  const out = path.join("public/content", dir);
  fs.mkdirSync(out, { recursive: true });
  const srcs = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]))];
  for (const src of srcs) {
    let url = decode(src);
    if (url.startsWith("//")) url = "https:" + url;
    if (!/^https:\/\/(cdn\.shopify\.com|reverseclinics\.com)/.test(url)) { html = html.split(src).join(""); continue; }
    url = url.replace(/_(\d+x\d*|x\d+|\d+x)(?=\.)/, "").replace(/([?&])width=\d+/, "$1"); // largest size
    const ext = (url.split("?")[0].match(/\.(png|jpe?g|webp|gif)$/i)?.[1] ?? "jpg").toLowerCase();
    const name = crypto.createHash("sha1").update(url.split("?")[0]).digest("hex").slice(0, 12) + "." + ext;
    const file = path.join(out, name);
    if (!fs.existsSync(file)) {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).catch(() => null);
      if (!r?.ok) { html = html.split(src).join(""); continue; }
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      await new Promise((res) => setTimeout(res, 150));
    }
    html = html.split(src).join(`/content/${dir}/${name}`);
  }
  return html.replace(/<img(?![^>]*src="\/content)[^>]*>/g, ""); // drop any image we couldn't localise
}

function dedupe(html) {
  // themes often render desktop + mobile copies of the same block: drop repeated paragraphs/headings
  const seen = new Set();
  return html.replace(/<(p|h2|h3|li)>([\s\S]*?)<\/\1>/g, (m, _t, inner) => {
    const k = stripTags(inner).toLowerCase();
    if (k.length > 12 && seen.has(k)) return "";
    seen.add(k); return m;
  });
}

/** Collapse whitespace, drop empty paragraphs, wrap stray top-level text in <p>. */
const LINK_MAP = Object.fromEntries(Object.entries(PAGE_MAP).map(([k, v]) => [k, v]));
function relink(html) {
  return html
    .replace(/href="https?:\/\/(?:www\.)?reverseclinics\.com/g, 'href="')
    .replace(/href="\/pages\/([a-z0-9-]+)[^"]*"/g, (_m, s) => `href="/${LINK_MAP[s] ?? (s.startsWith("about") ? "about" : "clinic")}"`)
    .replace(/href="\/collections\/[^"]*"/g, 'href="/shop"')
    .replace(/href="\/blogs\/[a-z0-9-]+\/([a-z0-9-]+)[^"]*"/g, 'href="/journal/$1"')
    .replace(/href="\/blogs\/[^"]*"/g, 'href="/journal"');
}

function tidy(html) {
  html = relink(html);
  let h = html.replace(/\s+/g, " ").replace(/<p>\s*<\/p>/g, "").replace(/(\s*<br \/>\s*){2,}/g, "<br />");
  h = h.replace(/(^|<\/(?:h2|h3|h4|p|ul|ol|table|blockquote|figure|details)>)\s*([^<\s][^<]{20,}?)\s*(?=<(?:h2|h3|h4|p|ul|ol|table|img|blockquote|figure|details)\b|$)/g, "$1<p>$2</p>");
  return h.trim();
}

function pageContent(raw) {
  const main = raw.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? raw;
  const parts = main.split(/(?=<div[^>]+id="shopify-section-)/).filter((p) => {
    const id = p.match(/id="shopify-section-([^"]+)"/)?.[1] ?? "";
    return !DROP_SECTIONS.test(id);
  });
  return tidy(dedupe(sanitizeHtml(parts.join("\n"), ALLOWED)));
}

/** Inner HTML of the first <div> whose class contains `cls`, matching nested divs correctly. */
function innerDiv(raw, cls) {
  const start = raw.search(new RegExp(`<div[^>]+class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`));
  if (start < 0) return "";
  const open = raw.indexOf(">", start) + 1;
  const re = /<\/?div\b[^>]*>/g; re.lastIndex = open;
  let depth = 1, m;
  while ((m = re.exec(raw))) { depth += m[0][1] === "/" ? -1 : 1; if (depth === 0) return raw.slice(open, m.index); }
  return "";
}

function articleContent(raw) {
  const body = innerDiv(raw, "article-content") || innerDiv(raw, "article-template__content") || innerDiv(raw, "rte");
  return tidy(sanitizeHtml(body, ALLOWED));
}

const meta = (raw, prop) => decode(raw.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`))?.[1] ?? "");

const db = new PGlite("./.data/pg");

// Pages
let n = 0;
for (const [src, slug] of Object.entries(PAGE_MAP)) {
  const f = path.join(RAW, "pages", `${src}.html`);
  if (!fs.existsSync(f)) continue;
  const raw = fs.readFileSync(f, "utf8");
  const title = stripTags(raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? meta(raw, "og:title")).replace(/\s*[-–|]\s*Reverse Clinics?$/i, "") || src;
  let body = pageContent(raw);
  // drop theme breadcrumbs ("Home Joint") and the first heading that repeats the page title (the layout renders both)
  body = body.replace(/^\s*(?:<p>\s*)?<a href="\/">\s*Home\s*<\/a>[^<]{0,80}(?:<\/p>)?/i, "");
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/&/g, "(?:&|&amp;)");
  body = body.replace(new RegExp(`<h2>\\s*${esc}\\s*</h2>`, "i"), "");
  body = await localise(body, `pages/${slug.replace(/\//g, "-")}`);
  await db.query(
    `insert into pages (slug, title, body, seo_description) values ($1,$2,$3,$4)
     on conflict (slug) do update set title = excluded.title, body = excluded.body, seo_description = coalesce(pages.seo_description, excluded.seo_description), updated_at = now()`,
    [slug, title, body, meta(raw, "description").slice(0, 170) || null]);
  n++;
}
console.log(`pages: ${n}`);

// Articles
let a = 0;
const dir = path.join(RAW, "articles");
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
  const raw = fs.readFileSync(path.join(dir, f), "utf8");
  const slug = f.replace(/\.html$/, "");
  const title = stripTags(raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? meta(raw, "og:title"));
  let body = articleContent(raw);
  if (stripTags(body).length < 80) { console.log(`  skipped (no body found): ${slug}`); continue; }
  body = await localise(body, `journal/${slug}`);
  const ogImg = meta(raw, "og:image");
  let image = null;
  if (ogImg) {
    const local = await localise(`<img src="${ogImg}">`, `journal/${slug}`);
    image = local.match(/src="([^"]+)"/)?.[1] ?? null;
  }
  const published = raw.match(/(?:datetime|datePublished)["=: ]+"?(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  const desc = meta(raw, "description") || stripTags(body).slice(0, 160);
  await db.query(
    `insert into articles (slug, title, excerpt, body, image, seo_description, published_at) values ($1,$2,$3,$4,$5,$6,coalesce($7::timestamptz, now()))
     on conflict (slug) do update set title = excluded.title, excerpt = excluded.excerpt, body = excluded.body, image = excluded.image, published_at = excluded.published_at, updated_at = now()`,
    [slug, title, desc.slice(0, 300), body, image, desc.slice(0, 170), published || null]);
  a++;
}
console.log(`articles: ${a}`);
await db.close();
