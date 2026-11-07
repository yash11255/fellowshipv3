/** Typography for CMS HTML. Content is sanitised server-side before it is stored. */
export function Prose({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div className={`prose-rc ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
