// Server component that injects one or more JSON-LD structured-data blocks.
// Rendering happens on the server, so the markup is present in the initial HTML
// for Google and other crawlers.
/**
 * JSON.stringify leaves "<" untouched, so a value containing "</script>" would
 * close the element and let the rest execute as markup. Escaping it as a
 * unicode sequence keeps the JSON equivalent while staying inert in HTML.
 */
export function serializeJsonLd(block: object): string {
  return JSON.stringify(block).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object | object[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </>
  );
}
