/**
 * GitHub Pages serves a project repo under https://<user>.github.io/<repo>/,
 * so every URL needs that prefix. Next rewrites `next/image` sources, `<Link>`
 * hrefs and bundled assets automatically — but NOT strings we hand to `fetch`
 * or to the GLTF/Draco loaders, which bypass the router entirely. Those go
 * through `asset()`.
 *
 * NEXT_PUBLIC_ is inlined at build time, so this resolves on the client too.
 * Empty for local dev, the Docker image, a user/org page, or a custom domain.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
