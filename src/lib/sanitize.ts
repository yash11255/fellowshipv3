import "server-only";
import sanitizeHtml from "sanitize-html";

/** Allow-list for CMS content (admin-edited or imported). Strips scripts, styles, event handlers, iframes. */
export const cleanHtml = (html: string) => sanitizeHtml(html, {
  allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "img", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "br", "hr", "figure", "figcaption", "details", "summary"],
  allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "width", "height"] },
  allowedSchemes: ["https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
});
