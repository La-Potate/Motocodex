// Server component: renders an article section body. Paragraphs are separated by
// blank lines; lines beginning with "- " render as a bulleted list.
export function ArticleBody({ body }: { body: string }) {
  const blocks = body.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const bullets = lines.filter((l) => l.startsWith("- "));
        if (bullets.length && bullets.length === lines.length) {
          return (
            <ul key={i} className="mb-4 list-disc space-y-1.5 pl-5">
              {lines.map((l, j) => (
                <li key={j} className="text-graphite-600">{l.replace(/^-\s*/, "")}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mb-4 leading-relaxed text-graphite-600">
            {block}
          </p>
        );
      })}
    </>
  );
}
